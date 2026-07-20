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

      // Faculty -> CourseSection
      Faculty.hasMany(models.CourseSection, {
        foreignKey: "facultyId",
        as: "sections"
      });

      // Faculty -> AttendanceSession
      Faculty.hasMany(models.AttendanceSession, {
        foreignKey: "facultyId",
        as: "attendanceSessions"
      });

      // Faculty -> ExcuseRequest (inceleyen olarak)
      Faculty.hasMany(models.ExcuseRequest, {
        foreignKey: "reviewedBy",
        as: "reviewedExcuseRequests"
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