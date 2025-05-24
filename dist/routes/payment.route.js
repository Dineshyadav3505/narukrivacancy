"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentRouter = void 0;
const express_1 = require("express");
const payment_controller_1 = require("../controllers/payment.controller");
const paymentRouter = (0, express_1.Router)();
exports.paymentRouter = paymentRouter;
paymentRouter.route('/makePayment').post(payment_controller_1.makePayment);
