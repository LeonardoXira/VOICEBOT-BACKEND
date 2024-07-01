const express = require('express');
const multer = require('multer');
const cors = require('cors');

const { call, newCall, convert, convertMono } = require('./controller');
const app = express();

// Configuración del almacenamiento de multer
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// use cors
app.use(cors())

app.use(express.json());

app.post('/newCall', newCall);

app.post('/call', upload.single('audio'), call);

app.post('/convert', convert);

app.post('/convertMono', convertMono);

app.listen(3005, () => {
  console.log('Server is running on port 3005');
});
