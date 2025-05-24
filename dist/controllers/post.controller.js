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
exports.getJobPostByName = exports.updateJobPostById = exports.getJobPostById = exports.getJobWithoutApplyLink = exports.getJobPostByApplyLink = exports.getJobPostByAdmissionLink = exports.getJobPostByAnswerKeyLink = exports.getJobPostByResultLink = exports.getJobPostByAdmitCardLink = exports.getJobPostByState = exports.deleteJobPostById = exports.getAllJobPosts = exports.createJobPost = void 0;
const apiError_1 = require("../utils/apiError");
const asyncHandler_utils_1 = require("../utils/asyncHandler.utils");
const post_model_1 = require("../Models/post.model");
const apiResponse_utils_1 = require("../utils/apiResponse.utils");
// Define Caches
let cachedJobPosts = [];
let cachedJobPostsByState = {};
let cachedJobPostsByAdmitCardLink = [];
let cachedJobPostsByResultLink = [];
let cachedJobPostsByAnswerKeyLink = [];
let cachedJobPostsByAdmissionLink = [];
let cachedJobPostsByApplyLink = [];
let cacheTimestamp = 0;
const CACHE_TTL = 60 * 1000;
// Cache Helper Functions
function clearAllCaches() {
    cachedJobPosts = [];
    cachedJobPostsByState = {};
    cachedJobPostsByAdmitCardLink = [];
    cachedJobPostsByResultLink = [];
    cachedJobPostsByAnswerKeyLink = [];
    cachedJobPostsByAdmissionLink = [];
    cachedJobPostsByApplyLink = [];
    cacheTimestamp = 0;
}
function isCacheValid() {
    return Date.now() - cacheTimestamp < CACHE_TTL;
}
exports.createJobPost = (0, asyncHandler_utils_1.asyncHandler)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    // Authentication
    if (!req.user || req.user.role !== 'admin') {
        throw new apiError_1.ApiError(req.user ? 403 : 401, req.user ? 'Forbidden: Admin access required' : 'Unauthorized access');
    }
    // Destructure body fields
    const { postName, description, notificationLink, importantDates, applicationFee, ageLimit, resultLink, admitCardLink, applyLink, answerKeyLink, admissionLink, state, beginDate, lastDate, totalPost, informationSections, } = req.body;
    // Required fields validation
    const requiredFields = [
        'postName',
        'description',
        'notificationLink',
        'importantDates',
        'applicationFee',
        'ageLimit',
        'beginDate',
    ];
    for (const field of requiredFields) {
        const value = req.body[field];
        if (value === undefined ||
            value === null ||
            (typeof value === 'string' && value.trim() === '')) {
            throw new apiError_1.ApiError(400, `${field.charAt(0).toUpperCase() + field.slice(1)} is required`);
        }
    }
    const parsedBeginDate = typeof beginDate === 'string' ? new Date(beginDate) : beginDate;
    const parsedLastDate = typeof lastDate === 'string' && lastDate ? new Date(lastDate) : lastDate;
    const jobPost = new post_model_1.JobPost({
        postName,
        description,
        notificationLink,
        importantDates,
        applicationFee,
        ageLimit,
        resultLink,
        admitCardLink,
        applyLink,
        answerKeyLink,
        admissionLink,
        informationSections,
        state,
        beginDate: parsedBeginDate,
        lastDate: parsedLastDate,
        totalPost,
    });
    yield jobPost.save();
    clearAllCaches(); // Clear cache
    res
        .status(201)
        .json(new apiResponse_utils_1.ApiResponse(201, { jobPost }, 'Job post created successfully'));
}));
exports.getAllJobPosts = (0, asyncHandler_utils_1.asyncHandler)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const searchQuery = req.query.searchQuery;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 18;
    const skip = (page - 1) * limit;
    // Use cache if available and valid
    if (cachedJobPosts.length > 0 && isCacheValid()) {
        let filteredPosts = cachedJobPosts;
        if (searchQuery) {
            const regex = new RegExp(searchQuery, 'i');
            filteredPosts = filteredPosts.filter(post => regex.test(post.postName) ||
                regex.test(post.description) ||
                regex.test(post.state));
        }
        const paginatedPosts = filteredPosts.slice(skip, skip + limit);
        res.status(200).json(new apiResponse_utils_1.ApiResponse(200, {
            jobPosts: paginatedPosts,
            total: filteredPosts.length,
            page,
            pageCount: Math.ceil(filteredPosts.length / limit),
        }, 'Job posts fetched successfully'));
        return;
    }
    // If no cache, fetch from DB
    let filter = {
        admissionLink: {
            $elemMatch: { link: '' },
        },
    };
    if (searchQuery) {
        filter = {
            $or: [
                { postName: { $regex: searchQuery, $options: 'i' } },
                { description: { $regex: searchQuery, $options: 'i' } },
                { state: { $regex: searchQuery, $options: 'i' } },
            ],
        };
    }
    const total = yield post_model_1.JobPost.countDocuments(filter);
    const jobPosts = yield post_model_1.JobPost.find(filter)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 });
    // Cache the result
    if (!searchQuery && page === 1) {
        cachedJobPosts = yield post_model_1.JobPost.find(filter).sort({ createdAt: -1 });
        cacheTimestamp = Date.now();
    }
    res.status(200).json(new apiResponse_utils_1.ApiResponse(200, {
        jobPosts,
        total,
        page,
        pageCount: Math.ceil(total / limit),
    }, 'Job posts fetched successfully'));
}));
exports.deleteJobPostById = (0, asyncHandler_utils_1.asyncHandler)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    // Authentication
    if (!req.user || req.user.role !== 'admin') {
        throw new apiError_1.ApiError(req.user ? 403 : 401, req.user ? 'Forbidden: Admin access required' : 'Unauthorized access');
    }
    const jobPostId = req.params.Id;
    const jobPost = yield post_model_1.JobPost.findByIdAndDelete(jobPostId);
    if (!jobPost) {
        throw new apiError_1.ApiError(404, 'Job post not found');
    }
    clearAllCaches(); // Clear cache
    res
        .status(200)
        .json(new apiResponse_utils_1.ApiResponse(200, { jobPost }, 'Job post deleted successfully'));
}));
exports.getJobPostByState = (0, asyncHandler_utils_1.asyncHandler)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const stateName = req.query.state;
    const postName = req.query.searchQuery;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 18;
    const skip = (page - 1) * limit;
    // Use cache if available and valid
    if (((_a = cachedJobPostsByState[stateName || 'all']) === null || _a === void 0 ? void 0 : _a.length) > 0 &&
        isCacheValid()) {
        let cachedPosts = cachedJobPostsByState[stateName || 'all'];
        if (postName) {
            const regex = new RegExp(postName, 'i');
            cachedPosts = cachedPosts.filter(post => regex.test(post.postName));
        }
        const paginatedPosts = cachedPosts.slice(skip, skip + limit);
        res.status(200).json(new apiResponse_utils_1.ApiResponse(200, {
            jobPosts: paginatedPosts,
            total: cachedPosts.length,
            page,
            pageCount: Math.ceil(cachedPosts.length / limit),
        }, 'Job posts fetched successfully'));
        return;
    }
    // Build filter object
    const filter = { state: { $exists: true, $ne: '' } };
    if (stateName) {
        filter.state = stateName;
    }
    if (postName) {
        // Case-insensitive, partial match for postName
        filter.postName = { $regex: postName, $options: 'i' };
    }
    const total = yield post_model_1.JobPost.countDocuments(filter);
    const jobPosts = yield post_model_1.JobPost.find(filter)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 });
    if (!jobPosts || jobPosts.length === 0) {
        throw new apiError_1.ApiError(404, 'No job posts found for this filter');
    }
    // Cache the result
    if (page === 1) {
        cachedJobPostsByState[stateName || 'all'] = yield post_model_1.JobPost.find(filter).sort({
            createdAt: -1,
        });
        cacheTimestamp = Date.now();
    }
    res.status(200).json(new apiResponse_utils_1.ApiResponse(200, {
        jobPosts,
        total,
        page,
        pageCount: Math.ceil(total / limit),
    }, 'Job posts fetched successfully'));
}));
exports.getJobPostByAdmitCardLink = (0, asyncHandler_utils_1.asyncHandler)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const postName = req.query.searchQuery;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 18;
    const skip = (page - 1) * limit;
    // Use cache if available and valid
    if (cachedJobPostsByAdmitCardLink.length > 0 && isCacheValid()) {
        let filteredPosts = cachedJobPostsByAdmitCardLink;
        if (postName) {
            const regex = new RegExp(postName, 'i');
            filteredPosts = filteredPosts.filter(post => regex.test(post.postName));
        }
        const paginatedPosts = filteredPosts.slice(skip, skip + limit);
        res.status(200).json(new apiResponse_utils_1.ApiResponse(200, {
            jobPosts: paginatedPosts,
            total: filteredPosts.length,
            page,
            pageCount: Math.ceil(filteredPosts.length / limit),
        }, 'Job posts fetched successfully '));
        return;
    }
    // If admitCardLink is an array of objects with a 'link' field:
    const filter = {
        admitCardLink: { $elemMatch: { link: { $ne: '' } } },
    };
    // If admitCardLink is a string, use this instead:
    // const filter: any = { admitCardLink: { $exists: true, $ne: '' } };
    if (postName) {
        filter.postName = { $regex: postName, $options: 'i' };
    }
    const total = yield post_model_1.JobPost.countDocuments(filter);
    const jobPosts = yield post_model_1.JobPost.find(filter)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 });
    if (!jobPosts || jobPosts.length === 0) {
        throw new apiError_1.ApiError(404, 'No job posts found that have an AdmitCard value');
    }
    // Cache the result
    if (!postName && page === 1) {
        cachedJobPostsByAdmitCardLink = yield post_model_1.JobPost.find(filter).sort({
            createdAt: -1,
        });
        cacheTimestamp = Date.now();
    }
    res.status(200).json(new apiResponse_utils_1.ApiResponse(200, {
        jobPosts,
        total,
        page,
        pageCount: Math.ceil(total / limit),
    }, 'Job posts with AdmitCard value fetched successfully'));
}));
exports.getJobPostByResultLink = (0, asyncHandler_utils_1.asyncHandler)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    // Pagination params
    const postName = req.query.searchQuery;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 18;
    const skip = (page - 1) * limit;
    // Use cache if available and valid
    if (cachedJobPostsByResultLink.length > 0 && isCacheValid()) {
        let filteredPosts = cachedJobPostsByResultLink;
        if (postName) {
            const regex = new RegExp(postName, 'i');
            filteredPosts = filteredPosts.filter(post => regex.test(post.postName));
        }
        const paginatedPosts = filteredPosts.slice(skip, skip + limit);
        res.status(200).json(new apiResponse_utils_1.ApiResponse(200, {
            jobPosts: paginatedPosts,
            total: filteredPosts.length,
            page,
            pageCount: Math.ceil(filteredPosts.length / limit),
        }, 'Job posts fetched successfully '));
        return;
    }
    // Find jobs with the specific resultLink
    const filter = {
        resultLink: {
            $elemMatch: { link: { $ne: '' } },
        },
    };
    const total = yield post_model_1.JobPost.countDocuments(filter);
    const jobPosts = yield post_model_1.JobPost.find(filter)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 });
    if (!jobPosts || jobPosts.length === 0) {
        throw new apiError_1.ApiError(404, 'No job posts found for this result link');
    }
    // Cache the result
    if (!postName && page === 1) {
        cachedJobPostsByResultLink = yield post_model_1.JobPost.find(filter).sort({
            createdAt: -1,
        });
        cacheTimestamp = Date.now();
    }
    res.status(200).json(new apiResponse_utils_1.ApiResponse(200, {
        jobPosts,
        total,
        page,
        pageCount: Math.ceil(total / limit),
    }, 'Result Link posts fetched successfully'));
}));
exports.getJobPostByAnswerKeyLink = (0, asyncHandler_utils_1.asyncHandler)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    // Pagination params
    const postName = req.query.searchQuery;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 18;
    const skip = (page - 1) * limit;
    // Use cache if available and valid
    if (cachedJobPostsByAnswerKeyLink.length > 0 && isCacheValid()) {
        let filteredPosts = cachedJobPostsByAnswerKeyLink;
        if (postName) {
            const regex = new RegExp(postName, 'i');
            filteredPosts = filteredPosts.filter(post => regex.test(post.postName));
        }
        const paginatedPosts = filteredPosts.slice(skip, skip + limit);
        res.status(200).json(new apiResponse_utils_1.ApiResponse(200, {
            jobPosts: paginatedPosts,
            total: filteredPosts.length,
            page,
            pageCount: Math.ceil(filteredPosts.length / limit),
        }, 'Job posts fetched successfully '));
        return;
    }
    // Find jobs with a specific answerKeyLink
    const filter = {
        answerKeyLink: {
            $elemMatch: { link: { $ne: '' } },
        },
    };
    const total = yield post_model_1.JobPost.countDocuments(filter);
    const jobPosts = yield post_model_1.JobPost.find(filter)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 });
    if (!jobPosts || jobPosts.length === 0) {
        throw new apiError_1.ApiError(404, 'No AnswerKey posts found for this answer key link');
    }
    // Cache the result
    if (!postName && page === 1) {
        cachedJobPostsByAnswerKeyLink = yield post_model_1.JobPost.find(filter).sort({
            createdAt: -1,
        });
        cacheTimestamp = Date.now();
    }
    res.status(200).json(new apiResponse_utils_1.ApiResponse(200, {
        jobPosts,
        total,
        page,
        pageCount: Math.ceil(total / limit),
    }, 'AnswerKey Link posts fetched successfully'));
}));
exports.getJobPostByAdmissionLink = (0, asyncHandler_utils_1.asyncHandler)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    // Pagination params
    const postName = req.query.searchQuery;
    const searchQuery = req.query.searchQuery;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 18;
    const skip = (page - 1) * limit;
    // Use cache if available and valid
    if (cachedJobPostsByAdmissionLink.length > 0 && isCacheValid()) {
        let filteredPosts = cachedJobPostsByAdmissionLink;
        if (searchQuery) {
            const regex = new RegExp(searchQuery, 'i');
            filteredPosts = filteredPosts.filter(post => regex.test(post.postName) || regex.test(post.description));
        }
        const paginatedPosts = filteredPosts.slice(skip, skip + limit);
        res.status(200).json(new apiResponse_utils_1.ApiResponse(200, {
            jobPosts: paginatedPosts,
            total: filteredPosts.length,
            page,
            pageCount: Math.ceil(filteredPosts.length / limit),
        }, 'Job posts fetched successfully '));
        return;
    }
    // Build filter
    let filter = {
        admissionLink: {
            $elemMatch: { link: { $ne: '' } },
        },
    };
    // Add search functionality
    if (searchQuery) {
        filter = Object.assign(Object.assign({}, filter), { $or: [
                { postName: { $regex: searchQuery, $options: 'i' } },
                { description: { $regex: searchQuery, $options: 'i' } },
                // Add more fields as needed
            ] });
    }
    const total = yield post_model_1.JobPost.countDocuments(filter);
    const jobPosts = yield post_model_1.JobPost.find(filter)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 });
    if (!jobPosts || jobPosts.length === 0) {
        throw new apiError_1.ApiError(404, 'No AdmissionLink posts found for this admission link');
    }
    // Cache the result
    if (!searchQuery && page === 1) {
        cachedJobPostsByAdmissionLink = yield post_model_1.JobPost.find(filter).sort({
            createdAt: -1,
        });
        cacheTimestamp = Date.now();
    }
    res.status(200).json(new apiResponse_utils_1.ApiResponse(200, {
        jobPosts,
        total,
        page,
        pageCount: Math.ceil(total / limit),
    }, 'AdmissionLink posts fetched successfully'));
}));
exports.getJobPostByApplyLink = (0, asyncHandler_utils_1.asyncHandler)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    // Pagination params
    const postName = req.query.postName;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 18;
    const skip = (page - 1) * limit;
    console.log('Post Name:', postName);
    // Use cache if available and valid
    if (cachedJobPostsByApplyLink.length > 0 && isCacheValid()) {
        let filteredPosts = cachedJobPostsByApplyLink;
        if (postName) {
            const regex = new RegExp(postName, 'i');
            filteredPosts = filteredPosts.filter(post => regex.test(post.postName));
        }
        const paginatedPosts = filteredPosts.slice(skip, skip + limit);
        res.status(200).json(new apiResponse_utils_1.ApiResponse(200, {
            jobPosts: paginatedPosts,
            total: filteredPosts.length,
            page,
            pageCount: Math.ceil(filteredPosts.length / limit),
        }, 'Job posts fetched successfully '));
        return;
    }
    // Find jobs with the specific applyLink
    const filter = {
        applyLink: {
            $elemMatch: { link: { $ne: '' } },
        },
    };
    const total = yield post_model_1.JobPost.countDocuments(filter);
    const jobPosts = yield post_model_1.JobPost.find(filter)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 });
    if (!jobPosts || jobPosts.length === 0) {
        throw new apiError_1.ApiError(404, 'No ApplyLink posts found for this apply link');
    }
    // Cache the result
    if (!postName && page === 1) {
        cachedJobPostsByApplyLink = yield post_model_1.JobPost.find(filter).sort({
            createdAt: -1,
        });
        cacheTimestamp = Date.now();
    }
    res.status(200).json(new apiResponse_utils_1.ApiResponse(200, {
        jobPosts,
        total,
        page,
        pageCount: Math.ceil(total / limit),
    }, 'ApplyLink posts fetched successfully'));
}));
exports.getJobWithoutApplyLink = (0, asyncHandler_utils_1.asyncHandler)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    // Pagination params
    const postName = req.query.searchQuery;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    // Find jobs where applyLink is missing, null, or an empty array
    const filter = {
        applyLink: {
            $elemMatch: { link: '' },
        },
        admissionLink: {
            $elemMatch: { link: '' },
        },
    };
    const total = yield post_model_1.JobPost.countDocuments(filter);
    const jobPosts = yield post_model_1.JobPost.find(filter)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 });
    if (!jobPosts || jobPosts.length === 0) {
        throw new apiError_1.ApiError(404, 'No Upcoming posts found without apply link');
    }
    res.status(200).json(new apiResponse_utils_1.ApiResponse(200, {
        jobPosts,
        total,
        page,
        pageCount: Math.ceil(total / limit),
    }, 'Upcoming posts fetched successfully'));
}));
exports.getJobPostById = (0, asyncHandler_utils_1.asyncHandler)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const jobPostId = req.params.id;
    const jobPost = yield post_model_1.JobPost.findById(jobPostId);
    if (!jobPost) {
        throw new apiError_1.ApiError(404, 'Job post not found');
    }
    res
        .status(200)
        .json(new apiResponse_utils_1.ApiResponse(200, { jobPost }, 'Job post fetched successfully'));
}));
exports.updateJobPostById = (0, asyncHandler_utils_1.asyncHandler)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    // Authentication
    if (!req.user || req.user.role !== 'admin') {
        throw new apiError_1.ApiError(req.user ? 403 : 401, req.user ? 'Forbidden: Admin access required' : 'Unauthorized access');
    }
    // Destructure body fields
    const { postName, description, notificationLink, importantDates, applicationFee, ageLimit, resultLink, admitCardLink, applyLink, answerKeyLink, admissionLink, state, beginDate, lastDate, totalPost, informationSections, } = req.body;
    // Required fields validation
    const requiredFields = [
        'postName',
        'description',
        'notificationLink',
        'importantDates',
        'applicationFee',
        'ageLimit',
        'beginDate',
    ];
    for (const field of requiredFields) {
        const value = req.body[field];
        if (value === undefined ||
            value === null ||
            (typeof value === 'string' && value.trim() === '')) {
            throw new apiError_1.ApiError(400, `${field.charAt(0).toUpperCase() + field.slice(1)} is required`);
        }
    }
    // Construct update data
    const updateData = {
        postName,
        description,
        notificationLink,
        importantDates,
        applicationFee,
        ageLimit,
        resultLink,
        admitCardLink,
        applyLink,
        answerKeyLink,
        admissionLink,
        state,
        beginDate,
        lastDate,
        totalPost,
        informationSections,
    };
    // Job post ID from request params
    const jobPostId = req.params.Id;
    const updatedJobPost = yield post_model_1.JobPost.findByIdAndUpdate(jobPostId, updateData, {
        new: true,
    });
    if (!updatedJobPost) {
        throw new apiError_1.ApiError(404, 'Job post not found');
    }
    clearAllCaches(); // Clear cache
    res
        .status(200)
        .json(new apiResponse_utils_1.ApiResponse(200, { updatedJobPost }, 'Job post updated successfully'));
}));
exports.getJobPostByName = (0, asyncHandler_utils_1.asyncHandler)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const postName = req.params.postName.replace(/%/g, " ");
    // If no cache, fetch from DB
    let filter = { postName: { $exists: true } };
    if (postName) {
        filter.postName = postName;
    }
    const total = yield post_model_1.JobPost.countDocuments(filter);
    const jobPosts = yield post_model_1.JobPost.find(filter);
    res.status(200).json(new apiResponse_utils_1.ApiResponse(200, {
        jobPosts,
    }, 'Job posts fetched successfully'));
}));
