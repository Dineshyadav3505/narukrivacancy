import mongoose, { Schema } from 'mongoose';

export interface paymentInterface {
  id: string;
  amount: string;
  amount_paid: string;
  attempts: string;
  created_at: string;
  currency: string;
  receipt: string;
  transactionId?: string;
  status?: string;
  phone?: string;
}

export const PaymentSchema = new Schema<paymentInterface>(
  {
    id: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: String,
      required: true,
      trim: true,
    },
    amount_paid: {
      type: String,
      required: true,
      trim: true,
    },
    attempts: {
      type: String,
      required: true,
      trim: true,
    },
    created_at: {
      type: String,
      required: true,
      trim: true,
    },
    currency: {
      type: String,
      required: true,
      trim: true,
    },
    receipt: {
      type: String,
      required: true,
      trim: true,
    },
    transactionId: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

export const PaymentModel = mongoose.model<paymentInterface>(
  'Payment',
  PaymentSchema
);
