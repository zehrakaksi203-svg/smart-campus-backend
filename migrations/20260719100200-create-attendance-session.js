'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('AttendanceSessions', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },

      sectionId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'CourseSections',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },

      facultyId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Faculties',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },

      date: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },

      startTime: {
        type: Sequelize.TIME,
        allowNull: false
      },

      endTime: {
        type: Sequelize.TIME,
        allowNull: false
      },

      latitude: {
        type: Sequelize.DECIMAL(10, 7),
        allowNull: false
      },

      longitude: {
        type: Sequelize.DECIMAL(10, 7),
        allowNull: false
      },

      geofenceRadius: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 15
      },

      qrCode: {
        type: Sequelize.STRING,
        allowNull: true
      },

      status: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'Open'
      },

      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },

      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('AttendanceSessions');
  }
};
