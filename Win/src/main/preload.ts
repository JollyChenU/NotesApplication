import { contextBridge, ipcRenderer } from 'electron';

// 定义暴露给渲染进程的API接口
interface ElectronAPI {
  // 文件操作
  showSaveDialog: () => Promise<Electron.SaveDialogReturnValue>;
  showOpenDialog: () => Promise<Electron.OpenDialogReturnValue>;
  
  // 应用信息
  getAppVersion: () => Promise<string>;
  
  // 窗口控制
  minimizeWindow: () => Promise<void>;
  maximizeWindow: () => Promise<void>;
  closeWindow: () => Promise<void>;
  
  // 菜单事件监听
  onMenuNewNote: (callback: () => void) => void;
  onMenuSave: (callback: () => void) => void;
  onMenuStartAI: (callback: () => void) => void;
  onMenuStopAI: (callback: () => void) => void;
  onMenuImportModel: (callback: (filePath: string) => void) => void;
  
  // 移除事件监听
  removeAllListeners: (channel: string) => void;
}

// 暴露安全的API给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  // 文件操作
  showSaveDialog: () => ipcRenderer.invoke('show-save-dialog'),
  showOpenDialog: () => ipcRenderer.invoke('show-open-dialog'),
  
  // 应用信息
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  
  // 窗口控制
  minimizeWindow: () => ipcRenderer.invoke('minimize-window'),
  maximizeWindow: () => ipcRenderer.invoke('maximize-window'),
  closeWindow: () => ipcRenderer.invoke('close-window'),
  
  // 菜单事件监听
  onMenuNewNote: (callback: () => void) => {
    ipcRenderer.on('menu-new-note', callback);
  },
  onMenuSave: (callback: () => void) => {
    ipcRenderer.on('menu-save', callback);
  },
  onMenuStartAI: (callback: () => void) => {
    ipcRenderer.on('menu-start-ai', callback);
  },
  onMenuStopAI: (callback: () => void) => {
    ipcRenderer.on('menu-stop-ai', callback);
  },
  onMenuImportModel: (callback: (event: any, filePath: string) => void) => {
    ipcRenderer.on('menu-import-model', callback);
  },
  
  // 移除事件监听
  removeAllListeners: (channel: string) => {
    ipcRenderer.removeAllListeners(channel);
  }
} as ElectronAPI);

// 类型声明
declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}