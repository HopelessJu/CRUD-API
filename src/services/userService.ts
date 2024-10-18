import { UserDB } from "../db";
import { isValidUUID } from "../util/uuidValidator";
import { MESSAGES as message } from "../util/messages";
import { StoredUser, User, UserServiceInt } from "../models/models";
import { validateUserData } from "../util/validateData";

export class UserService implements UserServiceInt {
  constructor(private readonly db: UserDB) {}

  getAllUsers(): StoredUser[] {
    return this.db.getAllUsers();
  }

  getUserById(id: string): StoredUser {
    if (isValidUUID(id)) {
      try {
        return this.db.getUserById(id);
      } catch (error) {
        if (error instanceof Error) {
          throw new Error(`${error.message}`);
        } else {
          throw new Error("Unknown error occurred");
        }
      }
    } else {
      throw new Error(`${message.invalidUUID}`);
    }
  }

  createUser(user: User) {
    if (!validateUserData(user)) {
      throw new Error(`${message.required}`);
    } else {
      return this.db.createUser(user);
    }
  }

  updateUser(id: string, user: User): User {
    if (!isValidUUID(id)) {
      throw new Error(`${message.invalidUUID}`);
    }
    if (!validateUserData(user)) {
      throw new Error(`${message.required}`);
    }
    try {
      return this.db.updateUser(id, user);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`${error.message}`);
      } else {
        throw new Error("Unknown error occurred");
      }
    }
  }

  deleteUser(id: string) {
    if (!isValidUUID(id)) {
      throw new Error(`${message.invalidUUID}`);
    }
    try {
      this.db.deleteUser(id);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`${error.message}`);
      } else {
        throw new Error("Unknown error occurred");
      }
    }
  }
}
