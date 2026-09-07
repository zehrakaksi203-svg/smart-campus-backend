'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.changeColumn('AttendanceRecords', 'latitude', {
      type: Sequelize.DECIMAL(10, 7),
      allowNull: true
    });
    await queryInterface.changeColumn('AttendanceRecords', 'longitude', {
      type: Sequelize.DECIMAL(10, 7),
      allowNull: true
    });
    await queryInterface.changeColumn('AttendanceRecords', 'distanceFromCenter', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.changeColumn('AttendanceRecords', 'latitude', {
      type: Sequelize.DECIMAL(10, 7),
      allowNull: false
    });
    await queryInterface.changeColumn('AttendanceRecords', 'longitude', {
      type: Sequelize.DECIMAL(10, 7),
      allowNull: false
    });
    await queryInterface.changeColumn('AttendanceRecords', 'distanceFromCenter', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false
    });
  }
};