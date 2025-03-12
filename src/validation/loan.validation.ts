import Joi from "joi";
import {
  LoanStatus,
  getLoanStatuses,
  LoanType,
  getLoanTypes,
  RepaymentFrequency,
  getRepaymentFrequencies,
} from "../constants/loanTypes.js";

// Create loan validation schema
export const createLoanSchema = Joi.object({
  farmerId: Joi.string().uuid().required().messages({
    "string.uuid": "Farmer ID must be a valid UUID",
    "any.required": "Farmer ID is required",
  }),
  amount: Joi.number().positive().precision(2).required().messages({
    "number.base": "Amount must be a number",
    "number.positive": "Amount must be positive",
    "number.precision": "Amount can have up to 2 decimal places",
    "any.required": "Amount is required",
  }),
  interestRate: Joi.number().min(0).max(100).precision(2).required().messages({
    "number.base": "Interest rate must be a number",
    "number.min": "Interest rate cannot be negative",
    "number.max": "Interest rate cannot exceed 100%",
    "number.precision": "Interest rate can have up to 2 decimal places",
    "any.required": "Interest rate is required",
  }),
  durationMonths: Joi.number().integer().min(1).required().messages({
    "number.base": "Duration must be a number",
    "number.integer": "Duration must be an integer",
    "number.min": "Duration must be at least 1 month",
    "any.required": "Duration in months is required",
  }),
  repaymentFrequency: Joi.string()
    .valid(...getRepaymentFrequencies())
    .default(RepaymentFrequency.MONTHLY)
    .messages({
      "any.only": "Repayment frequency must be one of the supported values",
    }),
  loanType: Joi.string()
    .valid(...getLoanTypes())
    .required()
    .messages({
      "any.only": "Loan type must be one of the supported values",
      "any.required": "Loan type is required",
    }),
  issuedDate: Joi.date().default(Date.now).messages({
    "date.base": "Issued date must be a valid date",
  }),
  dueDate: Joi.date().min(Joi.ref("issuedDate")).required().messages({
    "date.base": "Due date must be a valid date",
    "date.min": "Due date must be after issued date",
    "any.required": "Due date is required",
  }),
  collateral: Joi.string().max(1000).allow(null, "").messages({
    "string.max": "Collateral description cannot exceed 1000 characters",
  }),
  notes: Joi.string().max(1000).allow(null, "").messages({
    "string.max": "Notes cannot exceed 1000 characters",
  }),
});

// Update loan validation schema
export const updateLoanSchema = Joi.object({
  amount: Joi.number().positive().precision(2).messages({
    "number.base": "Amount must be a number",
    "number.positive": "Amount must be positive",
    "number.precision": "Amount can have up to 2 decimal places",
  }),
  interestRate: Joi.number().min(0).max(100).precision(2).messages({
    "number.base": "Interest rate must be a number",
    "number.min": "Interest rate cannot be negative",
    "number.max": "Interest rate cannot exceed 100%",
    "number.precision": "Interest rate can have up to 2 decimal places",
  }),
  durationMonths: Joi.number().integer().min(1).messages({
    "number.base": "Duration must be a number",
    "number.integer": "Duration must be an integer",
    "number.min": "Duration must be at least 1 month",
  }),
  repaymentFrequency: Joi.string()
    .valid(...getRepaymentFrequencies())
    .messages({
      "any.only": "Repayment frequency must be one of the supported values",
    }),
  loanType: Joi.string()
    .valid(...getLoanTypes())
    .messages({
      "any.only": "Loan type must be one of the supported values",
    }),
  dueDate: Joi.date().messages({
    "date.base": "Due date must be a valid date",
  }),
  collateral: Joi.string().max(1000).allow(null, "").messages({
    "string.max": "Collateral description cannot exceed 1000 characters",
  }),
  notes: Joi.string().max(1000).allow(null, "").messages({
    "string.max": "Notes cannot exceed 1000 characters",
  }),
}).min(1);

// Update loan status validation schema
export const updateLoanStatusSchema = Joi.object({
  status: Joi.string()
    .valid(...getLoanStatuses())
    .required()
    .messages({
      "any.only": "Status must be one of the supported values",
      "any.required": "Status is required",
    }),
  approvedBy: Joi.string()
    .uuid()
    .when("status", {
      is: LoanStatus.APPROVED,
      then: Joi.required(),
      otherwise: Joi.optional(),
    })
    .messages({
      "string.uuid": "Approved by must be a valid UUID",
      "any.required": "Approved by is required when status is APPROVED",
    }),
  approvedDate: Joi.date()
    .when("status", {
      is: LoanStatus.APPROVED,
      then: Joi.date().default(Date.now),
      otherwise: Joi.optional(),
    })
    .messages({
      "date.base": "Approved date must be a valid date",
    }),
  disbursedDate: Joi.date()
    .when("status", {
      is: LoanStatus.ACTIVE,
      then: Joi.date().default(Date.now),
      otherwise: Joi.optional(),
    })
    .messages({
      "date.base": "Disbursed date must be a valid date",
    }),
  rejectionReason: Joi.string()
    .max(1000)
    .when("status", {
      is: LoanStatus.REJECTED,
      then: Joi.required(),
      otherwise: Joi.optional(),
    })
    .messages({
      "string.max": "Rejection reason cannot exceed 1000 characters",
      "any.required": "Rejection reason is required when status is REJECTED",
    }),
});

// Loan payment validation schema
export const loanPaymentSchema = Joi.object({
  amount: Joi.number().positive().precision(2).required().messages({
    "number.base": "Amount must be a number",
    "number.positive": "Amount must be positive",
    "number.precision": "Amount can have up to 2 decimal places",
    "any.required": "Amount is required",
  }),
  paymentDate: Joi.date().default(Date.now).messages({
    "date.base": "Payment date must be a valid date",
  }),
  notes: Joi.string().max(1000).allow(null, "").messages({
    "string.max": "Notes cannot exceed 1000 characters",
  }),
});

// Query parameters validation schema
export const loanQuerySchema = Joi.object({
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
      "issuedDate",
      "dueDate",
      "createdAt",
      "amount",
      "status",
      "interestRate"
    )
    .default("issuedDate")
    .messages({
      "any.only": "Sort by field must be one of the supported values",
    }),
  sortOrder: Joi.string().valid("ASC", "DESC").default("DESC").messages({
    "any.only": "Sort order must be either ASC or DESC",
  }),
  farmerId: Joi.string().uuid().messages({
    "string.uuid": "Farmer ID must be a valid UUID",
  }),
  status: Joi.alternatives()
    .try(
      Joi.string().valid(...getLoanStatuses()),
      Joi.array().items(Joi.string().valid(...getLoanStatuses()))
    )
    .messages({
      "any.only": "Status must be one of the supported values",
    }),
  loanType: Joi.alternatives()
    .try(
      Joi.string().valid(...getLoanTypes()),
      Joi.array().items(Joi.string().valid(...getLoanTypes()))
    )
    .messages({
      "any.only": "Loan type must be one of the supported values",
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
  overdue: Joi.boolean().messages({
    "boolean.base": "Overdue must be a boolean",
  }),
  approvedBy: Joi.string().uuid().messages({
    "string.uuid": "Approved by must be a valid UUID",
  }),
});

// ID parameter validation
export const idParamSchema = Joi.object({
  id: Joi.string().uuid().required().messages({
    "string.uuid": "ID must be a valid UUID",
    "any.required": "ID is required",
  }),
});
