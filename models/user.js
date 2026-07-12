'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {

      // Bir kullanıcı bir öğrenci olabilir
      User.hasOne(models.Student, {
        foreignKey: "userId",
        as: "student"
      });

      // Bir kullanıcı bir öğretim üyesi olabilir
      User.hasOne(models.Faculty, {
        foreignKey: "userId",
        as: "faculty"
      });

    }
  }

  User.init(
    {
      fullName: {
        type: DataTypes.STRING,
        allowNull: false
      },

      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
      },

      password: {
        type: DataTypes.STRING,
        allowNull: false
      },

      role: {
        type: DataTypes.STRING,
        allowNull: false
      },

      profilePicture: {
        type: DataTypes.STRING
      }
    },
    {
      sequelize,
      modelName: 'User'
    }
  );

  return User;
};