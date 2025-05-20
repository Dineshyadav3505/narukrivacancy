import { ApiError } from '../utils/apiError';
import { asyncHandler } from '../utils/asyncHandler.utils';
import jwt from 'jsonwebtoken';
import { User } from '../Models/user.model';
import dotenv from 'dotenv';
import { clearConfigCache } from 'prettier';

dotenv.config({
  path: '../.env',
});

interface DecodedToken {
  _id: string;
}

export const verifyJWT = asyncHandler(async (req, _, next) => {
  try {
    // Check if the token is in the authorization header or cookies
    const token = req.headers.authorization || req.cookies.accessToken;
    
    if (!token || token === 'null') {
      throw new ApiError(401, 'Unauthorized request');
    }

    const decodedToken = jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET! 
    ) as DecodedToken;

    const user = await User.findById(decodedToken?._id).select('-password');

    if (!user) {
      throw new ApiError(401, 'Invalid Access Token');
    }
    (req as any).user = user;

    next();
  } catch (error: any) {
    throw new ApiError(401, error || 'Invalid access token');
  }
});
