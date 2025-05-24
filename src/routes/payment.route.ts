import { Router } from 'express';
import { makePayment } from '../controllers/payment.controller';

const paymentRouter = Router();

paymentRouter.route('/makePayment').post(makePayment);


export { paymentRouter };
