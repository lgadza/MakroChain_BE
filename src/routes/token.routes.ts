import express from "express";
import TokenController from "../controllers/token.controller.js";
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
  createTokenSchema,
  updateTokenSchema,
  tokenQuerySchema,
  updateBlockchainStatusSchema,
  tokenRedemptionSchema,
  idParamSchema,
} from "../validation/token.validation.js";

const router = express.Router();

/**
 * @swagger
 * /api/tokens:
 *   get:
 *     summary: Get all tokens with filtering and pagination
 *     tags: [Tokens]
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
 *           enum: [earnedDate, createdAt, tokenAmount, status, tokenType, blockchainStatus]
 *           default: earnedDate
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *           default: DESC
 *         description: Sort order
 *       - in: query
 *         name: status, farmerId, harvestId, tokenType, blockchainStatus, etc.
 *         schema:
 *           type: string or array
 *         description: Various filter options
 *     responses:
 *       200:
 *         description: List of tokens retrieved successfully
 */
router.get(
  "/",
  authenticate,
  hasPermission(Resources.TOKENS, Permissions.READ),
  validateQuery(tokenQuerySchema),
  TokenController.getAllTokens
);

/**
 * @swagger
 * /api/tokens/{id}:
 *   get:
 *     summary: Get a token by ID
 *     tags: [Tokens]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Token ID
 *     responses:
 *       200:
 *         description: Token retrieved successfully
 *       404:
 *         description: Token not found
 */
router.get(
  "/:id",
  authenticate,
  validateParams(idParamSchema),
  TokenController.getTokenById
);

/**
 * @swagger
 * /api/tokens/farmer/{farmerId}:
 *   get:
 *     summary: Get tokens for a specific farmer
 *     tags: [Tokens]
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
 *         name: page, limit, sortBy, sortOrder, status, etc.
 *         description: Various query parameters
 *     responses:
 *       200:
 *         description: Farmer tokens retrieved successfully
 */
router.get(
  "/farmer/:farmerId",
  authenticate,
  isResourceOwner((req) => req.params.farmerId),
  validateQuery(tokenQuerySchema),
  TokenController.getFarmerTokens
);

/**
 * @swagger
 * /api/tokens/harvest/{harvestId}:
 *   get:
 *     summary: Get tokens for a specific harvest
 *     tags: [Tokens]
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
 *         name: page, limit, sortBy, sortOrder
 *         description: Pagination and sorting parameters
 *     responses:
 *       200:
 *         description: Harvest tokens retrieved successfully
 */
router.get(
  "/harvest/:harvestId",
  authenticate,
  validateQuery(tokenQuerySchema),
  TokenController.getHarvestTokens
);

/**
 * @swagger
 * /api/tokens:
 *   post:
 *     summary: Create a new token
 *     tags: [Tokens]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTokenRequest'
 *     responses:
 *       201:
 *         description: Token created successfully
 */
router.post(
  "/",
  authenticate,
  hasPermission(Resources.TOKENS, Permissions.CREATE),
  validate(createTokenSchema),
  TokenController.createToken
);

/**
 * @swagger
 * /api/tokens/{id}:
 *   put:
 *     summary: Update a token
 *     tags: [Tokens]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Token ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateTokenRequest'
 *     responses:
 *       200:
 *         description: Token updated successfully
 */
router.put(
  "/:id",
  authenticate,
  hasPermission(Resources.TOKENS, Permissions.UPDATE),
  validateParams(idParamSchema),
  validate(updateTokenSchema),
  TokenController.updateToken
);

/**
 * @swagger
 * /api/tokens/{id}/blockchain:
 *   patch:
 *     summary: Update token blockchain status
 *     tags: [Tokens]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Token ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BlockchainStatusUpdate'
 *     responses:
 *       200:
 *         description: Token blockchain status updated successfully
 */
router.patch(
  "/:id/blockchain",
  authenticate,
  requireRole([Roles.ADMIN, Roles.MANAGER]),
  validateParams(idParamSchema),
  validate(updateBlockchainStatusSchema),
  TokenController.updateTokenBlockchainStatus
);

/**
 * @swagger
 * /api/tokens/{id}/redeem:
 *   post:
 *     summary: Redeem a token
 *     tags: [Tokens]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Token ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TokenRedemption'
 *     responses:
 *       200:
 *         description: Token redeemed successfully
 */
router.post(
  "/:id/redeem",
  authenticate,
  requireRole([Roles.ADMIN, Roles.MANAGER]),
  validateParams(idParamSchema),
  validate(tokenRedemptionSchema),
  TokenController.redeemToken
);

/**
 * @swagger
 * /api/tokens/{id}/mint:
 *   post:
 *     summary: Mint a token on the blockchain
 *     tags: [Tokens]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Token ID
 *     responses:
 *       200:
 *         description: Token minted successfully
 */
router.post(
  "/:id/mint",
  authenticate,
  requireRole([Roles.ADMIN, Roles.MANAGER]),
  validateParams(idParamSchema),
  TokenController.mintToken
);

/**
 * @swagger
 * /api/tokens/{id}:
 *   delete:
 *     summary: Delete a token
 *     tags: [Tokens]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Token ID
 *     responses:
 *       200:
 *         description: Token deleted successfully
 */
router.delete(
  "/:id",
  authenticate,
  hasPermission(Resources.TOKENS, Permissions.DELETE),
  validateParams(idParamSchema),
  TokenController.deleteToken
);

/**
 * @swagger
 * /api/tokens/admin/check-expired:
 *   post:
 *     summary: Check and update expired tokens
 *     tags: [Tokens]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Expired tokens updated successfully
 */
router.post(
  "/admin/check-expired",
  authenticate,
  requireRole([Roles.ADMIN, Roles.MANAGER]),
  TokenController.checkExpiredTokens
);

export default router;
