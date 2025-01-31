/* eslint-disable @typescript-eslint/no-unused-vars */
import log from 'electron-log/main';
import RBServer from '../rbserver';
import ModelServer from '../models/model-server';

let PROGRESS = 5.0;

const getDeploy = async (_event: any, arg: any) => {
  let countOfServersReady: number;
  if (!Number.isNaN(RBServer.progress)) {
    PROGRESS = RBServer.progress * 10;
    // log.info(`deploy progress ${PROGRESS}`);
  }
  RBServer.registerServers('serverReady', true)
    .then(async (result: boolean) => {
      if (result === true) {
        PROGRESS = RBServer.progress;
        return PROGRESS;
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
      return PROGRESS;
    })
    .catch((error) => {
      log.info('waiting for servers ', error);
      return PROGRESS;
    });
  log.info(`servers deployed ${PROGRESS}%`);
  return PROGRESS;
};

async function stopDeploy(_event: any, _arg: any) {
  log.info('stop deploy not implemented');
  return true;
  // stop deploy
}

export { getDeploy, stopDeploy };
