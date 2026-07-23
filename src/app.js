import express from "express";
import cors from "cors";
const app = express();

app.use(express.json());
app.use(cors());

app.get("/", (request, response) => {
  return response.send("Server running...");
});



export default app;