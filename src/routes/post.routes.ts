import { Router } from 'express';
import {
  createJobPost,
  getAllJobPosts,
  getJobPostById,
  updateJobPostById,
  deleteJobPostById,
  getJobPostByState,
  getJobPostByAdmitCardLink,
  getJobPostByResultLink,
  getJobPostByAnswerKeyLink,
  getJobPostByAdmissionLink,
  getJobPostByApplyLink,
  getJobWithoutApplyLink,
  getJobPostByName,
} from '../controllers/post.controller';
import { verifyJWT } from '../Middleware/auth.middleware';

const jobPostRouter = Router();

jobPostRouter.route('/create').post(verifyJWT, createJobPost);
jobPostRouter.route('/getAll').get(getAllJobPosts);
jobPostRouter.route('/state').get(getJobPostByState);
jobPostRouter.route('/job/:postName').get(getJobPostByName);
jobPostRouter.route('/AdmitCard').get(getJobPostByAdmitCardLink);
jobPostRouter.route('/ResultLink').get(getJobPostByResultLink);
jobPostRouter.route('/AnswerKeyLink').get(getJobPostByAnswerKeyLink);
jobPostRouter.route('/AdmissionLink').get(getJobPostByAdmissionLink);
jobPostRouter.route('/ApplyLink').get(getJobPostByApplyLink);
jobPostRouter.route('/Upcoming').get(getJobWithoutApplyLink);
jobPostRouter.route('/:Id').put(verifyJWT, updateJobPostById);
jobPostRouter.route('/:Id').delete(verifyJWT, deleteJobPostById);
jobPostRouter.route('/:Id').get(getJobPostById);

export { jobPostRouter };
