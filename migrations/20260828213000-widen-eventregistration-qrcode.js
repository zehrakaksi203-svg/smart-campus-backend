'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('EventRegistrations', 'qrCode', {
      type: Sequelize.TEXT,
      allowNull: true
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('EventRegistrations', 'qrCode', {
      type: Sequelize.STRING,
      allowNull: true
    });
  }
};