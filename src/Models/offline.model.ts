import mongoose, { Schema } from 'mongoose';

export interface OfflinePostInterface {
  postName: string;
  description: string;
  qualification: string;
  ageLimit: string;
  lastDate:Date;
  details: string;
  link:string;
}

export const OfflinePostSchema = new Schema<OfflinePostInterface>(
  {
    postName: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    qualification: {
      type: String,
      required: true,
      trim: true,
    },
    ageLimit: {
      type: String,
      required: true,
      trim: true,
    },
    lastDate: { 
      type: Date, 
      required: true,
    },
    details:{
      type: String,
      required: true,
      trim: true,
    },
    link:{
      type: String,
      required: true,
      trim: true,
    }
  },
  { timestamps: true }
);

export const OfflinePostModel = mongoose.model<OfflinePostInterface>(
  'OfflinePost',
  OfflinePostSchema
);
