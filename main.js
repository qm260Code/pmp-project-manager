const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    title: "BOSCH 项目管理控制中心",
    webPreferences: {
      webSecurity: false, // 允许在 file:// 协议下正常跨域读取 ES 模块 (CORS Bypassing)
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  // 载入主入口 HTML 文件
  mainWindow.loadFile('index.html');

  // 默认启动最大化
  mainWindow.maximize();
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});
