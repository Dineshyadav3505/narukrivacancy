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
    date,
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
    'date',
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
    date,
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
      expireDateTime: { $gte: new Date() }
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
      new ApiResponse(200, { quiz, questions }, 'Quiz fetched successfully')
    );
});

export const updateQuizById = asyncHandler(
  async (req: Request, res: Response) => {
    const quizId = req.params.id;

    // Authentication check
    if (!req.user) {
      throw new ApiError(401, 'User not authenticated');
    }

    // Authorization check
    if (req.user.role !== 'admin') {
      throw new ApiError(403, 'You are not authorized to edit quizzes.');
    }

    // Find quiz
    const quiz = await Quizzes.findById(quizId);
    if (!quiz) {
      throw new ApiError(404, 'Quiz not found');
    }

    // Prepare update object
    const updateFields: any = {};
    const updatableFields = [
      'quizName',
      'image',
      'description',
      'questions',
      'numberOfQuestions',
      'active',
      'topPrize',
    ];

    for (const field of updatableFields) {
      if (field in req.body) {
        updateFields[field] = req.body[field];
      }
    }

    // Parse/validate fields as needed
    if ('active' in updateFields && typeof updateFields.active === 'string') {
      updateFields.active = updateFields.active.toLowerCase() === 'true';
    }
    if (
      'numberOfQuestions' in updateFields &&
      typeof updateFields.numberOfQuestions === 'string'
    ) {
      updateFields.numberOfQuestions = parseInt(
        updateFields.numberOfQuestions,
        10
      );
    }
    if (
      'topPrize' in updateFields &&
      typeof updateFields.topPrize === 'string'
    ) {
      updateFields.topPrize = parseFloat(updateFields.topPrize);
    }
    if (
      'questions' in updateFields &&
      typeof updateFields.questions === 'string'
    ) {
      try {
        updateFields.questions = JSON.parse(updateFields.questions);
      } catch {
        throw new ApiError(400, 'Questions must be a valid JSON array');
      }
    }

    // Optionally: Validate questions structure here (see previous answers)

    // Update quiz
    const updatedQuiz = await Quizzes.findByIdAndUpdate(quizId, updateFields, {
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
