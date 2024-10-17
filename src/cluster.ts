// import cluster from "cluster";
// import { cpus } from "os";
// import { userController } from "./controllers/userController";
// import http, { IncomingMessage, ServerResponse } from "http";

// const cpusNum = cpus();
// const PORT = process.env.PORT || 4000;

// export const startCluster = () => {
//   if (cluster.isPrimary) {
//     console.log(`Primary process is running`);

//     cpusNum.map((_, index) => {
//       const workerPort = +PORT + index + 1;
//       cluster.fork({ workerPort });

//     });
//     cluster.on("exit", (worker) => {
//         console.log(`Worker ${worker.process.pid} died. Creating a new one.`);
//         cluster.fork();
//       });

//     const loadBalancer = http.createServer((req, res) => {
//       const workerId = Math.floor(Math.random() * cpusNum.length).toString();
//       const worker = cluster.workers![workerId];
//      if (worker) {
//         worker.send({req: {url: req.url, method: req.method, headers: req.headers}});
//         worker.once('message', (response) => {
//             res.writeHead(response.statusCode, response.headers);
//             res.end(response.body);
//         })
//      } else {
//         res.writeHead(500);
//         res.end('No available worker');
//      }
//     });

//     loadBalancer.listen(PORT, () => {
//       console.log(`Load balancer is running on port ${PORT}`);
//     });
//   } else {

//     }
// }

import cluster from "cluster";
import { cpus } from "os";
import http, { IncomingMessage, ServerResponse } from "http";
import { userController } from "./controllers/userController";
import { WorkerMessage } from "./models/models";

const cpusNum = cpus().length; // Number of CPU cores
const PORT = process.env.PORT || 4000;

export const startCluster = () => {
  if (cluster.isPrimary) {
    console.log(`Primary process is running with PID: ${process.pid}`);

    // Fork workers based on the number of CPU cores
    for (let i = 0; i < cpusNum; i++) {
      cluster.fork();
    }

    // Handle worker exit
    cluster.on("exit", (worker) => {
      console.log(`Worker ${worker.process.pid} died. Forking a new worker.`);
      cluster.fork();
    });

    // Load balancer to distribute incoming requests
    const loadBalancer = http.createServer((req, res) => {
      const workerIds = Object.keys(cluster.workers || {});
      const workerId = workerIds[Math.floor(Math.random() * workerIds.length)];

      const worker = cluster.workers![workerId];
      if (worker) {
        worker.send({
          req: { url: req.url, method: req.method, headers: req.headers },
        });

        worker.once("message", (response) => {
          res.writeHead(response.statusCode, response.headers);
          res.end(response.body);
        });
      } else {
        res.writeHead(500);
        res.end("No available worker");
      }
    });

    loadBalancer.listen(PORT, () => {
      console.log(`Load balancer is running on PORT: ${PORT}`);
    });
  } else {
    process.on("message", (message: WorkerMessage) => {
      const { req } = message;
      const request = {
        url: req.url,
        method: req.method,
        headers: req.headers,
      };

      const response = {
        statusCode: 200,
        headers: {},
        body: "",
        writeHead: function (
          statusCode: number,
          headers: { [key: string]: string }
        ) {
          this.statusCode = statusCode;
          this.headers = headers;
        },
        end: function (body: string) {
          this.body = body;
          if (process.send) {
            process.send({
              statusCode: this.statusCode,
              headers: this.headers,
              body: this.body,
            });
          }
        },
      };

      // Handle the request with the userController
      userController(
        request as IncomingMessage,
        response as unknown as ServerResponse
      );
    });
  }
};
