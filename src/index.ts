import http from "http";
import { userController } from "./controllers/userController";
import dotenv from "dotenv";

dotenv.config();
const PORT = process.env.PORT || 3000;

const server = http.createServer(userController);

server.listen(PORT, () => {
  console.log(`Server is running on PORT:${PORT}`);
});
