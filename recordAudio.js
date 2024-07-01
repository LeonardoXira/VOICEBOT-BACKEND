const { exec } = require('child_process');

const outputFile = './audios/audio3.wav';

const command = `ffmpeg -f dshow -i audio="Varios micrófonos (Realtek(R) Audio)" -t 3 ${outputFile}`;

exec(command, (error, stdout, stderr) => {
  if (error) {
    console.error(`exec error: ${error}`);
    return;
  }
  if (stderr) console.log('stderr:', stderr);

  console.log('stdout', stdout);
  console.log('File created');
});