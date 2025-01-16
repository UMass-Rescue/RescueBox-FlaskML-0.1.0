/* eslint-disable @typescript-eslint/no-unused-vars */
import log from 'electron-log/main';
import fs from 'fs';
import path from 'path';
import RBServer from '../rbserver';
import { showNotification } from '../util';

const getDeploy = async (_event: any, arg: any) => {
  try {
    let rbLogPath = RBServer.appath;
    // log.info('rbLog path', rbLogPath);
    if (!rbLogPath) {
      log.error('rbLog path not defined');
      rbLogPath = path.join('.', 'logs');
      return -1;
    }
    const rbLog = path.join(rbLogPath, 'RescueBox-Desktop', 'logs', 'main.log');
    const pids = path.join(
      rbLogPath,
      'RescueBox-Desktop',
      'logs',
      'rb_process.txt',
    );
    // log.info(`rbLog file ${rbLog}`);
    // log.info(`pids file ${pids}`);
    if (fs.existsSync(pids)) {
      const lineArray = fs.readFileSync(pids).toString().split('\n');
      log.info(`progress found ${lineArray.length}`);

      if (lineArray.length > 2) {
        log.info('at least 1 model pid found');
        return 5;
      }
      if (lineArray.length == 2) {
        log.info('model pids found 0');
        return 2;
      }
    }
    const lineArray = fs.readFileSync(rbLog).toString();
    // log.info(`progress size of main.log ${lineArray.length}`);
    if (lineArray.includes('PROGRESS 5 of 5')) {
      log.info('progress 5');
      return 5;
    }
    if (lineArray.includes('PROGRESS 4 of 5')) {
      log.info('progress 4');
      return 4;
    }
    if (lineArray.includes('PROGRESS 3 of 5')) {
      log.info('progress 3');
      return 3;
    }
    if (lineArray.includes('PROGRESS 2 of 5')) {
      log.info('progress 2');
      return 2;
    }
    if (lineArray.includes('PROGRESS 1 of 5')) {
      log.info('progress 1');
      return 1;
    }
    log.info('progress not found');
    return 0;
  } catch (error) {
    log.error(error);
    return -1;
  }
};

async function stopDeploy(_event: any, _arg: any) {
  log.info('stop deploy not implemented');
  return true;
  // stop deploy
}

export { getDeploy, stopDeploy };
