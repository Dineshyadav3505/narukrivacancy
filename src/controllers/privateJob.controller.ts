import { PrivateJobModel } from '../Models/privateJob.model';
import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.utils';
import { ApiError } from '../utils/apiError';
import { ApiResponse } from '../utils/apiResponse.utils';

export const createPrivateJob = asyncHandler(
  async (req: Request, res: Response) => {
    // Authentication
    if (!req.user || req.user.role !== 'admin') {
      throw new ApiError(
        req.user ? 403 : 401,
        req.user ? 'Forbidden: Admin access required' : 'Unauthorized access'
      );
    }

    // Destructure body fields
    const {
      postName,
      description,
      location,
      jobRole,
      Requirement,
      salary,
      Benefits,
    } = req.body;

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
      if (
        value === undefined ||
        value === null ||
        (typeof value === 'string' && value.trim() === '')
      ) {
        throw new ApiError(
          400,
          `${field.charAt(0).toUpperCase() + field.slice(1)} is required`
        );
      }
    }

    // Create a new privateJob post
    const newJobPost = await PrivateJobModel.create({
      postName,
      description,
      location,
      jobRole,
      Requirement,
      salary,
      Benefits,
    });

    await newJobPost
      .save()
      .then(() => {
        res
          .status(201)
          .json(
            new ApiResponse(
              201,
              { newJobPost },
              'Private Job post created successfully'
            )
          );
      })
      .catch(error => {
        res.status(500).json(new ApiError(500, error, error));
      });
  }
);

export const getAllPrivateJobById = asyncHandler(
  async (req: Request, res: Response) => {
    const jobPostId = req.params.Id;

    // Authentication
    if (!req.user) {
      throw new ApiError(401, 'User not authenticated');
    }

    // Find the private job post by ID
    const jobPost = await PrivateJobModel.findById(jobPostId);
    if (!jobPost) {
      throw new ApiError(404, 'Private Job post not found');
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { jobPost },
          'Private Job post fetched successfully'
        )
      );
  }
);

export const getAllPrivateJob = asyncHandler(
  async (req: Request, res: Response) => {
    const searchQuery = req.query.searchQuery as string | undefined;
    const page = parseInt(req.query.page as string) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;

    let filter: any = {};
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
    const total = await PrivateJobModel.countDocuments(filter);

    // Get paginated jobs
    const privateJob = await PrivateJobModel.find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }); // Optional: newest first

    res.status(200).json(
      new ApiResponse(
        200,
        {
          privateJob,
          total,
          page,
          pageCount: Math.ceil(total / limit),
        },
        'Private Job posts fetched successfully'
      )
    );
  }
);

export const deletePrivateJobPostById = asyncHandler(
  async (req: Request, res: Response) => {

    // Authentication
    if (!req.user || req.user.role !== 'admin') {
      throw new ApiError(
        req.user ? 403 : 401,
        req.user ? 'Forbidden: Admin access required' : 'Unauthorized access'
      );
    }

    const jobPostId = req.params.Id;


    const jobPost = await PrivateJobModel.findByIdAndDelete(jobPostId);
    if (!jobPost) {
      throw new ApiError(404, 'Private Job post not found');
    }

    res
      .status(200)
      .json(new ApiResponse(200, {}, 'Private Job post deleted successfully'));
  }
);

export const updatePrivateJobPostById = asyncHandler(
  async (req: Request, res: Response) => {
    // Authentication
    if (!req.user || req.user.role !== 'admin') {
      throw new ApiError(
        req.user ? 403 : 401,
        req.user ? 'Forbidden: Admin access required' : 'Unauthorized access'
      );
    }

    const jobPostId = req.params.Id;

    // Find the private job post by ID
    const jobPost = await PrivateJobModel.findById(jobPostId);

    if (!jobPost) {
      throw new ApiError(404, 'Private Job post not found');
    }

    // Update the job post with the new data
    Object.assign(jobPost, req.body);

    await jobPost.save();

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { jobPost },
          'Private Job post updated successfully'
        )
      );
  }
);
