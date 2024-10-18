import { IncomingMessage, ServerResponse } from "http";
import { UserService } from "../services/userService";
import { UserDB } from "../db";
import { MESSAGES as message } from "../util/messages";
import { StoredUser, User, UserServiceInt } from "../models/models";
import { SharedUserService } from "../services/sharedUserService";

// const isClusterMode = process.env.USE_CLUSTER === "true";

const userDB = new UserDB();
// const userService = isClusterMode
//   ? new UserService(userDB)
//   : new SharedUserService(userDB);

export class UserController {
  constructor(private readonly service: UserService) {}

  async handleRequest(req: IncomingMessage, res: ServerResponse) {
    const { method, url } = req;
    const segments = url?.split("/") || [];

    const apiSegment = segments[1];
    const resource = segments[2];
    const userId = segments[3];

    try {
      if (segments[1] === "api" && segments[2] === "users") {
        switch (method) {
          case "GET":
            console.log(url, "UserId:", userId, "res:", resource);
            await this.handleGet(userId, res);
            break;

          case "POST":
            await this.handlePost(req, res, userId);
            break;

          case "PUT":
            await this.handleUpdate(userId, req, res);
            break;

          case "DELETE":
            await this.handleDelete(userId, res);
            break;

          default:
            this.sendResponse(res, 405, { message: message.notMethod });
        }
      } else {
        this.sendResponse(res, 404, { message: message.notEndPoint });
      }
    } catch (error) {
      if (error instanceof Error) {
        let statusCode = 500;
        if (error.message === message.invalidUUID) {
          statusCode = 400;
        }
        if (
          error.message === message.userNotFound ||
          error.message === message.required
        ) {
          statusCode = 404;
        }
        this.sendResponse(res, statusCode, {
          message: error.message || `Someone broke our server`,
        });
      } else {
        this.sendResponse(res, 500, { message: "Someone broke our server" });
      }
    }
  }

  private async handleGet(
    userId: string | undefined,
    res: ServerResponse
  ): Promise<void> {
    if (userId && userId !== "") {
      const user = this.service.getUserById(userId);
      this.sendResponse(res, 200, user);
    } else {
      const users = this.service.getAllUsers();
      this.sendResponse(res, 200, users);
    }
  }

  private async handlePost(
    req: IncomingMessage,
    res: ServerResponse,
    userId: string | undefined
  ): Promise<void> {
    if (userId) {
      this.sendResponse(res, 400, {
        message: "User ID should not be included when creating a new user.",
      });
      return;
    }
    let body = "";
    req.on("data", (chunk) => (body += chunk.toString()));
    req.on("end", () => {
      try {
        const user = JSON.parse(body);
        const newUser = this.service.createUser(user);
        this.sendResponse(res, 201, newUser);
      } catch (error) {
        if (error instanceof Error) {
          this.sendResponse(res, 400, {
            message: error.message,
          });
        } else {
          this.sendResponse(res, 400, {
            message: "An error occurred while creating the user.",
          });
        }
      }
    });
  }

  private async handleUpdate(
    userId: string | undefined,
    req: IncomingMessage,
    res: ServerResponse
  ): Promise<void> {
    if (userId) {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk.toString();
      });
      req.on("end", () => {
        try {
          const updateData = JSON.parse(body);
          const updatedUser = this.service.updateUser(userId, updateData);
          this.sendResponse(res, 200, updatedUser);
        } catch (error) {
          if (error instanceof Error) {
            this.sendResponse(res, 400, {
              message: error.message,
            });
          } else {
            this.sendResponse(res, 400, {
              message: "An error occurred while creating the user.",
            });
          }
        }
      });
    } else {
      this.sendResponse(res, 400, { message: message.idRequired });
    }
  }

  private async handleDelete(
    userId: string | undefined,
    res: ServerResponse
  ): Promise<void> {
    if (userId) {
      this.service.deleteUser(userId);
      res.writeHead(204);
      res.end();
    } else {
      this.sendResponse(res, 400, { message: message.idRequired });
    }
  }

  private sendResponse(
    res: ServerResponse,
    statusCode: number,
    data: StoredUser | StoredUser[] | User | {}
  ) {
    res.writeHead(statusCode, { "Content-Type": "application/json" });
    res.end(JSON.stringify(data));
  }
}

export const userController = (req: IncomingMessage, res: ServerResponse) =>
  new UserController(new UserService(userDB)).handleRequest(req, res);
