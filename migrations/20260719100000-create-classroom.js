'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Classrooms', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },

      building: {
        type: Sequelize.STRING,
        allowNull: false
      },

      roomNumber: {
        type: Sequelize.STRING,
        allowNull: false
      },

      capacity: {
        type: Sequelize.INTEGER,
        allowNull: false
      },

      latitude: {
        type: Sequelize.DECIMAL(10, 7),
        allowNull: false
      },

      longitude: {
        type: Sequelize.DECIMAL(10, 7),
        allowNull: false
      },

      featuresJson: {
        type: Sequelize.JSON,
        allowNull: true
      },

      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },

      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('Classrooms');
  }
};
