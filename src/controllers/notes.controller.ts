import { NotesModel } from '../Models/notes.model';
import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.utils';
import { ApiError } from '../utils/apiError';
import { ApiResponse } from '../utils/apiResponse.utils';

// CREATE
export const createNotes = asyncHandler(async (req: Request, res: Response) => {
  console.log("Creating a new Notes post...");
  // Authentication
  if (!req.user || req.user.role !== 'admin') {
    throw new ApiError(
      req.user ? 403 : 401,
      req.user ? 'Forbidden: Admin access required' : 'Unauthorized access'
    );
  }

  const { title, description, details, link, price } = req.body;

  // Required fields validation
  const requiredFields = ['title', 'description', 'details', 'link', 'price'];

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

  // Create a new Notes post
  const newJobPost = await NotesModel.create({
    title,
    description,
    details,
    link,
    price,
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
            'Notes created successfully'
          )
        );
    })
    .catch((error: Error) => {
      res
        .status(500)
        .json(new ApiError(500, 'Failed to create Notes'))
    });
});

// GET ALL
export const getAllNotes = asyncHandler(async (req: Request, res: Response) => {
  const searchQuery = req.query.searchQuery as string | undefined;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const skip = (page - 1) * limit;

  let filter: any = {};
  if (searchQuery) {
    filter = {
      $or: [
        { title: { $regex: searchQuery, $options: 'i' } },
        { description: { $regex: searchQuery, $options: 'i' } },
      ],
    };
  }

  const total = await NotesModel.countDocuments(filter);
  const notes = await NotesModel.find(filter)
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  res.status(200).json(
    new ApiResponse(
      200,
      {
        notes,
        total,
        page,
        pageCount: Math.ceil(total / limit),
      },
      'Notes fetched successfully'
    )
  );
});

// GET BY ID
export const getNotesById = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const note = await NotesModel.findById(id);

    if (!note) throw new ApiError(404, 'Notes not found');

    res.status(200).json(new ApiResponse(200, { note }));
  }
);

// UPDATE BY ID
export const updateNotesById = asyncHandler(
  async (req: Request, res: Response) => {

    if (!req.user) throw new ApiError(401, 'User not authenticated');
    if (req.user.role !== 'admin')
      throw new ApiError(403, 'You are not authorized to update this post.');

    const id = req.params.Id;
    const note = await NotesModel.findById(id);
    if (!note) throw new ApiError(404, 'Notes not found');

    const { title, description, details, link, price } = req.body;

    // Required fields validation
    const requiredFields = ['title', 'description', 'details', 'link', 'price'];
  
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

    const updatedNote = await NotesModel.findByIdAndUpdate(id, {
      title,
      description,
      details,
      link,
      price,
    }, { new: true });

    if (!updatedNote) throw new ApiError(500, 'Failed to update note');

    res
      .status(200)
      .json(
        new ApiResponse(200, { updatedNote }, 'Notes updated successfully')
      );
  }
);

// DELETE BY ID
export const deleteNotesById = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) throw new ApiError(401, 'User not authenticated');
    if (req.user.role !== 'admin')
      throw new ApiError(403, 'You are not authorized to delete this post.');

    const id = req.params.id;
    const deletedNote = await NotesModel.findByIdAndDelete(id);
    if (!deletedNote) throw new ApiError(404, 'Notes not found');

    res
      .status(200)
      .json(new ApiResponse(200, {}, 'Notes deleted successfully'));
  }
);
