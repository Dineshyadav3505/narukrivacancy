import { asyncHandler } from '../utils/asyncHandler.utils';
import { ApiError } from '../utils/apiError';
import { NextFunction, Request, Response } from 'express';
import Razorpay from 'razorpay';
import { PaymentModel } from '../Models/payment.model';

export const makePayment = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });

    const { amount } = req.body;

    if (!amount) throw new ApiError(404, 'Price not found');

    const options = {
      amount: amount * 100,
      currency: 'INR',
      receipt: `receipt_order_${Date.now()}`,
    };

    try {
      const order = await razorpay.orders.create(options);
      if (!order) {
        throw new ApiError(404, 'Failed to create order');
      }
      // Save the order to the database
      const paymentData = {
        id: order.id,
        amount: order.amount,
        amount_paid: order.amount_paid,
        attempts: order.attempts,
        created_at: order.created_at,
        currency: order.currency,
        receipt: order.receipt,
      };
      const payment = new PaymentModel(paymentData);
      await payment.save();

      if (!payment) {
        throw new ApiError(404, 'Failed to save payment data');
      }

      res.status(200).json({
        status: true,
        message: 'Order created successfully',
        order,
      });
    } catch (error) {
      throw new ApiError(404, 'Failed to create order');
    }
  }
);
