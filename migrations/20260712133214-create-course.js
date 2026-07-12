'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Courses', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },

      departmentId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "Departments",
          key: "id"
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT"
      },

      facultyId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "Faculties",
          key: "id"
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT"
      },

      courseCode: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },

      courseName: {
        type: Sequelize.STRING,
        allowNull: false
      },

      credit: {
        type: Sequelize.INTEGER,
        allowNull: false
      },

      semester: {
        type: Sequelize.STRING,
        allowNull: false
      },

      year: {
        type: Sequelize.INTEGER,
        allowNull: false
      },

      description: {
        type: Sequelize.TEXT
      },

      status: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: "Active"
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

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("Courses");
  }
};