import { Router } from 'express';
import { verifyJWT } from '../Middleware/auth.middleware';
import { createOfflineJob, getAllOfflineJobs, getOfflineJobById, updateOfflineJobById, deleteOfflineJobById } from '../controllers/offline.controller';

export const offlinePostRouter = Router();


offlinePostRouter.post('/create', verifyJWT, createOfflineJob )
offlinePostRouter.get('/allJob', getAllOfflineJobs )
offlinePostRouter.get('/:Id', verifyJWT, getOfflineJobById )
offlinePostRouter.put('/:Id', verifyJWT,  updateOfflineJobById )
offlinePostRouter.delete('/:Id', verifyJWT, deleteOfflineJobById )
