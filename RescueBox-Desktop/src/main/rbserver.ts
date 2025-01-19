import { spawn } from 'node:child_process';
import { info, error } from 'electron-log/main';
import path from 'path';
import fs from 'fs';
import { PythonShell } from 'python-shell';
import * as registration from './handlers/registration';
import RegisterModelService from './services/register-model-service';

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
      let SKIP_INSTALL = false;
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
          SKIP_INSTALL = true;
        }
      }
      const pyPath = path.join(
        process.resourcesPath,
        'assets',
        'rb_server',
        'python311',
        'python.exe',
      );
      const pscriptPath = path.join(
        process.resourcesPath,
        'assets',
        'rb_server',
      );
      const script = 'rb.py';
      if (fs.existsSync(pyPath)) {
        const options = {
          mode: 'text' as 'text',
          pythonPath: pyPath,
          pythonOptions: [], // get print results in real-time
          scriptPath: pscriptPath,
          args: [],
        };
        try {
          // kill any servers on restart + confirm python works
          const messages = await PythonShell.run(script, options);
          info('results: %j', messages);
          info(
            `** Found python is installed and registration found ${SKIP_INSTALL} **`,
          );
          // register on startup else nodel-not-available
          RBServer.registerServers('serverReady', true);
          // if (SKIP_INSTALL) return;
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
        RBServer.registerServers('serverReady', true);
      });
    } catch (err: any) {
      info(err);
      error('Failed to exec powershell', err);
    }
  }

  static registerServers = async (key: string, value: boolean) => {
    try {
      info(`in call to registerserver with ${key}, [${value}]`);
      if (key.includes('serverReady') && value) {
        // const ports = ['5000', '5005', '5010', '5020'];
        const ports = ['5020'];
        const serverAddress = '127.0.0.1';
        // eslint-disable-next-line no-plusplus
        for (let i = 0; i < ports.length; i++) {
          info(`registration call for port ${ports[i]}`);
          const mdb = RegisterModelService.registerModel(
            serverAddress,
            Number(ports[i]),
          );
          // eslint-disable-next-line no-unused-expressions, no-await-in-loop
          const foo = (await mdb).serverAddress;
          info(`return from registration isUserConnected= ${foo}`);
        }
      }
    } catch (error) {
      console.log(error);
    }
  };

  static async stopAllServers(appPath: string): Promise<boolean> {
    info('stop all servers');
    const script = 'rb.py';
    const options = {
      mode: 'text' as 'text',
      pythonPath: process.env.PY,
      pythonOptions: [], // get print results in real-time
      scriptPath: process.env.RBPY,
      args: [],
    };
    const pids = path.join(
      appPath,
      'RescueBox-Desktop',
      'logs',
      'rb_process.txt',
    );
    try {
      info('run stop using : %j', process.env.PY);
      info('run rb.py at : %j', process.env.RBPY);
      info(`call stop server rb.py`);
      const messages = await PythonShell.run(script, options);
      // results is an array consisting of messages collected during execution
      info('results: %j', messages);
      if (fs.existsSync(pids)) {
        fs.rm(pids, { force: true }, (err) => {
          if (err) {
            error('Error removing file:', err);
          }
        });
      }
      info('stop servers completed');
      return true;
    } catch (err) {
        error('Error running Python script: %s', err);
      return false;
    }
  }

  static async restartServer(port: number): Promise<boolean> {
    const script = 'rb.py';
    const pydir = process.env.PY ? path.join(process.env.PY) : '';
    const pypath = process.env.RBPY ? path.join(process.env.RBPY, 'rb.py') : '';
    if (!fs.existsSync(pydir) || !fs.existsSync(pypath)) {
      info(
        `** skip restart for pre existing server on ${port} found in db. reason: fresh install **`,
      );
      return false;
    }
    const options = {
      mode: 'text' as 'text',
      pythonPath: process.env.PY,
      pythonOptions: [], // get print results in real-time
      scriptPath: process.env.RBPY,
      args: ['--port', `${port}`],
    };
    try {
      const py = process.env.PY ? path.join(process.env.PY) : '';
      const sc = process.env.RBPY ? path.join(process.env.RBPY) : '';
      info(`call registration restart server rb.py on ${port}`);
      const messages = await PythonShell.run(script, options);
      // results is an array consisting of messages collected during execution
      info('server start output: %j', messages);
      return true;
    } catch (error) {
      // log.error('Error running Python script:', error);
      return false;
    }
  }

}
