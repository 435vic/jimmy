import express from 'express'
import ViteExpress from 'vite-express'
import Jimmy from '@jimmy/lib';
import multer from 'multer';

const app = express();
const upload = multer({ storage: multer.memoryStorage() });
app.use(express.json());

app.get('/api/upload', upload.single('file'), (req, res) => {
    console.log(req.file);
    res.send("Hi");
});

ViteExpress.listen(app, 3000, () => {
    console.log('app listening at http://localhost:3000')
});
