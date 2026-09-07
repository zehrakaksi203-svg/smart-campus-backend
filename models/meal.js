'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Meal extends Model {
    static associate(models) {
      if (models.MealReservation) {
        Meal.hasMany(models.MealReservation, {
          foreignKey: 'mealId',
          as: 'reservations'
        });
      }
    }
  }

  Meal.init(
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false
      },

      description: {
        type: DataTypes.TEXT,
        allowNull: true
      },

      price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
      },

      quota: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: 0
        }
      },

      availableDate: {
        type: DataTypes.DATEONLY,
        allowNull: false
      },

      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      }
    },
    {
      sequelize,
      modelName: 'Meal',
      tableName: 'Meals'
    }
  );

  return Meal;
};