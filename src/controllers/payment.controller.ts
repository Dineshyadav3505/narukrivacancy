import { Request, Response } from 'express';
import { PaymentModel } from '../Models/payment.model';
import axios from 'axios';
import { generateChecksum } from '../utils/checksum.utils';

// Helper to get callback URL
const getCallbackUrl = () =>
  `${process.env.PROJECT_URL || 'http://localhost:3456/api/v1'}/payment/callback`;

export const makePayment = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { phone, amount, notes } = req.body;
    if (!phone || !amount || !notes) {
      res
        .status(400)
        .json({ success: false, message: 'Phone and amount required' });
      return;
    }

    const numericAmount = Number(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      res.status(400).json({ success: false, message: 'Invalid amount' });
      return;
    }

    const orderId = `ORDER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const jobLink = notes.jobLink ? notes.jobLink : '/Quiz/' + notes.Id;

    // Encode jobLink in the callback URL
    const encodedJobLink = encodeURIComponent(jobLink);
    const callbackUrl = `${getCallbackUrl()}?jobLink=${encodedJobLink}`;

    // Save payment record without jobLink

    await new PaymentModel({
      id: orderId,
      amount: amount.toString(),
      amount_paid: '0',
      attempts: '0',
      created_at: new Date().toISOString(),
      currency: 'INR',
      receipt: `receipt_${orderId}`,
      transactionId: orderId,
      status: 'PENDING',
      phone,
    }).save();

    const paymentPayload = {
      merchantId: process.env.PHONEPE_MERCHANT_ID,
      merchantUserId: '1',
      mobileNumber: phone,
      amount: numericAmount * 100,
      merchantTransactionId: orderId,
      jobLink: jobLink,
      receipt: `receipt_${orderId}`,
      redirectUrl: callbackUrl,
      redirectMode: 'POST',
      callbackUrl: callbackUrl,
      paymentInstrument: { type: 'PAY_PAGE' },
    };

    const payload = Buffer.from(JSON.stringify(paymentPayload)).toString(
      'base64'
    );
    const checksum = generateChecksum(payload, '/pg/v1/pay');

    const phonepeApiUrl =
      process.env.NODE_ENV === 'production'
        ? 'https://api.phonepe.com/apis/hermes/pg/v1/pay'
        : 'https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/pay';

    const response = await axios.post(
      phonepeApiUrl,
      { request: payload },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-VERIFY': checksum,
          'X-MERCHANT-ID': process.env.PHONEPE_MERCHANT_ID!,
        },
        timeout: 30000,
      }
    );

    const redirectUrl =
      response.data?.data?.instrumentResponse?.redirectInfo?.url;
    if (!redirectUrl) {
      res
        .status(500)
        .json({ success: false, message: 'No redirect URL from PhonePe' });
      return;
    }

    res.json({
      success: true,
      redirectUrl,
      transactionId: orderId,
      message: 'Payment order created successfully',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// This is the callback endpoint PhonePe will POST to after payment
export const paymentCallback = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {

    // PhonePe will send payment status and merchantTransactionId
    const { transactionId, code } = req.body;

    // Get jobLink from URL query parameters
    const jobLink = req.query.jobLink as string;

    const payment = await PaymentModel.findOne({
      transactionId: transactionId,
    });

    if (!payment) {
      res.status(404).send('Payment not found');
      return;
    }

    // Update payment status
    payment.status = code === 'PAYMENT_SUCCESS' ? 'SUCCESS' : 'FAILED';
    await payment.save();

    // Redirect user to job link if payment was successful
    if (payment.status === 'SUCCESS' && jobLink) {
      if (jobLink.startsWith('Quiz')) {
        res.redirect(`${process.env.PROJECT_frontend_URL}${jobLink}`);
        return;
      }
      res.redirect(decodeURIComponent(jobLink));
      return;
    }

    // Otherwise, redirect to a generic failure page
    res.redirect(`${process.env.PROJECT_URL}/payment/failed`);
  } catch (err) {
    res.redirect(`${process.env.PROJECT_URL}/payment/failed`);
  }
};
