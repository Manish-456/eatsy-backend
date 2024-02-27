import express from 'express';
import multer from 'multer';

import RestaurantController from "../controllers/myRestaurant.controller";
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

router.get('/', jwtCheck, jwtParse, RestaurantController.getMyRestaurant);
router.get('/order', jwtCheck, jwtParse, RestaurantController.getMyRestaurantOrder);
router.post('/', 
jwtCheck, 
jwtParse, 
upload.single("imageFile"),
validateRestaurantRequest,
RestaurantController.createRestaurant
)
router.patch('/order/:orderId/status', jwtCheck, jwtParse, RestaurantController.updateOrderStatus);
router.put(`/`, jwtCheck, jwtParse, upload.single("imageFile"), validateRestaurantRequest, RestaurantController.updateMyRestaurant);
router.delete('/remove-image', jwtCheck, jwtParse, RestaurantController.removeRestaurantImage)

export default router;