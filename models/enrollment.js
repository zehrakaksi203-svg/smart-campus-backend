'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Enrollment extends Model {
    static associate(models) {

      // Enrollment -> Student
      Enrollment.belongsTo(models.Student, {
        foreignKey: "studentId",
        as: "student"
      });

      // Enrollment -> Course
      Enrollment.belongsTo(models.Course, {
        foreignKey: "courseId",
        as: "course"
      });

      // Enrollment -> CourseSection
      Enrollment.belongsTo(models.CourseSection, {
        foreignKey: "sectionId",
        as: "section"
      });

      // Enrollment -> Grade
      Enrollment.hasOne(models.Grade, {
        foreignKey: "enrollmentId",
        as: "grade"
      });

      // Enrollment -> Attendance
      Enrollment.hasMany(models.Attendance, {
        foreignKey: "enrollmentId",
        as: "attendances"
      });

    }
  }

  Enrollment.init(
    {
      studentId: {
        type: DataTypes.INTEGER,
        allowNull: false
      },

      courseId: {
        type: DataTypes.INTEGER,
        allowNull: false
      },

      sectionId: {
        type: DataTypes.INTEGER,
        allowNull: true
      },

      enrollmentDate: {
        type: DataTypes.DATE,
        allowNull: true
      },

      midtermGrade: {
        type: DataTypes.FLOAT,
        allowNull: true
      },

      finalGrade: {
        type: DataTypes.FLOAT,
        allowNull: true
      },

      letterGrade: {
        type: DataTypes.STRING,
        allowNull: true
      },

      gradePoint: {
        type: DataTypes.FLOAT,
        allowNull: true
      },

      semester: {
        type: DataTypes.STRING,
        allowNull: false
      },

      academicYear: {
        type: DataTypes.STRING,
        allowNull: false
      },

      status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "Active"
      }
    },
    {
      sequelize,
      modelName: "Enrollment"
    }
  );

  return Enrollment;
};