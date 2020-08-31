const WindowsToaster = require('node-notifier').WindowsToaster;
const wallpaper = require('wallpaper');
const https = require('https');
const fs = require('fs');
const Jimp = require('jimp');
const Mustache = require('mustache');

/**
 * Percorso per la api key
 */
const apiPath = `${__dirname}/assets/api-key.txt`;

/**
 * Api key per nasa api, default 'DEMO_KEY'
 */
const apiKey = fs.existsSync(apiPath) ? fs.readFileSync(apiPath).toString() : 'DEMO_KEY';

/**
 * Entry astronomical image of the day
 */
const nasaAPOD = `https://api.nasa.gov/planetary/apod?api_key=${apiKey}`;

/**
 * Percorso relativo dell'immagine scaricata
 */
const downloadedImage = 'assets/image.png';

/**
 * Percorso relativo dell'immagine editata
 */
const editedImage = 'assets/image-edit.png';

/** Template mustache per index.html */
let mustacheFile = '';

fs.readFile('electron/index.mustache', (err, data) => {
  mustacheFile = data.toString();
});

/**
 * Specifica se richiedere l'iimagine di oggi
 */
const todayImage = !process.argv[2];
/**
 * Promise dell'immagine
 */
const promise = todayImage ? requestImageData(nasaAPOD) : retrieveRandomImage();

// Toast notification
if (todayImage) {
  // notifyStartup(todayImage);
}

// Catena orribile di promise
promise
  .catch((err) => console.log(err))
  .then((data) => {
    fs.writeFile('electron/index.html', Mustache.render(mustacheFile, { description: data.explanation }), () => {});
    retrieveImage(data.hdurl || data.url, downloadedImage)
      .catch((err) => console.log(err))
      .then((res) => {
        if (!res) {
          return;
        }
        setWallpaper(downloadedImage)
          .catch((err) => console.log(err))
          .then(() => console.log('Wallpaper set'));
        /*applyText(downloadedImage, editedImage, 'Plugin by @roveroniandrea')
          .catch((err) => console.log(err))
          .then((res) => {
            if (!res) {
              return;
            }
            setWallpaper(editedImage)
              .catch((err) => console.log(err))
              .then(() => console.log('Wallpaper set'));
          });*/
      });
  });

function retrieveRandomImage() {
  const today = new Date();
  today.setDate(today.getDate() - Math.round(Math.random() * 365));
  return requestImageData(`${nasaAPOD}&date=${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`);
}

function requestImageData(url) {
  return new Promise((resolve, reject) => {
    console.log('Requesting image...');
    https.get(url, (res) => {
      let body = '';
      res.on('data', (data) => {
        body += data;
      });

      res.on('end', () => {
        const jsonBody = JSON.parse(body);
        if (jsonBody.media_type !== 'image') {
          console.log('Image is not an image. Ehm...');
          retrieveRandomImage().then(
            (res) => resolve(res),
            (rej) => reject(rej)
          );
        } else {
          resolve(jsonBody);
        }
      });

      res.on('error', (err) => {
        reject('Error downloading image: ' + err.message);
      });
    });
  });
}

function retrieveImage(hdurl, downloadPath) {
  return new Promise((resolve, reject) => {
    console.log('Downloading image...');
    const file = fs.createWriteStream(downloadPath);
    https.get(hdurl, (res) => {
      const totalBytes = parseInt(res.headers['content-length']);
      let bytes = 0;

      res.pipe(file);
      res.on('data', (chunk) => {
        bytes += chunk.length;
        console.log('PROGRESS' + bytes / totalBytes);
      });
      file.on('finish', function () {
        resolve(true);
      });

      file.on('error', (err) => {
        reject('Error retrieving image: ' + err.message);
      });
    });
  });
}

function applyText(imagePath, savePath, message) {
  return new Promise((resolve, reject) => {
    Jimp.read(imagePath, (err, image) => {
      if (err) {
        reject(err);
      } else {
        Jimp.loadFont(Jimp.FONT_SANS_32_WHITE, (err, font) => {
          if (err) {
            reject(err);
          } else {
            image.print(font, 10, Math.max((image.getHeight() - 768) / 2, 20), message).write(savePath, () => {});
            resolve(true);
          }
        });
      }
    });
  });
}

function setWallpaper(relativePath) {
  console.log('Setting wallpaper');
  return wallpaper.set(__dirname + '/' + relativePath);
}
