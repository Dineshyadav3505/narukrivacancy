import mongoose, { Schema } from 'mongoose';
export interface PrivateJobInterface {
    postName: string;
    description:string;
    location:string;
    Requirement:[
        {
            title:string;
        }
    ],
    salary:string,
    jobRole:string;
    Benefits:[
        {
            title:string;
        }
    ],
}


const privateJobSchema = new Schema<PrivateJobInterface>({
    postName: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    location: {
        type: String,
        required: true
    },
    jobRole:{
        type: String,
        required: true
    },
    Requirement: {
        type: [{
            title: {
                type: String,
            }
        }],
    },
    salary: {
        type: String,
        default: "Not Disclosed"
    },
    Benefits: {
        type: [{
            title: {
                type: String,
            }
        }],
    },
}, {
    timestamps: true
});

export const PrivateJobModel = mongoose.model<PrivateJobInterface>('PrivateJob', privateJobSchema);
