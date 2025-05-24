"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.submitQuiz = exports.deleteQuizById = exports.updateQuizById = exports.getQuizById = exports.getActiveQuizzes = exports.getQuizzes = exports.createQuiz = void 0;
const asyncHandler_utils_1 = require("../utils/asyncHandler.utils");
const apiResponse_utils_1 = require("../utils/apiResponse.utils");
const quizzes_model_1 = require("../Models/quizzes.model");
const apiError_1 = require("../utils/apiError");
const question_model_1 = require("../Models/question.model");
exports.createQuiz = (0, asyncHandler_utils_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Authentication
    if (!req.user || req.user.role !== 'admin') {
        throw new apiError_1.ApiError(req.user ? 403 : 401, req.user ? 'Forbidden: Admin access required' : 'Unauthorized access');
    }
    // Destructure fields from the request body
    const { title, description, totalQuestions, winningAmount, price, durationMinutes, category, startDateTime, expireDateTime, } = req.body;
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
        if (value === undefined ||
            value === null ||
            (typeof value === 'string' && value.trim() === '')) {
            throw new apiError_1.ApiError(400, `${field.charAt(0).toUpperCase() + field.slice(1)} is required`);
        }
    }
    const validCategory = ['Free', 'Quizzes', 'Mock'];
    if (category && !validCategory.includes(category)) {
        throw new apiError_1.ApiError(400, 'category must be Free, Quizzes or Mock');
    }
    // Prepare the quiz data
    const quizData = {
        title,
        description,
        totalQuestions,
        winningAmount,
        price,
        durationMinutes,
        category: category || 'Free',
    };
    // Optionally add startDateTime and expireDateTime if provided
    if (startDateTime)
        quizData.startDateTime = startDateTime;
    if (expireDateTime)
        quizData.expireDateTime = expireDateTime;
    // Create and save the quiz
    try {
        const quiz = new quizzes_model_1.Quizzes(quizData);
        yield quiz.save();
        res
            .status(201)
            .json(new apiResponse_utils_1.ApiResponse(201, { quiz }, 'Quiz created successfully'));
    }
    catch (error) {
        throw new apiError_1.ApiError(500, 'Failed to create quiz');
    }
}));
exports.getQuizzes = (0, asyncHandler_utils_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const quizzes = yield quizzes_model_1.Quizzes.find()
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 });
    if (!quizzes) {
        throw new apiError_1.ApiError(404, 'Quizzes not found');
    }
    res
        .status(200)
        .json(new apiResponse_utils_1.ApiResponse(200, { quizzes }, 'Quizzes fetched successfully'));
}));
exports.getActiveQuizzes = (0, asyncHandler_utils_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const quizzes = yield quizzes_model_1.Quizzes.find({
        expireDateTime: { $gte: new Date() },
    })
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 });
    if (!quizzes) {
        throw new apiError_1.ApiError(404, 'Quizzes not found');
    }
    res
        .status(200)
        .json(new apiResponse_utils_1.ApiResponse(200, { quizzes }, 'Quizzes fetched successfully'));
}));
exports.getQuizById = (0, asyncHandler_utils_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const quizId = req.params.Id;
    const quiz = yield quizzes_model_1.Quizzes.findById(quizId);
    if (!quiz) {
        throw new apiError_1.ApiError(404, 'Quiz not found');
    }
    const totalQuestions = quiz.totalQuestions || 20;
    const categoryQuestion = quiz.category; // Make sure your Quiz schema has a 'category' field
    // Calculate counts for each level
    const numDifficult = Math.max(1, Math.floor(totalQuestions * 0.2));
    const numModerate = Math.max(1, Math.floor(totalQuestions * 0.3));
    let numEasy = totalQuestions - numDifficult - numModerate;
    if (numEasy < 0)
        numEasy = 0;
    // Aggregate for each level, filter by category
    const [difficultQuestions, moderateQuestions, easyQuestions] = yield Promise.all([
        question_model_1.QuestionModel.aggregate([
            { $match: { level: 'Difficult', category: categoryQuestion } },
            { $sample: { size: numDifficult } },
        ]),
        question_model_1.QuestionModel.aggregate([
            { $match: { level: 'Moderate', category: categoryQuestion } },
            { $sample: { size: numModerate } },
        ]),
        question_model_1.QuestionModel.aggregate([
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
        throw new apiError_1.ApiError(404, 'No questions found for this category');
    }
    res
        .status(200)
        .json(new apiResponse_utils_1.ApiResponse(200, { quiz, questions }, 'Quiz fetched successfully'));
}));
exports.updateQuizById = (0, asyncHandler_utils_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Authentication
    if (!req.user || req.user.role !== 'admin') {
        throw new apiError_1.ApiError(req.user ? 403 : 401, req.user ? 'Forbidden: Admin access required' : 'Unauthorized access');
    }
    // Destructure fields from the request body
    const { title, description, totalQuestions, winningAmount, price, durationMinutes, category, startDateTime, expireDateTime, } = req.body;
    // Find quiz
    const quizId = req.params.Id;
    const quiz = yield quizzes_model_1.Quizzes.findById(quizId);
    if (!quiz) {
        throw new apiError_1.ApiError(404, 'Quiz not found');
    }
    const validCategory = ['Free', 'Quizzes', 'Mock'];
    if (category && !validCategory.includes(category)) {
        throw new apiError_1.ApiError(400, 'category must be Free, Quizzes or Mock');
    }
    // Prepare the quiz data
    const quizData = {
        title,
        description,
        totalQuestions,
        winningAmount,
        price,
        durationMinutes,
        category: category || 'Free',
    };
    // Optionally add startDateTime and expireDateTime if provided
    if (startDateTime)
        quizData.startDateTime = startDateTime;
    if (expireDateTime)
        quizData.expireDateTime = expireDateTime;
    // Update quiz
    const updatedQuiz = yield quizzes_model_1.Quizzes.findByIdAndUpdate(quizId, quizData, {
        new: true,
        runValidators: true,
    });
    res
        .status(200)
        .json(new apiResponse_utils_1.ApiResponse(200, { updatedQuiz }, 'Quiz updated successfully'));
}));
exports.deleteQuizById = (0, asyncHandler_utils_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Authentication
    if (!req.user || req.user.role !== 'admin') {
        throw new apiError_1.ApiError(req.user ? 403 : 401, req.user ? 'Forbidden: Admin access required' : 'Unauthorized access');
    }
    const quizId = req.params.Id;
    const quiz = yield quizzes_model_1.Quizzes.findByIdAndDelete(quizId);
    if (!quiz) {
        throw new apiError_1.ApiError(404, 'Quiz not found');
    }
    res
        .status(200)
        .json(new apiResponse_utils_1.ApiResponse(200, { quiz }, 'Quiz deleted successfully'));
}));
exports.submitQuiz = (0, asyncHandler_utils_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const quizId = req.params.id || req.params.Id; // Support both 'id' and 'Id'
    const { answers } = req.body; // answers: [{ questionId: string, selectedOption: string }]
    console.log(quizId);
    if (!Array.isArray(answers) || answers.length === 0) {
        throw new apiError_1.ApiError(400, 'Answers are required');
    }
    // Fetch the quiz to ensure it exists
    const quiz = yield quizzes_model_1.Quizzes.findById(quizId);
    if (!quiz) {
        throw new apiError_1.ApiError(404, 'Quiz not found');
    }
    // Fetch all relevant questions
    const questionIds = answers.map(a => a.questionId);
    const questions = yield question_model_1.QuestionModel.find({ _id: { $in: questionIds } });
    if (questions.length !== answers.length) {
        throw new apiError_1.ApiError(400, 'Some questions are invalid');
    }
    // Calculate score
    let score = 0;
    const detailedResults = questions.map(q => {
        const userAnswer = answers.find(a => a.questionId === q._id.toString());
        const isCorrect = userAnswer && userAnswer.selectedOption === q.options[q.correctOption];
        if (isCorrect)
            score += 1;
        return {
            questionId: q._id,
            isCorrect,
            correctAnswer: q.options[q.correctOption],
            userAnswer: userAnswer ? userAnswer.selectedOption : null,
        };
    });
    // Optionally, save the result to a database here
    res.status(200).json(new apiResponse_utils_1.ApiResponse(200, {
        quizId,
        score,
        totalQuestions: questions.length,
        details: detailedResults,
    }, 'Quiz submitted successfully'));
}));
