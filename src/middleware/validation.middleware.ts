import { Request, Response, NextFunction } from "express";
import Joi from "joi";
import { ErrorFactory } from "../utils/errorUtils.js";

export const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body, { abortEarly: false });

    if (error) {
      const errorMessage = error.details
        .map((detail) => detail.message)
        .join(", ");
      return next(
        ErrorFactory.validation(errorMessage, "VALIDATION_ERROR", error.details)
      );
    }

    next();
  };
};
