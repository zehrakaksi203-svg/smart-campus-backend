'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {

    await queryInterface.addColumn("Users", "isVerified", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });

    await queryInterface.addColumn("Users", "verificationToken", {
      type: Sequelize.TEXT,
      allowNull: true
    });

  },

  async down(queryInterface, Sequelize) {

    await queryInterface.removeColumn("Users", "verificationToken");

    await queryInterface.removeColumn("Users", "isVerified");

  }
};