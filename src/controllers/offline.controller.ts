import { OfflinePostModel } from '../Models/offline.model';
import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.utils';
import { ApiError } from '../utils/apiError';
import { ApiResponse } from '../utils/apiResponse.utils';

export const createOfflineJob = asyncHandler(
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
      qualification,
      ageLimit,
      lastDate,
      details,
      price,
      link,
    } = req.body;

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

    // Create a new offline job post
    const newJobPost = await OfflinePostModel.create({
      postName,
      description,
      qualification,
      ageLimit,
      lastDate,
      details,
      price,
      link,
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
              'Offline Job post created successfully'
            )
          );
      })
      .catch(error => {
        res
          .status(500)
          .json(new ApiError(500, 'Failed to create Offline Job post', error));
      });
  }
);

export const getAllOfflineJobs = asyncHandler(
  async (req: Request, res: Response) => {
    const searchQuery = req.query.searchQuery as string | undefined;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    let filter: any = {};
    if (searchQuery) {
      filter = {
        $or: [
          { postName: { $regex: searchQuery, $options: 'i' } },
          { description: { $regex: searchQuery, $options: 'i' } },
          { state: { $regex: searchQuery, $options: 'i' } },
        ],
      };
    }

    const total = await OfflinePostModel.countDocuments(filter);
    const jobPosts = await OfflinePostModel.find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    res.status(200).json(
      new ApiResponse(
        200,
        {
          jobPosts,
          total,
          page,
          pageCount: Math.ceil(total / limit),
        },
        'Job posts fetched successfully'
      )
    );
  }
);

export const getOfflineJobById = asyncHandler(
  async (req: Request, res: Response) => {
    // Fetch offline job post by ID
    const { id } = req.params;
    const offlineJob = await OfflinePostModel.findById(id);

    if (!offlineJob) {
      throw new ApiError(404, 'Offline job post not found');
    }

    res.status(200).json(new ApiResponse(200, { offlineJob }));
  }
);

export const updateOfflineJobById = asyncHandler(
  async (req: Request, res: Response) => {
    // Authentication
    if (!req.user || req.user.role !== 'admin') {
      throw new ApiError(
        req.user ? 403 : 401,
        req.user ? 'Forbidden: Admin access required' : 'Unauthorized access'
      );
    }

    // Fetch offline job post by ID
    const id = req.params.Id;
    const offlineJob = await OfflinePostModel.findById(id);

    if (!offlineJob) {
      throw new ApiError(404, 'Offline job post not found');
    }

    // Update offline job post
    const updatedJobPost = await OfflinePostModel.findByIdAndUpdate(
      id,
      req.body,
      { new: true }
    );

    res.status(200).json(new ApiResponse(200, { updatedJobPost },"Offline form updated successfully"));
  }
);

export const deleteOfflineJobById = asyncHandler(
  async (req: Request, res: Response) => {
    // Authentication
    if (!req.user || req.user.role !== 'admin') {
      throw new ApiError(
        req.user ? 403 : 401,
        req.user ? 'Forbidden: Admin access required' : 'Unauthorized access'
      );
    }
    const jobPostId = req.params.Id;
    const offlineJob = await OfflinePostModel.findByIdAndDelete(jobPostId);

    if (!offlineJob) {
      throw new ApiError(404, 'Offline job post not found');
    }

    res
      .status(200)
      .json(new ApiResponse(200, {}, 'Offline job post deleted successfully'));
  }
);
