"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.makePayment = void 0;
const asyncHandler_utils_1 = require("../utils/asyncHandler.utils");
const apiError_1 = require("../utils/apiError");
const razorpay_1 = __importDefault(require("razorpay"));
const payment_model_1 = require("../Models/payment.model");
exports.makePayment = (0, asyncHandler_utils_1.asyncHandler)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const razorpay = new razorpay_1.default({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
    const { amount } = req.body;
    if (!amount)
        throw new apiError_1.ApiError(404, 'Price not found');
    const options = {
        amount: amount * 100,
        currency: 'INR',
        receipt: `receipt_order_${Date.now()}`,
    };
    try {
        const order = yield razorpay.orders.create(options);
        if (!order) {
            throw new apiError_1.ApiError(404, 'Failed to create order');
        }
        // Save the order to the database
        const paymentData = {
            id: order.id,
            amount: order.amount,
            amount_paid: order.amount_paid,
            attempts: order.attempts,
            created_at: order.created_at,
            currency: order.currency,
            receipt: order.receipt,
        };
        const payment = new payment_model_1.PaymentModel(paymentData);
        yield payment.save();
        if (!payment) {
            throw new apiError_1.ApiError(404, 'Failed to save payment data');
        }
        res.status(200).json({
            status: true,
            message: 'Order created successfully',
            order,
        });
    }
    catch (error) {
        throw new apiError_1.ApiError(404, 'Failed to create order');
    }
}));
