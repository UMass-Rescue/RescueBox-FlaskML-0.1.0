import { spawn } from 'node:child_process';
import { info, error } from 'electron-log/main';
import path from 'path';
import fs from 'fs';

export default class RBServer {
  public static appath: string;

  constructor(scpath: string) {
    RBServer.appath = scpath;
  }

  // Install PowerShell script to install RB server
  static async installRBserver(appPath: string): Promise<void> {
    try {
      RBServer.appath = appPath;
      // "$env:APPDATA\RescueBox-Desktop\logs"
      const rbServerProcessInfo = path.join(
        appPath,
        'RescueBox-Desktop',
        'logs',
        'rb_process.txt',
      );
      if (fs.existsSync(rbServerProcessInfo)) {
        info(
          `Skip RescueBox Server Install. ${rbServerProcessInfo} found, Model Server running perhaps`,
        );
        return;
      }
      info(`Desktop app path for logs : ${appPath}`);
      const pathf = path.join(
        process.resourcesPath,
        'assets',
        'rb_server',
        'installer.ps1',
      );
      // c:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe is a pre-req
      const pse = path.join(
        'c:',
        'WINDOWS',
        'System32',
        'WindowsPowerShell',
        'v1.0',
        'powershell.exe',
      );
      info(`powershell script path: ${pathf}`);
      // const maxBuffer = 1048576; // 1MB in bytes
      const arf = `-File ${pathf}`;
      const child = spawn('powershell.exe', [
        pse,
        '-ExecutionPolicy Bypass',
        arf,
        process.resourcesPath,
      ]);
      child.stdout.on('data', (data: any) => {
        info(`stdout: ${data}`);
      });

      child.stderr.on('data', (data: any) => {
        info(`stderr: ${data}`);
      });

      child.on('close', (code: any) => {
        info(`RescueBox Installed Ok, exit=${code}.Proceed to register models`);
      });
    } catch (err: any) {
      info(err);
      error('Failed to exec powershell', err);
    }
  }
}
