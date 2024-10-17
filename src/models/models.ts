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
