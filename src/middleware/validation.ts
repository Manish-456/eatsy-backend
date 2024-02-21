import { NextFunction, Request, Response } from "express";
import { body, validationResult } from "express-validator";

const handleValidationErrors = async(req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);

    if(!errors.isEmpty()){
        return res.status(400).json({ errors: errors.array()})
    }

    next();
}

export const validateUserRequest = [
    body('name').isString().notEmpty().withMessage(`Name must be a string`),
    body('addressLine1').isString().notEmpty().withMessage(`Address must be a string`),
    body('city').isString().notEmpty().withMessage(`City must be string`),
    body('country').isString().notEmpty().withMessage(`Country must be provided as a string`),
    handleValidationErrors,
];
