'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {

  class PasswordResetToken extends Model {

    static associate(models) {

      PasswordResetToken.belongsTo(models.User, {
        foreignKey: "userId",
        as: "user"
      });

    }

  }


  PasswordResetToken.init(
    {
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false
      },

      token: {
        type: DataTypes.TEXT,
        allowNull: false
      },

      expiresAt: {
        type: DataTypes.DATE,
        allowNull: false
      }

    },
    {
      sequelize,
      modelName: "PasswordResetToken"
    }
  );


  return PasswordResetToken;

};