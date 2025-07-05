import { Router } from 'express';
import { makePayment, paymentCallback } from '../controllers/payment.controller';

const paymentRouter = Router();

paymentRouter.route('/initialize-payment').post(makePayment);
paymentRouter.route('/callback').post(paymentCallback);

export { paymentRouter };
