const wallpaper = require('wallpaper');
const https = require('https');
const fs = require('fs');

/**
 * Entry astronomical image of the day
 */
const nasaAPOD = 'https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY';

/**
 * Percorso relativo dell'immagine scaricata
 */
const downloadedImage = 'image.jpg'

console.log('Requesting image...');

https.get(nasaAPOD, (res) => {
  let body = '';
  res.on('data', (data) => {
    body += data;
  });

  res.on('end', () => {
      const jsonBody = JSON.parse(body);
      retrieveImage(jsonBody)
  })
});

function retrieveImage(body){
  if(body.media_type !== 'image'){
    console.log('APOD is not an image');
  }
  else{
    console.log('Downloading image...')
    const file = fs.createWriteStream(downloadedImage);
    https.get(body.hdurl, (res) => {
      res.pipe(file);
      file.on('finish', function() {
        setWallpaper(downloadedImage);
      });
    })
  }
}

function setWallpaper(relativePath){
  console.log('Setting wallpaper');
  wallpaper.set(__dirname + '/' + relativePath);
}
