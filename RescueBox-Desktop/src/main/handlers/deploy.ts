/* eslint-disable @typescript-eslint/no-unused-vars */
import log from 'electron-log/main';
import fs from 'fs';
import path from 'path';
import RBServer from '../rbserver';

const rbHome = RBServer.appath;
const rbLog = path.join(rbHome, 'rb_py.log');

export async function getDeploy(_event: any, _arg: any) {
  const lineArray = fs.readFileSync(rbLog).toString().split('\n');
  log.info(`progress data ${lineArray.length}`);
  const searchTerm = 'PROGRESS 5';
  if (lineArray.includes(searchTerm)) {
    log.info('progress 5 found');
    return 5;
  }
  if (lineArray.includes('PROGRESS 4')) {
    log.info('progress 4 found');
    return 4;
  }
  if (lineArray.includes('PROGRESS 3')) {
    log.info('progress 3 found');
    return 3;
  }
  if (lineArray.includes('PROGRESS 2')) {
    log.info('progress 2 found');
    return 2;
  }
  if (lineArray.includes('PROGRESS 1')) {
    log.info('progress 1 found');
    return 1;
  }
  log.info('progress not found');
  return 0;
  // spawn ps1 status
}

export async function stopDeploy(_event: any, _arg: any) {
  log.info('deploy stop not implemented');
  log.transports.file.getFile().clear();
  log.create({ logId: 'main' });
  return true;
  // stop deploy
}
