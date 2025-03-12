'use strict';
const { v4: uuidv4 } = require('uuid');

// Function to generate a random date between start and end
const getRandomDate = (start, end) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

// Function to generate a future date X months from a given date
const addMonths = (date, months) => {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
};

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Get some existing users with FARMER role to use as farmers for the loans
    const farmers = await queryInterface.sequelize.query(
      `SELECT id FROM users WHERE role = 'FARMER' LIMIT 5`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    // Get some existing users with ADMIN or MANAGER role to use as approvers
    const approvers = await queryInterface.sequelize.query(
      `SELECT id FROM users WHERE role IN ('ADMIN', 'MANAGER') LIMIT 2`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (farmers.length === 0 || approvers.length === 0) {
      console.log('No farmers or approvers found. Skipping loan seed data.');
      return;
    }

    const loanTypes = ['EQUIPMENT', 'SEEDS', 'FERTILIZER', 'SEASONAL', 'INFRASTRUCTURE', 'EMERGENCY'];
    const loanStatuses = ['PENDING', 'APPROVED', 'REJECTED', 'ACTIVE', 'OVERDUE', 'REPAID', 'DEFAULTED'];
    const repaymentFrequencies = ['MONTHLY', 'QUARTERLY', 'BIANNUALLY', 'ANNUALLY', 'LUMP_SUM'];

    // Date range for loan issuance
    const now = new Date();
    const oneYearAgo = new Date(now);
    oneYearAgo.setFullYear(now.getFullYear() - 1);

    // Generate loan data
    const loanData = [];

    // Create 20 sample loans
    for (let i = 0; i < 20; i++) {
      const farmerId = farmers[Math.floor(Math.random() * farmers.length)].id;
      const loanType = loanTypes[Math.floor(Math.random() * loanTypes.length)];
      const status = loanStatuses[Math.floor(Math.random() * loanStatuses.length)];
      const durationMonths = Math.floor(Math.random() * 24) + 3; // 3 to 27 months
      const repaymentFrequency = repaymentFrequencies[Math.floor(Math.random() * repaymentFrequencies.length)];
      
      // Random amount between 500 and 10,000
      const amount = parseFloat((Math.random() * 9500 + 500).toFixed(2));
      
      // Random interest rate between 5% and 15%
      const interestRate = parseFloat((Math.random() * 10 + 5).toFixed(2));
      
      // Random issued date within the last year
      const issuedDate = getRandomDate(oneYearAgo, now);
      
      // Due date is issued date + duration months
      const dueDate = addMonths(issuedDate, durationMonths);

      // Create loan record
      const loan = {
        id: uuidv4(),
        farmer_id: farmerId,
        amount: amount,
        interest_rate: interestRate,
        duration_months: durationMonths,
        repayment_frequency: repaymentFrequency,
        loan_type: loanType,
        status: status,
        issued_date: issuedDate,
        due_date: dueDate,
        created_at: issuedDate,
        updated_at: issuedDate,
      };

      // Add status-specific fields
      if (status === 'APPROVED' || status === 'ACTIVE' || status === 'REPAID' || status === 'OVERDUE' || status === 'DEFAULTED') {
        const approverId = approvers[Math.floor(Math.random() * approvers.length)].id;
        const approvedDate = new Date(issuedDate);
        approvedDate.setDate(approvedDate.getDate() + Math.floor(Math.random() * 14)); // Approved within 14 days

        loan.approved_by = approverId;
        loan.approved_date = approvedDate;
        loan.updated_at = approvedDate;

        // If active or beyond, add disbursed date
        if (status === 'ACTIVE' || status === 'REPAID' || status === 'OVERDUE' || status === 'DEFAULTED') {
          const disbursedDate = new Date(approvedDate);
          disbursedDate.setDate(disbursedDate.getDate() + Math.floor(Math.random() * 7)); // Disbursed within 7 days of approval

          loan.disbursed_date = disbursedDate;
          loan.updated_at = disbursedDate;

          // Calculate remaining balance and amount paid
          if (status === 'ACTIVE' || status === 'OVERDUE' || status === 'DEFAULTED') {
            // For active loans, simulate some payments
            const totalDue = amount * (1 + interestRate / 100);
            const paymentProgress = status === 'OVERDUE' || status === 'DEFAULTED' ? 0.3 : 0.5; // Less progress for overdue/defaulted
            loan.amount_paid = parseFloat((totalDue * paymentProgress).toFixed(2));
            loan.remaining_balance = parseFloat((totalDue - loan.amount_paid).toFixed(2));

            // Add last payment date
            const lastPaymentDate = new Date(disbursedDate);
            lastPaymentDate.setDate(lastPaymentDate.getDate() + Math.floor(Math.random() * 30)); // Payment within 30 days of disbursement
            loan.last_payment_date = lastPaymentDate;
          } else if (status === 'REPAID') {
            // Repaid loans have full payment and no remaining balance
            loan.amount_paid = parseFloat((amount * (1 + interestRate / 100)).toFixed(2));
            loan.remaining_balance = 0;
            
            // Last payment date is close to but before due date
            const lastPaymentDate = new Date(dueDate);
            lastPaymentDate.setDate(lastPaymentDate.getDate() - Math.floor(Math.random() * 14)); // Repaid within 14 days before due date
            loan.last_payment_date = lastPaymentDate;
            loan.updated_at = lastPaymentDate;
          }
        }
      } else if (status === 'REJECTED') {
        // Add rejection reason
        loan.rejection_reason = 'Application does not meet our current lending criteria.';

        // Rejection date
        const rejectionDate = new Date(issuedDate);
        rejectionDate.setDate(rejectionDate.getDate() + Math.floor(Math.random() * 14)); // Rejected within 14 days
        loan.updated_at = rejectionDate;
      }

      loanData.push(loan);
    }

    await queryInterface.bulkInsert('loans', loanData);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('loans', null, {});
  }
};
