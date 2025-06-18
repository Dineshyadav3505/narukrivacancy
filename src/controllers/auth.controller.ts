import { User } from '../Models/user.model';
import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { ApiError } from '../utils/apiError';
import { generateToken, options } from '../utils/jwtToken.utils';
import { ApiResponse } from '../utils/apiResponse.utils';
import { asyncHandler } from '../utils/asyncHandler.utils';
import {
  generateVerificationCode,
  storeVerificationEmailCode,
  storeVerificationPhoneCode,
  verifyCode,
} from '../utils/optValidation';
import { sendEmail } from '../utils/nodeMailer';

interface CustomRequest extends Request {
  user?: any;
}

// Create a new user
export const createUser = asyncHandler(async (req: Request, res: Response) => {
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
      throw new ApiError(
        400,
        `${field.charAt(0).toUpperCase() + field.slice(1)} is required`
      );
    }
  }

  // Check if the user already exists
  const existingUser = await User.findOne({ email });

  if (existingUser) {
    throw new ApiError(409, 'Email already exists', [], 'Email already exists');
  }

  // Check if phone number already exists
  const existingPhone = await User.findOne({ phone });
  if (existingPhone) {
    throw new ApiError(409, 'Phone number already exists');
  }

  const isCodeValid = verifyCode(email, otp);

  if (!isCodeValid) {
    throw new ApiError(401, 'Code is not Valid Try Again');
  }

  const newUser = new User({
    firstName,
    lastName,
    phone,
    email,
  });

  await newUser.save();

  // Find the created user without password
  const createdUser = await User.findById(newUser._id);

  if (!createdUser) {
    throw new ApiError(500, 'User not registered');
  }

  const accessToken = generateToken({ _id: createdUser._id.toString() });

  // Generate a token
  res
    .status(200)
    .cookie('accessToken', accessToken, options)
    .json(
      new ApiResponse(
        200,
        { createdUser, accessToken },
        'User created successfully'
      )
    );
});

// Login user
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, otp } = req.body;

  const requiredFields = ['email','otp'];
  for (const field of requiredFields) {
    if (!req.body[field] || req.body[field].trim() === '') {
      throw new ApiError(
        400,
        `${field.charAt(0).toUpperCase() + field.slice(1)} is required`
      );
    }
  }

  const user = await User.findOne({ email });

  if (!user) {
    throw new ApiError(401, "You Don't have Account.Sigh Up ");
  }

  const isCodeValid = verifyCode(email, otp);

  if (!isCodeValid) {
    throw new ApiError(401, 'Code is not Valid Try Again');
  }

  // Generate access token
  const accessToken = generateToken({ _id: user._id.toString() });

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
    .cookie('accessToken', accessToken, options)
    .json(
      new ApiResponse(200, { createdUser, accessToken }, 'Login successful')
    );
});

// Logout user
export const logout = asyncHandler(
  async (req: CustomRequest, res: Response) => {
    res
      .status(200)
      .clearCookie('accessToken', options)
      .json(new ApiResponse(200, {}, 'User logged out successfully'));
  }
);

// Get user profile
export const getProfile = asyncHandler(
  async (req: CustomRequest, res: Response) => {
    res
      .status(200)
      .json(new ApiResponse(200, req.user, 'User fetched successfully'));
  }
);

export const sendVerificationCode = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    // Support both POST body and GET query
    const email = req.body.email || req.query.email;
    const phone_number = req.body.phone_number || req.query.phone_number;

    if (!email && !phone_number) {
      throw new ApiError(400, 'Either email or phone number is required');
    }

    let verificationCode;

    if (email) {
      verificationCode = generateVerificationCode();
      storeVerificationEmailCode(email, verificationCode);
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
    
    sendEmail({
      to: recipientEmail,
      subject,
      text,
      html, // HTML version for better formatting
    });
    

    // console.log(`Verification code sent to ${email || phone_number}: ${verificationCode}`);
    res
      .status(201)
      .json(new ApiResponse(200, { email }, 'OTP sent successfully'));
  }
);
