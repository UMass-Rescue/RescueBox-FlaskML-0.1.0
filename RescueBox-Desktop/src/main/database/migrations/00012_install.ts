import { QueryInterface, DataTypes } from 'sequelize';

const TABLE_NAME = 'install';
const MIGRATION_NAME = '0012_install';

const migration0012Install = {
  name: MIGRATION_NAME,
  async up({ context: queryInterface }: { context: QueryInterface }) {
    await queryInterface.createTable(TABLE_NAME, {
      id: {
        type: DataTypes.STRING,
        allowNull: false,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: true,
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
      createdAt: {
        type: DataTypes.DATE,
      },
      updatedAt: {
        type: DataTypes.DATE,
      },
      comments: {
        type: DataTypes.STRING,
      },
    });
  },
  async down({ context: queryInterface }: { context: QueryInterface }) {
    await queryInterface.dropTable(TABLE_NAME);
  },
};

export default migration0012Install;
