/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import path from 'path';
import log from 'electron-log';
import { app, BrowserWindow, shell, ipcMain } from 'electron';
import { autoUpdater } from 'electron-updater';
import console from 'console';
import isDummyMode from 'src/shared/dummy_data/set_dummy_mode';
// import ReactDOM from 'react-dom';
// import { useEffect } from 'react';
import fs from 'fs';
// import Deploy from 'src/renderer/audit_logs/Deploy';
import MenuBuilder from './menu';
import { resolveHtmlPath } from './util';
import * as registration from './handlers/registration';
import * as job from './handlers/job';
import * as models from './handlers/models';
import * as fileSystem from './handlers/file-system';
import * as loggingHandler from './handlers/logging';
import * as deployHandler from './handlers/deploy';
import * as taskHandler from './handlers/task';
import DatabaseConn, { getDbPath } from './database/database-conn';
import RBServer from './rbserver';

// It preloads electron-log IPC code in renderer processes
const mlog = log.create({ logId: 'main' });
log.initialize();

class AppUpdater {
  constructor() {
    mlog.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let mainWindow: BrowserWindow | null = null;

// IPCMain Setup

function setupIpcMain() {
  // Database: access to reset database
  ipcMain.handle('database:reset-database', () => {
    if (isDummyMode) {
      return DatabaseConn.resetDummyData(getDbPath(app));
    }
    return DatabaseConn.resetDatabase(getDbPath(app));
  });
  // Registration: handles registering models
  ipcMain.handle(
    'register:register-model-app-ip',
    registration.registerModelAppIp,
  );
  ipcMain.handle(
    'register:unregister-model-app-ip',
    registration.unregisterModelAppIp,
  );
  ipcMain.handle(
    'register:get-model-app-status',
    registration.getModelAppStatus,
  );
  ipcMain.handle('register:get-model-servers', registration.getModelServers);
  ipcMain.handle('register:get-model-server', registration.getModelServer);

  // Models: handles registering models
  ipcMain.handle('models:get-models', models.getModels);
  ipcMain.handle('models:get-model-by-uid', models.getModelByUid);
  ipcMain.handle('models:remove-model-by-uid', models.removeModelByUid);

  // Job: handles creating jobs
  ipcMain.handle('job:get-jobs', job.getJobs);
  ipcMain.handle('job:get-job-by-id', job.getJobById);
  ipcMain.handle('job:run-job', job.runJob);
  ipcMain.handle('job:cancel-job', job.cancelJob);
  ipcMain.handle('job:delete-job-by-id', job.deleteJobById);

  // File System: handles file system operations
  ipcMain.handle('fileSystem:read-file', fileSystem.readFile);
  ipcMain.handle('fileSystem:open-path', fileSystem.openPath);
  ipcMain.handle(
    'fileSystem:show-file-in-explorer',
    fileSystem.showFileInExplorer,
  );
  ipcMain.handle('fileSystem:select-directory', fileSystem.selectDirectory);
  ipcMain.handle('fileSystem:select-directories', fileSystem.selectDirectories);
  ipcMain.handle('fileSystem:select-file', fileSystem.selectFile);
  ipcMain.handle('fileSystem:select-files', fileSystem.selectFiles);
  ipcMain.handle('fileSystem:select-file-save', fileSystem.selectFileSave);
  ipcMain.handle('fileSystem:save-logs', fileSystem.saveLogs);
  ipcMain.handle('fileSystem:get-files-from-dir', fileSystem.getFilesFromDir);
  ipcMain.handle('fileSystem:delete-file', fileSystem.deleteFile);
  ipcMain.handle('fileSystem:get-file-icon', fileSystem.getFileIcon);
  ipcMain.handle('fileSystem:join-path', fileSystem.joinPath);

  // Logging: handles logging operations
  ipcMain.handle('logging:get-logs', loggingHandler.getLogs);
  ipcMain.handle('deploy:get-deploy', deployHandler.getDeploy);
  ipcMain.handle('logging:clear-logs', loggingHandler.clearLogs);

  // Task: handles task service operations
  ipcMain.handle('task:get-api-routes', taskHandler.getApiRoutes);
  ipcMain.handle('task:get-app-metadata', taskHandler.getAppMetadata);
  ipcMain.handle('task:get-task-schema', taskHandler.getTaskSchema);
  ipcMain.handle(
    'task:get-task-by-model-uid-and-task-id',
    taskHandler.getTaskByModelUidAndTaskId,
  );
}

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const isDebug =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDebug) {
  require('electron-debug')();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload,
    )
    .catch(console.log);
};

/**
 * Window Management ...
 */
// eslint-disable-next-line func-names, @typescript-eslint/no-unused-vars
const createDeployWindow = async (top: BrowserWindow) => {
  try {
    const RESOURCES_PATH = app.isPackaged
      ? path.join(process.resourcesPath, 'assets')
      : path.join(__dirname, '../../assets');

    const getAssetPath = (...paths: string[]): string => {
      return path.join(RESOURCES_PATH, ...paths);
    };

    let rbWindow: BrowserWindow | null;
    const mainIndex = resolveHtmlPath('rb.html'); // the login window
    const iconPath = getAssetPath('icon.png'); // replace with your own logo
    rbWindow = new BrowserWindow({
      // 1. create new Window
      height: 300,
      width: 300,
      // eslint-disable-next-line no-path-concat
      icon: __dirname + iconPath,
      frame: false, // I had my own style of title bar, so I don't want to show the default
      backgroundColor: '#68b7ad', // I had to set back color to window in case the white screen show up
      // backgroundColor: '#420024',
      parent: top,
      modal: true,
      show: false, // to prevent the white screen when loading the window, lets not show it first
      webPreferences: {
        // preload: path.join(__dirname, 'preload.js'),
        nodeIntegration: true, // Enable Node.js in the renderer process (if needed)
        contextIsolation: false, // Disable context isolation (if needed)
      },
    });

    rbWindow.loadFile(mainIndex);

    rbWindow.webContents.once('dom-ready', () => {
      console.log('child window log here ....');

      rbWindow?.webContents.executeJavaScript(`
        log.info('JavaScript executed from Electron main process!');
        const { render } = require('react-dom');
        const React = require('react');
        const DeployComponent = require('src/renderer/audit_logs/Deploy').default;
        render(React.createElement(DeployComponent), document.getElementById('root'));
      `);
    });

    rbWindow.once('ready-to-show', () => {
      // rbWindow?.setAlwaysOnTop(true);
      top.show();
      rbWindow?.show();
      rbWindow?.webContents.send('message-from-main', 'Hello from Deploy!');
    });

    rbWindow.on('closed', () => {
      rbWindow = null;
    });
  } catch (error) {
    log.info(error);
  }
};

const createWindow = async () => {
  if (isDebug) {
    await installExtensions();
  }

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  mainWindow = new BrowserWindow({
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#374151',
      symbolColor: '#ffffff',
      height: 30,
    },
    trafficLightPosition: {
      x: 10,
      y: 8,
    },
    show: false,
    width: 1024,
    height: 728,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
      webSecurity: process.env.NODE_ENV !== 'development',
    },
  });

  // createDeployWindow(mainWindow);

  mainWindow.loadURL(resolveHtmlPath('index.html'));

  mainWindow.on('ready-to-show', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      // mainWindow?.webContents.send('message-from-main', 'Hello from Main!');
      mainWindow.show();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();

  // Open urls in the user's browser
  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  new AppUpdater();
};

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

if (process.env.NODE_ENV === 'development') {
  app.setAppUserModelId(process.execPath);
}

app
  .whenReady()
  .then(async () => {
    try {
      setupIpcMain();
      const cwd = app.getPath('userData');
      RBServer.appath = cwd;
      log.info('RBServer appath is', cwd);
      const rbServerLog = path.join(
        process.resourcesPath,
        'assets',
        'rb_server',
        'rb_py.log',
      );
      if (fs.existsSync(rbServerLog)) {
        log.info(`Skip RescueBox Server Install. ${rbServerLog} exists`);
      } else {
        log.info('Run powershell script to install RBserver..');
        await RBServer.installRBserver(cwd);
      }
      const dbPath = getDbPath(app);
      log.info('Database location is', dbPath);
      if (isDummyMode) {
        log.info('Initializing dummy data');
        await DatabaseConn.initDatabaseTest(dbPath);
      } else {
        log.info('Initializing database');
        await DatabaseConn.initDatabase(dbPath);
        // await DatabaseConn.resetDatabase(dbPath); // For testing purposes only
      }
      createWindow();
      app.on('activate', () => {
        // On macOS it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        console.log('Activating app');
        if (mainWindow === null) createWindow();
      });
    } catch (error) {
      console.log(error);
    }
  })
  .catch(console.log);
