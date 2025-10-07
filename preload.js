const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  onFullScreenChanged: (callback) => ipcRenderer.on('fullscreen-changed', (event, isFullScreen) => callback(isFullScreen))
});
