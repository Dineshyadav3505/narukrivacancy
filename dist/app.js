"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const user_routes_1 = require("./routes/user.routes");
const post_routes_1 = require("./routes/post.routes");
const quizzes_routes_1 = require("./routes/quizzes.routes");
const privateJob_route_1 = require("./routes/privateJob.route");
const offline_route_1 = require("./routes/offline.route");
const question_routes_1 = require("./routes/question.routes");
const notes_route_1 = require("./routes/notes.route");
const payment_route_1 = require("./routes/payment.route");
const app = (0, express_1.default)();
exports.app = app;
// Middlewares configuration //
////////////////////////////////////////////////////////////////
app.use((0, cors_1.default)({ origin: process.env.CORS_ORIGIN, credentials: true }));
app.use(express_1.default.json({ limit: "30kb" }));
app.use(express_1.default.urlencoded({ extended: true, limit: "100mb" }));
app.use(express_1.default.static("Public"));
app.use((0, cookie_parser_1.default)());
// Middleware
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
app.use((0, cors_1.default)());
// Add more routes as needed
app.use('/api/v1', user_routes_1.userRouter);
app.use('/api/v1', post_routes_1.jobPostRouter);
app.use("/api/v1/quizzes", quizzes_routes_1.quizzesRouter);
app.use("/api/v1/privateJob", privateJob_route_1.privateJobRouter);
app.use("/api/v1/offlineJob", offline_route_1.offlinePostRouter);
app.use("/api/v1/notes", notes_route_1.notesRouter);
app.use("/api/v1/question", question_routes_1.questionRouter);
app.use("/api/v1/payment", payment_route_1.paymentRouter);
