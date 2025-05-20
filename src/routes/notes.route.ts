import { Router } from 'express';
import { verifyJWT } from '../Middleware/auth.middleware';
import { createNotes, getAllNotes, getNotesById, updateNotesById, deleteNotesById } from '../controllers/notes.controller';

export const notesRouter = Router();

notesRouter.post('/create', verifyJWT, createNotes)
notesRouter.get('/allNote', getAllNotes)
notesRouter.get('/:Id', verifyJWT, getNotesById)
notesRouter.put('/:Id', verifyJWT, updateNotesById)
notesRouter.delete('/:Id', verifyJWT, deleteNotesById)