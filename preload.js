// 渲染层唯一桥：穿透/截图/文件工具/历史/GPU/语义记忆
const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('petWindow', {
  setClickThrough: (on) => ipcRenderer.send('pet-click-through', !!on),
  quitApp: () => ipcRenderer.send('pet-quit'),
  captureScreen: () => ipcRenderer.invoke('pet-capture'),
  fsTool: (call) => ipcRenderer.invoke('pet-fs-tool', call),
  historyLoad: (mode) => ipcRenderer.invoke('history-load', mode),
  historySave: (arr, mode) => ipcRenderer.invoke('history-save', arr, mode),
  gpuUtil: () => ipcRenderer.invoke('gpu-util'),
  memoryAdd: (items, mode) => ipcRenderer.invoke('memory-add', items, mode),
  memorySearch: (query, mode, limit) => ipcRenderer.invoke('memory-search', query, mode, limit),
  fstoolTail: (n) => ipcRenderer.invoke('fstool-tail', n),
  roomStateLoad: () => ipcRenderer.invoke('room-state-load'),
  getDisplays: () => ipcRenderer.invoke('get-displays'),
  getWinBounds: () => ipcRenderer.invoke('get-win-bounds'),
  roomStateSave: (s) => ipcRenderer.invoke('room-state-save', s),
  onDisplaysChanged: (cb) => ipcRenderer.on('displays-changed', () => cb()),
  onRoomChanged: (cb) => ipcRenderer.on('room-changed', () => cb()),
  wakeBeat: (s) => ipcRenderer.invoke('wake-beat', s),
});
