import express from 'express';
import { param } from 'express-validator';
import RestaurantController from '../controllers/restaurant.controller';

const router = express.Router();

router.get(
    '/search/:city', 
    param('city')
    .isString()
    .trim()
    .notEmpty()
    .withMessage("City parameter must be a valid string"), 
    RestaurantController.searchRestaurant);

router.get(
    `/:restaurantId`,
    param('restaurantId')
    .isString()
    .trim()
    .notEmpty()
    .withMessage("Restaurant ID must be a valid string"),
    RestaurantController.getRestaurantDetails
)

export default router;