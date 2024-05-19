import express from "express";
import ViteExpress from "vite-express";
import { Context } from "../lib/context";
import multer from "multer";
import { createServer } from "http";
import { Server as SIOServer } from 'socket.io';

let jimmyContext: Context | undefined;

const app = express();
const server = createServer(app);
const sio = new SIOServer(server);
const upload = multer({ storage: {
  async _handleFile(req, file, callback) {
    jimmyContext = await Context.from_stream(file.stream);
  },
  _removeFile(req, file, callback) {},
} })

app.post('/api/upload', upload.single('file'), async (req, res) => {
  console.log(req.file);
  res.status(200).send({ status: 'ok' });
});


/// { message: "ASFASFASF" }
app.post('/api/ask', async (req, res) => {
  const message = req.body.message;
  console.log(message);
})

sio.on('connection', (socket) => {
  console.log('A user connected');
});

ViteExpress.bind(app, server.listen(3000, () =>
  console.log("Server is listening on http://localhost:3000..."),
));
