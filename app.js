import express from "express";
import connect from "./schemas/index.js";
import DataRouter from "./routes/products.router.js";
import errorHandlerMiddleware from "./middlewares/error-handler.middleware.js";

const app = express();
const PORT = 3000;

connect();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const router = express.Router();

app.use("/api", [router, DataRouter]);

app.use(errorHandlerMiddleware);

app.listen(PORT, () => {
  console.log(PORT, "포트로 서버가 열렸어요!");
});
