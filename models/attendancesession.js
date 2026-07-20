'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class AttendanceSession extends Model {
    static associate(models) {

      // AttendanceSession -> CourseSection
      AttendanceSession.belongsTo(models.CourseSection, {
        foreignKey: "sectionId",
        as: "section"
      });

      // AttendanceSession -> Faculty
      AttendanceSession.belongsTo(models.Faculty, {
        foreignKey: "facultyId",
        as: "faculty"
      });

      // AttendanceSession -> AttendanceRecord
      AttendanceSession.hasMany(models.AttendanceRecord, {
        foreignKey: "sessionId",
        as: "records"
      });

      // AttendanceSession -> ExcuseRequest
      AttendanceSession.hasMany(models.ExcuseRequest, {
        foreignKey: "sessionId",
        as: "excuseRequests"
      });

    }
  }

  AttendanceSession.init(
    {
      sectionId: {
        type: DataTypes.INTEGER,
        allowNull: false
      },

      facultyId: {
        type: DataTypes.INTEGER,
        allowNull: false
      },

      date: {
        type: DataTypes.DATEONLY,
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

      latitude: {
        type: DataTypes.DECIMAL(10, 7),
        allowNull: false
      },

      longitude: {
        type: DataTypes.DECIMAL(10, 7),
        allowNull: false
      },

      geofenceRadius: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 30
      },
      qrCode: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: true
      },
      
      status: {
        type: DataTypes.ENUM("Open", "Closed"),
        allowNull: false,
        defaultValue: "Open"
      }
      
    },
    {
      sequelize,
      modelName: "AttendanceSession"
    }
  );

  return AttendanceSession;
};