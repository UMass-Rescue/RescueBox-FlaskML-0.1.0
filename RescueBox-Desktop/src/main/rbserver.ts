import { spawn } from 'node:child_process';
import { info, error } from 'electron-log/main';
import path from 'path';
import fs from 'fs';
import { PythonShell } from 'python-shell';
import { getRaw, resolvePyPath } from './util';
import * as registration from './handlers/registration';
import RegisterModelService from './services/register-model-service';

// const { createInterface } = require('node:readline/promises');

export default class RBServer {
  public static RUNNING = false;

  public static SKIP_STOP_ON_CLOSE = true;

  public static appath: string;

  public static progress: number;

  public static serverPorts: (number | undefined)[] = [];

  public static serverPortPaths: Map<string, string> = new Map();

  constructor(scpath: string) {
    RBServer.appath = scpath;
  }

  static async readConfig(): Promise<void> {
    const config = path.join(
      process.resourcesPath,
      'assets',
      'rb_server',
      'server_config.json',
    );
    const txt = fs.readFileSync(config, 'utf8');
    const srvs = JSON.parse(txt);
    const slist = Object.keys(srvs.servers);
    for (let i = 0; i < slist.length; i += 1) {
      const port = Number(slist[i]);
      if (!Number.isNaN(port)) {
        info(`server found in file ${port}`);
        RBServer.serverPorts.push(port);
        // get paths for each server
        const paths = srvs.servers[slist[i]].pdir;
        RBServer.serverPortPaths.set(slist[i], paths);
      } else if (slist[i] === 'SKIP_STOP_ON_CLOSE') {
        info(
          `skip stopping server when UI is closed ${srvs.servers[slist[i]]}`,
        );
        if (!srvs.servers[slist[i]]) {
          RBServer.SKIP_STOP_ON_CLOSE = false;
        }
      }
    }
  }

  static async checkPaths(): Promise<boolean> {
    const keysArray = Array.from(RBServer.serverPortPaths.keys());
    for (let i = 0; i < keysArray.length; i += 1) {
      const port = keysArray[i];
      const mpath = RBServer.serverPortPaths.get(port);
      const pitems = mpath ? mpath.split(',') : [];
      let mp = path.join(
        process.resourcesPath,
        'assets',
        'rb_server',
        pitems[1],
      );
      for (let j = 2; j < pitems.length; j += 1) {
        const item = pitems[j];
        mp = path.join(mp, item);
        if (!fs.existsSync(mp)) {
          info(`server path for ${port} not found ${mp}`);
          return false;
        }
      }
    }
    return true;
  }

  static async checIfServersRegistered(): Promise<boolean> {
    const servers = await registration.getModelServers();
    if (servers && servers.length > 0) {
      RBServer.serverPorts = []; // do not use default servers
      for (let i = 0; i < servers.length; i += 1) {
        const port = servers[i]?.serverPort;
        RBServer.serverPorts.push(port);
      }
      return true;
      // server found if previous db exists, check if py and pip also exist
      // if true then skip install
    }
    return false;
  }

  static async checkIfPythonInstalled(): Promise<boolean> {
    // check if python for RB is installed
    resolvePyPath();
    const pydir = process.env.PY ? path.join(process.env.PY) : '';
    const pypath = process.env.RBPY ? path.join(process.env.RBPY, 'rb.py') : '';
    info(`python path= ${pydir} py scripts= ${pypath}`);
    if (!fs.existsSync(pydir) || !fs.existsSync(pypath)) {
      info('install server python paths not found,assume fresh install');
      return false;
    }
    return true;
  }

  static async runPowerShellScript(): Promise<boolean> {
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
    let serverCount = 1;
    const child = spawn(
      'powershell.exe',
      [pse, '-ExecutionPolicy Bypass', arf, process.resourcesPath],
      { stdio: ['ignore', 'pipe', 'pipe'] },
    );
    child.stdout.on('data', (data: any) => {
      const x = data.toString();
      const lines = x.replace(/\r\n/g, '\r').replace(/\n/g, '\r').split(/\r/);
      for (let i = 0; i < lines.length; i += 1) {
        if (lines[i].includes('S=')) {
          const parts = lines[i].split('=');
          if (parts.length === 2) {
            RBServer.progress += Number(parts[1]);
          }
        }
        if (lines[i].includes('powershell process exit with code 0')) {
          info(`powershell process exited with code 0`);
        }
        if (lines[i].includes('Serving Flask app')) {
          serverCount += 1;
          RBServer.progress += 0.25;
          info(
            `powershell start flask server running ok ${serverCount} ${RBServer.progress}`,
          );
        }
      }
      if (RBServer.progress === 10) {
        RBServer.RUNNING = false;
        RBServer.registerServers('serverReady', true)
          .then(async (result: boolean) => {
            return new Promise<boolean>((resolve) => {
              resolve(result);
            });
          })
          .catch((err) => {
            info('registerServers error:', err);
            return err;
          });
      }
    });
    return new Promise<boolean>((resolve) => {
      RBServer.RUNNING = false;
      resolve(false);
    });
  }

  // Run PowerShell script to install RB server
  static async installRBserver(appPath: string): Promise<void> {
    try {
      RBServer.progress = 1;
      RBServer.appath = appPath;
      // "$env:APPDATA\RescueBox-Desktop\logs"
      let SKIP_INSTALL = false;
      info(`servers from config file read ok`);
      // parse json file
      await RBServer.readConfig();
      // plugin app src is installed
      let SERVERS_REGISTERED = false;
      RBServer.progress += 1;
      if (await RBServer.checkPaths()) {
        // check if python for RB is installed
        SKIP_INSTALL = await RBServer.checkIfPythonInstalled();
        // check if servers are registered
        if (SKIP_INSTALL) {
          SERVERS_REGISTERED = await RBServer.checIfServersRegistered();
        }
      } else {
        info('fresh install because server not found registered in db');
      }
      RBServer.RUNNING = true;
      if (SERVERS_REGISTERED && SKIP_INSTALL) {
        RBServer.RUNNING = false;
        info('restart if servers registered and paths found');
        await RBServer.restartServer()
          .then(async (result: boolean) => {
            if (result) {
              RBServer.progress = 10;
            }
            info(`restart completed`);
            return result;
          })
          .catch((err) => {
            info('registerServers error:', err);
            return err;
          });
      } else {
        // install servers
        RBServer.runPowerShellScript();
      }
    } catch (err: any) {
      info(err);
      error('Failed to exec powershell', err);
    }
    info('debug installRBserver..running in background');
  }

  static async registerServers(key: string, value: boolean): Promise<boolean> {
    if (RBServer.RUNNING) {
      return new Promise<boolean>((resolve) => {
        info(`registerservers skip`);
        resolve(false);
      });
    }
    if (key.includes('serverReady') && value) {
      const serverAddress = '127.0.0.1';
      for (let i = 0; i < this.serverPorts.length; i += 1) {
        // info(`registration call for port ${this.serverPorts[i]}`);
        try {
          const mdb = RegisterModelService.registerModel(
            serverAddress,
            Number(this.serverPorts[i]),
          ).then(getRaw);
          // eslint-disable-next-line no-unused-expressions, no-await-in-loop
          const status = (await mdb)?.isUserConnected;
          // Models();
          // eslint-disable-next-line no-await-in-loop
          const mid = (await mdb)?.modelUid;
          if (mid && status) {
            // force available models UI screen to refresh status
            // eslint-disable-next-line no-await-in-loop
            info(`registerServers ${this.serverPorts[i]} ${mid}`);
          }
        } catch (err) {
          info(`registerServers skip`);
        }
      }
    }
    return new Promise<boolean>((resolve) => {
      resolve(true);
    });
  }

  static async stopAllServers(appPath: string): Promise<boolean> {
    info('stop all servers');
    // unregister all servers
    const servers = await registration.getModelServers();
    for (let i = 0; i < servers.length; i += 1) {
      const modelUid = servers[i]?.modelUid;
      if (modelUid) {
        // ModelServer.unregisterServer(modelUid);
        info(`skip unregister server ${servers[i]?.serverPort}`);
      }
    }
    resolvePyPath();
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
      await PythonShell.run(script, options);
      // results is an array consisting of messages collected during execution
      if (fs.existsSync(pids)) {
        fs.rm(pids, { force: true }, (err) => {
          if (err) {
            error('Error removing pids file:', err);
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

  static async restartServer(): Promise<boolean> {
    if (RBServer.RUNNING) {
      info(`restartServer in progress  ${RBServer.progress}`);
      return true;
    }
    const script = 'rb.py';
    resolvePyPath();
    let COUNT = 1;
    for (let i = 0; i < RBServer.serverPorts.length; i += 1) {
      RBServer.RUNNING = true;
      const fport = RBServer.serverPorts[i];
      const options = {
        mode: 'text' as 'text',
        pythonPath: process.env.PY,
        pythonOptions: [], // get print results in real-time
        scriptPath: process.env.RBPY,
        args: ['--port', `${fport}`],
      };
      // info(`call restart server rb.py on ${fport}`);
      // eslint-disable-next-line no-await-in-loop
      PythonShell.run(script, options)
        // eslint-disable-next-line no-loop-func
        .then((messages) => {
          // messages is an array of strings, one for each line of output from your script
          info('restart output: %j', messages);
          // progress += total - current / ports.length
          RBServer.progress += 2.5;
          COUNT += 1;
          return new Promise<boolean>((resolve) => {
            resolve(true);
          });
        })
        // eslint-disable-next-line @typescript-eslint/no-shadow, no-loop-func
        .catch((error) => {
          info('restart Error:', error);
          COUNT -= 1;
          return false;
        });
      // results is an array consisting of messages collected during execution
    }
    return new Promise<boolean>((resolve) => {
      if (COUNT === RBServer.serverPorts.length) {
        RBServer.RUNNING = false;
        RBServer.progress = 10;
      }
      resolve(true);
    });
  }
}
