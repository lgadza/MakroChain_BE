import Joi from "joi";
import {
  TokenStatus,
  getTokenStatuses,
  TokenType,
  getTokenTypes,
  BlockchainStatus,
  getBlockchainStatuses,
} from "../constants/tokenTypes.js";

// Create token validation schema
export const createTokenSchema = Joi.object({
  harvestId: Joi.string().uuid().required().messages({
    "string.uuid": "Harvest ID must be a valid UUID",
    "any.required": "Harvest ID is required",
  }),
  farmerId: Joi.string().uuid().required().messages({
    "string.uuid": "Farmer ID must be a valid UUID",
    "any.required": "Farmer ID is required",
  }),
  tokenAmount: Joi.number().positive().precision(2).required().messages({
    "number.base": "Token amount must be a number",
    "number.positive": "Token amount must be positive",
    "number.precision": "Token amount can have up to 2 decimal places",
    "any.required": "Token amount is required",
  }),
  earnedDate: Joi.date().default(Date.now).messages({
    "date.base": "Earned date must be a valid date",
  }),
  expiryDate: Joi.date().min(Joi.ref("earnedDate")).allow(null).messages({
    "date.base": "Expiry date must be a valid date",
    "date.min": "Expiry date must be after earned date",
  }),
  tokenType: Joi.string()
    .valid(...getTokenTypes())
    .default(TokenType.HARVEST)
    .messages({
      "any.only": "Token type must be one of the supported values",
    }),
  metadata: Joi.object().allow(null).messages({
    "object.base": "Metadata must be a valid JSON object",
  }),
});

// Update token validation schema
export const updateTokenSchema = Joi.object({
  tokenAmount: Joi.number().positive().precision(2).messages({
    "number.base": "Token amount must be a number",
    "number.positive": "Token amount must be positive",
    "number.precision": "Token amount can have up to 2 decimal places",
  }),
  expiryDate: Joi.date().allow(null).messages({
    "date.base": "Expiry date must be a valid date",
  }),
  status: Joi.string()
    .valid(...getTokenStatuses())
    .messages({
      "any.only": "Status must be one of the supported values",
    }),
  tokenType: Joi.string()
    .valid(...getTokenTypes())
    .messages({
      "any.only": "Token type must be one of the supported values",
    }),
  metadata: Joi.object().allow(null).messages({
    "object.base": "Metadata must be a valid JSON object",
  }),
}).min(1);

// Update token blockchain status validation schema
export const updateBlockchainStatusSchema = Joi.object({
  blockchainStatus: Joi.string()
    .valid(...getBlockchainStatuses())
    .required()
    .messages({
      "any.only": "Blockchain status must be one of the supported values",
      "any.required": "Blockchain status is required",
    }),
  blockchainTxId: Joi.string().allow(null, "").max(66).messages({
    "string.max": "Blockchain transaction ID cannot exceed 66 characters",
  }),
  contractAddress: Joi.string()
    .allow(null, "")
    .max(42)
    .regex(/^(0x)?[0-9a-fA-F]{40}$/)
    .messages({
      "string.max": "Contract address cannot exceed 42 characters",
      "string.pattern.base":
        "Contract address must be a valid Ethereum address",
    }),
  tokenId: Joi.string().allow(null, "").max(66).messages({
    "string.max": "Token ID cannot exceed 66 characters",
  }),
});

// Token redemption validation schema
export const tokenRedemptionSchema = Joi.object({
  redemptionAmount: Joi.number().positive().precision(2).required().messages({
    "number.base": "Redemption amount must be a number",
    "number.positive": "Redemption amount must be positive",
    "number.precision": "Redemption amount can have up to 2 decimal places",
    "any.required": "Redemption amount is required",
  }),
  redemptionDate: Joi.date().default(Date.now).messages({
    "date.base": "Redemption date must be a valid date",
  }),
  redemptionTxId: Joi.string().allow(null, "").max(66).messages({
    "string.max": "Redemption transaction ID cannot exceed 66 characters",
  }),
  notes: Joi.string().max(1000).allow(null, "").messages({
    "string.max": "Notes cannot exceed 1000 characters",
  }),
});

// Query parameters validation schema
export const tokenQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1).messages({
    "number.base": "Page must be a number",
    "number.integer": "Page must be an integer",
    "number.min": "Page must be at least 1",
  }),
  limit: Joi.number().integer().min(1).max(100).default(10).messages({
    "number.base": "Limit must be a number",
    "number.integer": "Limit must be an integer",
    "number.min": "Limit must be at least 1",
    "number.max": "Limit cannot exceed 100",
  }),
  sortBy: Joi.string()
    .valid(
      "earnedDate",
      "createdAt",
      "tokenAmount",
      "status",
      "tokenType",
      "blockchainStatus"
    )
    .default("earnedDate")
    .messages({
      "any.only": "Sort by field must be one of the supported values",
    }),
  sortOrder: Joi.string().valid("ASC", "DESC").default("DESC").messages({
    "any.only": "Sort order must be either ASC or DESC",
  }),
  farmerId: Joi.string().uuid().messages({
    "string.uuid": "Farmer ID must be a valid UUID",
  }),
  harvestId: Joi.string().uuid().messages({
    "string.uuid": "Harvest ID must be a valid UUID",
  }),
  status: Joi.alternatives()
    .try(
      Joi.string().valid(...getTokenStatuses()),
      Joi.array().items(Joi.string().valid(...getTokenStatuses()))
    )
    .messages({
      "any.only": "Status must be one of the supported values",
    }),
  tokenType: Joi.alternatives()
    .try(
      Joi.string().valid(...getTokenTypes()),
      Joi.array().items(Joi.string().valid(...getTokenTypes()))
    )
    .messages({
      "any.only": "Token type must be one of the supported values",
    }),
  blockchainStatus: Joi.alternatives()
    .try(
      Joi.string().valid(...getBlockchainStatuses()),
      Joi.array().items(Joi.string().valid(...getBlockchainStatuses()))
    )
    .messages({
      "any.only": "Blockchain status must be one of the supported values",
    }),
  fromDate: Joi.date().messages({
    "date.base": "From date must be a valid date",
  }),
  toDate: Joi.date().min(Joi.ref("fromDate")).messages({
    "date.base": "To date must be a valid date",
    "date.min": "To date must be after from date",
  }),
  minAmount: Joi.number().min(0).messages({
    "number.base": "Minimum amount must be a number",
    "number.min": "Minimum amount cannot be negative",
  }),
  maxAmount: Joi.number().min(Joi.ref("minAmount")).messages({
    "number.base": "Maximum amount must be a number",
    "number.min": "Maximum amount must be greater than minimum amount",
  }),
  hasBlockchainInfo: Joi.boolean().messages({
    "boolean.base": "Has blockchain info must be a boolean",
  }),
});

// ID parameter validation
export const idParamSchema = Joi.object({
  id: Joi.string().uuid().required().messages({
    "string.uuid": "ID must be a valid UUID",
    "any.required": "ID is required",
  }),
});
