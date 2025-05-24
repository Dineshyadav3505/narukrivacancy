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
exports.sendVerificationCode = exports.getProfile = exports.logout = exports.login = exports.createUser = void 0;
const user_model_1 = require("../Models/user.model");
const apiError_1 = require("../utils/apiError");
const jwtToken_utils_1 = require("../utils/jwtToken.utils");
const apiResponse_utils_1 = require("../utils/apiResponse.utils");
const asyncHandler_utils_1 = require("../utils/asyncHandler.utils");
const optValidation_1 = require("../utils/optValidation");
const nodeMailer_1 = require("../utils/nodeMailer");
// Create a new user
exports.createUser = (0, asyncHandler_utils_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { firstName, lastName, phone, email, otp } = req.body;
    const requiredFields = [
        'firstName',
        'lastName',
        'phone',
        'email',
        'otp',
    ];
    for (const field of requiredFields) {
        if (!req.body[field] || req.body[field].trim() === '') {
            throw new apiError_1.ApiError(400, `${field.charAt(0).toUpperCase() + field.slice(1)} is required`);
        }
    }
    // Check if the user already exists
    const existingUser = yield user_model_1.User.findOne({ email });
    if (existingUser) {
        throw new apiError_1.ApiError(409, 'Email already exists', [], 'Email already exists');
    }
    // Check if phone number already exists
    const existingPhone = yield user_model_1.User.findOne({ phone });
    if (existingPhone) {
        throw new apiError_1.ApiError(409, 'Phone number already exists');
    }
    const isCodeValid = (0, optValidation_1.verifyCode)(email, otp);
    if (!isCodeValid) {
        throw new apiError_1.ApiError(401, 'Code is not Valid Try Again');
    }
    const newUser = new user_model_1.User({
        firstName,
        lastName,
        phone,
        email,
    });
    yield newUser.save();
    // Find the created user without password
    const createdUser = yield user_model_1.User.findById(newUser._id);
    if (!createdUser) {
        throw new apiError_1.ApiError(500, 'User not registered');
    }
    const accessToken = (0, jwtToken_utils_1.generateToken)({ _id: createdUser._id.toString() });
    // Generate a token
    res
        .status(200)
        .cookie('accessToken', accessToken, jwtToken_utils_1.options)
        .json(new apiResponse_utils_1.ApiResponse(200, { createdUser, accessToken }, 'User created successfully'));
}));
// Login user
exports.login = (0, asyncHandler_utils_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, otp } = req.body;
    const requiredFields = ['email', 'otp'];
    for (const field of requiredFields) {
        if (!req.body[field] || req.body[field].trim() === '') {
            throw new apiError_1.ApiError(400, `${field.charAt(0).toUpperCase() + field.slice(1)} is required`);
        }
    }
    const user = yield user_model_1.User.findOne({ email });
    if (!user) {
        throw new apiError_1.ApiError(401, "You Don't have Account.Sigh Up ");
    }
    const isCodeValid = (0, optValidation_1.verifyCode)(email, otp);
    if (!isCodeValid) {
        throw new apiError_1.ApiError(401, 'Code is not Valid Try Again');
    }
    // Generate access token
    const accessToken = (0, jwtToken_utils_1.generateToken)({ _id: user._id.toString() });
    const createdUser = {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        subscribe: user.subscribe,
        role: user.role,
    };
    res
        .status(200)
        .cookie('accessToken', accessToken, jwtToken_utils_1.options)
        .json(new apiResponse_utils_1.ApiResponse(200, { createdUser, accessToken }, 'Login successful'));
}));
// Logout user
exports.logout = (0, asyncHandler_utils_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res
        .status(200)
        .clearCookie('accessToken', jwtToken_utils_1.options)
        .json(new apiResponse_utils_1.ApiResponse(200, {}, 'User logged out successfully'));
}));
// Get user profile
exports.getProfile = (0, asyncHandler_utils_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res
        .status(200)
        .json(new apiResponse_utils_1.ApiResponse(200, req.user, 'User fetched successfully'));
}));
exports.sendVerificationCode = (0, asyncHandler_utils_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Support both POST body and GET query
    const email = req.body.email || req.query.email;
    const phone_number = req.body.phone_number || req.query.phone_number;
    if (!email && !phone_number) {
        throw new apiError_1.ApiError(400, 'Either email or phone number is required');
    }
    let verificationCode;
    if (email) {
        verificationCode = (0, optValidation_1.generateVerificationCode)();
        (0, optValidation_1.storeVerificationEmailCode)(email, verificationCode);
    }
    // if (phone_number) {
    //   verificationCode = generateVerificationCode();
    //   storeVerificationPhoneCode(phone_number, verificationCode);
    // }
    const recipientEmail = email;
    const subject = 'One Time Password (OTP) from NAUKRI VACANCY';
    const text = `Dear Candidate,
    
    Your one time password (OTP) is: ${verificationCode}
    
    Please do not share this OTP with anyone for security reasons.
    
    Regards,
    Team Naukri Vacancy`;
    const html = `
      <p>Dear Candidate,</p>
      <p>Your one time password (OTP) is: <b>${verificationCode}</b></p>
      <p>Please do not share this OTP with anyone for security reasons.</p>
      <br>
      <p>Regards,<br>Team Naukri Vacancy</p>
    `;
    (0, nodeMailer_1.sendEmail)({
        to: recipientEmail,
        subject,
        text,
        html, // HTML version for better formatting
    });
    res
        .status(201)
        .json(new apiResponse_utils_1.ApiResponse(201, { email }, 'OTP sent successfully'));
}));
