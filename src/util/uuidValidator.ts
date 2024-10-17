import { validate } from "uuid";

export const isValidUUID = (id: string): boolean => validate(id);
