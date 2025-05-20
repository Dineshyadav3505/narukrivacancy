import mongoose, { Schema, Document } from 'mongoose';

export interface questionInterface extends Document {
  questionName: string;
  options: string[];
  correctOption: number;
  level: string;
  marks: number;
  negativeMarks: number;
  category: string;
}

const questionSchema = new Schema<questionInterface>(
  {
    questionName: {
      type: String,
      required: true,
    },
    options: {
      type: [String],
      required: true,
      validate: {
        validator: function (arr: string[]) {
          return Array.isArray(arr) && arr.length === 4;
        },
        message: 'Each question must have exactly 4 options.',
      },
    },
    correctOption: {
      type: Number,
      required: true,
      min: 0,
      max: 3,
    },
    level: {
      type: String,
      enum: ['Easy', 'Moderate', 'Difficult'],
      default: 'Easy',
      required: true,
    },
    category: {
      type: String,
      enum: ['Free', 'Quizzes', 'Mock'],
      default: 'Free',
      required: true,
    },
    marks: {
      type: Number,
      required: true,
    },
    negativeMarks: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export const QuestionModel = mongoose.model<questionInterface>(
  'Question',
  questionSchema
);
