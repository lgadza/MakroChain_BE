import express from "express";
import { PhoneController } from "../controllers/phone.controller.js";
import { authenticate } from "../middleware/authMiddleware.js";
import {
  validate,
  validateParams,
  validateQuery,
} from "../middleware/validation.middleware.js";
import {
  createPhoneSchema,
  updatePhoneSchema,
  phoneIdParamSchema,
  verifyPhoneSchema,
  phoneQuerySchema,
} from "../dto/phone.dto.js";

const router = express.Router();
const phoneController = new PhoneController();

/**
 * @swagger
 * /api/phones:
 *   get:
 *     summary: Get all phone numbers for the authenticated user
 *     tags: [Phones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: phoneType
 *         schema:
 *           type: string
 *           enum: [MOBILE, HOME, WORK, FAX, OTHER]
 *         description: Filter by phone type
 *       - in: query
 *         name: isDefault
 *         schema:
 *           type: boolean
 *         description: Filter by default status
 *       - in: query
 *         name: isVerified
 *         schema:
 *           type: boolean
 *         description: Filter by verification status
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
 *         description: List of phone numbers retrieved successfully
 *       401:
 *         description: Not authenticated
 */
router.get(
  "/",
  authenticate,
  validateQuery(phoneQuerySchema),
  phoneController.getUserPhones
);

/**
 * @swagger
 * /api/phones/{id}:
 *   get:
 *     summary: Get a specific phone number by ID
 *     tags: [Phones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Phone ID
 *     responses:
 *       200:
 *         description: Phone number retrieved successfully
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Phone number not found
 */
router.get(
  "/:id",
  authenticate,
  validateParams(phoneIdParamSchema),
  phoneController.getPhoneById
);

/**
 * @swagger
 * /api/phones:
 *   post:
 *     summary: Create a new phone number
 *     tags: [Phones]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phoneType
 *               - countryCode
 *               - number
 *             properties:
 *               phoneType:
 *                 type: string
 *                 enum: [MOBILE, HOME, WORK, FAX, OTHER]
 *               countryCode:
 *                 type: string
 *                 description: Country code without + (e.g. 1 for USA)
 *               number:
 *                 type: string
 *               extension:
 *                 type: string
 *               isDefault:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Phone number created successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authenticated
 *       409:
 *         description: Phone number already exists
 */
router.post(
  "/",
  authenticate,
  validate(createPhoneSchema),
  phoneController.createPhone
);

/**
 * @swagger
 * /api/phones/{id}:
 *   put:
 *     summary: Update an existing phone number
 *     tags: [Phones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Phone ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               phoneType:
 *                 type: string
 *                 enum: [MOBILE, HOME, WORK, FAX, OTHER]
 *               countryCode:
 *                 type: string
 *                 description: Country code without + (e.g. 1 for USA)
 *               number:
 *                 type: string
 *               extension:
 *                 type: string
 *               isDefault:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Phone number updated successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Phone number not found
 *       409:
 *         description: Phone number already exists
 */
router.put(
  "/:id",
  authenticate,
  validateParams(phoneIdParamSchema),
  validate(updatePhoneSchema),
  phoneController.updatePhone
);

/**
 * @swagger
 * /api/phones/{id}:
 *   delete:
 *     summary: Delete a phone number
 *     tags: [Phones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Phone ID
 *     responses:
 *       200:
 *         description: Phone number deleted successfully
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Phone number not found
 */
router.delete(
  "/:id",
  authenticate,
  validateParams(phoneIdParamSchema),
  phoneController.deletePhone
);

/**
 * @swagger
 * /api/phones/{id}/default:
 *   patch:
 *     summary: Set a phone number as default for its type
 *     tags: [Phones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Phone ID
 *     responses:
 *       200:
 *         description: Phone number set as default successfully
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Phone number not found
 */
router.patch(
  "/:id/default",
  authenticate,
  validateParams(phoneIdParamSchema),
  phoneController.setPhoneAsDefault
);

/**
 * @swagger
 * /api/phones/{id}/verify/request:
 *   post:
 *     summary: Request a verification code for a phone number
 *     tags: [Phones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Phone ID
 *     responses:
 *       200:
 *         description: Verification code sent successfully
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Phone number not found
 */
router.post(
  "/:id/verify/request",
  authenticate,
  validateParams(phoneIdParamSchema),
  phoneController.requestVerificationCode
);

/**
 * @swagger
 * /api/phones/{id}/verify:
 *   post:
 *     summary: Verify a phone number with a verification code
 *     tags: [Phones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Phone ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - verificationCode
 *             properties:
 *               verificationCode:
 *                 type: string
 *                 description: The 6-digit verification code
 *     responses:
 *       200:
 *         description: Phone number verified successfully
 *       400:
 *         description: Invalid or expired verification code
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Phone number not found
 */
router.post(
  "/:id/verify",
  authenticate,
  validateParams(phoneIdParamSchema),
  validate(verifyPhoneSchema),
  phoneController.verifyPhone
);

export default router;
