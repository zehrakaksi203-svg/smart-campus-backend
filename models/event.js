'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Event extends Model {
    static associate(models) {
      // Event -> Faculty (organizer)
      Event.belongsTo(models.Faculty, {
        foreignKey: "organizerId",
        as: "organizer"
      });

      // Event -> EventRegistration
      Event.hasMany(models.EventRegistration, {
        foreignKey: "eventId",
        as: "registrations"
      });
    }
  }

  Event.init(
    {
      title: {
        type: DataTypes.STRING,
        allowNull: false
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      eventDate: {
        type: DataTypes.DATE,
        allowNull: false
      },
      location: {
        type: DataTypes.STRING,
        allowNull: false
      },
      capacity: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      organizerId: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      status: {
        type: DataTypes.ENUM('Scheduled', 'Cancelled', 'Completed'),
        allowNull: false,
        defaultValue: 'Scheduled'
      }
    },
    {
      sequelize,
      modelName: "Event"
    }
  );

  return Event;
};