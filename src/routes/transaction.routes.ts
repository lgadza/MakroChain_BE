import express from "express";
import TransactionController from "../controllers/transaction.controller.js";
import {
  authenticate,
  optionalAuthenticate,
} from "../middleware/authMiddleware.js";
import {
  hasPermission,
  isResourceOwner,
} from "../middleware/authorizationMiddleware.js";
import { Resources, Permissions } from "../constants/roles.js";
import {
  validate,
  validateQuery,
  validateParams,
} from "../middleware/validation.middleware.js";
import {
  createTransactionSchema,
  updateTransactionSchema,
  transactionQuerySchema,
  updateTransactionStatusSchema,
  harvestSaleTransactionSchema,
  idParamSchema,
} from "../validation/transaction.validation.js";

const router = express.Router();

/**
 * @swagger
 * /api/transactions:
 *   get:
 *     summary: Get all transactions with filtering and pagination
 *     tags: [Transactions]
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
 *           enum: [transactionDate, createdAt, amount, status]
 *           default: transactionDate
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
 *         name: buyerId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by buyer ID
 *       - in: query
 *         name: harvestId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by harvest ID
 *       - in: query
 *         name: transactionType
 *         schema:
 *           type: string or array
 *         description: Filter by transaction type(s)
 *       - in: query
 *         name: status
 *         schema:
 *           type: string or array
 *         description: Filter by status(es)
 *       - in: query
 *         name: fromDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter transactions from this date
 *       - in: query
 *         name: toDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter transactions up to this date
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
 *     responses:
 *       200:
 *         description: List of transactions retrieved successfully
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 */
router.get(
  "/",
  authenticate,
  hasPermission(Resources.TRANSACTIONS, Permissions.READ),
  validateQuery(transactionQuerySchema),
  TransactionController.getAllTransactions
);

/**
 * @swagger
 * /api/transactions/{id}:
 *   get:
 *     summary: Get a transaction by ID
 *     tags: [Transactions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Transaction ID
 *     responses:
 *       200:
 *         description: Transaction retrieved successfully
 *       404:
 *         description: Transaction not found
 */
router.get(
  "/:id",
  authenticate,
  validateParams(idParamSchema),
  TransactionController.getTransactionById
);

/**
 * @swagger
 * /api/transactions/farmer/{farmerId}:
 *   get:
 *     summary: Get transactions for a specific farmer
 *     tags: [Transactions]
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
 *           enum: [transactionDate, createdAt, amount, status]
 *           default: transactionDate
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *           default: DESC
 *         description: Sort order
 *       - in: query
 *         name: transactionType
 *         schema:
 *           type: string or array
 *         description: Filter by transaction type(s)
 *       - in: query
 *         name: status
 *         schema:
 *           type: string or array
 *         description: Filter by status(es)
 *     responses:
 *       200:
 *         description: Farmer transactions retrieved successfully
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 */
router.get(
  "/farmer/:farmerId",
  authenticate,
  isResourceOwner((req) => req.params.farmerId),
  validateQuery(transactionQuerySchema),
  TransactionController.getFarmerTransactions
);

/**
 * @swagger
 * /api/transactions/buyer/{buyerId}:
 *   get:
 *     summary: Get transactions for a specific buyer
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: buyerId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Buyer ID
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
 *           enum: [transactionDate, createdAt, amount, status]
 *           default: transactionDate
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *           default: DESC
 *         description: Sort order
 *       - in: query
 *         name: transactionType
 *         schema:
 *           type: string or array
 *         description: Filter by transaction type(s)
 *       - in: query
 *         name: status
 *         schema:
 *           type: string or array
 *         description: Filter by status(es)
 *     responses:
 *       200:
 *         description: Buyer transactions retrieved successfully
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 */
router.get(
  "/buyer/:buyerId",
  authenticate,
  isResourceOwner((req) => req.params.buyerId),
  validateQuery(transactionQuerySchema),
  TransactionController.getBuyerTransactions
);

/**
 * @swagger
 * /api/transactions/harvest/{harvestId}:
 *   get:
 *     summary: Get transactions for a specific harvest
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: harvestId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Harvest ID
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
 *           enum: [transactionDate, createdAt, amount, status]
 *           default: transactionDate
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *           default: DESC
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Harvest transactions retrieved successfully
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 */
router.get(
  "/harvest/:harvestId",
  authenticate,
  validateQuery(transactionQuerySchema),
  TransactionController.getHarvestTransactions
);

/**
 * @swagger
 * /api/transactions:
 *   post:
 *     summary: Create a new transaction
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTransactionRequest'
 *     responses:
 *       201:
 *         description: Transaction created successfully
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
  hasPermission(Resources.TRANSACTIONS, Permissions.CREATE),
  validate(createTransactionSchema),
  TransactionController.createTransaction
);

/**
 * @swagger
 * /api/transactions/harvest-sale:
 *   post:
 *     summary: Create a harvest sale transaction
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/HarvestSaleTransactionRequest'
 *     responses:
 *       201:
 *         description: Harvest sale transaction created successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Harvest not found
 *       409:
 *         description: Harvest is not available for sale
 */
router.post(
  "/harvest-sale",
  authenticate,
  hasPermission(Resources.TRANSACTIONS, Permissions.CREATE),
  validate(harvestSaleTransactionSchema),
  TransactionController.createHarvestSaleTransaction
);

/**
 * @swagger
 * /api/transactions/{id}:
 *   put:
 *     summary: Update a transaction
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Transaction ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateTransactionRequest'
 *     responses:
 *       200:
 *         description: Transaction updated successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Transaction not found
 */
router.put(
  "/:id",
  authenticate,
  hasPermission(Resources.TRANSACTIONS, Permissions.UPDATE),
  validateParams(idParamSchema),
  validate(updateTransactionSchema),
  TransactionController.updateTransaction
);

/**
 * @swagger
 * /api/transactions/{id}/status:
 *   patch:
 *     summary: Update transaction status
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Transaction ID
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
 *                 enum: [PENDING, COMPLETED, FAILED, CANCELLED, REFUNDED]
 *     responses:
 *       200:
 *         description: Transaction status updated successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Transaction not found
 *       409:
 *         description: Invalid status transition
 */
router.patch(
  "/:id/status",
  authenticate,
  hasPermission(Resources.TRANSACTIONS, Permissions.UPDATE),
  validateParams(idParamSchema),
  validate(updateTransactionStatusSchema),
  TransactionController.updateTransactionStatus
);

/**
 * @swagger
 * /api/transactions/{id}:
 *   delete:
 *     summary: Delete a transaction
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Transaction ID
 *     responses:
 *       200:
 *         description: Transaction deleted successfully
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Transaction not found
 */
router.delete(
  "/:id",
  authenticate,
  hasPermission(Resources.TRANSACTIONS, Permissions.DELETE),
  validateParams(idParamSchema),
  TransactionController.deleteTransaction
);

export default router;
