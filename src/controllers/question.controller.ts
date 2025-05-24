import { QuestionModel } from '../Models/question.model';
import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.utils';
import { ApiError } from '../utils/apiError';
import { ApiResponse } from '../utils/apiResponse.utils';
import { error } from 'console';

export const createQuestion = asyncHandler(
  async (req: Request, res: Response) => {
    // Authentication
    if (!req.user || req.user.role !== 'admin') {
      throw new ApiError(
        req.user ? 403 : 401,
        req.user ? 'Forbidden: Admin access required' : 'Unauthorized access'
      );
    }

    // Destructure body fields
    const {
      questionName,
      options,
      correctOption,
      explanation,
      marks,
      negativeMarks,
      level,
      category,
    } = req.body;

    // Required fields validation
    const requiredFields = [
      'questionName',
      'options',
      'correctOption',
      'explanation',
      'marks',
      'negativeMarks',
      'level',
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

    // Validate options array
    if (
      !Array.isArray(options) ||
      options.length !== 4 ||
      !options.every(opt => typeof opt === 'string')
    ) {
      throw new ApiError(400, 'Options must be an array of exactly 4 strings');
    }

    // Validate correctOption
    if (
      typeof correctOption !== 'number' ||
      correctOption < 0 ||
      correctOption > 3
    ) {
      throw new ApiError(400, 'correctOption must be a number between 0 and 3');
    }

    // Validate level
    const validLevels = ['Easy', 'Moderate', 'Difficult'];
    if (level && !validLevels.includes(level)) {
      throw new ApiError(400, 'level must be Easy, Moderate, or Difficult');
    }

    const validCategory  = ['Free', 'Quizzes', 'Mock'];
    if (category && !validCategory.includes(category) ){
        throw new ApiError(400, 'category must be Free, Quizzes or Mock');
    }

    //Create a new Question
    const newQuestion = await QuestionModel.create({
      questionName,
      options,
      correctOption,
      explanation,
      marks,
      negativeMarks,
      level: level || 'Easy',
      category: category || 'Free'
    });

    if (!newQuestion) {
      throw new ApiError(500, 'Question Not Created Due to Server issue');
    }

    res
      .status(201)
      .json(
        new ApiResponse(201, { newQuestion }, 'Question created successfully')
      );
  }
);

export const getRandomQuestion = asyncHandler(
  async (req: Request, res: Response) => {
    const numberOfQuestion =
      parseInt(req.query.numberOfQuestion as string, 10) || 20;

    if (numberOfQuestion <= 0) {
      throw new ApiError(400, 'Invalid number of questions');
    }

    // Calculate counts for each level
    const numDifficult = Math.max(1, Math.floor(numberOfQuestion * 0.2));
    const numModerate = Math.max(1, Math.floor(numberOfQuestion * 0.3));
    let numEasy = numberOfQuestion - numDifficult - numModerate;


    // Adjust in case rounding causes sum to differ
    if (numEasy < 0) numEasy = 0;

    // Aggregate for each level
    const [difficultQuestions, moderateQuestions, easyQuestions] =
      await Promise.all([
        QuestionModel.aggregate([
          { $match: { level: 'Difficult' } },
          { $sample: { size: numDifficult } },
        ]),
        QuestionModel.aggregate([
          { $match: { level: 'Moderate' } },
          { $sample: { size: numModerate } },
        ]),
        QuestionModel.aggregate([
          { $match: { level: 'Easy' } },
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
      throw new ApiError(404, 'No questions found');
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { questions },
          'Random questions fetched successfully'
        )
      );
  }
);

export const getAllQuestion = asyncHandler(
  async (req: Request, res: Response) => {
    const searchQuery = req.query.searchQuery as string | undefined;
    const page = parseInt(req.query.page as string) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;

    let filter: any = {};
    if (searchQuery) {
      filter = {
        $or: [{ questionName: { $regex: searchQuery, $options: 'i' } }],
      };
    }

    const total = await QuestionModel.countDocuments(filter);

    const questions = await QuestionModel.find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }); // Optional: newest first

    res.status(200).json(
      new ApiResponse(
        200,
        {
          questions,
          total,
          page,
          pageCount: Math.ceil(total / limit),
        },
        'All questions fetched successfully'
      )
    );
  }
);

export const deletedQuestionById = asyncHandler(
  async (req: Request, res: Response) => {

    // Authentication
    if (!req.user || req.user.role !== 'admin') {
      throw new ApiError(
        req.user ? 403 : 401,
        req.user ? 'Forbidden: Admin access required' : 'Unauthorized access'
      );
    }

    const questionId = req.params.Id;


    const question = await QuestionModel.findByIdAndDelete(questionId);
    if (!question) {
      throw new ApiError(404, 'Question not found');
    }

    res
      .status(200)
      .json(new ApiResponse(200, {}, 'Question deleted successfully'));
  }
);

export const updateQuestionById = asyncHandler(
  async (req: Request, res: Response) => {
    // Authentication
    if (!req.user || req.user.role !== 'admin') {
      throw new ApiError(
        req.user ? 403 : 401,
        req.user ? 'Forbidden: Admin access required' : 'Unauthorized access'
      );
    }

    const questionId = req.params.Id;

    const question = await QuestionModel.findByIdAndUpdate(questionId, req.body, { new: true });

    if (!question) {
      throw new ApiError(404, 'Question not found');
    }

    res
      .status(200)
      .json(new ApiResponse(200, { question }, 'Question updated successfully'));
  }
);
