'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Attendance extends Model {
    static associate(models) {

      // Attendance -> Enrollment
      Attendance.belongsTo(models.Enrollment, {
        foreignKey: "enrollmentId",
        as: "enrollment"
      });

    }
  }

  Attendance.init(
    {
      enrollmentId: {
        type: DataTypes.INTEGER,
        allowNull: false
      },

      attendanceDate: {
        type: DataTypes.DATE,
        allowNull: false
      },

      status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "Present"
      },

      remarks: {
        type: DataTypes.STRING,
        allowNull: true
      }
    },
    {
      sequelize,
      modelName: "Attendance"
    }
  );

  return Attendance;
};
