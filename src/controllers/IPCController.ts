import { IncomingMessage, ServerResponse } from "http";
import { UserService } from "../services/userService";
import { UserDB } from "../db";
import { MESSAGES as message } from "../util/messages";
import {
  ProccessMessage,
  StoredUser,
  User,
  UserServiceInt,
} from "../models/models";

const userDB = new UserDB();
const userService = new UserService(userDB);

export class UserIPCController {
  constructor(private readonly service: UserServiceInt) {}

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
      this.handleError(error, res);
    }
  }

  private async handleGet(
    userId: string | undefined,
    res: ServerResponse
  ): Promise<void> {
    if (userId) {
      // IPC message to get user by ID from the primary process
      process.send!({ type: "getUserById", userId });

      process.once(
        "message",
        (message: ProccessMessage<StoredUser> | ProccessMessage<string>) => {
          if (message.type === "getUserById") {
            this.sendResponse(res, 200, message.data);
          } else {
            this.sendErrorResponse(res, message);
          }
        }
      );
    } else {
      // IPC message to get all users from the primary process
      process.send!({ type: "getAllUsers" });

      process.once("message", (message: ProccessMessage<StoredUser[]>) => {
        if (message.type === "getAllUsers") {
          this.sendResponse(res, 200, message.data);
        } else {
          this.sendErrorResponse(res, message);
        }
      });
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
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      const user = JSON.parse(body);

      // IPC message to create a new user
      process.send!({ type: "createUser", user });

      process.once(
        "message",
        (message: ProccessMessage<StoredUser> | ProccessMessage<string>) => {
          if (message.type === "createUser") {
            this.sendResponse(res, 201, message.data);
          } else {
            this.sendErrorResponse(res, message);
          }
        }
      );
    });
  }

  private async handleUpdate(
    userId: string | undefined,
    req: IncomingMessage,
    res: ServerResponse
  ): Promise<void> {
    if (userId) {
      let body = "";
      req.on("data", (chunk) => (body += chunk.toString()));
      req.on("end", () => {
        const updateData = JSON.parse(body);

        // IPC message to update a user
        process.send!({ type: "updateUser", userId, user: updateData });

        process.once(
          "message",
          (message: ProccessMessage<User> | ProccessMessage<string>) => {
            if (message.type === "updateUser") {
              this.sendResponse(res, 200, message.data);
            } else {
              this.sendErrorResponse(res, message);
            }
          }
        );
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
      // IPC message to delete a user
      process.send!({ type: "deleteUser", userId });

      process.once("message", (message: ProccessMessage<string>) => {
        if (message.type === "deleteUser") {
          res.writeHead(204);
          res.end();
        } else {
          this.sendErrorResponse(res, message);
        }
      });
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

  private sendErrorResponse(res: ServerResponse, message: any) {
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: message.data || "An error occurred" }));
  }

  private handleError(error: unknown, res: ServerResponse) {
    let statusCode = 500;
    if (error instanceof Error) {
      if (error.message === message.invalidUUID) {
        statusCode = 400;
      }
      if (
        error.message === message.userNotFound ||
        error.message === message.required
      ) {
        statusCode = 404;
      }
      this.sendResponse(res, statusCode, { message: error.message });
    } else {
      this.sendResponse(res, statusCode, {
        message: "Someone broke our server",
      });
    }
  }
}

export const userIPCController = (req: IncomingMessage, res: ServerResponse) =>
  new UserIPCController(userService).handleRequest(req, res);
