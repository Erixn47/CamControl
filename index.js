const { app, BrowserWindow, ipcMain, seassion } = require('electron/main');
const path = require('node:path');

let win;

function createWindow() {
    win = new BrowserWindow({
        width: 800,
        height: 600,
        title: "CamControl",
        icon: path.join(__dirname, 'images', 'logo.png'),
        autoHideMenuBar: true,
        center: true,
        minHeight: 400,
        minWidth: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: false,
            webSecurity: false,
            allowRunningInsecureContent: true,
            media: true,
            devTools: true
        }
    });

    win.loadFile('index.html');

    win.on('enter-full-screen', () => {
        win.webContents.send('fullscreen-changed', true);
    });

    win.on('leave-full-screen', () => {
        win.webContents.send('fullscreen-changed', false);
    });
}

app.whenReady().then(() => {
    createWindow();
    const cachePath = app.getPath('userData') + '/Cache';
    seassion.defaultSession.setCachePath(cachePath);
});
