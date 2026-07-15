'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Department extends Model {
    static associate(models) {
       // Bir bölümde birçok öğrenci olabilir
  Department.hasMany(models.Student, {
    foreignKey: "departmentId",
    as: "students"
  });

  // Bir bölümde birçok öğretim üyesi olabilir
  Department.hasMany(models.Faculty, {
    foreignKey: "departmentId",
    as: "faculties"
  });

  // Bir bölümde birçok ders olabilir
  Department.hasMany(models.Course, {
    foreignKey: "departmentId",
    as: "courses"
  });
  // Department -> Announcement
Department.hasMany(models.Announcement, {
  foreignKey: "departmentId",
  as: "announcements"
});
    }
  }

  Department.init(
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false
      },

      code: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
      },

      description: {
        type: DataTypes.TEXT,
        allowNull: true
      },

      facultyName: {
        type: DataTypes.STRING,
        allowNull: false
      },

      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      }
    },
    {
      sequelize,
      modelName: "Department"
    }
  );

  return Department;
};
