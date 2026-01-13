import { validationResult } from "express-validator";
import  APIError  from "../utils/api-error.js";

export const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }
  const extractedErrors = [];
  errors.array().map((err) => extractedErrors.push(
        { 
            [err.path]: err.msg

        }));
     throw new APIError(422, "Invalid request parameters",extractedErrors);
};
