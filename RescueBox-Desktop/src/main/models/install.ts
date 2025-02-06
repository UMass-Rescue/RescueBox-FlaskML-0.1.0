/* eslint-disable no-use-before-define */
import {
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
  Sequelize,
} from 'sequelize';
import log from 'electron-log/main';

class InstallDb extends Model<
  InferAttributes<InstallDb>,
  InferCreationAttributes<InstallDb>
> {
  declare name: string;

  declare port: number;

  declare id: string;

  declare isOk: boolean;

  declare isRunning: boolean;

  declare isDeleted: boolean;

  declare comments: string;

  public static async getAllInstalled() {
    return InstallDb.findAll();
  }

  public static getInstallByName(name: string) {
    return InstallDb.findOne({
      where: {
        name,
      },
    });
  }

  public static getIsOk(name: string) {
    return InstallDb.findOne({
      where: {
        name,
      },
      attributes: { include: ['isOk'] },
    });
  }

  public static getIsRunning(name: string) {
    return InstallDb.findOne({
      where: {
        name,
      },
      attributes: { include: ['isRunning'] },
    });
  }

  public static async addInstall(
    name: string,
    port: number,
    isOk: boolean,
    isRunning: boolean,
    comments: string,
  ) {
    const [install, wasCreated] = await InstallDb.findOrCreate({
      where: {
        name,
      },
      defaults: {
        id: '', // or generate a unique id
        name,
        port,
        isOk,
        isRunning,
        isDeleted: false,
        comments,
      },
    });
    if (!wasCreated) {
      await install.save();
    }
    return install;
  }

  public static async unregisterInstall(name: string) {
    const model = await InstallDb.findOne({
      where: {
        name,
      },
    });
    if (!model) {
      log.warn(
        `Server for model ${name} was attempted to be unregistered but not found`,
      );
      return;
    }
    model.isDeleted = true;
    model.isRunning = false;
    await model.save();
  }

  public static updateInstall(
    name: string,
    port: number,
    isOk: boolean,
    isRunning: boolean,
    isDeleted: boolean,
    comments: string,
  ) {
    return InstallDb.update(
      {
        name,
        port,
        isOk,
        isRunning,
        isDeleted,
        comments,
      },
      {
        where: {
          name,
        },
      },
    );
  }

  public static deleteServerByModelld(name: string) {
    return InstallDb.destroy({
      where: {
        name,
      },
    });
  }

  public static createInstall(
    name: string,
    port: number,
    isOk: boolean,
    isRunning: boolean,
    comments: string,
  ) {
    return InstallDb.create({
      name,
      port,
      isOk,
      isRunning,
      comments,
      isDeleted: false,
      id: '',
    });
  }
}

export const initInstaller = async (connection: Sequelize) => {
  InstallDb.init(
    {
      id: {
        type: DataTypes.STRING,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
      },
      port: {
        type: DataTypes.NUMBER,
        allowNull: true,
      },
      isOk: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
      },
      isRunning: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
      },
      isDeleted: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
      },
      comments: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      sequelize: connection,
      tableName: 'install',
    },
  );
};

export default InstallDb;

export type InstallArgs = {
  name: string;
  port: number;
  isOk: boolean;
  isDeleted: boolean;
  isRunning: boolean;
  comments: string;
};

export type RemoveInstalledByidArgs = {
  name: string;
};
