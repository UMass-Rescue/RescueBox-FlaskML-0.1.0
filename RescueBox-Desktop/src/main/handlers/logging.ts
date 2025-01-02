/* eslint-disable @typescript-eslint/no-unused-vars */
import log from 'electron-log/main';

export async function getLogs(_event: any, _arg: any) {
  return log.transports.file.readAllLogs();
}

export async function clearLogs(_event: any, _arg: any) {
  log.info('Clearing logs not implemented');
  log.transports.file.getFile().clear();
  log.create({ logId: 'main' });
  return true;
  // deletes log and new log does not create
}
