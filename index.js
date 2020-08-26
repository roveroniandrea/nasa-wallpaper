const WindowsToaster = require('node-notifier').WindowsToaster;
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


let notifyStartup = function (isToday) {
    var notifier = new WindowsToaster({
        withFallback: false,
        customPath: undefined
    });

    notifier.notify(
        {
            title: 'NASA wallpaper',
            message: isToday? 'Requesting today\'s astronomical photo ASAP!': 'Requesting another beatiful photo...',
            sound: false,
            appID: 'NASA wallpaper',
            id: 1
        }
    );
}

if(!process.argv[2]){
  notifyStartup(true);
  requestImageData(nasaAPOD);
}
else{
  notifyStartup(false);
  retrieveRandomImage();
}

function retrieveRandomImage(){
  const today = new Date();
  today.setDate(today.getDate() - Math.round(Math.random() * 365));
  requestImageData(`${nasaAPOD}&date=${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`)
}

function requestImageData(url){
  console.log('Requesting image...');
  https.get(url, (res) => {
    let body = '';
    res.on('data', (data) => {
      body += data;
    });
  
    res.on('end', () => {
        const jsonBody = JSON.parse(body);
        retrieveImage(jsonBody)
    })
  });
}

function retrieveImage(body){
  if(body.media_type !== 'image'){
    console.log('APOD is not an image');
    retrieveRandomImage();
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
