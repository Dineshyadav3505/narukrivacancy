import mongoose, { Schema, Document } from 'mongoose';

export interface JobPostInterface extends Document {
  postName: string;
  description: string;
  notificationLink: string;
  importantDates: { label: string; date: string }[];
  applicationFee: { label: string; fee: string }[];
  ageLimit: { label: string; age: string }[];
  resultLink: { label: string; link: string }[];
  admitCardLink: { label: string; link: string }[];
  answerKeyLink: { label: string; link: string }[];
  admissionLink: { label: string; link: string }[];
  applyLink: { label: string; link: string }[];
  informationSections: {
    informationName: string;
    Information: {
      values: string[][][]; 
    }[];
  }[];
  state: string;
  beginDate: Date;
  lastDate?: Date;
  totalPost: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Sub-schemas for array fields
const labelDateSchema = new Schema(
  {
    label: { type: String, trim: true },
    date: { type: String, trim: true }
  },
  { _id: false }
);

const labelFeeSchema = new Schema(
  {
    label: { type: String, trim: true },
    fee: { type: String, trim: true }
  },
  { _id: false }
);

const labelAgeSchema = new Schema(
  {
    label: { type: String, trim: true },
    age: { type: String, trim: true }
  },
  { _id: false }
);

const labelLinkSchema = new Schema(
  {
    label: { type: String, trim: true },
    link: { type: String, trim: true }
  },
  { _id: false }
);

const informationInnerSchema = new Schema(
  {
    values: {
      type: [[[String]]], // 3D array of strings
      required: true
    }
  },
  { _id: false }
);

const informationSectionSchema = new Schema(
  {
    informationName: { type: String, trim: true },
    Information: [informationInnerSchema]
  },
  { _id: false }
);

const jobPostSchema = new Schema<JobPostInterface>(
  {
    postName: { type: String, required: true, index: true, trim: true },
    description: { type: String, required: true, trim: true },
    notificationLink: { type: String, required: true, trim: true },
    importantDates: [labelDateSchema],
    applicationFee: [labelFeeSchema],
    ageLimit: [labelAgeSchema],
    resultLink: [labelLinkSchema],
    admitCardLink: [labelLinkSchema],
    answerKeyLink: [labelLinkSchema],
    admissionLink: [labelLinkSchema],
    applyLink: [labelLinkSchema],
    informationSections: [informationSectionSchema],
    state: { type: String, trim: true },
    beginDate: { type: Date, required: true },
    lastDate: { type: Date },
    totalPost: { type: String, trim: true }
  },
  {
    timestamps: true
  }
);

export const JobPost = mongoose.model<JobPostInterface>(
  'jobPost',
  jobPostSchema
);
