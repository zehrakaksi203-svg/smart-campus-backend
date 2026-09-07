'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('Events', 'organizerId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'Faculties',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('Events', 'organizerId', {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'Faculties',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });
  }
};