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
