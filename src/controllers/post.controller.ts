import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/apiError';
import { asyncHandler } from '../utils/asyncHandler.utils';
import { JobPost } from '../Models/post.model';
import { ApiResponse } from '../utils/apiResponse.utils';
import { userInfo } from 'os';

// Define Caches
let cachedJobPosts: any[] = [];
let cachedJobPostsByState: { [key: string]: any[] } = {};
let cachedJobPostsByAdmitCardLink: any[] = [];
let cachedJobPostsByResultLink: any[] = [];
let cachedJobPostsByAnswerKeyLink: any[] = [];
let cachedJobPostsByAdmissionLink: any[] = [];
let cachedJobPostsByApplyLink: any[] = [];
let cacheTimestamp = 0;
const CACHE_TTL = 60 * 1000;

declare global {
  namespace Express {
    interface User {
      role: string;
    }
  }
}

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
      applyLink,
      answerKeyLink,
      admissionLink,
      informationSections,
      state,
      beginDate: parsedBeginDate,
      lastDate: parsedLastDate,
      totalPost,
    });

    await jobPost.save();
    clearAllCaches(); // Clear cache

    res
      .status(201)
      .json(new ApiResponse(201, { jobPost }, 'Job post created successfully'));
  }
);


export const getAllJobPosts = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const searchQuery = req.query.searchQuery as string | undefined;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 18;
    const skip = (page - 1) * limit;

    // Use cache if available and valid
    if (cachedJobPosts.length > 0 && isCacheValid()) {
      let filteredPosts = cachedJobPosts;
      if (searchQuery) {
        const regex = new RegExp(searchQuery, 'i');
        filteredPosts = filteredPosts.filter(
          post =>
            regex.test(post.postName) ||
            regex.test(post.description) ||
            regex.test(post.state)
        );
      }
      const paginatedPosts = filteredPosts.slice(skip, skip + limit);
      res.status(200).json(
        new ApiResponse(
          200,
          {
            jobPosts: paginatedPosts,
            total: filteredPosts.length,
            page,
            pageCount: Math.ceil(filteredPosts.length / limit),
          },
          'Job posts fetched successfully'
        )
      );
      return;
    }

    // If no cache, fetch from DB
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

    // Cache the result
    if (!searchQuery && page === 1) {
      cachedJobPosts = await JobPost.find(filter).sort({ createdAt: -1 });
      cacheTimestamp = Date.now();
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

export const deleteJobPostById = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {     
    // Authentication
     if (!req.user || req.user.role !== 'admin') {
      throw new ApiError(
        req.user ? 403 : 401,
        req.user ? 'Forbidden: Admin access required' : 'Unauthorized access'
      );
    }
    const jobPostId = req.params.Id;

    const jobPost = await JobPost.findByIdAndDelete(jobPostId);

    if (!jobPost) {
      throw new ApiError(404, 'Job post not found');
    }

    clearAllCaches(); // Clear cache

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
    const limit = parseInt(req.query.limit as string) || 18;
    const skip = (page - 1) * limit;

    // Use cache if available and valid
    if (
      cachedJobPostsByState[stateName || 'all']?.length > 0 &&
      isCacheValid()
    ) {
      let cachedPosts = cachedJobPostsByState[stateName || 'all'];
      if (postName) {
        const regex = new RegExp(postName, 'i');
        cachedPosts = cachedPosts.filter(post => regex.test(post.postName));
      }
      const paginatedPosts = cachedPosts.slice(skip, skip + limit);
      res.status(200).json(
        new ApiResponse(
          200,
          {
            jobPosts: paginatedPosts,
            total: cachedPosts.length,
            page,
            pageCount: Math.ceil(cachedPosts.length / limit),
          },
          'Job posts fetched successfully'
        )
      );
      return;
    }

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

    // Cache the result
    if (page === 1) {
      cachedJobPostsByState[stateName || 'all'] = await JobPost.find(
        filter
      ).sort({
        createdAt: -1,
      });
      cacheTimestamp = Date.now();
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
    const limit = parseInt(req.query.limit as string) || 18;
    const skip = (page - 1) * limit;

    // Use cache if available and valid
    if (cachedJobPostsByAdmitCardLink.length > 0 && isCacheValid()) {
      let filteredPosts = cachedJobPostsByAdmitCardLink;
      if (postName) {
        const regex = new RegExp(postName, 'i');
        filteredPosts = filteredPosts.filter(post => regex.test(post.postName));
      }
      const paginatedPosts = filteredPosts.slice(skip, skip + limit);
      res.status(200).json(
        new ApiResponse(
          200,
          {
            jobPosts: paginatedPosts,
            total: filteredPosts.length,
            page,
            pageCount: Math.ceil(filteredPosts.length / limit),
          },
          'Job posts fetched successfully '
        )
      );
      return;
    }

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

    // Cache the result
    if (!postName && page === 1) {
      cachedJobPostsByAdmitCardLink = await JobPost.find(filter).sort({
        createdAt: -1,
      });
      cacheTimestamp = Date.now();
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
    const limit = parseInt(req.query.limit as string) || 18;
    const skip = (page - 1) * limit;

    // Use cache if available and valid
    if (cachedJobPostsByResultLink.length > 0 && isCacheValid()) {
      let filteredPosts = cachedJobPostsByResultLink;
      if (postName) {
        const regex = new RegExp(postName, 'i');
        filteredPosts = filteredPosts.filter(post => regex.test(post.postName));
      }
      const paginatedPosts = filteredPosts.slice(skip, skip + limit);
      res.status(200).json(
        new ApiResponse(
          200,
          {
            jobPosts: paginatedPosts,
            total: filteredPosts.length,
            page,
            pageCount: Math.ceil(filteredPosts.length / limit),
          },
          'Job posts fetched successfully '
        )
      );
      return;
    }

    // Find jobs with the specific resultLink
    const filter = {
      resultLink: {
        $elemMatch: { link: { $ne: '' } },
      },
    };

    const total = await JobPost.countDocuments(filter);

    const jobPosts = await JobPost.find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    if (!jobPosts || jobPosts.length === 0) {
      throw new ApiError(404, 'No job posts found for this result link');
    }

    // Cache the result
    if (!postName && page === 1) {
      cachedJobPostsByResultLink = await JobPost.find(filter).sort({
        createdAt: -1,
      });
      cacheTimestamp = Date.now();
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
    const limit = parseInt(req.query.limit as string) || 18;
    const skip = (page - 1) * limit;

    // Use cache if available and valid
    if (cachedJobPostsByAnswerKeyLink.length > 0 && isCacheValid()) {
      let filteredPosts = cachedJobPostsByAnswerKeyLink;
      if (postName) {
        const regex = new RegExp(postName, 'i');
        filteredPosts = filteredPosts.filter(post => regex.test(post.postName));
      }
      const paginatedPosts = filteredPosts.slice(skip, skip + limit);
      res.status(200).json(
        new ApiResponse(
          200,
          {
            jobPosts: paginatedPosts,
            total: filteredPosts.length,
            page,
            pageCount: Math.ceil(filteredPosts.length / limit),
          },
          'Job posts fetched successfully '
        )
      );
      return;
    }

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

    // Cache the result
    if (!postName && page === 1) {
      cachedJobPostsByAnswerKeyLink = await JobPost.find(filter).sort({
        createdAt: -1,
      });
      cacheTimestamp = Date.now();
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
    const limit = parseInt(req.query.limit as string) || 18;
    const skip = (page - 1) * limit;

    // Use cache if available and valid
    if (cachedJobPostsByAdmissionLink.length > 0 && isCacheValid()) {
      let filteredPosts = cachedJobPostsByAdmissionLink;
      if (searchQuery) {
        const regex = new RegExp(searchQuery, 'i');
        filteredPosts = filteredPosts.filter(
          post => regex.test(post.postName) || regex.test(post.description)
        );
      }
      const paginatedPosts = filteredPosts.slice(skip, skip + limit);
      res.status(200).json(
        new ApiResponse(
          200,
          {
            jobPosts: paginatedPosts,
            total: filteredPosts.length,
            page,
            pageCount: Math.ceil(filteredPosts.length / limit),
          },
          'Job posts fetched successfully '
        )
      );
      return;
    }

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

    if (!jobPosts || jobPosts.length === 0) {
      throw new ApiError(
        404,
        'No AdmissionLink posts found for this admission link'
      );
    }

    // Cache the result
    if (!searchQuery && page === 1) {
      cachedJobPostsByAdmissionLink = await JobPost.find(filter).sort({
        createdAt: -1,
      });
      cacheTimestamp = Date.now();
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
    const postName = req.query.postName as string | undefined;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 18;
    const skip = (page - 1) * limit;


    // Use cache if available and valid
    if (cachedJobPostsByApplyLink.length > 0 && isCacheValid()) {
      let filteredPosts = cachedJobPostsByApplyLink;
      if (postName) {
        const regex = new RegExp(postName, 'i');
        filteredPosts = filteredPosts.filter(post => regex.test(post.postName));
      }
      const paginatedPosts = filteredPosts.slice(skip, skip + limit);
      res.status(200).json(
        new ApiResponse(
          200,
          {
            jobPosts: paginatedPosts,
            total: filteredPosts.length,
            page,
            pageCount: Math.ceil(filteredPosts.length / limit),
          },
          'Job posts fetched successfully '
        )
      );
      return;
    }

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

    // Cache the result
    if (!postName && page === 1) {
      cachedJobPostsByApplyLink = await JobPost.find(filter).sort({
        createdAt: -1,
      });
      cacheTimestamp = Date.now();
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
      resultLink: {
        $elemMatch: { link: '' },
      },
      admitCardLink: {
        $elemMatch: { link: '' },
      },
      answerKeyLink: {
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

    const updatedJobPost = await JobPost.findByIdAndUpdate(
      jobPostId,
      updateData,
      {
        new: true,
      }
    );

    if (!updatedJobPost) {
      throw new ApiError(404, 'Job post not found');
    }

    clearAllCaches(); // Clear cache

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { updatedJobPost },
          'Job post updated successfully'
        )
      );
  }
);

export const getJobPostByName = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const postName = (req.params.postName as string).replace(/-/g, " ");

    // If no cache, fetch from DB
    let filter: any = { postName: { $exists: true } };
    if (postName) {
      filter.postName = postName;
    }

    const total = await JobPost.countDocuments(filter);
    const jobPosts = await JobPost.find(filter)

    res.status(200).json(
      new ApiResponse(
        200,
        {
          jobPosts,
        },
        'Job posts fetched successfully'
      )
    );
  }
);
