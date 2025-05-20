import mongoose, { Schema, Document } from 'mongoose';

export interface QuizzesInterface extends Document {
  title: string;
  description: string;
  date: Date;
  totalQuestions: number;
  winningAmount: number | string;
  price: number | string;
  durationMinutes: number;
  category: string;
  startDateTime: Date;
  expireDateTime: Date;
}

const quizzesSchema = new Schema<QuizzesInterface>(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
      required: true,
    },
    totalQuestions: {
      type: Number,
      required: true,
    },
    winningAmount: {
      type: Schema.Types.Mixed,
      required: true,
    },
    price: {
      type: Schema.Types.Mixed,
      required: true,
    },
    durationMinutes: {
      type: Number,
      required: true,
    },
    category: {
      type: String,
      enum: ['Free', 'Quizzes', 'Mock'],
      default: 'Free',
      required: true,
    },
    startDateTime: {
      type: Date,
      default: Date.now,
      required: true,
    },
    expireDateTime: {
      type: Date,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      required: true,    
    },
  },
  {
    timestamps: true,
  }
);

export const Quizzes = mongoose.model<QuizzesInterface>(
  'Quizzes',
  quizzesSchema
);
