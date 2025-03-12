'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('loans', {
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
      amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      interestRate: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
        field: 'interest_rate',
      },
      durationMonths: {
        type: Sequelize.INTEGER,
        allowNull: false,
        field: 'duration_months',
      },
      repaymentFrequency: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: 'MONTHLY',
        field: 'repayment_frequency',
      },
      loanType: {
        type: Sequelize.STRING(20),
        allowNull: false,
        field: 'loan_type',
      },
      status: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: 'PENDING',
      },
      issuedDate: {
        type: Sequelize.DATE,
        allowNull: false,
        field: 'issued_date',
      },
      dueDate: {
        type: Sequelize.DATE,
        allowNull: false,
        field: 'due_date',
      },
      approvedBy: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        field: 'approved_by',
      },
      approvedDate: {
        type: Sequelize.DATE,
        allowNull: true,
        field: 'approved_date',
      },
      disbursedDate: {
        type: Sequelize.DATE,
        allowNull: true,
        field: 'disbursed_date',
      },
      collateral: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      rejectionReason: {
        type: Sequelize.TEXT,
        allowNull: true,
        field: 'rejection_reason',
      },
      lastPaymentDate: {
        type: Sequelize.DATE,
        allowNull: true,
        field: 'last_payment_date',
      },
      amountPaid: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0.00,
        field: 'amount_paid',
      },
      remainingBalance: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
        field: 'remaining_balance',
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
    await queryInterface.addIndex('loans', ['farmer_id']);
    await queryInterface.addIndex('loans', ['status']);
    await queryInterface.addIndex('loans', ['issued_date']);
    await queryInterface.addIndex('loans', ['due_date']);
    await queryInterface.addIndex('loans', ['loan_type']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('loans');
  }
};
