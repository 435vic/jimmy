import express from "express";
import ViteExpress from "vite-express";
import { Context } from "../lib/context";
import multer from "multer";
import { createServer } from "http";
import { Server as SIOServer, Socket } from 'socket.io';

let jimmyContext: Context | undefined;
let jimmySocket: Socket | undefined;

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
app.post('/api/ask', express.json(), async (req, res) => {
  const message = req.body.message;
  jimmyContext?.ask(message, (event) => {
    if (event.type === 'partial') {
      process.stdout.write(event.content);
    } else if (event.type === 'func') {
      console.log(event);
    } else if (event.type === 'stop') {
      console.log(`\nstop: ${event.reason}\n--------\n`);
    }
    jimmySocket?.send(event)
  });
  res.status(200).send({ status: 'ok' });
})

sio.on('connection', (socket) => {
  console.log('A user connected');
  jimmySocket = socket;
});

ViteExpress.bind(app, server.listen(3000, () =>
  console.log("Server is listening on http://localhost:3000..."),
));
