'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('EventRegistrations', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      eventId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Events',
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
      status: {
        type: Sequelize.ENUM('Registered', 'Cancelled'),
        allowNull: false,
        defaultValue: 'Registered'
      },
      qrCode: {
        type: Sequelize.STRING,
        allowNull: true
      },
      qrUsed: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
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

    await queryInterface.addConstraint('EventRegistrations', {
      fields: ['eventId', 'studentId'],
      type: 'unique',
      name: 'unique_event_student_registration'
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('EventRegistrations');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_EventRegistrations_status";');
  }
};