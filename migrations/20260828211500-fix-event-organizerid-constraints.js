'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    // Fazladan eklenen ikinci foreign key'i kaldır
    await queryInterface.sequelize.query(
      'ALTER TABLE "Events" DROP CONSTRAINT IF EXISTS "Events_organizerId_fkey1";'
    );

    // organizerId sütununu nullable yap
    await queryInterface.sequelize.query(
      'ALTER TABLE "Events" ALTER COLUMN "organizerId" DROP NOT NULL;'
    );
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(
      'ALTER TABLE "Events" ALTER COLUMN "organizerId" SET NOT NULL;'
    );
  }
};