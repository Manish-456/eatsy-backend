import express from 'express';
import UserController from '../controllers/user.controller';
import { jwtCheck } from '../middleware/auth';

const router = express.Router();

router.post('/', jwtCheck, UserController.createUser);

export default router;