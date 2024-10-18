import http from "http";
import { userController } from "./controllers/userController";
import dotenv from "dotenv";
import { startCluster } from "./cluster";

dotenv.config();
const isClusterMode = process.env.USE_CLUSTER === "true";

if (isClusterMode) {
  startCluster();
} else {
  const PORT = process.env.PORT || 4000;
  const server = http.createServer(userController);
  server.listen(PORT, () => {
    console.log(`Server is running on PORT:${PORT}`);
  });
}
