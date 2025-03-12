import express from "express";
import LoanController from "../controllers/loan.controller.js";
import {
  authenticate,
  optionalAuthenticate,
} from "../middleware/authMiddleware.js";
import {
  hasPermission,
  isResourceOwner,
  requireRole,
} from "../middleware/authorizationMiddleware.js";
import { Resources, Permissions, Roles } from "../constants/roles.js";
import {
  validate,
  validateQuery,
  validateParams,
} from "../middleware/validation.middleware.js";
import {
  createLoanSchema,
  updateLoanSchema,
  loanQuerySchema,
  updateLoanStatusSchema,
  loanPaymentSchema,
  idParamSchema,
} from "../validation/loan.validation.js";

const router = express.Router();

/**
 * @swagger
 * /api/loans:
 *   get:
 *     summary: Get all loans with filtering and pagination
 *     tags: [Loans]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [issuedDate, dueDate, createdAt, amount, status, interestRate]
 *           default: issuedDate
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *           default: DESC
 *         description: Sort order
 *       - in: query
 *         name: farmerId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by farmer ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string or array
 *         description: Filter by status(es)
 *       - in: query
 *         name: loanType
 *         schema:
 *           type: string or array
 *         description: Filter by loan type(s)
 *       - in: query
 *         name: fromDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter loans from this date
 *       - in: query
 *         name: toDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter loans up to this date
 *       - in: query
 *         name: minAmount
 *         schema:
 *           type: number
 *         description: Minimum amount
 *       - in: query
 *         name: maxAmount
 *         schema:
 *           type: number
 *         description: Maximum amount
 *       - in: query
 *         name: overdue
 *         schema:
 *           type: boolean
 *         description: Filter for overdue loans
 *       - in: query
 *         name: approvedBy
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by the user who approved the loan
 *     responses:
 *       200:
 *         description: List of loans retrieved successfully
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 */
router.get(
  "/",
  authenticate,
  hasPermission(Resources.LOANS, Permissions.READ),
  validateQuery(loanQuerySchema),
  LoanController.getAllLoans
);

/**
 * @swagger
 * /api/loans/{id}:
 *   get:
 *     summary: Get a loan by ID
 *     tags: [Loans]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Loan ID
 *     responses:
 *       200:
 *         description: Loan retrieved successfully
 *       404:
 *         description: Loan not found
 */
router.get(
  "/:id",
  authenticate,
  validateParams(idParamSchema),
  LoanController.getLoanById
);

/**
 * @swagger
 * /api/loans/farmer/{farmerId}:
 *   get:
 *     summary: Get loans for a specific farmer
 *     tags: [Loans]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: farmerId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Farmer ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [issuedDate, dueDate, createdAt, amount, status, interestRate]
 *           default: issuedDate
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *           default: DESC
 *         description: Sort order
 *       - in: query
 *         name: status
 *         schema:
 *           type: string or array
 *         description: Filter by status(es)
 *       - in: query
 *         name: loanType
 *         schema:
 *           type: string or array
 *         description: Filter by loan type(s)
 *     responses:
 *       200:
 *         description: Farmer loans retrieved successfully
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 */
router.get(
  "/farmer/:farmerId",
  authenticate,
  isResourceOwner((req) => req.params.farmerId),
  validateQuery(loanQuerySchema),
  LoanController.getFarmerLoans
);

/**
 * @swagger
 * /api/loans:
 *   post:
 *     summary: Create a new loan
 *     tags: [Loans]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateLoanRequest'
 *     responses:
 *       201:
 *         description: Loan created successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 */
router.post(
  "/",
  authenticate,
  hasPermission(Resources.LOANS, Permissions.CREATE),
  validate(createLoanSchema),
  LoanController.createLoan
);

/**
 * @swagger
 * /api/loans/{id}:
 *   put:
 *     summary: Update a loan
 *     tags: [Loans]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Loan ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateLoanRequest'
 *     responses:
 *       200:
 *         description: Loan updated successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Loan not found
 */
router.put(
  "/:id",
  authenticate,
  hasPermission(Resources.LOANS, Permissions.UPDATE),
  validateParams(idParamSchema),
  validate(updateLoanSchema),
  LoanController.updateLoan
);

/**
 * @swagger
 * /api/loans/{id}/status:
 *   patch:
 *     summary: Update loan status
 *     tags: [Loans]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Loan ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [PENDING, APPROVED, REJECTED, ACTIVE, OVERDUE, REPAID, DEFAULTED, RESTRUCTURED, CANCELLED]
 *               approvedBy:
 *                 type: string
 *                 format: uuid
 *               approvedDate:
 *                 type: string
 *                 format: date-time
 *               disbursedDate:
 *                 type: string
 *                 format: date-time
 *               rejectionReason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Loan status updated successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Loan not found
 *       409:
 *         description: Invalid status transition
 */
router.patch(
  "/:id/status",
  authenticate,
  hasPermission(Resources.LOANS, Permissions.UPDATE),
  validateParams(idParamSchema),
  validate(updateLoanStatusSchema),
  LoanController.updateLoanStatus
);

/**
 * @swagger
 * /api/loans/{id}/payment:
 *   post:
 *     summary: Record a payment for a loan
 *     tags: [Loans]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Loan ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *             properties:
 *               amount:
 *                 type: number
 *                 description: Payment amount
 *               paymentDate:
 *                 type: string
 *                 format: date-time
 *                 description: Payment date
 *               notes:
 *                 type: string
 *                 description: Payment notes
 *     responses:
 *       200:
 *         description: Loan payment recorded successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Loan not found
 *       409:
 *         description: Cannot record payment for this loan
 */
router.post(
  "/:id/payment",
  authenticate,
  validateParams(idParamSchema),
  validate(loanPaymentSchema),
  LoanController.recordLoanPayment
);

/**
 * @swagger
 * /api/loans/{id}:
 *   delete:
 *     summary: Delete a loan
 *     tags: [Loans]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Loan ID
 *     responses:
 *       200:
 *         description: Loan deleted successfully
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Loan not found
 */
router.delete(
  "/:id",
  authenticate,
  hasPermission(Resources.LOANS, Permissions.DELETE),
  validateParams(idParamSchema),
  LoanController.deleteLoan
);

/**
 * @swagger
 * /api/loans/admin/check-overdue:
 *   post:
 *     summary: Check and update overdue loans
 *     tags: [Loans]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Overdue loans updated successfully
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 */
router.post(
  "/admin/check-overdue",
  authenticate,
  requireRole([Roles.ADMIN, Roles.MANAGER]),
  LoanController.checkOverdueLoans
);

export default router;
