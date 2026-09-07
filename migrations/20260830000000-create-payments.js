"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Payments", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      studentId: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: {
          model: "Students",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      type: {
        allowNull: false,
        type: Sequelize.ENUM("Tuition", "Meal", "Event"),
      },
      referenceId: {
        allowNull: true,
        type: Sequelize.INTEGER,
      },
      amount: {
        allowNull: false,
        type: Sequelize.DECIMAL(10, 2),
      },
      status: {
        allowNull: false,
        type: Sequelize.ENUM("Pending", "Completed", "Failed"),
        defaultValue: "Pending",
      },
      description: {
        allowNull: true,
        type: Sequelize.STRING,
      },
      paidAt: {
        allowNull: true,
        type: Sequelize.DATE,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("Payments");
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_Payments_type";'
    );
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_Payments_status";'
    );
  },
};
