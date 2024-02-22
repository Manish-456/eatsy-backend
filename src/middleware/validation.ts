import { NextFunction, Request, Response } from "express";
import { body, validationResult } from "express-validator";

const handleValidationErrors = async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
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

export const validateRestaurantRequest = [
    body("name").isString().notEmpty().withMessage(`Name must be a string`),
    body("city").isString().notEmpty().withMessage(`City must be a string`),
    body("country").isString().notEmpty().withMessage(`Country must be a string`),
    body("deliveryPrice").isFloat({ min: 0 }).withMessage(`DeliveryPrice must be a positive number`),
    body("estimatedDeliveryTime").isInt({ min: 0 }).withMessage(`EstimatedDeliveryTime must be a positive number`),
    body("cuisines").isArray().withMessage("Cuisines must be an array").not().isEmpty().withMessage("Cuisines Array cannot be empty"),
    body("menuItems").isArray().withMessage("Menu items should be an array"),
    body("menuItems.*.name").notEmpty().withMessage("Menu item name is required"),
    body("menuItems.*.price").isFloat({ min: 0 }).withMessage("Menu item price is required and must be a positive number"),
    handleValidationErrors
]
