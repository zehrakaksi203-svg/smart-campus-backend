"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Payment extends Model {
    static associate(models) {
      Payment.belongsTo(models.Student, {
        foreignKey: "studentId",
        as: "student",
      });
    }
  }

  Payment.init(
    {
      studentId: DataTypes.INTEGER,
      type: DataTypes.ENUM("Tuition", "Meal", "Event"),
      referenceId: DataTypes.INTEGER,
      amount: DataTypes.DECIMAL(10, 2),
      status: {
        type: DataTypes.ENUM("Pending", "Completed", "Failed"),
        defaultValue: "Pending",
      },
      description: DataTypes.STRING,
      paidAt: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: "Payment",
    }
  );

  return Payment;
};
