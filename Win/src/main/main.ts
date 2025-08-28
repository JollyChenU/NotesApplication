import { app, BrowserWindow, Menu, ipcMain, dialog } from 'electron';
import * as path from 'path';
import { fileURLToPath } from 'url';

const isDev = process.env.NODE_ENV === 'development';

class MainWindow {
  private window: BrowserWindow | null = null;

  constructor() {
    this.createWindow();
    this.setupEventHandlers();
  }

  private createWindow(): void {
    // 创建浏览器窗口
    this.window = new BrowserWindow({
      width: 1200,
      height: 800,
      minWidth: 800,
      minHeight: 600,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        enableRemoteModule: false,
        preload: path.join(__dirname, 'preload.js')
      },
      titleBarStyle: 'default',
      show: false
    });

    // 加载应用
    if (isDev) {
      this.window.loadURL('http://localhost:3000');
      this.window.webContents.openDevTools();
    } else {
      this.window.loadFile(path.join(__dirname, '../renderer/index.html'));
    }

    // 窗口准备好后显示
    this.window.once('ready-to-show', () => {
      this.window?.show();
    });

    // 窗口关闭事件
    this.window.on('closed', () => {
      this.window = null;
    });
  }

  private setupEventHandlers(): void {
    // 设置应用菜单
    this.setupMenu();

    // IPC 事件处理
    this.setupIpcHandlers();
  }

  private setupMenu(): void {
    const template: Electron.MenuItemConstructorOptions[] = [
      {
        label: '文件',
        submenu: [
          {
            label: '新建笔记',
            accelerator: 'CmdOrCtrl+N',
            click: () => {
              this.window?.webContents.send('menu-new-note');
            }
          },
          {
            label: '保存',
            accelerator: 'CmdOrCtrl+S',
            click: () => {
              this.window?.webContents.send('menu-save');
            }
          },
          { type: 'separator' },
          {
            label: '退出',
            accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
            click: () => {
              app.quit();
            }
          }
        ]
      },
      {
        label: '编辑',
        submenu: [
          { role: 'undo', label: '撤销' },
          { role: 'redo', label: '重做' },
          { type: 'separator' },
          { role: 'cut', label: '剪切' },
          { role: 'copy', label: '复制' },
          { role: 'paste', label: '粘贴' },
          { role: 'selectall', label: '全选' }
        ]
      },
      {
        label: 'AI',
        submenu: [
          {
            label: '启动AI模型',
            click: () => {
              this.window?.webContents.send('menu-start-ai');
            }
          },
          {
            label: '停止AI模型',
            click: () => {
              this.window?.webContents.send('menu-stop-ai');
            }
          },
          { type: 'separator' },
          {
            label: '导入模型',
            click: async () => {
              const result = await dialog.showOpenDialog(this.window!, {
                properties: ['openFile'],
                filters: [
                  { name: 'RWKV模型文件', extensions: ['pth', 'st'] },
                  { name: '所有文件', extensions: ['*'] }
                ]
              });
              
              if (!result.canceled && result.filePaths.length > 0) {
                this.window?.webContents.send('menu-import-model', result.filePaths[0]);
              }
            }
          }
        ]
      },
      {
        label: '视图',
        submenu: [
          { role: 'reload', label: '重新加载' },
          { role: 'forceReload', label: '强制重新加载' },
          { role: 'toggleDevTools', label: '切换开发者工具' },
          { type: 'separator' },
          { role: 'resetZoom', label: '实际大小' },
          { role: 'zoomIn', label: '放大' },
          { role: 'zoomOut', label: '缩小' },
          { type: 'separator' },
          { role: 'togglefullscreen', label: '切换全屏' }
        ]
      },
      {
        label: '帮助',
        submenu: [
          {
            label: '关于',
            click: () => {
              dialog.showMessageBox(this.window!, {
                type: 'info',
                title: '关于 AI Notes',
                message: 'AI Notes v1.0.0',
                detail: '基于RWKV模型的智能笔记软件\n\n© 2024 AI Notes Team'
              });
            }
          }
        ]
      }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
  }

  private setupIpcHandlers(): void {
    // 文件系统操作
    ipcMain.handle('show-save-dialog', async () => {
      const result = await dialog.showSaveDialog(this.window!, {
        filters: [
          { name: 'Markdown文件', extensions: ['md'] },
          { name: '文本文件', extensions: ['txt'] },
          { name: '所有文件', extensions: ['*'] }
        ]
      });
      return result;
    });

    ipcMain.handle('show-open-dialog', async () => {
      const result = await dialog.showOpenDialog(this.window!, {
        properties: ['openFile'],
        filters: [
          { name: 'Markdown文件', extensions: ['md'] },
          { name: '文本文件', extensions: ['txt'] },
          { name: '所有文件', extensions: ['*'] }
        ]
      });
      return result;
    });

    // 应用信息
    ipcMain.handle('get-app-version', () => {
      return app.getVersion();
    });

    // 窗口控制
    ipcMain.handle('minimize-window', () => {
      this.window?.minimize();
    });

    ipcMain.handle('maximize-window', () => {
      if (this.window?.isMaximized()) {
        this.window.unmaximize();
      } else {
        this.window?.maximize();
      }
    });

    ipcMain.handle('close-window', () => {
      this.window?.close();
    });
  }

  public getWindow(): BrowserWindow | null {
    return this.window;
  }
}

// 应用程序事件处理
app.whenReady().then(() => {
  new MainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      new MainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// 安全设置
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, navigationUrl) => {
    event.preventDefault();
  });

  contents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    
    if (parsedUrl.origin !== 'http://localhost:3000' && !isDev) {
      event.preventDefault();
    }
  });
});