import express from "express";
import HarvestController from "../controllers/harvest.controller.js";
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
  createHarvestSchema,
  updateHarvestSchema,
  harvestQuerySchema,
  sellHarvestSchema,
  reserveHarvestSchema,
  idParamSchema,
} from "../validation/harvest.validation.js";

const router = express.Router();

/**
 * @swagger
 * /api/harvests:
 *   get:
 *     summary: Get all harvests with filtering and pagination
 *     tags: [Harvests]
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
 *           enum: [harvestDate, createdAt, quantity, expectedPrice]
 *           default: createdAt
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *           default: DESC
 *         description: Sort order
 *       - in: query
 *         name: cropType
 *         schema:
 *           type: string
 *         description: Filter by crop type
 *       - in: query
 *         name: qualityGrade
 *         schema:
 *           type: string or array
 *         description: Filter by quality grade(s)
 *       - in: query
 *         name: marketStatus
 *         schema:
 *           type: string or array
 *         description: Filter by market status(es)
 *       - in: query
 *         name: fromDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter harvests from this date
 *       - in: query
 *         name: toDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter harvests up to this date
 *       - in: query
 *         name: minQuantity
 *         schema:
 *           type: number
 *         description: Minimum quantity
 *       - in: query
 *         name: maxQuantity
 *         schema:
 *           type: number
 *         description: Maximum quantity
 *     responses:
 *       200:
 *         description: List of harvests retrieved successfully
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 */
router.get(
  "/",
  authenticate,
  hasPermission(Resources.HARVESTS, Permissions.READ),
  validateQuery(harvestQuerySchema),
  HarvestController.getAllHarvests
);

/**
 * @swagger
 * /api/harvests/available:
 *   get:
 *     summary: Get available harvests for marketplace
 *     tags: [Harvests]
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
 *           enum: [harvestDate, createdAt, quantity, expectedPrice]
 *           default: createdAt
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *           default: DESC
 *         description: Sort order
 *       - in: query
 *         name: cropType
 *         schema:
 *           type: string
 *         description: Filter by crop type
 *       - in: query
 *         name: qualityGrade
 *         schema:
 *           type: string or array
 *         description: Filter by quality grade(s)
 *       - in: query
 *         name: minQuantity
 *         schema:
 *           type: number
 *         description: Minimum quantity
 *       - in: query
 *         name: maxQuantity
 *         schema:
 *           type: number
 *         description: Maximum quantity
 *     responses:
 *       200:
 *         description: Available harvests retrieved successfully
 */
router.get(
  "/available",
  optionalAuthenticate,
  validateQuery(harvestQuerySchema),
  HarvestController.getAvailableHarvests
);

/**
 * @swagger
 * /api/harvests/{id}:
 *   get:
 *     summary: Get a harvest by ID
 *     tags: [Harvests]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Harvest ID
 *     responses:
 *       200:
 *         description: Harvest retrieved successfully
 *       404:
 *         description: Harvest not found
 */
router.get(
  "/:id",
  validateParams(idParamSchema),
  HarvestController.getHarvestById
);

/**
 * @swagger
 * /api/harvests/farmer/{farmerId}:
 *   get:
 *     summary: Get harvests for a specific farmer
 *     tags: [Harvests]
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
 *           enum: [harvestDate, createdAt, quantity, expectedPrice]
 *           default: createdAt
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *           default: DESC
 *         description: Sort order
 *       - in: query
 *         name: marketStatus
 *         schema:
 *           type: string or array
 *         description: Filter by market status(es)
 *     responses:
 *       200:
 *         description: Farmer harvests retrieved successfully
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 */
router.get(
  "/farmer/:farmerId",
  authenticate,
  isResourceOwner((req) => req.params.farmerId),
  validateQuery(harvestQuerySchema),
  HarvestController.getFarmerHarvests
);

/**
 * @swagger
 * /api/harvests/buyer/{buyerId}:
 *   get:
 *     summary: Get harvests purchased by a specific buyer
 *     tags: [Harvests]
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
 *           enum: [harvestDate, createdAt, quantity, expectedPrice]
 *           default: createdAt
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *           default: DESC
 *         description: Sort order
 *       - in: query
 *         name: marketStatus
 *         schema:
 *           type: string or array
 *         description: Filter by market status(es)
 *     responses:
 *       200:
 *         description: Buyer harvests retrieved successfully
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 */
router.get(
  "/buyer/:buyerId",
  authenticate,
  isResourceOwner((req) => req.params.buyerId),
  validateQuery(harvestQuerySchema),
  HarvestController.getBuyerHarvests
);

/**
 * @swagger
 * /api/harvests:
 *   post:
 *     summary: Create a new harvest
 *     tags: [Harvests]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateHarvestRequest'
 *     responses:
 *       201:
 *         description: Harvest created successfully
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
  hasPermission(Resources.HARVESTS, Permissions.CREATE),
  validate(createHarvestSchema),
  HarvestController.createHarvest
);

/**
 * @swagger
 * /api/harvests/{id}:
 *   put:
 *     summary: Update a harvest
 *     tags: [Harvests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Harvest ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateHarvestRequest'
 *     responses:
 *       200:
 *         description: Harvest updated successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Harvest not found
 */
router.put(
  "/:id",
  authenticate,
  hasPermission(Resources.HARVESTS, Permissions.UPDATE),
  validateParams(idParamSchema),
  validate(updateHarvestSchema),
  HarvestController.updateHarvest
);

/**
 * @swagger
 * /api/harvests/{id}:
 *   delete:
 *     summary: Delete a harvest
 *     tags: [Harvests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Harvest ID
 *     responses:
 *       200:
 *         description: Harvest deleted successfully
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Harvest not found
 */
router.delete(
  "/:id",
  authenticate,
  hasPermission(Resources.HARVESTS, Permissions.DELETE),
  validateParams(idParamSchema),
  HarvestController.deleteHarvest
);

/**
 * @swagger
 * /api/harvests/{id}/sell:
 *   post:
 *     summary: Mark a harvest as sold
 *     tags: [Harvests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Harvest ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - buyerId
 *             properties:
 *               buyerId:
 *                 type: string
 *                 format: uuid
 *               transactionId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Harvest marked as sold successfully
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
  "/:id/sell",
  authenticate,
  hasPermission(Resources.HARVESTS, Permissions.UPDATE),
  validateParams(idParamSchema),
  validate(sellHarvestSchema),
  HarvestController.markHarvestAsSold
);

/**
 * @swagger
 * /api/harvests/{id}/reserve:
 *   post:
 *     summary: Mark a harvest as reserved
 *     tags: [Harvests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Harvest ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               buyerId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Harvest marked as reserved successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Harvest not found
 *       409:
 *         description: Harvest cannot be reserved
 */
router.post(
  "/:id/reserve",
  authenticate,
  hasPermission(Resources.HARVESTS, Permissions.UPDATE),
  validateParams(idParamSchema),
  validate(reserveHarvestSchema),
  HarvestController.markHarvestAsReserved
);

export default router;
