'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class CourseSection extends Model {
    static associate(models) {

      // CourseSection -> Course
      CourseSection.belongsTo(models.Course, {
        foreignKey: "courseId",
        as: "course"
      });

      // CourseSection -> Faculty
      CourseSection.belongsTo(models.Faculty, {
        foreignKey: "facultyId",
        as: "faculty"
      });

    }
  }

  CourseSection.init(
    {
      courseId: {
        type: DataTypes.INTEGER,
        allowNull: false
      },

      facultyId: {
        type: DataTypes.INTEGER,
        allowNull: false
      },

      sectionCode: {
        type: DataTypes.STRING,
        allowNull: false
      },

      semester: {
        type: DataTypes.STRING,
        allowNull: false
      },

      capacity: {
        type: DataTypes.INTEGER,
        allowNull: false
      },

      enrolledCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      },

      classroom: {
        type: DataTypes.STRING,
        allowNull: false
      },

      dayOfWeek: {
        type: DataTypes.STRING,
        allowNull: false
      },

      startTime: {
        type: DataTypes.TIME,
        allowNull: false
      },

      endTime: {
        type: DataTypes.TIME,
        allowNull: false
      },

      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      }
    },
    {
      sequelize,
      modelName: "CourseSection"
    }
  );

  return CourseSection;
};