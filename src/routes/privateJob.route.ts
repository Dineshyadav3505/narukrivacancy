import { Router } from 'express';
import { createPrivateJob, deletePrivateJobPostById, getAllPrivateJob, getAllPrivateJobById, updatePrivateJobPostById,  } from "../controllers/privateJob.controller";
import { verifyJWT } from '../Middleware/auth.middleware';


export const privateJobRouter = Router();

privateJobRouter.post('/create', verifyJWT, createPrivateJob )
privateJobRouter.get('/allJob', getAllPrivateJob )
privateJobRouter.get('/:Id', verifyJWT, getAllPrivateJobById )
privateJobRouter.put('/:Id', verifyJWT,  updatePrivateJobPostById )
privateJobRouter.delete('/:Id', verifyJWT, deletePrivateJobPostById )
