'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDescription = await queryInterface.describeTable("Users");

    if (!tableDescription.profilePicture) {
      await queryInterface.addColumn("Users", "profilePicture", {
        type: Sequelize.STRING,
        allowNull: true
      });
    }
  },

  async down(queryInterface, Sequelize) {
    const tableDescription = await queryInterface.describeTable("Users");

    if (tableDescription.profilePicture) {
      await queryInterface.removeColumn("Users", "profilePicture");
    }
  }
};