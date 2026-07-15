'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Exam extends Model {
    static associate(models) {

      // Exam -> Course
      Exam.belongsTo(models.Course, {
        foreignKey: "courseId",
        as: "course"
      });

    }
  }

  Exam.init(
    {
      courseId: {
        type: DataTypes.INTEGER,
        allowNull: false
      },

      examType: {
        type: DataTypes.STRING,
        allowNull: false
      },

      examDate: {
        type: DataTypes.DATE,
        allowNull: false
      },

      startTime: {
        type: DataTypes.STRING,
        allowNull: false
      },

      endTime: {
        type: DataTypes.STRING,
        allowNull: false
      },

      classroom: {
        type: DataTypes.STRING,
        allowNull: false
      },

      status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "Scheduled"
      }
    },
    {
      sequelize,
      modelName: "Exam"
    }
  );

  return Exam;
};
