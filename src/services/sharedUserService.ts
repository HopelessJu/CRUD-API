import {
  User,
  StoredUser,
  UserServiceInt,
  ProccessMessage,
} from "../models/models";
import { isValidUUID } from "../util/uuidValidator";
import { validateUserData } from "../util/validateData";
import { MESSAGES as message } from "../util/messages";
import { UserDB } from "../db";

export class SharedUserService implements UserServiceInt {
  constructor(private readonly sharedBD: UserDB) {}
  getAllUsers(): Promise<StoredUser[]> {
    return new Promise((resolve, reject) => {
      process.send!({ type: "getAllUsers" });
      process.once("message", (message: ProccessMessage<StoredUser[]>) => {
        if (message.type === "getAllUsers") {
          resolve(message.data);
        } else {
          reject(new Error("Failed to get all users"));
        }
      });
    });
  }

  getUserById(id: string): Promise<StoredUser> {
    return new Promise((resolve, reject) => {
      if (!isValidUUID(id)) {
        return reject(new Error(`${message.invalidUUID}`));
      }

      process.send!({ type: "getUserById", userId: id });
      process.once(
        "message",
        (message: ProccessMessage<StoredUser> | ProccessMessage<string>) => {
          if (message.type === "getUserById") {
            resolve(message.data as StoredUser);
          } else if (message.type === "error") {
            reject(new Error(message.data as string));
          } else {
            reject(new Error("Unknown error occurred"));
          }
        }
      );
    });
  }

  createUser(user: User): Promise<StoredUser> {
    return new Promise((resolve, reject) => {
      if (!validateUserData(user)) {
        return reject(new Error(`${message.required}`));
      }

      process.send!({ type: "createUser", user });
      process.once(
        "message",
        (message: ProccessMessage<StoredUser> | ProccessMessage<string>) => {
          if (message.type === "createUser") {
            resolve(message.data as StoredUser);
          } else if (message.type === "error") {
            reject(new Error(message.data as string));
          } else {
            reject(new Error("Failed to create user"));
          }
        }
      );
    });
  }

  updateUser(id: string, user: User): Promise<User> {
    return new Promise((resolve, reject) => {
      if (!isValidUUID(id)) {
        return reject(new Error(`${message.invalidUUID}`));
      }
      if (!validateUserData(user)) {
        return reject(new Error(`${message.required}`));
      }

      process.send!({ type: "updateUser", userId: id, user });
      process.once(
        "message",
        (message: ProccessMessage<User> | ProccessMessage<string>) => {
          if (message.type === "updateUser") {
            resolve(message.data as User);
          } else if (message.type === "error") {
            reject(new Error(message.data as string));
          } else {
            reject(new Error("Failed to update user"));
          }
        }
      );
    });
  }

  deleteUser(id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!isValidUUID(id)) {
        return reject(new Error(`${message.invalidUUID}`));
      }

      process.send!({ type: "deleteUser", userId: id });
      process.once("message", (message: ProccessMessage<string>) => {
        if (message.type === "deleteUser") {
          resolve();
        } else if (message.type === "error") {
          reject(new Error(message.data));
        } else {
          reject(new Error("Failed to delete user"));
        }
      });
    });
  }
}
