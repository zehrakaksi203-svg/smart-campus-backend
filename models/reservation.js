'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Reservation extends Model {
    static associate(models) {
      Reservation.belongsTo(models.Classroom, {
        foreignKey: "classroomId",
        as: "classroom"
      });

      Reservation.belongsTo(models.User, {
        foreignKey: "userId",
        as: "user"
      });

      Reservation.belongsTo(models.User, {
        foreignKey: "approvedBy",
        as: "approver"
      });
    }
  }

  Reservation.init(
    {
      classroomId: {
        type: DataTypes.INTEGER,
        allowNull: false
      },

      userId: {
        type: DataTypes.INTEGER,
        allowNull: false
      },

      date: {
        type: DataTypes.DATEONLY,
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

      purpose: {
        type: DataTypes.STRING,
        allowNull: true
      },

      status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "Pending"
      },

      approvedBy: {
        type: DataTypes.INTEGER,
        allowNull: true
      }
    },
    {
      sequelize,
      modelName: "Reservation"
    }
  );

  return Reservation;
};