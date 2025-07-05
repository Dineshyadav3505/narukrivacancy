import { asyncHandler } from '../utils/asyncHandler.utils';
import { ApiResponse } from '../utils/apiResponse.utils';
import { Request, Response } from 'express';
import { Quizzes } from '../Models/quizzes.model';
import { ApiError } from '../utils/apiError';
import { QuestionModel } from '../Models/question.model';

export const createQuiz = asyncHandler(async (req: Request, res: Response) => {
  // Authentication
  if (!req.user || req.user.role !== 'admin') {
    throw new ApiError(
      req.user ? 403 : 401,
      req.user ? 'Forbidden: Admin access required' : 'Unauthorized access'
    );
  }

  // Destructure fields from the request body
  const {
    title,
    description,
    totalQuestions,
    winningAmount,
    price,
    durationMinutes,
    category,
    startDateTime,
    expireDateTime,
  } = req.body;

  // Required fields and type checking
  const requiredFields = [
    'title',
    'description',
    'totalQuestions',
    'winningAmount',
    'price',
    'durationMinutes',
    'category',
  ];

  for (const field of requiredFields) {
    const value = req.body[field];
    if (
      value === undefined ||
      value === null ||
      (typeof value === 'string' && value.trim() === '')
    ) {
      throw new ApiError(
        400,
        `${field.charAt(0).toUpperCase() + field.slice(1)} is required`
      );
    }
  }

  const validCategory = ['Free', 'Quizzes', 'Mock'];
  if (category && !validCategory.includes(category)) {
    throw new ApiError(400, 'category must be Free, Quizzes or Mock');
  }

  // Prepare the quiz data
  const quizData: any = {
    title,
    description,
    totalQuestions,
    winningAmount,
    price,
    durationMinutes,
    category: category || 'Free',
  };

  // Optionally add startDateTime and expireDateTime if provided
  if (startDateTime) quizData.startDateTime = startDateTime;
  if (expireDateTime) quizData.expireDateTime = expireDateTime;

  // Create and save the quiz
  try {
    const quiz = new Quizzes(quizData);
    await quiz.save();
    res
      .status(201)
      .json(new ApiResponse(201, { quiz }, 'Quiz created successfully'));
  } catch (error) {
    throw new ApiError(500, 'Failed to create quiz');
  }
});

export const getQuizzes = asyncHandler(async (req: Request, res: Response) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const quizzes = await Quizzes.find()
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });
  

  if (!quizzes) {
    throw new ApiError(404, 'Quizzes not found');
  }

  res
    .status(200)
    .json(new ApiResponse(200, { quizzes }, 'Quizzes fetched successfully'));
});

export const getActiveQuizzes = asyncHandler(
  async (req: Request, res: Response) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const quizzes = await Quizzes.find({
      expireDateTime: { $gte: new Date() },
    })
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    if (!quizzes) {
      throw new ApiError(404, 'Quizzes not found');
    }
    res
      .status(200)
      .json(new ApiResponse(200, { quizzes }, 'Quizzes fetched successfully'));
  }
);

export const getQuizById = asyncHandler(async (req: Request, res: Response) => {

  const quizId = req.params.Id;
  const quiz = await Quizzes.findById(quizId);
  if (!quiz) {
    throw new ApiError(404, 'Quiz not found');
  }

  const totalQuestions = quiz.totalQuestions || 20;
  const categoryQuestion = quiz.category; // Make sure your Quiz schema has a 'category' field

  // Calculate counts for each level
  const numDifficult = Math.max(1, Math.floor(totalQuestions * 0.2));
  const numModerate = Math.max(1, Math.floor(totalQuestions * 0.3));
  let numEasy = totalQuestions - numDifficult - numModerate;
  if (numEasy < 0) numEasy = 0;

  // Aggregate for each level, filter by category
  const [difficultQuestions, moderateQuestions, easyQuestions] =
    await Promise.all([
      QuestionModel.aggregate([
        { $match: { level: 'Difficult', category: categoryQuestion } },
        { $sample: { size: numDifficult } },
      ]),
      QuestionModel.aggregate([
        { $match: { level: 'Moderate', category: categoryQuestion } },
        { $sample: { size: numModerate } },
      ]),
      QuestionModel.aggregate([
        { $match: { level: 'Easy', category: categoryQuestion } },
        { $sample: { size: numEasy } },
      ]),
    ]);

  // Combine and shuffle
  const questions = [
    ...difficultQuestions,
    ...moderateQuestions,
    ...easyQuestions,
  ].sort(() => Math.random() - 0.5);

  if (questions.length === 0) {
    throw new ApiError(404, 'No questions found for this category');
  }



  res
    .status(200)
    .json(
      new ApiResponse(200, { quiz, user: req.user, questions }, 'Quiz fetched successfully')
    );
});

export const updateQuizById = asyncHandler(
  async (req: Request, res: Response) => {
    // Authentication
    if (!req.user || req.user.role !== 'admin') {
      throw new ApiError(
        req.user ? 403 : 401,
        req.user ? 'Forbidden: Admin access required' : 'Unauthorized access'
      );
    }

    // Destructure fields from the request body
    const {
      title,
      description,
      totalQuestions,
      winningAmount,
      price,
      durationMinutes,
      category,
      startDateTime,
      expireDateTime,
    } = req.body;

    // Find quiz
    const quizId = req.params.Id;
    const quiz = await Quizzes.findById(quizId);
    if (!quiz) {
      throw new ApiError(404, 'Quiz not found');
    }

    const validCategory = ['Free', 'Quizzes', 'Mock'];
    if (category && !validCategory.includes(category)) {
      throw new ApiError(400, 'category must be Free, Quizzes or Mock');
    }

    // Prepare the quiz data
    const quizData: any = {
      title,
      description,
      totalQuestions,
      winningAmount,
      price,
      durationMinutes,
      category: category || 'Free',
    };

    // Optionally add startDateTime and expireDateTime if provided
    if (startDateTime) quizData.startDateTime = startDateTime;
    if (expireDateTime) quizData.expireDateTime = expireDateTime;

    // Update quiz
    const updatedQuiz = await Quizzes.findByIdAndUpdate(quizId, quizData, {
      new: true,
      runValidators: true,
    });

    res
      .status(200)
      .json(new ApiResponse(200, { updatedQuiz }, 'Quiz updated successfully'));
  }
);

export const deleteQuizById = asyncHandler(
  async (req: Request, res: Response) => {
    // Authentication
    if (!req.user || req.user.role !== 'admin') {
      throw new ApiError(
        req.user ? 403 : 401,
        req.user ? 'Forbidden: Admin access required' : 'Unauthorized access'
      );
    }
    const quizId = req.params.Id;
    const quiz = await Quizzes.findByIdAndDelete(quizId);

    if (!quiz) {
      throw new ApiError(404, 'Quiz not found');
    }

    res
      .status(200)
      .json(new ApiResponse(200, { quiz }, 'Quiz deleted successfully'));
  }
);

export const submitQuiz = asyncHandler(async (req: Request, res: Response) => {
  const quizId = req.params.id || req.params.Id; // Support both 'id' and 'Id'
  const { answers } = req.body; // answers: [{ questionId: string, selectedOption: string }]


  if (!Array.isArray(answers) || answers.length === 0) {
    throw new ApiError(400, 'Answers are required');
  }

  // Fetch the quiz to ensure it exists
  const quiz = await Quizzes.findById(quizId);
  if (!quiz) {
    throw new ApiError(404, 'Quiz not found');
  }

  // Fetch all relevant questions
  const questionIds = answers.map(a => a.questionId);
  const questions = await QuestionModel.find({ _id: { $in: questionIds } });

  if (questions.length !== answers.length) {
    throw new ApiError(400, 'Some questions are invalid');
  }

  // Calculate score
  let score = 0;
  const detailedResults = questions.map(q => {
    const userAnswer = answers.find(a => a.questionId === (q._id as string).toString());
    const isCorrect = userAnswer && userAnswer.selectedOption === q.options[q.correctOption];
    if (isCorrect) score += 1;
    return {
      questionId: q._id,
      isCorrect,
      correctAnswer: q.options[q.correctOption],
      userAnswer: userAnswer ? userAnswer.selectedOption : null,
    };
  });

  // Optionally, save the result to a database here

  res.status(200).json(
    new ApiResponse(200, {
      quizId,
      score,
      totalQuestions: questions.length,
      details: detailedResults,
    }, 'Quiz submitted successfully')
  );
});
