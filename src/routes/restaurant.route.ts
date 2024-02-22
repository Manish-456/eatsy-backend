import express from 'express';
import multer from 'multer';

import RestaurantController from "../controllers/restaurant.controller";
import { jwtCheck, jwtParse } from '../middleware/auth';
import { validateRestaurantRequest } from '../middleware/validation';

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: {
        fieldSize: 5 * 1024 * 1024 // 5MB
    }
});

router.post('/', 
jwtCheck, 
jwtParse, 
upload.single("imageFile"),
validateRestaurantRequest,
RestaurantController.createRestaurant
)

export default router;