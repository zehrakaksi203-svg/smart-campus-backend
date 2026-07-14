'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Announcement extends Model {
    static associate(models) {

      // Announcement -> Faculty
      Announcement.belongsTo(models.Faculty, {
        foreignKey: "facultyId",
        as: "faculty"
      });

      // Announcement -> Department
      Announcement.belongsTo(models.Department, {
        foreignKey: "departmentId",
        as: "department"
      });

    }
  }

  Announcement.init(
    {
      facultyId: {
        type: DataTypes.INTEGER,
        allowNull: false
      },

      departmentId: {
        type: DataTypes.INTEGER,
        allowNull: false
      },

      title: {
        type: DataTypes.STRING,
        allowNull: false
      },

      content: {
        type: DataTypes.TEXT,
        allowNull: false
      },

      publishDate: {
        type: DataTypes.DATE,
        allowNull: false
      },

      expiryDate: {
        type: DataTypes.DATE,
        allowNull: true
      },

      status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "Active"
      }
    },
    {
      sequelize,
      modelName: "Announcement"
    }
  );

  return Announcement;
};