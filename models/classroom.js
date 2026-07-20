'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Classroom extends Model {
    static associate(models) {

      // Classroom -> AttendanceSession (bilgi amaçlı, session tabloya sınıf değil koordinat kopyalıyor)
    }
  }

  Classroom.init(
    {
      building: {
        type: DataTypes.STRING,
        allowNull: false
      },

      roomNumber: {
        type: DataTypes.STRING,
        allowNull: false
      },

      capacity: {
        type: DataTypes.INTEGER,
        allowNull: false
      },

      latitude: {
        type: DataTypes.DECIMAL(10, 7),
        allowNull: false
      },

      longitude: {
        type: DataTypes.DECIMAL(10, 7),
        allowNull: false
      },

      featuresJson: {
        type: DataTypes.JSON,
        allowNull: true
      }
    },
    {
      sequelize,
      modelName: "Classroom"
    }
  );

  return Classroom;
};