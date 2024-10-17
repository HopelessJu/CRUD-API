import { v4 } from "uuid";
import { User, StoredUser } from "./models/models";
import { MESSAGES as message } from "./util/messages";

export class UserDB {
  private users: StoredUser[] = [];

  public getAllUsers(): StoredUser[] {
    return this.users;
  }

  public getUserById(userId: string): StoredUser {
    const user = this.users.find((user) => user.id === userId);
    if (!user) {
      throw new Error(message.userNotFound);
    }
    return user;
  }

  public createUser(user: User): StoredUser {
    const newUser = { id: v4(), ...user };
    this.users.push(newUser);
    console.log(`${message.userCreated}`);
    return newUser;
  }

  public updateUser(userId: string, userUpdate: Partial<User>): User {
    const userToUpdate = this.users.find((user) => user.id === userId);
    if (!userToUpdate) {
      throw new Error(message.userNotFound);
    }
    Object.assign(userToUpdate, userUpdate);
    return userToUpdate;
  }

  public deleteUser(userId: string): boolean {
    const index = this.users.findIndex((user) => user.id === userId);
    if (index === -1) {
      throw new Error(message.userNotFound);
    }
    this.users.splice(index, 1);
    return true;
  }
}
