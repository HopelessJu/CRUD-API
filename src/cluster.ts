import cluster from "cluster";
import http, { IncomingMessage, ServerResponse } from "http";
import os from "os";
import { UserDB } from "./db";
import { UserService } from "./services/userService";
import { userIPCController } from "./controllers/IPCController";

const numCPUs = os.cpus().length;
const basePort = parseInt(process.env.PORT || "4000");
let currentWorker = 0;

const sharedUserDB = new UserDB();
const userService = new UserService(sharedUserDB);

export const startCluster = (): void => {
  if (cluster.isPrimary) {
    console.log(`Primary ${process.pid} is running`);

    cluster.on("message", async (worker, message) => {
      if (message.type === "getAllUsers") {
        const users = userService.getAllUsers();
        worker.send({ type: "getAllUsers", data: users });
      } else if (message.type === "getUserById") {
        try {
          const user = userService.getUserById(message.userId);
          worker.send({ type: "getUserById", data: user });
        } catch (error) {
          worker.send({
            type: "error",
            data:
              error instanceof Error
                ? error.message
                : "Unknown error ocurred while getting user by Id",
          });
        }
      } else if (message.type === "createUser") {
        try {
          const newUser = userService.createUser(message.user);
          worker.send({ type: "createUser", data: newUser });
        } catch (error) {
          worker.send({
            type: "error",
            data:
              error instanceof Error
                ? error.message
                : "Unknown error ocurred while creating new user",
          });
        }
      } else if (message.type === "updateUser") {
        console.log("Update ID", message.id);
        try {
          const updatedUser = userService.updateUser(
            message.userId,
            message.user
          );
          worker.send({ type: "updateUser", data: updatedUser });
        } catch (error) {
          worker.send({
            type: "error",
            data:
              error instanceof Error
                ? error.message
                : `Unknown error occured while updating user`,
          });
        }
      } else if (message.type === "deleteUser") {
        try {
          userService.deleteUser(message.userId);
          worker.send({ type: "deleteUser" });
        } catch (error) {
          worker.send({
            type: "error",
            data:
              error instanceof Error
                ? error.message
                : "Unknown error occured while deleting user",
          });
        }
      }
    });

    for (let i = 1; i < numCPUs; i++) {
      const workerPort = basePort + i;
      cluster.fork({ PORT: workerPort });
    }

    const loadBalancer = http.createServer(
      (req: IncomingMessage, res: ServerResponse) => {
        const workerPorts = Array.from(Object.values(cluster.workers!)).map(
          (worker, index) => ({
            id: worker?.process.pid,
            port: basePort + index + 1,
          })
        );

        const targetPort = workerPorts[currentWorker % workerPorts.length].port;
        currentWorker++;

        console.log(
          `Load balancer forwarding request to worker on port ${targetPort}`
        );

        const options = {
          hostname: "localhost",
          port: targetPort,
          path: req.url,
          method: req.method,
          headers: req.headers,
        };

        const proxy = http.request(options, (workerRes) => {
          res.writeHead(workerRes.statusCode || 500, workerRes.headers);
          workerRes.pipe(res);
        });

        req.pipe(proxy);
        proxy.on("error", (err) => {
          console.error(
            `Error forwarding request to worker on port ${targetPort}`,
            err
          );
          res.writeHead(500);
          res.end("Error handling request.");
        });
      }
    );

    loadBalancer.listen(basePort, () => {
      console.log(`Load balancer is listening on PORT: ${basePort}`);
    });

    cluster.on("exit", (worker) => {
      console.log(`Worker ${worker.process.pid} died. Forking a new worker.`);
      for (let i = 1; i < numCPUs; i++) {
        const workerPort = basePort + i;
        cluster.fork({ PORT: workerPort });
      }
    });
  } else {
    const port = process.env.PORT || 4000 + cluster.worker!.id;
    const server = http.createServer(userIPCController);

    server.listen(port, () => {
      console.log(`Worker ${process.pid} is running on PORT: ${port}`);
    });

    server.on("request", () => {
      console.log(`Worker ${process.pid} handling request on port ${port}`);
    });
    server.on("error", (err) => {
      console.error(`Failed to start server on port ${port}: ${err.message}`);
      process.exit(0);
    });

    process.on("SIGINT", () => {
      console.log(
        `Worker ${process.pid} received SIGTERM. Closing server gracefully...`
      );

      server.close(() => {
        console.log(
          `Server on port ${port} closed. Exiting process ${process.pid}`
        );
        process.exit(0);
      });
    });
  }
};
