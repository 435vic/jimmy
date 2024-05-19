import express from "express";
import ViteExpress from "vite-express";
import { Context } from "../lib/context";
import multer from "multer";

const app = express();
const upload = multer({ storage: multer.memoryStorage() })

app.post('/api/upload', upload.single('file'), (req, res) => {
  console.log(req.file);
  res.status(200).send({ status: 'ok' });
});

ViteExpress.listen(app, 3000, () =>
  console.log("Server is listening on http://localhost:3000..."),
);
