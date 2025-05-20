import mongoose, { Schema, Model } from 'mongoose';

export interface notesInterface {
  title: string;
  description: string;
  details: string;
  link: string;
  price: number;
}

const notesSchema = new Schema<notesInterface>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    details: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
    },
    link: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

export const NotesModel: Model<notesInterface> = mongoose.model<notesInterface>(
  'notesPost',
  notesSchema
);
