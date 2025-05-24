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
exports.deleteOfflineJobById = exports.updateOfflineJobById = exports.getOfflineJobById = exports.getAllOfflineJobs = exports.createOfflineJob = void 0;
const offline_model_1 = require("../Models/offline.model");
const asyncHandler_utils_1 = require("../utils/asyncHandler.utils");
const apiError_1 = require("../utils/apiError");
const apiResponse_utils_1 = require("../utils/apiResponse.utils");
exports.createOfflineJob = (0, asyncHandler_utils_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Authentication
    if (!req.user || req.user.role !== 'admin') {
        throw new apiError_1.ApiError(req.user ? 403 : 401, req.user ? 'Forbidden: Admin access required' : 'Unauthorized access');
    }
    // Destructure body fields
    const { postName, description, qualification, ageLimit, lastDate, details, price, link, } = req.body;
    // Required fields validation
    const requiredFields = [
        'postName',
        'description',
        'qualification',
        'ageLimit',
        'lastDate',
        'details',
        'price',
        'link',
    ];
    for (const field of requiredFields) {
        const value = req.body[field];
        if (value === undefined ||
            value === null ||
            (typeof value === 'string' && value.trim() === '')) {
            throw new apiError_1.ApiError(400, `${field.charAt(0).toUpperCase() + field.slice(1)} is required`);
        }
    }
    // Create a new offline job post
    const newJobPost = yield offline_model_1.OfflinePostModel.create({
        postName,
        description,
        qualification,
        ageLimit,
        lastDate,
        details,
        price,
        link,
    });
    yield newJobPost
        .save()
        .then(() => {
        res
            .status(201)
            .json(new apiResponse_utils_1.ApiResponse(201, { newJobPost }, 'Offline Job post created successfully'));
    })
        .catch(error => {
        res
            .status(500)
            .json(new apiError_1.ApiError(500, 'Failed to create Offline Job post', error));
    });
}));
exports.getAllOfflineJobs = (0, asyncHandler_utils_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const searchQuery = req.query.searchQuery;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    let filter = {};
    if (searchQuery) {
        filter = {
            $or: [
                { postName: { $regex: searchQuery, $options: 'i' } },
                { description: { $regex: searchQuery, $options: 'i' } },
                { state: { $regex: searchQuery, $options: 'i' } },
            ],
        };
    }
    const total = yield offline_model_1.OfflinePostModel.countDocuments(filter);
    const jobPosts = yield offline_model_1.OfflinePostModel.find(filter)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 });
    res.status(200).json(new apiResponse_utils_1.ApiResponse(200, {
        jobPosts,
        total,
        page,
        pageCount: Math.ceil(total / limit),
    }, 'Job posts fetched successfully'));
}));
exports.getOfflineJobById = (0, asyncHandler_utils_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Fetch offline job post by ID
    const { id } = req.params;
    const offlineJob = yield offline_model_1.OfflinePostModel.findById(id);
    if (!offlineJob) {
        throw new apiError_1.ApiError(404, 'Offline job post not found');
    }
    res.status(200).json(new apiResponse_utils_1.ApiResponse(200, { offlineJob }));
}));
exports.updateOfflineJobById = (0, asyncHandler_utils_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Authentication
    if (!req.user || req.user.role !== 'admin') {
        throw new apiError_1.ApiError(req.user ? 403 : 401, req.user ? 'Forbidden: Admin access required' : 'Unauthorized access');
    }
    // Fetch offline job post by ID
    const id = req.params.Id;
    const offlineJob = yield offline_model_1.OfflinePostModel.findById(id);
    if (!offlineJob) {
        throw new apiError_1.ApiError(404, 'Offline job post not found');
    }
    // Update offline job post
    const updatedJobPost = yield offline_model_1.OfflinePostModel.findByIdAndUpdate(id, req.body, { new: true });
    res.status(200).json(new apiResponse_utils_1.ApiResponse(200, { updatedJobPost }, "Offline form updated successfully"));
}));
exports.deleteOfflineJobById = (0, asyncHandler_utils_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Authentication
    if (!req.user || req.user.role !== 'admin') {
        throw new apiError_1.ApiError(req.user ? 403 : 401, req.user ? 'Forbidden: Admin access required' : 'Unauthorized access');
    }
    const jobPostId = req.params.Id;
    const offlineJob = yield offline_model_1.OfflinePostModel.findByIdAndDelete(jobPostId);
    if (!offlineJob) {
        throw new apiError_1.ApiError(404, 'Offline job post not found');
    }
    res
        .status(200)
        .json(new apiResponse_utils_1.ApiResponse(200, {}, 'Offline job post deleted successfully'));
}));
