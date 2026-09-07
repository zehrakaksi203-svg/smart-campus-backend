'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class MealReservation extends Model {
    static associate(models) {
      MealReservation.belongsTo(models.Student, {
        foreignKey: 'studentId',
        as: 'student'
      });

      MealReservation.belongsTo(models.Meal, {
        foreignKey: 'mealId',
        as: 'meal'
      });
    }
  }

  MealReservation.init(
    {
      studentId: {
        type: DataTypes.INTEGER,
        allowNull: false
      },

      mealId: {
        type: DataTypes.INTEGER,
        allowNull: false
      },

      reservationDate: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },

      status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'Reserved'
      },

      qrCode: {
        type: DataTypes.TEXT,
        allowNull: true
      },

      qrUsed: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      }
    },
    {
      sequelize,
      modelName: 'MealReservation',
      tableName: 'MealReservations'
    }
  );

  return MealReservation;
};