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
exports.updateQuestionById = exports.deletedQuestionById = exports.getAllQuestion = exports.getRandomQuestion = exports.createQuestion = void 0;
const question_model_1 = require("../Models/question.model");
const asyncHandler_utils_1 = require("../utils/asyncHandler.utils");
const apiError_1 = require("../utils/apiError");
const apiResponse_utils_1 = require("../utils/apiResponse.utils");
exports.createQuestion = (0, asyncHandler_utils_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Authentication
    if (!req.user || req.user.role !== 'admin') {
        throw new apiError_1.ApiError(req.user ? 403 : 401, req.user ? 'Forbidden: Admin access required' : 'Unauthorized access');
    }
    // Destructure body fields
    const { questionName, options, correctOption, explanation, marks, negativeMarks, level, category, } = req.body;
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
        if (value === undefined ||
            value === null ||
            (typeof value === 'string' && value.trim() === '')) {
            throw new apiError_1.ApiError(400, `${field.charAt(0).toUpperCase() + field.slice(1)} is required`);
        }
    }
    // Validate options array
    if (!Array.isArray(options) ||
        options.length !== 4 ||
        !options.every(opt => typeof opt === 'string')) {
        throw new apiError_1.ApiError(400, 'Options must be an array of exactly 4 strings');
    }
    // Validate correctOption
    if (typeof correctOption !== 'number' ||
        correctOption < 0 ||
        correctOption > 3) {
        throw new apiError_1.ApiError(400, 'correctOption must be a number between 0 and 3');
    }
    // Validate level
    const validLevels = ['Easy', 'Moderate', 'Difficult'];
    if (level && !validLevels.includes(level)) {
        throw new apiError_1.ApiError(400, 'level must be Easy, Moderate, or Difficult');
    }
    const validCategory = ['Free', 'Quizzes', 'Mock'];
    if (category && !validCategory.includes(category)) {
        throw new apiError_1.ApiError(400, 'category must be Free, Quizzes or Mock');
    }
    //Create a new Question
    const newQuestion = yield question_model_1.QuestionModel.create({
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
        throw new apiError_1.ApiError(500, 'Question Not Created Due to Server issue');
    }
    res
        .status(201)
        .json(new apiResponse_utils_1.ApiResponse(201, { newQuestion }, 'Question created successfully'));
}));
exports.getRandomQuestion = (0, asyncHandler_utils_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const numberOfQuestion = parseInt(req.query.numberOfQuestion, 10) || 20;
    if (numberOfQuestion <= 0) {
        throw new apiError_1.ApiError(400, 'Invalid number of questions');
    }
    // Calculate counts for each level
    const numDifficult = Math.max(1, Math.floor(numberOfQuestion * 0.2));
    const numModerate = Math.max(1, Math.floor(numberOfQuestion * 0.3));
    let numEasy = numberOfQuestion - numDifficult - numModerate;
    // Adjust in case rounding causes sum to differ
    if (numEasy < 0)
        numEasy = 0;
    // Aggregate for each level
    const [difficultQuestions, moderateQuestions, easyQuestions] = yield Promise.all([
        question_model_1.QuestionModel.aggregate([
            { $match: { level: 'Difficult' } },
            { $sample: { size: numDifficult } },
        ]),
        question_model_1.QuestionModel.aggregate([
            { $match: { level: 'Moderate' } },
            { $sample: { size: numModerate } },
        ]),
        question_model_1.QuestionModel.aggregate([
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
        throw new apiError_1.ApiError(404, 'No questions found');
    }
    res
        .status(200)
        .json(new apiResponse_utils_1.ApiResponse(200, { questions }, 'Random questions fetched successfully'));
}));
exports.getAllQuestion = (0, asyncHandler_utils_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const searchQuery = req.query.searchQuery;
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;
    let filter = {};
    if (searchQuery) {
        filter = {
            $or: [{ questionName: { $regex: searchQuery, $options: 'i' } }],
        };
    }
    const total = yield question_model_1.QuestionModel.countDocuments(filter);
    const questions = yield question_model_1.QuestionModel.find(filter)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }); // Optional: newest first
    res.status(200).json(new apiResponse_utils_1.ApiResponse(200, {
        questions,
        total,
        page,
        pageCount: Math.ceil(total / limit),
    }, 'All questions fetched successfully'));
}));
exports.deletedQuestionById = (0, asyncHandler_utils_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Authentication
    if (!req.user || req.user.role !== 'admin') {
        throw new apiError_1.ApiError(req.user ? 403 : 401, req.user ? 'Forbidden: Admin access required' : 'Unauthorized access');
    }
    const questionId = req.params.Id;
    const question = yield question_model_1.QuestionModel.findByIdAndDelete(questionId);
    if (!question) {
        throw new apiError_1.ApiError(404, 'Question not found');
    }
    res
        .status(200)
        .json(new apiResponse_utils_1.ApiResponse(200, {}, 'Question deleted successfully'));
}));
exports.updateQuestionById = (0, asyncHandler_utils_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Authentication
    if (!req.user || req.user.role !== 'admin') {
        throw new apiError_1.ApiError(req.user ? 403 : 401, req.user ? 'Forbidden: Admin access required' : 'Unauthorized access');
    }
    const questionId = req.params.Id;
    const question = yield question_model_1.QuestionModel.findByIdAndUpdate(questionId, req.body, { new: true });
    if (!question) {
        throw new apiError_1.ApiError(404, 'Question not found');
    }
    res
        .status(200)
        .json(new apiResponse_utils_1.ApiResponse(200, { question }, 'Question updated successfully'));
}));
