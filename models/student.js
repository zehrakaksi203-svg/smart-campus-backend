'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Student extends Model {
    static associate(models) {
      // Student -> User
      Student.belongsTo(models.User, {
        foreignKey: "userId",
        as: "user"
      });
      // Student -> Wallet
      Student.hasOne(models.Wallet, {
      foreignKey: "studentId",
      as: "wallet"
      });
      // Student -> Department
      Student.belongsTo(models.Department, {
        foreignKey: "departmentId",
        as: "department"
      });
 // Student -> Enrollment
      Student.hasMany(models.Enrollment, {
        foreignKey: "studentId",
        as: "enrollments"
      });

      // Student -> AttendanceRecord
      Student.hasMany(models.AttendanceRecord, {
        foreignKey: "studentId",
        as: "attendanceRecords"
      });

      // Student -> ExcuseRequest
      Student.hasMany(models.ExcuseRequest, {
        foreignKey: "studentId",
        as: "excuseRequests"
      });
      // Student -> MealReservation
      Student.hasMany(models.MealReservation, {
      foreignKey: "studentId",
      as: "mealReservations"
      });

          // Student -> EventRegistration
          Student.hasMany(models.EventRegistration, {
            foreignKey: "studentId",
            as: "eventRegistrations"
            });

    }
  }

  Student.init(
    {
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false
      },

      departmentId: {
        type: DataTypes.INTEGER,
        allowNull: false
      },

      studentNumber: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
      },

      classYear: {
        type: DataTypes.INTEGER,
        allowNull: false
      },

      gpa: {
        type: DataTypes.DECIMAL(3, 2),
        defaultValue: 0.00
      },

      status: {
        type: DataTypes.STRING,
        defaultValue: "Active"
      }
    },
    {
      sequelize,
      modelName: "Student"
    }
  );

  return Student;
};