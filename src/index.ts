import http from "http";
import { userController, UserController } from "./controllers/userController";
import dotenv from "dotenv";
import { startCluster } from "./cluster";
import { UserDB } from "./db";
import { SharedUserService } from "./services/sharedUserService";
import { UserService } from "./services/userService";

dotenv.config();
const isClusterMode = process.env.USE_CLUSTER === "true";
// const userdDB = new UserDB();
// const userService = isClusterMode
//   ? new SharedUserService(userdDB)
//   : new UserService(userdDB);
// const userController = new UserController();

if (isClusterMode) {
  startCluster();
} else {
  const PORT = process.env.PORT || 4000;
  const server = http.createServer(userController);
  server.listen(PORT, () => {
    console.log(`Server is running on PORT:${PORT}`);
  });
}
