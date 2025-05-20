import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/apiError';
import { asyncHandler } from '../utils/asyncHandler.utils';
import { JobPost } from '../Models/post.model';
import { ApiResponse } from '../utils/apiResponse.utils';
import { userInterface } from '../Models/user.model';

declare global {
  namespace Express {
    interface User {
      role: string;
    }
  }
}

// const AllJobPosts = [];
// const AllJobPostsByState = [];
// const AllJobPostsByAdmitCardLink = [];
// const AllJobPostsByResultLink = [];
// const AllJobPostsByAnswerKeyLink = [];
// const AllJobPostsByAdmissionLink = [];
// const AllJobPostsByApplyLink = [];

export const createJobPost = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
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
    } = req.body;

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

    const parsedBeginDate =
      typeof beginDate === 'string' ? new Date(beginDate) : beginDate;
    const parsedLastDate =
      typeof lastDate === 'string' && lastDate ? new Date(lastDate) : lastDate;

    const jobPost = new JobPost({
      postName,
      description,
      notificationLink,
      importantDates,
      applicationFee,
      ageLimit,
      resultLink,
      admitCardLink,
      answerKeyLink,
      admissionLink,
      applyLink,
      informationSections,
      state,
      beginDate: parsedBeginDate,
      lastDate: parsedLastDate,
      totalPost,
    });

    await jobPost
      .save()
      .then(() => {
        res
          .status(201)
          .json(
            new ApiResponse(201, { jobPost }, 'Job post created successfully')
          );
      })
      .catch(error => {
        res.status(500).json(new ApiError(500, error));
      });
  }
);

export const getAllJobPosts = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const searchQuery = req.query.searchQuery as string | undefined;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    let filter: any = {
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

    const total = await JobPost.countDocuments(filter);
    const jobPosts = await JobPost.find(filter)
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

export const deleteJobPostById = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new ApiError(401, 'User not authenticated');
    }

    if (req.user.role !== 'admin') {
      throw new ApiError(403, 'You are not authorized to delete a job post.');
    }

    const jobPostId = req.params.id;
    const jobPost = await JobPost.findByIdAndDelete(jobPostId);
    if (!jobPost) {
      throw new ApiError(404, 'Job post not found');
    }

    res
      .status(200)
      .json(new ApiResponse(200, { jobPost }, 'Job post deleted successfully'));
  }
);

export const getJobPostByState = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const stateName = req.query.state as string | undefined;
    const postName = req.query.searchQuery as string | undefined;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter: any = { state: { $exists: true, $ne: '' } };

    if (stateName) {
      filter.state = stateName;
    }
    if (postName) {
      // Case-insensitive, partial match for postName
      filter.postName = { $regex: postName, $options: 'i' };
    }

    const total = await JobPost.countDocuments(filter);
    const jobPosts = await JobPost.find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    if (!jobPosts || jobPosts.length === 0) {
      throw new ApiError(404, 'No job posts found for this filter');
    }

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

export const getJobPostByAdmitCardLink = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const postName = req.query.searchQuery as string | undefined;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    // If admitCardLink is an array of objects with a 'link' field:
    const filter: any = {
      admitCardLink: { $elemMatch: { link: { $ne: '' } } },
    };

    // If admitCardLink is a string, use this instead:
    // const filter: any = { admitCardLink: { $exists: true, $ne: '' } };

    if (postName) {
      filter.postName = { $regex: postName, $options: 'i' };
    }

    const total = await JobPost.countDocuments(filter);

    const jobPosts = await JobPost.find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    if (!jobPosts || jobPosts.length === 0) {
      throw new ApiError(
        404,
        'No job posts found that have an AdmitCard value'
      );
    }

    res.status(200).json(
      new ApiResponse(
        200,
        {
          jobPosts,
          total,
          page,
          pageCount: Math.ceil(total / limit),
        },
        'Job posts with AdmitCard value fetched successfully'
      )
    );
  }
);

export const getJobPostByResultLink = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    // Pagination params
    const postName = req.query.searchQuery as string | undefined;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    // Find jobs with the specific resultLink
    const filter = {
      resultLink: {
        $elemMatch: { link: { $ne: '' } },
      },
    };

    // Get total count for pagination info
    const total = await JobPost.countDocuments(filter);

    // Get paginated jobs
    const jobPosts = await JobPost.find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    if (!jobPosts || jobPosts.length === 0) {
      throw new ApiError(404, 'No job posts found for this result link');
    }

    res.status(200).json(
      new ApiResponse(
        200,
        {
          jobPosts,
          total,
          page,
          pageCount: Math.ceil(total / limit),
        },
        'Result Link posts fetched successfully'
      )
    );
  }
);

export const getJobPostByAnswerKeyLink = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    // Pagination params
    const postName = req.query.searchQuery as string | undefined;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    // Find jobs with a specific answerKeyLink
    const filter = {
      answerKeyLink: {
        $elemMatch: { link: { $ne: '' } },
      },
    };

    const total = await JobPost.countDocuments(filter);

    const jobPosts = await JobPost.find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    if (!jobPosts || jobPosts.length === 0) {
      throw new ApiError(
        404,
        'No AnswerKey posts found for this answer key link'
      );
    }
    res.status(200).json(
      new ApiResponse(
        200,
        {
          jobPosts,
          total,
          page,
          pageCount: Math.ceil(total / limit),
        },
        'AnswerKey Link posts fetched successfully'
      )
    );
  }
);

export const getJobPostByAdmissionLink = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    // Pagination params
    const postName = req.query.searchQuery as string | undefined;
    const searchQuery = req.query.searchQuery as string | undefined;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    // Build filter
    let filter: any = {
      admissionLink: {
        $elemMatch: { link: { $ne: '' } },
      },
    };

    // Add search functionality
    if (searchQuery) {
      filter = {
        ...filter,
        $or: [
          { postName: { $regex: searchQuery, $options: 'i' } },
          { description: { $regex: searchQuery, $options: 'i' } },
          // Add more fields as needed
        ],
      };
    }

    const total = await JobPost.countDocuments(filter);

    const jobPosts = await JobPost.find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    // Or keep your error throw:
    if (!jobPosts || jobPosts.length === 0) {
      throw new ApiError(
        404,
        'No AdmissionLink posts found for this admission link'
      );
    }

    res.status(200).json(
      new ApiResponse(
        200,
        {
          jobPosts,
          total,
          page,
          pageCount: Math.ceil(total / limit),
        },
        'AdmissionLink posts fetched successfully'
      )
    );
  }
);

export const getJobPostByApplyLink = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    // Pagination params
    const postName = req.query.searchQuery as string | undefined;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    // Find jobs with the specific applyLink
    const filter = {
      applyLink: {
        $elemMatch: { link: { $ne: '' } },
      },
    };

    const total = await JobPost.countDocuments(filter);

    const jobPosts = await JobPost.find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    if (!jobPosts || jobPosts.length === 0) {
      throw new ApiError(404, 'No ApplyLink posts found for this apply link');
    }
    res.status(200).json(
      new ApiResponse(
        200,
        {
          jobPosts,
          total,
          page,
          pageCount: Math.ceil(total / limit),
        },
        'ApplyLink posts fetched successfully'
      )
    );
  }
);

export const getJobWithoutApplyLink = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    // Pagination params
    const postName = req.query.searchQuery as string | undefined;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
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

    const total = await JobPost.countDocuments(filter);

    const jobPosts = await JobPost.find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    if (!jobPosts || jobPosts.length === 0) {
      throw new ApiError(404, 'No Upcoming posts found without apply link');
    }

    res.status(200).json(
      new ApiResponse(
        200,
        {
          jobPosts,
          total,
          page,
          pageCount: Math.ceil(total / limit),
        },
        'Upcoming posts fetched successfully'
      )
    );
  }
);

export const getJobPostById = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const jobPostId = req.params.id;
    const jobPost = await JobPost.findById(jobPostId);
    if (!jobPost) {
      throw new ApiError(404, 'Job post not found');
    }
    res
      .status(200)
      .json(new ApiResponse(200, { jobPost }, 'Job post fetched successfully'));
  }
);

export const updateJobPostById = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new ApiError(401, 'User not authenticated');
    }

    if (req.user.role !== 'admin') {
      throw new ApiError(403, 'You are not authorized to update a job post.');
    }

    const jobPostId = req.params.id;
    const {
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
    } = req.body;

    const jobPost = await JobPost.findByIdAndUpdate(
      jobPostId,
      {
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
      },
      { new: true }
    );

    if (!jobPost) {
      throw new ApiError(404, 'Job post not found');
    }

    res
      .status(200)
      .json(new ApiResponse(200, { jobPost }, 'Job post updated successfully'));
  }
);
