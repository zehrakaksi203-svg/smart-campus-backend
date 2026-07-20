'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class ExcuseRequest extends Model {
    static associate(models) {

      // ExcuseRequest -> Student
      ExcuseRequest.belongsTo(models.Student, {
        foreignKey: "studentId",
        as: "student"
      });

      // ExcuseRequest -> AttendanceSession
      ExcuseRequest.belongsTo(models.AttendanceSession, {
        foreignKey: "sessionId",
        as: "session"
      });

      // ExcuseRequest -> Faculty (inceleyen)
      ExcuseRequest.belongsTo(models.Faculty, {
        foreignKey: "reviewedBy",
        as: "reviewer"
      });

    }
  }

  ExcuseRequest.init(
    {
      studentId: {
        type: DataTypes.INTEGER,
        allowNull: false
      },

      sessionId: {
        type: DataTypes.INTEGER,
        allowNull: false
      },

      reason: {
        type: DataTypes.TEXT,
        allowNull: false
      },

      documentUrl: {
        type: DataTypes.STRING,
        allowNull: true
      },

      status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "Pending"
      },

      reviewedBy: {
        type: DataTypes.INTEGER,
        allowNull: true
      },

      reviewedAt: {
        type: DataTypes.DATE,
        allowNull: true
      },

      notes: {
        type: DataTypes.TEXT,
        allowNull: true
      }
    },
    {
      sequelize,
      modelName: "ExcuseRequest"
    }
  );

  return ExcuseRequest;
};