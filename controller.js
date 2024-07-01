const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');
const { execSync } = require('child_process')
const { postCall, postNewCall } = require('./api');
const path = require('path');

const newCall = async (req, res) => {
  try {
    const { callId, campaign, phoneNumber, extraInfo } = req.body;
    const resp = await postNewCall(callId, campaign, phoneNumber, extraInfo);

    console.log('Resp: ', resp);

    base64ToWav(resp.audio64, 'newCall.wav');
    res.send(resp);
  } catch (error) {
    console.error(error);
  }
}

const call = async (req, res) => {
  try {
    const { callId, phoneNumber, campaign } = req.body;

    if (!req.file) {
      return res.status(400).send('No se recibió ningún archivo');
    }

    const originalName = req.file.originalname;
    const audioBuffer = req.file.buffer;

    // Directorios de almacenamiento
    const audioDir = path.join(__dirname, 'audios');
    const wavDir = path.join(audioDir, 'wav');
    const monoDir = path.join(audioDir, 'mono');

    // Crear directorios si no existen
    if (!fs.existsSync(audioDir)) fs.mkdirSync(audioDir);
    if (!fs.existsSync(wavDir)) fs.mkdirSync(wavDir);
    if (!fs.existsSync(monoDir)) fs.mkdirSync(monoDir);

    // Ruta de almacenamiento del archivo
    const filePath = path.join(audioDir, originalName);
    const wavPath = path.join(wavDir, `${originalName}.wav`);
    const monoPath = path.join(monoDir, `${originalName}.wav`);

    // Guardar el archivo si no existe
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, audioBuffer);

      await convertM4AToWAV(filePath, wavPath);
      // Espera 1 segundo para asegurar que el archivo se haya creado
      await new Promise(resolve => setTimeout(resolve, 1000));
      await convertAudio(wavPath, monoPath);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    const audio64 = await wavToBase64(monoPath);
    const resp = await postCall(callId, campaign, phoneNumber, audio64);
    console.log('Responsing: ', resp)
    base64ToWav(resp.audio64, `${originalName}.wav`);

    res.send(resp);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error en el servidor');
  }
}

// Convertir a Mono y establecer la frecuencia a 8000 Hz
const convertAudio = async (inputPath, outputPath) => {
  ffmpeg(inputPath)
    .audioChannels(1)      // Convertir a mono
    .audioFrequency(8000)  // Establecer la frecuencia a 8000 Hz
    .on('end', () => {
      console.log('Conversión completada.');
    })
    .on('error', (err) => {
      console.error('Ocurrió un error: ' + err.message);
    })
    .save(outputPath);
}

const convertM4AToWAV = async (inputPath, outputPath) => {
  ffmpeg(inputPath)
    .toFormat('wav')
    .on('end', () => {
      console.log('Conversión de M4A a WAV completada.');
    })
    .on('error', (err) => {
      console.error('Ocurrió un error: ' + err.message);
    })
    .save(outputPath);
}

// Función para convertir WAV a base64
const wavToBase64 = async (filePath) => {
  try {
    console.log('filePath: ', filePath)
    if (!fs.existsSync(filePath)) {
      console.error('El archivo no existe');
      return null;
    } else {
      const fileData = fs.readFileSync(filePath);
      const base64Data = fileData.toString('base64');
      return base64Data;
    }
  } catch (error) {
    console.error('Error en wavToBase64 ', error);
    return null;
  }
}

const base64ToWav = (base64, name) => {
  try {
    const outputFile = `./salidas/${name}`;

    const binaryData = Buffer.from(base64, 'base64');

    fs.writeFileSync(outputFile, binaryData);

    console.log('Archivo salida creada');
  } catch (error) {
    console.error(error);
  }
}

const formatAudio = (name) => {
  try {
    const outputFile = `./audios/${name}`
    const outputFile2 = `./audios/aux_${name}`;
    const outputFile3 = `./audios/aux2_${name}`;

    const command = `ffmpeg -i ${outputFile} -acodec pcm_s16le ${outputFile2}`;
    execSync(command, { stdio: 'ignore' });
    fs.rmSync(outputFile);

    const command2 = `ffmpeg -i ${outputFile2} -ar 8000 ${outputFile3}`;
    execSync(command2, { stdio: 'ignore' });
    fs.rmSync(outputFile2);

    const command3 = `ffmpeg -i ${outputFile3} -ac 1 ${outputFile}`;
    execSync(command3, { stdio: 'ignore' });
    fs.rmSync(outputFile3);

    console.log('Audio formateado');
  } catch (error) {
    console.error(error);
  }
}

const convert = async (req, res) => {
  try {
    const { name } = req.body;
    convertM4AToWAV(`./audios/m4a/${name}.m4a`, `./audios/${name}.wav`);
    res.send({ message: 'Audio formateado' });
  } catch (error) {
    console.error(error);
  }
}

// Convertir a Mono usando la funcion convertAudio
const convertMono = (req, res) => {
  try {
    const { name } = req.body;
    const inputPath = `./audios/${name}.wav`;
    const outputPath = `./audios/mono/${name}.wav`;
    convertAudio(inputPath, outputPath);
    res.send({ message: 'Conversión completada' });
  } catch (error) {
    console.error(error);
  }
}

module.exports = {
  newCall,
  call,
  convert,
  convertMono
}
