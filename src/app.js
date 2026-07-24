import env from "./config/env.js";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import constants from "./constants.js";
const app = express();


app.use(cors({
  origin: env.cors_origin,
  credentials: true,
}));

app.use(express.json({
  limit: constants.limit,
}));

app.use(express.urlencoded({
  extended: true,
  limit: constants.limit,
}));

app.use(express.static("public"));

app.use(cookieParser());


app.get("/", (request, response) => {
  return response.send("Server running...");
});



export default app;