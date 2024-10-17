export interface User {
  username: string;
  age: number;
  hobbies: string[];
}

export interface StoredUser extends User {
  id: string;
}
