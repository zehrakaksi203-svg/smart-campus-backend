'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('CourseSections', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },

      courseId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Courses',
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

      sectionCode: {
        type: Sequelize.STRING,
        allowNull: false
      },

      semester: {
        type: Sequelize.STRING,
        allowNull: false
      },

      capacity: {
        type: Sequelize.INTEGER,
        allowNull: false
      },

      enrolledCount: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },

      classroom: {
        type: Sequelize.STRING,
        allowNull: false
      },

      dayOfWeek: {
        type: Sequelize.STRING,
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

      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
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
    await queryInterface.dropTable('CourseSections');
  }
};