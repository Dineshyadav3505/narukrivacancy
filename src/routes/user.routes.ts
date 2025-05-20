import { Router } from 'express';
import {
  createUser,
  getProfile,
  login,
  logout,
  sendVerificationCode,
} from '../controllers/auth.controller';
import { verifyJWT } from '../Middleware/auth.middleware';

const userRouter = Router();

userRouter.route('/register').post(createUser);
userRouter.route('/code').post(sendVerificationCode);
userRouter.route('/login').post(login);
userRouter.route('/logout').get(logout);
userRouter.route('/profile').get(verifyJWT, getProfile);

export { userRouter };
