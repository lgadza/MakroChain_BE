import express from "express";
import { AddressController } from "../controllers/address.controller.js";
import { authenticate } from "../middleware/authMiddleware.js";
import {
  validate,
  validateParams,
  validateQuery,
} from "../middleware/validation.middleware.js";
import {
  createAddressSchema,
  updateAddressSchema,
  addressIdParamSchema,
  addressQuerySchema,
} from "../dto/address.dto.js";

const router = express.Router();
const addressController = new AddressController();

/**
 * @swagger
 * /api/addresses:
 *   get:
 *     summary: Get all addresses for the authenticated user
 *     tags: [Addresses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: addressType
 *         schema:
 *           type: string
 *           enum: [HOME, WORK, SHIPPING, BILLING]
 *         description: Filter by address type
 *       - in: query
 *         name: isDefault
 *         schema:
 *           type: boolean
 *         description: Filter by default status
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
 *     responses:
 *       200:
 *         description: List of addresses retrieved successfully
 *       401:
 *         description: Not authenticated
 */
router.get(
  "/",
  authenticate,
  validateQuery(addressQuerySchema),
  addressController.getUserAddresses
);

/**
 * @swagger
 * /api/addresses/{id}:
 *   get:
 *     summary: Get a specific address by ID
 *     tags: [Addresses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Address ID
 *     responses:
 *       200:
 *         description: Address retrieved successfully
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Address not found
 */
router.get(
  "/:id",
  authenticate,
  validateParams(addressIdParamSchema),
  addressController.getAddressById
);

/**
 * @swagger
 * /api/addresses:
 *   post:
 *     summary: Create a new address
 *     tags: [Addresses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - addressType
 *               - street1
 *               - city
 *               - state
 *               - postalCode
 *               - country
 *             properties:
 *               addressType:
 *                 type: string
 *                 enum: [HOME, WORK, SHIPPING, BILLING]
 *               street1:
 *                 type: string
 *               street2:
 *                 type: string
 *               city:
 *                 type: string
 *               state:
 *                 type: string
 *               postalCode:
 *                 type: string
 *               country:
 *                 type: string
 *               isDefault:
 *                 type: boolean
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *     responses:
 *       201:
 *         description: Address created successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authenticated
 */
router.post(
  "/",
  authenticate,
  validate(createAddressSchema),
  addressController.createAddress
);

/**
 * @swagger
 * /api/addresses/{id}:
 *   put:
 *     summary: Update an existing address
 *     tags: [Addresses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Address ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               addressType:
 *                 type: string
 *                 enum: [HOME, WORK, SHIPPING, BILLING]
 *               street1:
 *                 type: string
 *               street2:
 *                 type: string
 *               city:
 *                 type: string
 *               state:
 *                 type: string
 *               postalCode:
 *                 type: string
 *               country:
 *                 type: string
 *               isDefault:
 *                 type: boolean
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *     responses:
 *       200:
 *         description: Address updated successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Address not found
 */
router.put(
  "/:id",
  authenticate,
  validateParams(addressIdParamSchema),
  validate(updateAddressSchema),
  addressController.updateAddress
);

/**
 * @swagger
 * /api/addresses/{id}:
 *   delete:
 *     summary: Delete an address
 *     tags: [Addresses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Address ID
 *     responses:
 *       200:
 *         description: Address deleted successfully
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Address not found
 */
router.delete(
  "/:id",
  authenticate,
  validateParams(addressIdParamSchema),
  addressController.deleteAddress
);

/**
 * @swagger
 * /api/addresses/{id}/default:
 *   patch:
 *     summary: Set an address as default for its type
 *     tags: [Addresses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Address ID
 *     responses:
 *       200:
 *         description: Address set as default successfully
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Address not found
 */
router.patch(
  "/:id/default",
  authenticate,
  validateParams(addressIdParamSchema),
  addressController.setAddressAsDefault
);

export default router;
