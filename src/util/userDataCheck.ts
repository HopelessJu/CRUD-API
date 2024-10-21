import { User } from "../models/models";

export function validateUserData(data: User | Partial<User>): boolean {
  const allowedKeys = ["username", "age", "hobbies"];

  return Object.keys(data).every((key) => allowedKeys.includes(key));
}
