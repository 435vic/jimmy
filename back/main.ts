import express from 'express';
import { Context } from '@jimmy/lib/context';
import multer from 'multer';

const app = express.Router();
const upload = multer({ storage: multer.memoryStorage() });
app.use(express.json());

app.get('/api/upload', upload.single('file'), (req, res) => {
    console.log(req.file);
    res.send("Hi");
});

export default app;
