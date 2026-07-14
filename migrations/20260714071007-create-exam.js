'use strict';
/** @type {import('sequelize-cli').Migration} */

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Exams', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },

      courseId: {
        type: Sequelize.INTEGER,
        allowNull: false
      },

      examType: {
        type: Sequelize.STRING,
        allowNull: false
      },

      examDate: {
        type: Sequelize.DATE,
        allowNull: false
      },

      startTime: {
        type: Sequelize.STRING,
        allowNull: false
      },

      endTime: {
        type: Sequelize.STRING,
        allowNull: false
      },

      classroom: {
        type: Sequelize.STRING,
        allowNull: false
      },

      status: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: "Scheduled"
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
    await queryInterface.dropTable("Exams");
  }
};