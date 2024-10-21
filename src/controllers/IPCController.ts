import { IncomingMessage, ServerResponse } from "http";
import { UserService } from "../services/userService";
import { UserDB } from "../db";
import { MESSAGES as message, MESSAGES } from "../util/messages";
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

  async handleRequest(
    req: IncomingMessage,
    res: ServerResponse
  ): Promise<void> {
    const { method, url } = req;
    const segments = url?.split("/") || [];
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
            this.sendErrorResponse(res, {
              type: "error",
              data: MESSAGES.notMethod,
            });
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
      try {
        const user = JSON.parse(body);

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
      } catch (error) {
        if (error instanceof SyntaxError) {
          this.sendResponse(res, 400, {
            message: message.invalidJSON,
          });
        } else {
          this.sendResponse(res, 400, {
            message: message.unknown,
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
      req.on("data", (chunk) => (body += chunk.toString()));
      req.on("end", () => {
        try {
          const updateData = JSON.parse(body);

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
        } catch (error) {
          if (error instanceof SyntaxError) {
            this.sendResponse(res, 400, {
              message: message.invalidJSON,
            });
          } else {
            this.sendResponse(res, 400, {
              message: message.unknown,
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
    data: StoredUser | StoredUser[] | User | unknown
  ): void {
    res.writeHead(statusCode, { "Content-Type": "application/json" });
    res.end(JSON.stringify(data));
  }

  private sendErrorResponse(
    res: ServerResponse,
    message:
      | ProccessMessage<User>
      | ProccessMessage<string>
      | ProccessMessage<StoredUser[]>
  ): void {
    let statusCode = 500;
    if (
      message.data === MESSAGES.userNotFound ||
      message.data === MESSAGES.notEndPoint ||
      message.data === MESSAGES.notMethod
    ) {
      statusCode = 404;
    } else if (
      message.data === MESSAGES.invalidUUID ||
      message.data === MESSAGES.required
    ) {
      statusCode = 400;
    }
    res.writeHead(statusCode, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: message.data || "An error occurred" }));
  }

  private handleError(error: unknown, res: ServerResponse): void {
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

export const userIPCController = (
  req: IncomingMessage,
  res: ServerResponse
): Promise<void> => new UserIPCController(userService).handleRequest(req, res);
