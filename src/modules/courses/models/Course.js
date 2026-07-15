'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Course extends Model {
    static associate(models) {

      // Course -> Department
      Course.belongsTo(models.Department, {
        foreignKey: "departmentId",
        as: "department"
      });

      // Course -> Faculty
      Course.belongsTo(models.Faculty, {
        foreignKey: "facultyId",
        as: "faculty"
      });

     // Course -> Enrollment
  Course.hasMany(models.Enrollment, {
    foreignKey: "courseId",
    as: "enrollments"
  });

   // Course -> Exam
Course.hasMany(models.Exam, {
  foreignKey: "courseId",
  as: "exams"
});




    }
  }

  Course.init(
    {
      departmentId: {
        type: DataTypes.INTEGER,
        allowNull: false
      },

      facultyId: {
        type: DataTypes.INTEGER,
        allowNull: false
      },

      courseCode: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
      },

      courseName: {
        type: DataTypes.STRING,
        allowNull: false
      },

      credit: {
        type: DataTypes.INTEGER,
        allowNull: false
      },

      semester: {
        type: DataTypes.STRING,
        allowNull: false
      },

      year: {
        type: DataTypes.INTEGER,
        allowNull: false
      },

      description: {
        type: DataTypes.TEXT
      },

      status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "Active"
      }
    },
    {
      sequelize,
      modelName: "Course"
    }
  );

  return Course;
};
