/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  APIRoutes,
  AppMetadata,
  SchemaAPIRoute,
} from 'src/shared/generated_models';
import { isrModelRoutes } from 'src/main/database/dummy_data/mlmodels';
import log from 'electron-log/main';
import isDummyMode from 'src/shared/dummy_data/set_dummy_mode';
import MLModelDb from '../models/ml-model';
import ModelServerDb from '../models/model-server';
import TaskDb from '../models/tasks';

const API_ROUTES_SLUG = '/api/routes';
const APP_METADATA_SLUG = '/api/app_metadata';

type ModelMetadataError = { error: 'App metadata not set' };

export default class RegisterModelService {
  static async registerModel(serverAddress: string, serverPort: number) {
    let modelInfo;
    let apiRoutes;
    try {
      modelInfo = await RegisterModelService.getAppMetadata(
        serverAddress,
        serverPort,
      );
      apiRoutes = await RegisterModelService.getAPIRoutes(
        serverAddress,
        serverPort,
      );
    } catch (error) {
      throw new Error(
        `FATAL: register Model error ${serverAddress} ${serverPort} , server not available`,
      );
    }
    const prevModel = await MLModelDb.getModelByModelInfoAndRoutes(
      modelInfo,
      apiRoutes,
    );
    if (prevModel) {
      await MLModelDb.restoreModel(prevModel.uid);
      await ModelServerDb.updateServer(
        prevModel.uid,
        serverAddress,
        serverPort,
      );
      const server = await ModelServerDb.getServerByModelUid(prevModel.uid);
      if (!server) {
        throw new Error(`FATAL: Server not found for model ${prevModel.uid}`);
      }
      return server;
    }
    log.info(
      `Registering new model app metadata at ${serverAddress}:${serverPort}`,
    );
    const modelDb = await MLModelDb.createModel(modelInfo, apiRoutes);
    await RegisterModelService.createTasks(
      RegisterModelService.getSchemaApiRoutes(apiRoutes),
      modelDb.uid,
    );
    return ModelServerDb.registerServer(modelDb.uid, serverAddress, serverPort);
  }

  private static getSchemaApiRoutes(apiRoutes: APIRoutes) {
    return apiRoutes.filter((apiRoute) => 'order' in apiRoute);
  }

  private static async createTasks(
    apiRoutes: SchemaAPIRoute[],
    modelUid: string,
  ) {
    const taskParams = apiRoutes.map((route) => ({
      uid: String(route.order),
      modelUid,
      schemaApiRoute: route,
    }));
    return TaskDb.createTasks(taskParams);
  }

  static async getAppMetadata(
    serverAddress: string,
    serverPort: number,
  ): Promise<AppMetadata> {
    return fetch(`http://${serverAddress}:${serverPort}${APP_METADATA_SLUG}`)
      .then(async (res) => {
        if (res.status === 404) {
          throw new Error(
            `404 APP_METADATA_SLUG not found on backend server at port ${serverPort}`,
            {
              cause: res.statusText,
            },
          );
        }
        if (res.status !== 200) {
          throw new Error(
            `Failed to fetch app metadata from backend server at port ${serverPort} ${res.statusText}.`,
          );
        }
        return res.json();
      })
      .then((data: AppMetadata | ModelMetadataError) => {
        if ('error' in data) {
          throw new Error('App metadata not set');
        }
        return data;
      })
      .catch((error) => {
        // log.error('Failed rest api call, assume Server is not Running');
        throw error;
      });
  }

  static async getAPIRoutes(
    serverAddress: string,
    serverPort: number,
  ): Promise<APIRoutes> {
    if (isDummyMode) {
      log.info(
        'Fetching API routes for isr model from dummy data. This will take some time.',
      );
      const apiRoutes = isrModelRoutes;
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(RegisterModelService.getSchemaApiRoutes(apiRoutes));
        }, 1000);
      });
    }
    const url = `http://${serverAddress}:${serverPort}${API_ROUTES_SLUG}`;
    const apiRoutes: APIRoutes = await fetch(url)
      .then((res) => {
        if (res.status !== 200) {
          throw new Error(`Failed to fetch API routes. Status: ${res.status}`);
        }
        return res.json();
      })
      .catch((error) => {
        log.error('Failed to fetch API routes', error);
        throw new Error('Failed to fetch API routes. Server may be offline.');
      });
    return apiRoutes;
  }
}
