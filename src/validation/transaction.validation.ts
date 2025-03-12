import Joi from "joi";
import {
  TransactionType,
  TransactionStatus,
  PaymentMethod,
  Currency,
  getTransactionTypes,
  getTransactionStatuses,
  getPaymentMethods,
  getCurrencies,
} from "../constants/transactionTypes.js";

// Create transaction validation schema
export const createTransactionSchema = Joi.object({
  farmerId: Joi.string().uuid().required().messages({
    "string.uuid": "Farmer ID must be a valid UUID",
    "any.required": "Farmer ID is required",
  }),
  buyerId: Joi.string().uuid().messages({
    "string.uuid": "Buyer ID must be a valid UUID",
  }),
  harvestId: Joi.string().uuid().messages({
    "string.uuid": "Harvest ID must be a valid UUID",
  }),
  transactionType: Joi.string()
    .valid(...getTransactionTypes())
    .required()
    .messages({
      "any.only": "Transaction type must be one of the supported values",
      "any.required": "Transaction type is required",
    }),
  amount: Joi.number().positive().precision(2).required().messages({
    "number.base": "Amount must be a number",
    "number.positive": "Amount must be positive",
    "number.precision": "Amount can have up to 2 decimal places",
    "any.required": "Amount is required",
  }),
  currency: Joi.string()
    .valid(...getCurrencies())
    .default(Currency.USD)
    .messages({
      "any.only": "Currency must be one of the supported values",
    }),
  paymentMethod: Joi.string()
    .valid(...getPaymentMethods())
    .required()
    .messages({
      "any.only": "Payment method must be one of the supported values",
      "any.required": "Payment method is required",
    }),
  transactionDate: Joi.date().default(Date.now).messages({
    "date.base": "Transaction date must be a valid date",
  }),
  status: Joi.string()
    .valid(...getTransactionStatuses())
    .default(TransactionStatus.PENDING)
    .messages({
      "any.only": "Status must be one of the supported values",
    }),
  notes: Joi.string().max(1000).allow(null, "").messages({
    "string.max": "Notes cannot exceed 1000 characters",
  }),
  reference: Joi.string().max(100).allow(null, "").messages({
    "string.max": "Reference cannot exceed 100 characters",
  }),
  metadata: Joi.object().allow(null).messages({
    "object.base": "Metadata must be a valid JSON object",
  }),
}).custom((value, helpers) => {
  // Special validation for SALE transactions
  if (value.transactionType === TransactionType.SALE && !value.harvestId) {
    return helpers.error("custom.harvestRequired", {
      message: "Harvest ID is required for sale transactions",
    });
  }

  // Special validation for PAYMENT transactions that should have buyer
  if (value.transactionType === TransactionType.PAYMENT && !value.buyerId) {
    return helpers.error("custom.buyerRequired", {
      message: "Buyer ID is required for payment transactions",
    });
  }

  return value;
});

// Update transaction validation schema
export const updateTransactionSchema = Joi.object({
  status: Joi.string()
    .valid(...getTransactionStatuses())
    .messages({
      "any.only": "Status must be one of the supported values",
    }),
  notes: Joi.string().max(1000).allow(null, "").messages({
    "string.max": "Notes cannot exceed 1000 characters",
  }),
  reference: Joi.string().max(100).allow(null, "").messages({
    "string.max": "Reference cannot exceed 100 characters",
  }),
  blockchainHash: Joi.string().max(255).allow(null, "").messages({
    "string.max": "Blockchain hash cannot exceed 255 characters",
  }),
  metadata: Joi.object().allow(null).messages({
    "object.base": "Metadata must be a valid JSON object",
  }),
}).min(1);

// Update transaction status validation schema
export const updateTransactionStatusSchema = Joi.object({
  status: Joi.string()
    .valid(...getTransactionStatuses())
    .required()
    .messages({
      "any.only": "Status must be one of the supported values",
      "any.required": "Status is required",
    }),
});

// Query parameters validation schema
export const transactionQuerySchema = Joi.object({
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
    .valid("transactionDate", "createdAt", "amount", "status")
    .default("transactionDate")
    .messages({
      "any.only": "Sort by field must be one of the supported values",
    }),
  sortOrder: Joi.string().valid("ASC", "DESC").default("DESC").messages({
    "any.only": "Sort order must be either ASC or DESC",
  }),
  farmerId: Joi.string().uuid().messages({
    "string.uuid": "Farmer ID must be a valid UUID",
  }),
  buyerId: Joi.string().uuid().messages({
    "string.uuid": "Buyer ID must be a valid UUID",
  }),
  harvestId: Joi.string().uuid().messages({
    "string.uuid": "Harvest ID must be a valid UUID",
  }),
  transactionType: Joi.alternatives()
    .try(
      Joi.string().valid(...getTransactionTypes()),
      Joi.array().items(Joi.string().valid(...getTransactionTypes()))
    )
    .messages({
      "any.only": "Transaction type must be one of the supported values",
    }),
  status: Joi.alternatives()
    .try(
      Joi.string().valid(...getTransactionStatuses()),
      Joi.array().items(Joi.string().valid(...getTransactionStatuses()))
    )
    .messages({
      "any.only": "Status must be one of the supported values",
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
  reference: Joi.string().messages({
    "string.base": "Reference must be a string",
  }),
});

// Harvest sale transaction validation schema
export const harvestSaleTransactionSchema = Joi.object({
  harvestId: Joi.string().uuid().required().messages({
    "string.uuid": "Harvest ID must be a valid UUID",
    "any.required": "Harvest ID is required",
  }),
  buyerId: Joi.string().uuid().required().messages({
    "string.uuid": "Buyer ID must be a valid UUID",
    "any.required": "Buyer ID is required",
  }),
  paymentMethod: Joi.string()
    .valid(...getPaymentMethods())
    .required()
    .messages({
      "any.only": "Payment method must be one of the supported values",
      "any.required": "Payment method is required",
    }),
  amount: Joi.number().positive().precision(2).required().messages({
    "number.base": "Amount must be a number",
    "number.positive": "Amount must be positive",
    "number.precision": "Amount can have up to 2 decimal places",
    "any.required": "Amount is required",
  }),
  currency: Joi.string()
    .valid(...getCurrencies())
    .default(Currency.USD)
    .messages({
      "any.only": "Currency must be one of the supported values",
    }),
  notes: Joi.string().max(1000).allow(null, "").messages({
    "string.max": "Notes cannot exceed 1000 characters",
  }),
});

// ID parameter validation
export const idParamSchema = Joi.object({
  id: Joi.string().uuid().required().messages({
    "string.uuid": "ID must be a valid UUID",
    "any.required": "ID is required",
  }),
});
