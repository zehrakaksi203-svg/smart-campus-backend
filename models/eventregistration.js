'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class EventRegistration extends Model {
    static associate(models) {
      // EventRegistration -> Event
      EventRegistration.belongsTo(models.Event, {
        foreignKey: "eventId",
        as: "event"
      });

      // EventRegistration -> Student
      EventRegistration.belongsTo(models.Student, {
        foreignKey: "studentId",
        as: "student"
      });
    }
  }

  EventRegistration.init(
    {
      eventId: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      studentId: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      status: {
        type: DataTypes.ENUM('Registered', 'Cancelled', 'Waitlisted'),
        allowNull: false,
        defaultValue: 'Registered'
      },
      qrCode: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      qrUsed: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      }
    },
    {
      sequelize,
      modelName: "EventRegistration"
    }
  );

  return EventRegistration;
};