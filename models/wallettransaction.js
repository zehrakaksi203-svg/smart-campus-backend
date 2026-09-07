'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class WalletTransaction extends Model {
    static associate(models) {
      WalletTransaction.belongsTo(models.Wallet, {
        foreignKey: 'walletId',
        as: 'wallet'
      });
    }
  }

  WalletTransaction.init(
    {
      walletId: {
        type: DataTypes.INTEGER,
        allowNull: false
      },

      amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
      },

      type: {
        type: DataTypes.STRING,
        allowNull: false
      },

      status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'Pending'
      },

      paymentProvider: {
        type: DataTypes.STRING,
        allowNull: true
      },

      transactionId: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true
      }
    },
    {
      sequelize,
      modelName: 'WalletTransaction',
      tableName: 'WalletTransactions'
    }
  );

  return WalletTransaction;
};