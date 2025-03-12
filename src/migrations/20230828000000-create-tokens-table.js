'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('tokens', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      harvestId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'harvests',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
        field: 'harvest_id',
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
      tokenAmount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        field: 'token_amount',
      },
      earnedDate: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
        field: 'earned_date',
      },
      expiryDate: {
        type: Sequelize.DATE,
        allowNull: true,
        field: 'expiry_date',
      },
      status: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: 'PENDING',
      },
      tokenType: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: 'HARVEST',
        field: 'token_type',
      },
      blockchainStatus: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: 'UNMINTED',
        field: 'blockchain_status',
      },
      blockchainTxId: {
        type: Sequelize.STRING(66),
        allowNull: true,
        field: 'blockchain_tx_id',
      },
      contractAddress: {
        type: Sequelize.STRING(42),
        allowNull: true,
        field: 'contract_address',
      },
      tokenId: {
        type: Sequelize.STRING(66),
        allowNull: true,
        field: 'token_id',
      },
      metadata: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      redemptionDate: {
        type: Sequelize.DATE,
        allowNull: true,
        field: 'redemption_date',
      },
      redemptionAmount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
        field: 'redemption_amount',
      },
      redemptionTxId: {
        type: Sequelize.STRING(66),
        allowNull: true,
        field: 'redemption_tx_id',
      },
      lastUpdated: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
        field: 'last_updated',
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
    await queryInterface.addIndex('tokens', ['harvest_id']);
    await queryInterface.addIndex('tokens', ['farmer_id']);
    await queryInterface.addIndex('tokens', ['status']);
    await queryInterface.addIndex('tokens', ['blockchain_status']);
    await queryInterface.addIndex('tokens', ['earned_date']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('tokens');
  }
};
