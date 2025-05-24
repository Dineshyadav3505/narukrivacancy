"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobPost = void 0;
const mongoose_1 = __importStar(require("mongoose"));
// Sub-schemas for array fields
const labelDateSchema = new mongoose_1.Schema({
    label: { type: String, trim: true },
    date: { type: String, trim: true }
}, { _id: false });
const labelFeeSchema = new mongoose_1.Schema({
    label: { type: String, trim: true },
    fee: { type: String, trim: true }
}, { _id: false });
const labelAgeSchema = new mongoose_1.Schema({
    label: { type: String, trim: true },
    age: { type: String, trim: true }
}, { _id: false });
const labelLinkSchema = new mongoose_1.Schema({
    label: { type: String, trim: true },
    link: { type: String, trim: true }
}, { _id: false });
const informationInnerSchema = new mongoose_1.Schema({
    values: {
        type: [[[String]]], // 3D array of strings
        required: true
    }
}, { _id: false });
const informationSectionSchema = new mongoose_1.Schema({
    informationName: { type: String, trim: true },
    Information: [informationInnerSchema]
}, { _id: false });
const jobPostSchema = new mongoose_1.Schema({
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
}, {
    timestamps: true
});
exports.JobPost = mongoose_1.default.model('jobPost', jobPostSchema);
