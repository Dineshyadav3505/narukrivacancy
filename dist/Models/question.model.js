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
exports.QuestionModel = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const questionSchema = new mongoose_1.Schema({
    questionName: {
        type: String,
        required: true,
    },
    options: {
        type: [String],
        required: true,
        validate: {
            validator: function (arr) {
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
    explanation: {
        type: String,
        required: true,
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
}, {
    timestamps: true,
});
exports.QuestionModel = mongoose_1.default.model('Question', questionSchema);
