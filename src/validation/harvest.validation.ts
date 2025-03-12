import Joi from "joi";
import {
  QualityGrade,
  MarketStatus,
  UnitOfMeasure,
  getQualityGrades,
  getMarketStatuses,
  getUnitsOfMeasure,
} from "../constants/harvestTypes.js";

// Create harvest validation schema
export const createHarvestSchema = Joi.object({
  farmerId: Joi.string().uuid().required().messages({
    "string.uuid": "Farmer ID must be a valid UUID",
    "any.required": "Farmer ID is required",
  }),
  cropType: Joi.string().min(2).max(100).required().messages({
    "string.min": "Crop type must be at least 2 characters long",
    "string.max": "Crop type cannot exceed 100 characters",
    "any.required": "Crop type is required",
  }),
  variety: Joi.string().min(2).max(100).allow(null, "").messages({
    "string.min": "Variety must be at least 2 characters long",
    "string.max": "Variety cannot exceed 100 characters",
  }),
  quantity: Joi.number().positive().precision(2).required().messages({
    "number.base": "Quantity must be a number",
    "number.positive": "Quantity must be positive",
    "number.precision": "Quantity can have up to 2 decimal places",
    "any.required": "Quantity is required",
  }),
  unitOfMeasure: Joi.string()
    .valid(...getUnitsOfMeasure())
    .required()
    .messages({
      "any.only": "Unit of measure must be one of the supported values",
      "any.required": "Unit of measure is required",
    }),
  qualityGrade: Joi.string()
    .valid(...getQualityGrades())
    .required()
    .messages({
      "any.only": "Quality grade must be one of the supported values",
      "any.required": "Quality grade is required",
    }),
  harvestDate: Joi.date().max("now").required().messages({
    "date.base": "Harvest date must be a valid date",
    "date.max": "Harvest date cannot be in the future",
    "any.required": "Harvest date is required",
  }),
  storageLocation: Joi.string().max(255).allow(null, "").messages({
    "string.max": "Storage location cannot exceed 255 characters",
  }),
  expectedPrice: Joi.number().min(0).precision(2).required().messages({
    "number.base": "Expected price must be a number",
    "number.min": "Expected price cannot be negative",
    "number.precision": "Expected price can have up to 2 decimal places",
    "any.required": "Expected price is required",
  }),
  marketStatus: Joi.string()
    .valid(...getMarketStatuses())
    .messages({
      "any.only": "Market status must be one of the supported values",
    }),
});

// Update harvest validation schema
export const updateHarvestSchema = Joi.object({
  cropType: Joi.string().min(2).max(100).messages({
    "string.min": "Crop type must be at least 2 characters long",
    "string.max": "Crop type cannot exceed 100 characters",
  }),
  variety: Joi.string().min(2).max(100).allow(null, "").messages({
    "string.min": "Variety must be at least 2 characters long",
    "string.max": "Variety cannot exceed 100 characters",
  }),
  quantity: Joi.number().positive().precision(2).messages({
    "number.base": "Quantity must be a number",
    "number.positive": "Quantity must be positive",
    "number.precision": "Quantity can have up to 2 decimal places",
  }),
  unitOfMeasure: Joi.string()
    .valid(...getUnitsOfMeasure())
    .messages({
      "any.only": "Unit of measure must be one of the supported values",
    }),
  qualityGrade: Joi.string()
    .valid(...getQualityGrades())
    .messages({
      "any.only": "Quality grade must be one of the supported values",
    }),
  harvestDate: Joi.date().max("now").messages({
    "date.base": "Harvest date must be a valid date",
    "date.max": "Harvest date cannot be in the future",
  }),
  storageLocation: Joi.string().max(255).allow(null, "").messages({
    "string.max": "Storage location cannot exceed 255 characters",
  }),
  expectedPrice: Joi.number().min(0).precision(2).messages({
    "number.base": "Expected price must be a number",
    "number.min": "Expected price cannot be negative",
    "number.precision": "Expected price can have up to 2 decimal places",
  }),
  marketStatus: Joi.string()
    .valid(...getMarketStatuses())
    .messages({
      "any.only": "Market status must be one of the supported values",
    }),
}).min(1);

// Query parameters validation schema
export const harvestQuerySchema = Joi.object({
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
    .valid("harvestDate", "createdAt", "quantity", "expectedPrice")
    .default("createdAt")
    .messages({
      "any.only": "Sort by field must be one of the supported values",
    }),
  sortOrder: Joi.string().valid("ASC", "DESC").default("DESC").messages({
    "any.only": "Sort order must be either ASC or DESC",
  }),
  cropType: Joi.string().messages({
    "string.base": "Crop type must be a string",
  }),
  qualityGrade: Joi.alternatives()
    .try(
      Joi.string().valid(...getQualityGrades()),
      Joi.array().items(Joi.string().valid(...getQualityGrades()))
    )
    .messages({
      "any.only": "Quality grade must be one of the supported values",
    }),
  marketStatus: Joi.alternatives()
    .try(
      Joi.string().valid(...getMarketStatuses()),
      Joi.array().items(Joi.string().valid(...getMarketStatuses()))
    )
    .messages({
      "any.only": "Market status must be one of the supported values",
    }),
  fromDate: Joi.date().messages({
    "date.base": "From date must be a valid date",
  }),
  toDate: Joi.date().min(Joi.ref("fromDate")).messages({
    "date.base": "To date must be a valid date",
    "date.min": "To date must be after from date",
  }),
  minQuantity: Joi.number().min(0).messages({
    "number.base": "Minimum quantity must be a number",
    "number.min": "Minimum quantity cannot be negative",
  }),
  maxQuantity: Joi.number().min(Joi.ref("minQuantity")).messages({
    "number.base": "Maximum quantity must be a number",
    "number.min": "Maximum quantity must be greater than minimum quantity",
  }),
});

// Sell harvest validation schema
export const sellHarvestSchema = Joi.object({
  buyerId: Joi.string().uuid().required().messages({
    "string.uuid": "Buyer ID must be a valid UUID",
    "any.required": "Buyer ID is required",
  }),
  transactionId: Joi.string().uuid().messages({
    "string.uuid": "Transaction ID must be a valid UUID",
  }),
});

// Reserve harvest validation schema
export const reserveHarvestSchema = Joi.object({
  buyerId: Joi.string().uuid().messages({
    "string.uuid": "Buyer ID must be a valid UUID",
  }),
});

// ID parameter validation
export const idParamSchema = Joi.object({
  id: Joi.string().uuid().required().messages({
    "string.uuid": "ID must be a valid UUID",
    "any.required": "ID is required",
  }),
});
