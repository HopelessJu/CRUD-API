import { v4 } from "uuid";
import { User, StoredUser } from "./models/models";
import { MESSAGES as message } from "./util/messages";
import { validateUserData } from "./util/userDataCheck";

const users: StoredUser[] = [];

export class UserDB {
  public getAllUsers(): StoredUser[] {
    return users;
  }

  public getUserById(userId: string): StoredUser {
    const user = users.find((user) => user.id === userId);
    if (!user) {
      throw new Error(message.userNotFound);
    }
    return user;
  }

  public createUser(user: User): StoredUser {
    const validUser = validateUserData(user);

    if (!validUser) {
      throw new Error(message.invalidFields);
    }
    const newUser = { id: v4(), ...user };
    users.push(newUser);
    console.log(`${message.userCreated}`);
    return newUser;
  }

  public updateUser(userId: string, userUpdate: Partial<User>): User {
    const validUser = validateUserData(userUpdate);

    if (!validUser) {
      throw new Error(message.invalidFields);
    }
    const userToUpdate = users.find((user) => user.id === userId);
    if (!userToUpdate) {
      throw new Error(message.userNotFound);
    }
    Object.assign(userToUpdate, userUpdate);
    return userToUpdate;
  }

  public deleteUser(userId: string): boolean {
    const index = users.findIndex((user) => user.id === userId);
    if (index === -1) {
      throw new Error(message.userNotFound);
    }
    users.splice(index, 1);
    return true;
  }
}
