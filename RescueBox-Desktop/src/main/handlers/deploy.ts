/* eslint-disable @typescript-eslint/no-unused-vars */
import log from 'electron-log/main';
import RBServer from '../rbserver';
import ModelServer from '../models/model-server';
import InstallDb, {
  InstallArgs,
  RemoveInstalledByidArgs,
} from '../models/install';
import { getRaw } from '../util';

let PROGRESS = 5.0;

const getDeploy = async (_event: any, arg: any) => {
  let countOfServersReady: number;
  if (!Number.isNaN(RBServer.progress)) {
    PROGRESS = RBServer.progress * 10;
    // log.info(`deploy progress ${PROGRESS}`);
  }
  countOfServersReady = 0;
  const servers = await ModelServer.getAllServers();
  if (servers) {
    for (let i = 0; i < servers.length; i += 1) {
      if (servers[i]?.isUserConnected) {
        countOfServersReady += 1;
      }
    }
  }
  log.info(`server started count=${countOfServersReady} progress=${PROGRESS}%`);
  return PROGRESS;
};

async function stopDeploy(_event: any, _arg: any) {
  log.info('stop deploy not implemented');
  return true;
  // stop deploy
}

export { getDeploy, stopDeploy };

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function getInstalled(_event: any, _arg: any) {
  return InstallDb.findAll().then((installDb) => installDb.map(getRaw));
}

export async function addInstalled(_event: any, arg: InstallArgs) {
  return InstallDb.addInstall(
    arg.name,
    arg.port,
    arg.isOk,
    arg.isRunning,
    arg.comments,
  );
}

export async function updateInstalled(_event: any, arg: InstallArgs) {
  return InstallDb.updateInstall(
    arg.name,
    arg.port,
    arg.isOk,
    arg.isRunning,
    arg.isDeleted,
    arg.comments,
  );
}

export async function getInstalledByName(event: any, arg: InstallArgs) {
  return InstallDb.getInstallByName(arg.name).then(getRaw);
}

export async function removeInstalledByName(
  event: any,
  arg: RemoveInstalledByidArgs,
) {
  return InstallDb.unregisterInstall(arg.name);
}
