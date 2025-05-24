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
exports.updatePrivateJobPostById = exports.deletePrivateJobPostById = exports.getAllPrivateJob = exports.getAllPrivateJobById = exports.createPrivateJob = void 0;
const privateJob_model_1 = require("../Models/privateJob.model");
const asyncHandler_utils_1 = require("../utils/asyncHandler.utils");
const apiError_1 = require("../utils/apiError");
const apiResponse_utils_1 = require("../utils/apiResponse.utils");
exports.createPrivateJob = (0, asyncHandler_utils_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Authentication
    if (!req.user || req.user.role !== 'admin') {
        throw new apiError_1.ApiError(req.user ? 403 : 401, req.user ? 'Forbidden: Admin access required' : 'Unauthorized access');
    }
    // Destructure body fields
    const { postName, description, location, jobRole, Requirement, salary, Benefits, } = req.body;
    // Required fields validation
    const requiredFields = [
        'postName',
        'description',
        'location',
        'jobRole',
        'Requirement',
    ];
    for (const field of requiredFields) {
        const value = req.body[field];
        if (value === undefined ||
            value === null ||
            (typeof value === 'string' && value.trim() === '')) {
            throw new apiError_1.ApiError(400, `${field.charAt(0).toUpperCase() + field.slice(1)} is required`);
        }
    }
    // Create a new privateJob post
    const newJobPost = yield privateJob_model_1.PrivateJobModel.create({
        postName,
        description,
        location,
        jobRole,
        Requirement,
        salary,
        Benefits,
    });
    yield newJobPost
        .save()
        .then(() => {
        res
            .status(201)
            .json(new apiResponse_utils_1.ApiResponse(201, { newJobPost }, 'Private Job post created successfully'));
    })
        .catch(error => {
        res.status(500).json(new apiError_1.ApiError(500, error, error));
    });
}));
exports.getAllPrivateJobById = (0, asyncHandler_utils_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const jobPostId = req.params.Id;
    // Authentication
    if (!req.user) {
        throw new apiError_1.ApiError(401, 'User not authenticated');
    }
    // Find the private job post by ID
    const jobPost = yield privateJob_model_1.PrivateJobModel.findById(jobPostId);
    if (!jobPost) {
        throw new apiError_1.ApiError(404, 'Private Job post not found');
    }
    res
        .status(200)
        .json(new apiResponse_utils_1.ApiResponse(200, { jobPost }, 'Private Job post fetched successfully'));
}));
exports.getAllPrivateJob = (0, asyncHandler_utils_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const searchQuery = req.query.searchQuery;
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;
    let filter = {};
    if (searchQuery) {
        filter = {
            $or: [
                { postName: { $regex: searchQuery, $options: 'i' } },
                { description: { $regex: searchQuery, $options: 'i' } },
                { location: { $regex: searchQuery, $options: 'i' } },
            ],
        };
    }
    // Get total count for pagination info
    const total = yield privateJob_model_1.PrivateJobModel.countDocuments(filter);
    // Get paginated jobs
    const privateJob = yield privateJob_model_1.PrivateJobModel.find(filter)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }); // Optional: newest first
    res.status(200).json(new apiResponse_utils_1.ApiResponse(200, {
        privateJob,
        total,
        page,
        pageCount: Math.ceil(total / limit),
    }, 'Private Job posts fetched successfully'));
}));
exports.deletePrivateJobPostById = (0, asyncHandler_utils_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(req.params.Id);
    // Authentication
    if (!req.user || req.user.role !== 'admin') {
        throw new apiError_1.ApiError(req.user ? 403 : 401, req.user ? 'Forbidden: Admin access required' : 'Unauthorized access');
    }
    const jobPostId = req.params.Id;
    console.log(req.params.Id);
    const jobPost = yield privateJob_model_1.PrivateJobModel.findByIdAndDelete(jobPostId);
    if (!jobPost) {
        throw new apiError_1.ApiError(404, 'Private Job post not found');
    }
    res
        .status(200)
        .json(new apiResponse_utils_1.ApiResponse(200, {}, 'Private Job post deleted successfully'));
}));
exports.updatePrivateJobPostById = (0, asyncHandler_utils_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Authentication
    if (!req.user || req.user.role !== 'admin') {
        throw new apiError_1.ApiError(req.user ? 403 : 401, req.user ? 'Forbidden: Admin access required' : 'Unauthorized access');
    }
    const jobPostId = req.params.Id;
    // Find the private job post by ID
    const jobPost = yield privateJob_model_1.PrivateJobModel.findById(jobPostId);
    if (!jobPost) {
        throw new apiError_1.ApiError(404, 'Private Job post not found');
    }
    // Update the job post with the new data
    Object.assign(jobPost, req.body);
    yield jobPost.save();
    res
        .status(200)
        .json(new apiResponse_utils_1.ApiResponse(200, { jobPost }, 'Private Job post updated successfully'));
}));
