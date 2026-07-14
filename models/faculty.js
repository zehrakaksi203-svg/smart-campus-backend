'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Faculty extends Model {
    static associate(models) {

      // Faculty -> User
      Faculty.belongsTo(models.User, {
        foreignKey: "userId",
        as: "user"
      });

      // Faculty -> Department
      Faculty.belongsTo(models.Department, {
        foreignKey: "departmentId",
        as: "department"
      });
     // Faculty -> Course
      Faculty.hasMany(models.Course, {
        foreignKey: "facultyId",
        as: "courses"
      });
      // Faculty -> Announcement
      Faculty.hasMany(models.Announcement, {
       foreignKey: "facultyId",
       as: "announcements"
      });


    }
  }

  Faculty.init(
    {
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false
      },

      departmentId: {
        type: DataTypes.INTEGER,
        allowNull: false
      },

      employeeNumber: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
      },

      title: {
        type: DataTypes.STRING,
        allowNull: false
      },

      specialization: {
        type: DataTypes.STRING,
        allowNull: false
      },

      office: {
        type: DataTypes.STRING,
        allowNull: false
      },

      status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "Active"
      }
    },
    {
      sequelize,
      modelName: "Faculty"
    }
  );

  return Faculty;
};