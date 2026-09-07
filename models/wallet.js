'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Wallet extends Model {
    static associate(models) {
      Wallet.belongsTo(models.Student, {
        foreignKey: 'studentId',
        as: 'student'
      });

      Wallet.hasMany(models.WalletTransaction, {
        foreignKey: 'walletId',
        as: 'transactions'
      });
    }
  }

  Wallet.init(
    {
      studentId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true
      },

      balance: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00
      }
    },
    {
      sequelize,
      modelName: 'Wallet',
      tableName: 'Wallets'
    }
  );

  return Wallet;
};