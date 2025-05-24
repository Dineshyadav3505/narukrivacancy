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
exports.deleteNotesById = exports.updateNotesById = exports.getNotesById = exports.getAllNotes = exports.createNotes = void 0;
const notes_model_1 = require("../Models/notes.model");
const asyncHandler_utils_1 = require("../utils/asyncHandler.utils");
const apiError_1 = require("../utils/apiError");
const apiResponse_utils_1 = require("../utils/apiResponse.utils");
// CREATE
exports.createNotes = (0, asyncHandler_utils_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("Creating a new Notes post...");
    // Authentication
    if (!req.user || req.user.role !== 'admin') {
        throw new apiError_1.ApiError(req.user ? 403 : 401, req.user ? 'Forbidden: Admin access required' : 'Unauthorized access');
    }
    const { title, description, details, link, price } = req.body;
    // Required fields validation
    const requiredFields = ['title', 'description', 'details', 'link', 'price'];
    for (const field of requiredFields) {
        const value = req.body[field];
        if (value === undefined ||
            value === null ||
            (typeof value === 'string' && value.trim() === '')) {
            throw new apiError_1.ApiError(400, `${field.charAt(0).toUpperCase() + field.slice(1)} is required`);
        }
    }
    // Create a new Notes post
    const newJobPost = yield notes_model_1.NotesModel.create({
        title,
        description,
        details,
        link,
        price,
    });
    yield newJobPost
        .save()
        .then(() => {
        res
            .status(201)
            .json(new apiResponse_utils_1.ApiResponse(201, { newJobPost }, 'Notes created successfully'));
    })
        .catch((error) => {
        res
            .status(500)
            .json(new apiError_1.ApiError(500, 'Failed to create Notes'));
    });
}));
// GET ALL
exports.getAllNotes = (0, asyncHandler_utils_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const searchQuery = req.query.searchQuery;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    let filter = {};
    if (searchQuery) {
        filter = {
            $or: [
                { title: { $regex: searchQuery, $options: 'i' } },
                { description: { $regex: searchQuery, $options: 'i' } },
            ],
        };
    }
    const total = yield notes_model_1.NotesModel.countDocuments(filter);
    const notes = yield notes_model_1.NotesModel.find(filter)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 });
    res.status(200).json(new apiResponse_utils_1.ApiResponse(200, {
        notes,
        total,
        page,
        pageCount: Math.ceil(total / limit),
    }, 'Notes fetched successfully'));
}));
// GET BY ID
exports.getNotesById = (0, asyncHandler_utils_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const note = yield notes_model_1.NotesModel.findById(id);
    if (!note)
        throw new apiError_1.ApiError(404, 'Notes not found');
    res.status(200).json(new apiResponse_utils_1.ApiResponse(200, { note }));
}));
// UPDATE BY ID
exports.updateNotesById = (0, asyncHandler_utils_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.user)
        throw new apiError_1.ApiError(401, 'User not authenticated');
    if (req.user.role !== 'admin')
        throw new apiError_1.ApiError(403, 'You are not authorized to update this post.');
    const id = req.params.Id;
    const note = yield notes_model_1.NotesModel.findById(id);
    if (!note)
        throw new apiError_1.ApiError(404, 'Notes not found');
    const { title, description, details, link, price } = req.body;
    // Required fields validation
    const requiredFields = ['title', 'description', 'details', 'link', 'price'];
    for (const field of requiredFields) {
        const value = req.body[field];
        if (value === undefined ||
            value === null ||
            (typeof value === 'string' && value.trim() === '')) {
            throw new apiError_1.ApiError(400, `${field.charAt(0).toUpperCase() + field.slice(1)} is required`);
        }
    }
    const updatedNote = yield notes_model_1.NotesModel.findByIdAndUpdate(id, {
        title,
        description,
        details,
        link,
        price,
    }, { new: true });
    if (!updatedNote)
        throw new apiError_1.ApiError(500, 'Failed to update note');
    res
        .status(200)
        .json(new apiResponse_utils_1.ApiResponse(200, { updatedNote }, 'Notes updated successfully'));
}));
// DELETE BY ID
exports.deleteNotesById = (0, asyncHandler_utils_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.user)
        throw new apiError_1.ApiError(401, 'User not authenticated');
    if (req.user.role !== 'admin')
        throw new apiError_1.ApiError(403, 'You are not authorized to delete this post.');
    const id = req.params.id;
    const deletedNote = yield notes_model_1.NotesModel.findByIdAndDelete(id);
    if (!deletedNote)
        throw new apiError_1.ApiError(404, 'Notes not found');
    res
        .status(200)
        .json(new apiResponse_utils_1.ApiResponse(200, {}, 'Notes deleted successfully'));
}));
