import { Request, Response, NextFunction } from "express";
import Joi from "joi";
import { createError } from "../utils/errorUtils.js";

/**
 * Middleware to validate request data against a Joi schema
 */
export const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errorMessage = error.details
        .map((detail) => detail.message)
        .join(", ");

      next(createError(400, errorMessage));
      return;
    }

    next();
  };
};

/**
 * Middleware to validate query parameters against a Joi schema
 */
export const validateQuery = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errorMessage = error.details
        .map((detail) => detail.message)
        .join(", ");

      next(createError(400, errorMessage));
      return;
    }

    next();
  };
};

/**
 * Middleware to validate route parameters against a Joi schema
 */
export const validateParams = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error } = schema.validate(req.params, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errorMessage = error.details
        .map((detail) => detail.message)
        .join(", ");

      next(createError(400, errorMessage));
      return;
    }

    next();
  };
};
