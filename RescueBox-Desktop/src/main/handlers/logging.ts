/* eslint-disable @typescript-eslint/no-unused-vars */
import fs from 'fs';
import log from 'electron-log/main';
import path from 'path';

export async function getLogs(_event: any, _arg: any) {
  return log.transports.file.readAllLogs();
}

export async function clearLogs(_event: any, _arg: any) {
  // window.fileSystem.saveLogs();
  const savePath = `rb_main_saved_${new Date().toISOString().replaceAll(':', '_')}.log`;
  const appDataPath = process.env.APPDATA;
  let pathf = '.';
  if (appDataPath) {
    const outDir = path.join(appDataPath, 'RescueBox-Desktop', 'logs');
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir);
    }
    pathf = path.join(outDir, savePath);
  }
  fs.copyFileSync(log.transports.file.getFile().path, pathf);
  log.transports.file.getFile().clear();
  return true;
}
