'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Grades', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },

      enrollmentId: {
        type: Sequelize.INTEGER,
        allowNull: false
      },

      midterm: {
        type: Sequelize.DECIMAL(5,2),
        defaultValue: 0
      },

      final: {
        type: Sequelize.DECIMAL(5,2),
        defaultValue: 0
      },

      makeup: {
        type: Sequelize.DECIMAL(5,2),
        allowNull: true
      },

      average: {
        type: Sequelize.DECIMAL(5,2),
        defaultValue: 0
      },

      letterGrade: {
        type: Sequelize.STRING,
        defaultValue: "FF"
      },

      status: {
        type: Sequelize.STRING,
        defaultValue: "Failed"
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
    await queryInterface.dropTable('Grades');
  }
};