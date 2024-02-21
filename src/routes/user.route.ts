import express from 'express';
import UserController from '../controllers/user.controller';
import { jwtCheck, jwtParse } from '../middleware/auth';
import { validateUserRequest } from '../middleware/validation';

const router = express.Router();

router.get('/', jwtCheck, jwtParse, UserController.getCurrentUser);
router.post('/', jwtCheck, UserController.createUser);
router.put('/', jwtCheck, jwtParse, validateUserRequest, UserController.updateUser);

export default router;