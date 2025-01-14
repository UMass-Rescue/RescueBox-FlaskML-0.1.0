/* eslint-disable @typescript-eslint/no-unused-vars */
import { ModelAppStatus } from 'src/shared/models';
import log from 'electron-log/main';
import { PythonShell } from 'python-shell';
import fs from 'fs';
import path from 'path';
import ModelServer from '../models/model-server';
import { getRaw } from '../util';
import ModelAppService from '../services/model-app-service';
import RegisterModelService from '../services/register-model-service';

export type RegisterModelArgs = {
  modelUid?: string;
  serverAddress: string;
  serverPort: number;
};

export type UnregisterModelArgs = {
  modelUid: string;
};

export type GetModelAppStatusArgs = {
  modelUid: string;
};

export type GetModelServerArgs = GetModelAppStatusArgs;

const registerModelAppIp = async (_event: any, arg: RegisterModelArgs) => {
  return RegisterModelService.registerModel(
    arg.serverAddress,
    arg.serverPort,
  ).then(getRaw);
};

const unregisterModelAppIp = async (_event: any, arg: UnregisterModelArgs) => {
  log.info(`Unregistering model ${arg.modelUid}`);
  return ModelServer.unregisterServer(arg.modelUid);
};

const getModelServers = async () => {
  return ModelServer.getAllServers().then((servers) => servers.map(getRaw));
};

const getModelServer = async (event: any, arg: GetModelServerArgs) => {
  return ModelServer.getServerByModelUid(arg.modelUid).then(getRaw);
};

async function restartServer(port: string): Promise<boolean> {
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
    if (fs.existsSync(sc) && fs.existsSync(py)) {
      const script = 'rb.py';
      log.info('py path %j', options.pythonPath);
      log.info('call py script path %j', options.scriptPath);
      const messages = await PythonShell.run(script, options);
      // results is an array consisting of messages collected during execution
      log.info('results: %j', messages);
      return true;
    }
    return true;
  } catch (error) {
    log.error('Error running Python script:', error);
    return false;
  }
}

const getModelAppStatus = async (
  _event: any,
  arg: GetModelAppStatusArgs,
): Promise<ModelAppStatus> => {
  const server = await ModelServer.getServerByModelUid(arg.modelUid);
  if (!server) {
    log.error(`Server not found for model ${arg.modelUid}`);
    log.info("Returning 'Unregistered' status");
    return ModelAppStatus.Unregistered;
  }
  if (!server.isUserConnected) {
    return ModelAppStatus.Unregistered;
  }
  const modelAppService = await ModelAppService.init(arg.modelUid);
  const healthBool = await modelAppService.pingHealth();
  server.isUserConnected = healthBool;
  await server.save();
  log.info(`App status is online ? ${healthBool}`);
  if (!healthBool) {
    // restart service
    const port = modelAppService.getAppServerPort();
    const res = await port.then((result) => result.toString());
    log.info(`App status offline on port ${res}`);
    const rc = restartServer(res);
    const rce = await port.then((result) => result.toString());
    log.info(`App restart rc for port ${res} ${rce}`);
  }
  return healthBool ? ModelAppStatus.Online : ModelAppStatus.Offline;
};

export {
  registerModelAppIp,
  unregisterModelAppIp,
  getModelAppStatus,
  getModelServers,
  getModelServer,
};
