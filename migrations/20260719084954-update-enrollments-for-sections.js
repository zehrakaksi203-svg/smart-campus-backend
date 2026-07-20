'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {

    // sectionId sütunu ekle
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

    // enrollmentDate
    await queryInterface.addColumn("Enrollments", "enrollmentDate", {
      type: Sequelize.DATE,
      defaultValue: Sequelize.NOW
    });

    // Midterm
    await queryInterface.addColumn("Enrollments", "midtermGrade", {
      type: Sequelize.FLOAT,
      allowNull: true
    });

    // Final
    await queryInterface.addColumn("Enrollments", "finalGrade", {
      type: Sequelize.FLOAT,
      allowNull: true
    });

    // Letter
    await queryInterface.addColumn("Enrollments", "letterGrade", {
      type: Sequelize.STRING,
      allowNull: true
    });

    // Grade Point
    await queryInterface.addColumn("Enrollments", "gradePoint", {
      type: Sequelize.FLOAT,
      allowNull: true
    });

  },

  async down(queryInterface) {

    await queryInterface.removeColumn("Enrollments", "gradePoint");
    await queryInterface.removeColumn("Enrollments", "letterGrade");
    await queryInterface.removeColumn("Enrollments", "finalGrade");
    await queryInterface.removeColumn("Enrollments", "midtermGrade");
    await queryInterface.removeColumn("Enrollments", "enrollmentDate");
    await queryInterface.removeColumn("Enrollments", "sectionId");

  }
};