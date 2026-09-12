'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDescription = await queryInterface.describeTable("Users");

    if (!tableDescription.isVerified) {
      await queryInterface.addColumn("Users", "isVerified", {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      });
    }

    if (!tableDescription.verificationToken) {
      await queryInterface.addColumn("Users", "verificationToken", {
        type: Sequelize.TEXT,
        allowNull: true
      });
    }
  },

  async down(queryInterface, Sequelize) {
    const tableDescription = await queryInterface.describeTable("Users");

    if (tableDescription.verificationToken) {
      await queryInterface.removeColumn("Users", "verificationToken");
    }

    if (tableDescription.isVerified) {
      await queryInterface.removeColumn("Users", "isVerified");
    }
  }
};