import { Router } from 'express';

import { verifyJWT } from '../Middleware/auth.middleware';
import { createQuestion, getRandomQuestion, getAllQuestion, deletedQuestionById, updateQuestionById } from '../controllers/question.controller';


export const questionRouter = Router();

questionRouter.post('/create', verifyJWT, createQuestion)
questionRouter.get('/random', getRandomQuestion)
questionRouter.get('/allQuestion', getAllQuestion)
questionRouter.delete('/:Id', verifyJWT, deletedQuestionById)
questionRouter.put('/:Id',verifyJWT, updateQuestionById)




