'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('ExcuseRequests', 'documentUrl', {
      type: Sequelize.TEXT,
      allowNull: true
    });

    await queryInterface.addColumn('ExcuseRequests', 'documentName', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('ExcuseRequests', 'documentType', {
      type: Sequelize.STRING,
      allowNull: true
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('ExcuseRequests', 'documentName');
    await queryInterface.removeColumn('ExcuseRequests', 'documentType');

    await queryInterface.changeColumn('ExcuseRequests', 'documentUrl', {
      type: Sequelize.STRING,
      allowNull: true
    });
  }
};