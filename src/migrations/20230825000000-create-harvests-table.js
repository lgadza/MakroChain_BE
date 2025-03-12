'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('harvests', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      farmerId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
        field: 'farmer_id',
      },
      cropType: {
        type: Sequelize.STRING(100),
        allowNull: false,
        field: 'crop_type',
      },
      variety: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      quantity: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      unitOfMeasure: {
        type: Sequelize.STRING(20),
        allowNull: false,
        field: 'unit_of_measure',
      },
      qualityGrade: {
        type: Sequelize.STRING(20),
        allowNull: false,
        field: 'quality_grade',
      },
      harvestDate: {
        type: Sequelize.DATEONLY,
        allowNull: false,
        field: 'harvest_date',
      },
      storageLocation: {
        type: Sequelize.STRING(255),
        allowNull: true,
        field: 'storage_location',
      },
      expectedPrice: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        field: 'expected_price',
      },
      marketStatus: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: 'AVAILABLE',
        field: 'market_status',
      },
      buyerId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        field: 'buyer_id',
      },
      transactionId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'transactions',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        field: 'transaction_id',
      },
      blockchainHash: {
        type: Sequelize.STRING(255),
        allowNull: true,
        field: 'blockchain_hash',
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
        field: 'created_at',
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
        field: 'updated_at',
      },
    });

    // Add indices for faster queries
    await queryInterface.addIndex('harvests', ['farmer_id']);
    await queryInterface.addIndex('harvests', ['market_status']);
    await queryInterface.addIndex('harvests', ['harvest_date']);
    await queryInterface.addIndex('harvests', ['crop_type']);
    await queryInterface.addIndex('harvests', ['buyer_id']);
    await queryInterface.addIndex('harvests', ['farmer_id', 'market_status']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('harvests');
  }
};
