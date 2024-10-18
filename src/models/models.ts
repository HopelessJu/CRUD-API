export interface User {
  username: string;
  age: number;
  hobbies: string[];
}

export interface StoredUser extends User {
  id: string;
}

export interface WorkerMessage {
  req: {
    url: string | undefined;
    method: string | undefined;
    headers: { [key: string]: string | string[] | undefined };
  };
}

export interface UserServiceInt {
  getAllUsers(): StoredUser[] | Promise<StoredUser[]>;
  getUserById(id: string): StoredUser | Promise<StoredUser>;
  createUser(user: User): StoredUser | Promise<StoredUser>;
  updateUser(id: string, user: User): User | Promise<User>;
  deleteUser(id: string): void | Promise<void>;
}

export interface ProccessMessage<T> {
  type: string;
  data: T;
}
