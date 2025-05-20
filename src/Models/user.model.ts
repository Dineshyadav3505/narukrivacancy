import mongoose, { Schema } from 'mongoose';

export interface userInterface {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  subscribe: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const userSchema = new Schema<userInterface>(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      minlength: 2,
      maxlength: 20,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      minlength: 2,
      maxlength: 20,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      validate: {
        validator: function (v: string) {
          return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(v);
        },
        message: (props: { value: string }) =>
          `${props.value} is not a valid email!`,
      },
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: function (v: string) {
          return /^\d{10}$/.test(v);
        },
        message: (props: { value: string }) =>
          `${props.value} is not a valid phone number!`,
      },
      unique: true,
      minlength: 10,
      maxlength: 10,
    },
    subscribe: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      enum: ['admin', 'user'],
      default: 'user',
      required: true, 
    },
  },
  {
    timestamps: true,
  }
);

export const User = mongoose.model<userInterface>('User', userSchema);
