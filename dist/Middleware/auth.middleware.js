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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyJWT = void 0;
const apiError_1 = require("../utils/apiError");
const asyncHandler_utils_1 = require("../utils/asyncHandler.utils");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const user_model_1 = require("../Models/user.model");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config({
    path: '../.env',
});
exports.verifyJWT = (0, asyncHandler_utils_1.asyncHandler)((req, _, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Check if the token is in the authorization header or cookies
        const token = req.headers.authorization || req.cookies.accessToken;
        if (!token || token === 'null') {
            throw new apiError_1.ApiError(401, 'Unauthorized request');
        }
        const decodedToken = jsonwebtoken_1.default.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const user = yield user_model_1.User.findById(decodedToken === null || decodedToken === void 0 ? void 0 : decodedToken._id).select('-password');
        if (!user) {
            throw new apiError_1.ApiError(401, 'Invalid Access Token');
        }
        req.user = user;
        next();
    }
    catch (error) {
        throw new apiError_1.ApiError(401, error || 'Invalid access token');
    }
}));
