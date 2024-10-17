import http, { ServerResponse } from "http";
import { userController } from "../controllers/userController";
import { UserDB } from "../db";
import { UserService } from "../services/userService";
import { v4 as uuidv4 } from "uuid";
import { StoredUser, User } from "../models/models";

// Initialize UserDB and UserService
const userDB = new UserDB();
const userService = new UserService(userDB);

interface HttpResponse<T> {
  statusCode: number;
  body: T;
}

// Helper function to make HTTP requests
const request = (
  method: string,
  url: string,
  data?: any
): Promise<HttpResponse<StoredUser>> => {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        method,
        hostname: "localhost",
        port: 4000,
        path: url,
        headers: { "Content-Type": "application/json" },
      },
      (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          const parsedBody = body ? JSON.parse(body) : null;
          resolve({
            statusCode: res.statusCode ?? 500,
            body: parsedBody,
          });
        });
      }
    );

    req.on("error", (err) => {
      reject(err);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
};

// Start a temporary server for testing
const server = http.createServer(userController);
let createdUserId: string;

beforeAll((done) => {
  server.listen(4000, () => {
    console.log("Test server running on port 4000");
    done();
  });
});

afterAll((done) => {
  server.close(done);
});

// Test scenarios
describe("User API", () => {
  test("Get all records - expected empty array", async () => {
    const response = await request("GET", "/api/users");
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual([]);
  });

  test("Create a new user - expected newly created record", async () => {
    const newUser = { username: "john_doe", age: 30, hobbies: ["reading"] };
    userDB.createUser(newUser);
    const response = await request("POST", "/api/users", newUser);
    expect(response.statusCode).toBe(201);
    expect(response.body).toMatchObject(newUser);
    expect(response.body).toHaveProperty("id");

    createdUserId = response.body.id;
  });

  test("Get created user by ID - expected created record", async () => {
    const response = await request("GET", `/api/users/${createdUserId}`);
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("id", createdUserId);
  });

  test("Update created user - expected updated object", async () => {
    const updatedUser = {
      username: "john_doe_updated",
      age: 31,
      hobbies: ["traveling"],
    };
    const response = await request(
      "PUT",
      `/api/users/${createdUserId}`,
      updatedUser
    );
    expect(response.statusCode).toBe(200);
    expect(response.body).toMatchObject(updatedUser);
    expect(response.body).toHaveProperty("id", createdUserId);
  });

  test("Delete created user - confirmation of successful deletion", async () => {
    const response = await request("DELETE", `/api/users/${createdUserId}`);
    expect(response.statusCode).toBe(204);
  });

  test("Get deleted user by ID - expected not found response", async () => {
    const createdUserId = userDB.getAllUsers()[0].id;
    const response = await request("GET", `/api/users/${createdUserId}`);
    expect(response.statusCode).toBe(404);
    expect(response.body).toEqual({ message: "User not found" });
  });
});