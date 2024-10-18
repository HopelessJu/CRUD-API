import { User } from "../models/models";

export const validateUserData = (user: User): boolean => {
  if (typeof user.age !== "number" || user.age < 0) {
    return false;
  }
  if (typeof user.username !== "string" || user.username.trim() === "") {
    return false;
  }
  if (
    !Array.isArray(user.hobbies) ||
    user.hobbies.some((hobby) => typeof hobby !== "string")
  ) {
    return false;
  }
  return true;
};
