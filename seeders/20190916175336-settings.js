"use strict";

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert(
      "Settings",
      [
        {
          name: "orderLagMinutes",
          value: 30,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          name: "maxDeliveriesPerSlot",
          value: 10,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ],
      {}
    );
  },

  down: (queryInterface, Sequelize) => {
    /*
      Add reverting commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.bulkDelete('People', null, {});
    */
  }
};
