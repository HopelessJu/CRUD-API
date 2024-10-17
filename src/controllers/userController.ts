import { IncomingMessage, ServerResponse } from "http";
import { userService } from "../services/userService";

export class UserController {
  constructor(private readonly service: userService) {}

  async handleRequest(req: IncomingMessage, res: ServerResponse) {
    const { method, url } = req;
    const [_, resource, userId] = url?.split("/") || [];

    try {
      if (resource === "api" && url?.startsWith("/api/users")) {
        switch (method) {
          case "GET":
            if (userId) {
              const user = this.service.getUserById(userId);
              res.writeHead(200, { "Content-Type": "application/json" });
              res.end(JSON.stringify(user));
            } else {
              const users = this.service.getAllUsers();
              res.writeHead(200, { "Content-Type": "application/json" });
              res.end(JSON.stringify(users));
            }
        }
      }
    } catch {}
  }
}
