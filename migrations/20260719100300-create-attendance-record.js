'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('AttendanceRecords', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },

      sessionId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'AttendanceSessions',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },

      studentId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Students',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },

      checkInTime: {
        type: Sequelize.DATE,
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

      distanceFromCenter: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },

      isFlagged: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },

      flagReason: {
        type: Sequelize.STRING,
        allowNull: true
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
    await queryInterface.dropTable('AttendanceRecords');
  }
};
