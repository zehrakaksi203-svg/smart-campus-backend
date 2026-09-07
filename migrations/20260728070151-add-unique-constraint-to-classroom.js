'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addConstraint('Classrooms', {
      fields: ['building', 'roomNumber'],
      type: 'unique',
      name: 'unique_classroom_building_room'
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeConstraint('Classrooms', 'unique_classroom_building_room');
  }
};