'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDescription = await queryInterface.describeTable("Enrollments");

    if (!tableDescription.sectionId) {
      await queryInterface.addColumn("Enrollments", "sectionId", {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "CourseSections",
          key: "id"
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      });
    }

    if (!tableDescription.enrollmentDate) {
      await queryInterface.addColumn("Enrollments", "enrollmentDate", {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      });
    }

    if (!tableDescription.midtermGrade) {
      await queryInterface.addColumn("Enrollments", "midtermGrade", {
        type: Sequelize.FLOAT,
        allowNull: true
      });
    }

    if (!tableDescription.finalGrade) {
      await queryInterface.addColumn("Enrollments", "finalGrade", {
        type: Sequelize.FLOAT,
        allowNull: true
      });
    }

    if (!tableDescription.letterGrade) {
      await queryInterface.addColumn("Enrollments", "letterGrade", {
        type: Sequelize.STRING,
        allowNull: true
      });
    }

    if (!tableDescription.gradePoint) {
      await queryInterface.addColumn("Enrollments", "gradePoint", {
        type: Sequelize.FLOAT,
        allowNull: true
      });
    }
  },

  async down(queryInterface) {
    const tableDescription = await queryInterface.describeTable("Enrollments");

    if (tableDescription.gradePoint) {
      await queryInterface.removeColumn("Enrollments", "gradePoint");
    }
    if (tableDescription.letterGrade) {
      await queryInterface.removeColumn("Enrollments", "letterGrade");
    }
    if (tableDescription.finalGrade) {
      await queryInterface.removeColumn("Enrollments", "finalGrade");
    }
    if (tableDescription.midtermGrade) {
      await queryInterface.removeColumn("Enrollments", "midtermGrade");
    }
    if (tableDescription.enrollmentDate) {
      await queryInterface.removeColumn("Enrollments", "enrollmentDate");
    }
    if (tableDescription.sectionId) {
      await queryInterface.removeColumn("Enrollments", "sectionId");
    }
  }
};