import express from "express";
import ViteExpress from "vite-express";
import { Context } from "../lib/context";

const app = express();

app.get("/hello", (_, res) => {
  res.send("Hello Vite + React + TypeScript!");
});

ViteExpress.listen(app, 3000, () =>
  console.log("Server is listening on http://localhost:3000..."),
);
