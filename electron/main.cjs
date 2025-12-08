const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  // 创建浏览器窗口
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    title: "Charrose Gallery",
    // icon: path.join(__dirname, '../public/icon.png'), // 如果你有图标文件，取消这行注释
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false
    },
    autoHideMenuBar: true, // 隐藏顶部菜单栏
  });

  const isDev = process.env.NODE_ENV === 'development';

  if (isDev) {
    // 开发模式：加载 Vite 本地服务
    win.loadURL('http://localhost:3000');
  } else {
    // 生产模式：加载打包后的文件
    win.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});