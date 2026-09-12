'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(
      `ALTER TYPE "enum_EventRegistrations_status" ADD VALUE IF NOT EXISTS 'Waitlisted';`
    );
  },

  async down(queryInterface, Sequelize) {
    // PostgreSQL bir ENUM tipinden değer çıkarmayı doğrudan desteklemez.
    // Geri almak gerekirse enum tipini yeniden oluşturmak gerekir; bu düşük
    // riskli bir ekleme olduğu için down fonksiyonu bilinçli olarak boş
    // bırakılmıştır.
  }
};