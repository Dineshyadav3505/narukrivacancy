import { Router } from 'express';

import { verifyJWT } from '../Middleware/auth.middleware';
import {
  createQuestion,
  getRandomQuestion,
  getAllQuestion,
  deletedQuestionById,
  updateQuestionById,
} from '../controllers/question.controller';

export const questionRouter = Router();

questionRouter.route('/create').post(verifyJWT, createQuestion);
questionRouter.route('/random').get(getRandomQuestion);
questionRouter.route('/allQuestion').get(getAllQuestion);
questionRouter.route('/:Id').delete(verifyJWT, deletedQuestionById);
questionRouter.route('/:Id').put(verifyJWT, updateQuestionById);
