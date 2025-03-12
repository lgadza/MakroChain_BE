import Joi from "joi";
import { PhoneType } from "../constants/phoneTypes.js";

/**
 * Schema for validating phone number creation
 */
export const createPhoneSchema = Joi.object({
  phoneType: Joi.string()
    .valid(...Object.values(PhoneType))
    .required()
    .messages({
      "any.required": "Phone type is required",
      "any.only": "Phone type must be one of: MOBILE, HOME, WORK, FAX, OTHER",
    }),
  countryCode: Joi.string().pattern(/^\d+$/).required().max(5).messages({
    "any.required": "Country code is required",
    "string.pattern.base": "Country code must contain only digits",
    "string.max": "Country code cannot exceed 5 digits",
  }),
  number: Joi.string().pattern(/^\d+$/).required().min(5).max(15).messages({
    "any.required": "Phone number is required",
    "string.pattern.base": "Phone number must contain only digits",
    "string.min": "Phone number must be at least 5 digits",
    "string.max": "Phone number cannot exceed 15 digits",
  }),
  extension: Joi.string().allow("", null).max(10).messages({
    "string.max": "Extension cannot exceed 10 characters",
  }),
  isDefault: Joi.boolean().default(false),
});

/**
 * Schema for updating a phone number
 */
export const updatePhoneSchema = Joi.object({
  phoneType: Joi.string()
    .valid(...Object.values(PhoneType))
    .messages({
      "any.only": "Phone type must be one of: MOBILE, HOME, WORK, FAX, OTHER",
    }),
  countryCode: Joi.string().pattern(/^\d+$/).max(5).messages({
    "string.pattern.base": "Country code must contain only digits",
    "string.max": "Country code cannot exceed 5 digits",
  }),
  number: Joi.string().pattern(/^\d+$/).min(5).max(15).messages({
    "string.pattern.base": "Phone number must contain only digits",
    "string.min": "Phone number must be at least 5 digits",
    "string.max": "Phone number cannot exceed 15 digits",
  }),
  extension: Joi.string().allow("", null).max(10).messages({
    "string.max": "Extension cannot exceed 10 characters",
  }),
  isDefault: Joi.boolean(),
});

/**
 * Schema for validating phone ID parameter
 */
export const phoneIdParamSchema = Joi.object({
  id: Joi.string().uuid().required().messages({
    "any.required": "Phone ID is required",
    "string.uuid": "Invalid phone ID format",
  }),
});

/**
 * Schema for validating phone verification
 */
export const verifyPhoneSchema = Joi.object({
  verificationCode: Joi.string().required().length(6).messages({
    "any.required": "Verification code is required",
    "string.length": "Verification code must be 6 characters",
  }),
});

/**
 * Schema for validating phone query parameters
 */
export const phoneQuerySchema = Joi.object({
  phoneType: Joi.string().valid(...Object.values(PhoneType)),
  isDefault: Joi.boolean(),
  isVerified: Joi.boolean(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
});
