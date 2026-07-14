'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Grade extends Model {
    static associate(models) {

      // Grade -> Enrollment
      Grade.belongsTo(models.Enrollment, {
        foreignKey: "enrollmentId",
        as: "enrollment"
      });

    }
  }

  Grade.init(
    {
      enrollmentId: {
        type: DataTypes.INTEGER,
        allowNull: false
      },

      midterm: {
        type: DataTypes.DECIMAL(5,2),
        defaultValue: 0
      },

      final: {
        type: DataTypes.DECIMAL(5,2),
        defaultValue: 0
      },

      makeup: {
        type: DataTypes.DECIMAL(5,2),
        allowNull: true
      },

      average: {
        type: DataTypes.DECIMAL(5,2),
        defaultValue: 0
      },

      letterGrade: {
        type: DataTypes.STRING,
        defaultValue: "FF"
      },

      status: {
        type: DataTypes.STRING,
        defaultValue: "Failed"
      }
    },
    {
      sequelize,
      modelName: "Grade"
    }
  );

  return Grade;
};