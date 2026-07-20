'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class CoursePrerequisite extends Model {
    static associate(models) {

      // CoursePrerequisite -> Course (asıl ders)
      CoursePrerequisite.belongsTo(models.Course, {
        foreignKey: "courseId",
        as: "course"
      });

      // CoursePrerequisite -> Course (önkoşul olan ders)
      CoursePrerequisite.belongsTo(models.Course, {
        foreignKey: "prerequisiteCourseId",
        as: "prerequisiteCourse"
      });

    }
  }

  CoursePrerequisite.init(
    {
      courseId: {
        type: DataTypes.INTEGER,
        allowNull: false
      },

      prerequisiteCourseId: {
        type: DataTypes.INTEGER,
        allowNull: false
      }
    },
    {
      sequelize,
      modelName: "CoursePrerequisite"
    }
  );

  return CoursePrerequisite;
};