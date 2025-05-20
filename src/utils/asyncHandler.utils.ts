import { Request, Response, NextFunction } from 'express';
import { ApiError } from './apiError';

const asyncHandler =
  (
    requestHandler: (
      req: Request,
      res: Response,
      next: NextFunction
    ) => Promise<void>
  ) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await requestHandler(req, res, next);
    } catch (error) {
      if (error instanceof ApiError) {
        res.status(error.statusCode).json({
          status: false,
          message: error.message,
        });
      } else {
        res.status(500).json({
          status: false,
          message: 'Internal Server Error',
        });
      }
    }
  };

export { asyncHandler };
