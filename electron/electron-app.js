const { app, BrowserWindow, screen, Tray, Menu, ipcMain, shell } = require('electron');
const spawn = require('child_process').spawn;
const fs = require('fs');
const nasaIcon = 'assets/nasa-icon.png';

/** * Tray è l'icona in basso a dx */
let tray = null;

const windowSize = {
  width: 600,
  height: 600,
};

app.whenReady().then(() => {
  /*** Finestra */
  const win = new BrowserWindow({
    width: windowSize.width,
    height: windowSize.height,
    show: false,
    transparent: true,
    frame: false,
    closable: false,
    icon: nasaIcon,
    title: 'NASA wallpaper',
    x: screen.getPrimaryDisplay().bounds.width - windowSize.width,
    y: 0,
  });

  win.on('close', (event) => {
    if (!win.isClosable()) {
      event.preventDefault();
      win.hide();
      win.setOpacity(0);
    }
  });
  tray = new Tray(nasaIcon);

  /** Tray menu */
  const trayMenu = Menu.buildFromTemplate([
    { id: 'BTN_APOD', label: 'NASA astronomical photo of the day', click: () => electronSetImage(true) },
    { id: 'BTN_RANDOM', label: 'NASA random photo', click: () => electronSetImage(false) },
    { type: 'separator' },
    {
      label: 'Made by @roveroniandrea',
      click: () => {
        shell.openExternal('https://github.com/roveroniandrea');
      },
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        win.setClosable(true);
        win.close();
      },
    },
  ]);

  tray.setToolTip('NASA wallpaper');
  tray.on('click', () => {
    fs.exists('electron/index.html', (exist) => {
      if (exist) {
        win.show();
        win.setOpacity(0.7);
        win.loadFile('index.html');
      }
    });
  });
  tray.setContextMenu(trayMenu);

  electronSetImage(true);

  function electronSetImage(todayImage) {
    trayMenu.getMenuItemById('BTN_APOD').enabled = false;
    trayMenu.getMenuItemById('BTN_RANDOM').enabled = false;

    win.show();
    win.setOpacity(0);
    win.setProgressBar(2, 'indeterminate');

    // Primo argomento il file da eseguire
    let args = ['index.js'];
    // Se voglio l'immagine random aggiungo un argomento
    if (!todayImage) {
      args.push('random');
    }

    // Spawn processo figlio
    const child = spawn('node', args, {
      detached: true,
    });
    //Listener per stdout
    child.stdout.on('data', (data) => {
      const dataString = data.toString();
      if (dataString.includes('PROGRESS')) {
        const progress = parseFloat(dataString.replace('PROGRESS', ''));
        win.setProgressBar(progress, 'normal');
      }
    });

    child.stdout.pipe(process.stdout);

    child.on('exit', () => {
      console.log('Process exited');
      win.setProgressBar(-1, 'none');
      win.setOpacity(0);
      win.hide();
      trayMenu.getMenuItemById('BTN_APOD').enabled = true;
      trayMenu.getMenuItemById('BTN_RANDOM').enabled = true;
    });

    // Listener per stderr (non testato)
    child.stderr.on('data', (data) => {
      console.log('err', data.toString());
      tray.displayBalloon({
        title: 'Error!',
        content: data.toString(),
      });

      setTimeout(() => {
        tray.removeBalloon();
      }, 3000);
    });
  }
});
