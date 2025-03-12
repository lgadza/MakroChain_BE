import Joi from "joi";
import { AddressType } from "../constants/addressTypes.js";

/**
 * Schema for validating address creation
 */
export const createAddressSchema = Joi.object({
  addressType: Joi.string()
    .valid(...Object.values(AddressType))
    .required()
    .messages({
      "any.required": "Address type is required",
      "any.only": "Address type must be one of: HOME, WORK, SHIPPING, BILLING",
    }),
  street1: Joi.string().required().max(100).messages({
    "any.required": "Street address is required",
    "string.max": "Street address cannot exceed 100 characters",
  }),
  street2: Joi.string().allow("", null).max(100).messages({
    "string.max": "Street address line 2 cannot exceed 100 characters",
  }),
  city: Joi.string().required().max(50).messages({
    "any.required": "City is required",
    "string.max": "City cannot exceed 50 characters",
  }),
  state: Joi.string().required().max(50).messages({
    "any.required": "State/Province is required",
    "string.max": "State/Province cannot exceed 50 characters",
  }),
  postalCode: Joi.string().required().max(20).messages({
    "any.required": "Postal code is required",
    "string.max": "Postal code cannot exceed 20 characters",
  }),
  country: Joi.string().required().max(50).messages({
    "any.required": "Country is required",
    "string.max": "Country cannot exceed 50 characters",
  }),
  isDefault: Joi.boolean().default(false),
  latitude: Joi.number().allow(null).min(-90).max(90).messages({
    "number.min": "Latitude must be between -90 and 90",
    "number.max": "Latitude must be between -90 and 90",
  }),
  longitude: Joi.number().allow(null).min(-180).max(180).messages({
    "number.min": "Longitude must be between -180 and 180",
    "number.max": "Longitude must be between -180 and 180",
  }),
});

/**
 * Schema for updating an address
 */
export const updateAddressSchema = Joi.object({
  addressType: Joi.string()
    .valid(...Object.values(AddressType))
    .messages({
      "any.only": "Address type must be one of: HOME, WORK, SHIPPING, BILLING",
    }),
  street1: Joi.string().max(100).messages({
    "string.max": "Street address cannot exceed 100 characters",
  }),
  street2: Joi.string().allow("", null).max(100).messages({
    "string.max": "Street address line 2 cannot exceed 100 characters",
  }),
  city: Joi.string().max(50).messages({
    "string.max": "City cannot exceed 50 characters",
  }),
  state: Joi.string().max(50).messages({
    "string.max": "State/Province cannot exceed 50 characters",
  }),
  postalCode: Joi.string().max(20).messages({
    "string.max": "Postal code cannot exceed 20 characters",
  }),
  country: Joi.string().max(50).messages({
    "string.max": "Country cannot exceed 50 characters",
  }),
  isDefault: Joi.boolean(),
  latitude: Joi.number().allow(null).min(-90).max(90).messages({
    "number.min": "Latitude must be between -90 and 90",
    "number.max": "Latitude must be between -90 and 90",
  }),
  longitude: Joi.number().allow(null).min(-180).max(180).messages({
    "number.min": "Longitude must be between -180 and 180",
    "number.max": "Longitude must be between -180 and 180",
  }),
});

/**
 * Schema for validating address ID parameter
 */
export const addressIdParamSchema = Joi.object({
  id: Joi.string().uuid().required().messages({
    "any.required": "Address ID is required",
    "string.uuid": "Invalid address ID format",
  }),
});

/**
 * Schema for validating address query parameters
 */
export const addressQuerySchema = Joi.object({
  addressType: Joi.string().valid(...Object.values(AddressType)),
  isDefault: Joi.boolean(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
});
