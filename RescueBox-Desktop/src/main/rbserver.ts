import { spawn } from 'node:child_process';
import { info, error } from 'electron-log/main';
import path from 'path';
import fs from 'fs';
import { PythonShell } from 'python-shell';
import * as registration from './handlers/registration';

const pluginPath = path.join(
  process.resourcesPath,
  'assets',
  'rb_server',
  'plugin_apps',
);
const audio = path.join(
  pluginPath,
  'audio-transcription',
  'audio_transcription',
  'server.py',
);
const facematch = path.join(
  pluginPath,
  'src',
  'facematch',
  'face_match_server.py',
);
const dfvideo = path.join(
  pluginPath,
  'DeepFakeDetector',
  'video_detector',
  'server.py',
);
const dfimage = path.join(
  pluginPath,
  'DeepFakeDetector',
  'image_model',
  'binary_deepfake_detection',
  'model_server.py',
);

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
      if (
        // plugin app is installed
        fs.existsSync(audio) &&
        fs.existsSync(facematch) &&
        fs.existsSync(dfvideo) &&
        fs.existsSync(dfimage)
      ) {
        // servers are registered
        const servers = registration.getModelServers();
        if (servers && (await servers).length > 0) {
          const resolvedServers = await servers;
          for (let i = 0; i < resolvedServers.length; i += 1) {
            const port = resolvedServers[i]?.serverPort;
            const online = resolvedServers[i]?.isUserConnected;
            info(`server found ${port} ${online}`);
            // server found 5000 if previous db exists ,
          }
          info(
            'install already executed because server paths and registration found',
          );
          return;
        }
      }
      const pythonPath = path.join(
        process.resourcesPath,
        'assets',
        'rb_server',
        'python311',
        'python.exe',
      );
      const script = 'rb.py';
      if (fs.existsSync(pythonPath)) {
        const options = {
          mode: 'text' as 'text',
          pythonPath: process.env.PY,
          pythonOptions: [], // get print results in real-time
          scriptPath: process.env.RBPY,
          args: ['-h'],
        };
        try {
          const messages = await PythonShell.run(script, options);
          info('results: %j', messages);
          return;
        } catch (perror) {
          error('Error running Python script:', perror);
        }
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
