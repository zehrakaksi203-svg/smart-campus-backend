'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class AttendanceRecord extends Model {
    static associate(models) {

      // AttendanceRecord -> AttendanceSession
      AttendanceRecord.belongsTo(models.AttendanceSession, {
        foreignKey: "sessionId",
        as: "session"
      });

      // AttendanceRecord -> Student
      AttendanceRecord.belongsTo(models.Student, {
        foreignKey: "studentId",
        as: "student"
      });

    }
  }

  AttendanceRecord.init(
    {
      sessionId: {
        type: DataTypes.INTEGER,
        allowNull: false
      },

      studentId: {
        type: DataTypes.INTEGER,
        allowNull: false
      },

      checkInTime: {
        type: DataTypes.DATE,
        allowNull: false
      },

      latitude: {
        type: DataTypes.DECIMAL(10, 7),
        allowNull:true
      },

      longitude: {
        type: DataTypes.DECIMAL(10, 7),
        allowNull: true
      },

      distanceFromCenter: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true
      },

      isFlagged: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },

      flagReason: {
        type: DataTypes.STRING,
        allowNull: true
      }
    },
    {
      sequelize,
      modelName: "AttendanceRecord"
    }
  );

  return AttendanceRecord;
};