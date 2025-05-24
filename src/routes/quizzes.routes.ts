import { Router } from "express";
import { createQuiz, deleteQuizById, getActiveQuizzes, getQuizById, getQuizzes, updateQuizById, submitQuiz } from "../controllers/quizzes.controller";
import { verifyJWT } from "../Middleware/auth.middleware";



const quizzesRouter = Router();

quizzesRouter.route('/create').post(verifyJWT, createQuiz);
quizzesRouter.route('/getAll').get(getQuizzes);
quizzesRouter.route('/active').get(getActiveQuizzes);
quizzesRouter.route('/:Id').get(getQuizById);
quizzesRouter.route('/:Id').put(verifyJWT, updateQuizById);
quizzesRouter.route('/:Id').delete(verifyJWT, deleteQuizById);
quizzesRouter.route('/submit/:Id').post(submitQuiz);

export { quizzesRouter };
