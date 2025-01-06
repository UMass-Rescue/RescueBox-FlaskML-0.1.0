/* eslint-disable @typescript-eslint/no-unused-vars */
import log from 'electron-log/main';
import fs from 'fs';
import path from 'path';
import RBServer from '../rbserver';
import { showNotification } from '../util';

const getDeploy = async (_event: any, arg: any) => {
  try {
    const pidsPath = process.resourcesPath;
    let rbLogPath = RBServer.appath;
    log.info('rbLog path', rbLogPath);
    if (!rbLogPath) {
      log.error('rbLog path not defined');
      rbLogPath = path.join('.', 'logs', 'main.log');
    }
    const rbLog = path.join(rbLogPath, 'logs', 'main.log');
    const pids = path.join(pidsPath, 'assets', 'rb_server', 'rb_process.txt');
    log.info(`rbLog file ${rbLog}`);
    log.info(`pids file ${pids}`);
    if (fs.existsSync(pids)) {
      const lineArray = fs.readFileSync(pids).toString().split('\n');
      log.info(`pids data ${lineArray.length}`);
      if (lineArray.length === 5) {
        log.info('2 pids found');
        showNotification(
          'In Progress',
          `Click Logs to view details.`,
          `progress 5`,
        );
        return 5;
      }
      if (lineArray.length === 2) {
        log.info('pids found 2');
        return 2;
      }
      if (lineArray.length === 2) {
        log.info('pids found 1');
        return 1;
      }
    }
    const lineArray = fs.readFileSync(rbLog).toString();
    log.info(`progress size of main.log ${lineArray.length}`);
    if (lineArray.includes('PROGRESS 5 of 5')) {
      log.info('progress 5 found');
      return 5;
    }
    if (lineArray.includes('PROGRESS 4 of 5')) {
      log.info('progress 4 found');
      return 4;
    }
    if (lineArray.includes('PROGRESS 3 of 5')) {
      log.info('progress 3 found');
      return 3;
    }
    if (lineArray.includes('PROGRESS 2 of 5')) {
      log.info('progress 2 found');
      return 2;
    }
    if (lineArray.includes('PROGRESS 1 of 5')) {
      log.info('progress 1 found');
      return 1;
    }
    log.info('progress not found');
    return 0;
  } catch (error) {
    log.error(error);
    return -1;
  }
  // spawn ps1 status
};

async function stopDeploy(_event: any, _arg: any) {
  log.info('deploy stop not implemented');
  log.transports.file.getFile().clear();
  log.create({ logId: 'main' });
  return true;
  // stop deploy
}

export { getDeploy, stopDeploy };
