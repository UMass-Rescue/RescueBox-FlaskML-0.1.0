import {
  JobHandler,
  ModelsHandler,
  RegistrationHandler,
  FileSystemHandler,
  DatabaseHandler,
  LoggingHandler,
  DeployHandler,
  TaskHandler,
  ElectronAPIHandler,
  ServerStatusHandler,
} from '../main/preload';

declare global {
  // eslint-disable-next-line no-unused-vars
  interface Window {
    registration: RegistrationHandler;
    models: ModelsHandler;
    job: JobHandler;
    task: TaskHandler;
    fileSystem: FileSystemHandler;
    database: DatabaseHandler;
    logging: LoggingHandler;
    deploy: DeployHandler;
    electronAPI: ElectronAPIHandler;
    serverStatus: ServerStatusHandler;
  }
}
