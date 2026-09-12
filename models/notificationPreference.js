'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class NotificationPreference extends Model {
    static associate(models) {
      NotificationPreference.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user'
      });
    }
  }

  NotificationPreference.init(
    {
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true
      },

      email: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },

      push: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },

      sms: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      }
    },
    {
      sequelize,
      modelName: 'NotificationPreference'
    }
  );

  return NotificationPreference;
};