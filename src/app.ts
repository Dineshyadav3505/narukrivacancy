import express from "express"

import cors from "cors"
import cookieParser from "cookie-parser";
import { userRouter } from "./routes/user.routes";
import { jobPostRouter } from "./routes/post.routes";
import { quizzesRouter } from "./routes/quizzes.routes";
import { privateJobRouter } from "./routes/privateJob.route";
import { offlinePostRouter } from "./routes/offline.route";
import { questionRouter } from "./routes/question.routes";
import { notesRouter } from "./routes/notes.route";



const app = express();


                 // Middlewares configuration //
////////////////////////////////////////////////////////////////
app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true})); 

app.use(express.json({limit: "30kb"}))

app.use(express.urlencoded({ extended: true, limit: "100mb"}));

app.use(express.static("Public"));

app.use(cookieParser());

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors());


// Add more routes as needed
app.use('/api/v1', userRouter);
app.use('/api/v1', jobPostRouter);
app.use("/api/v1/quizzes", quizzesRouter);
app.use("/api/v1/privateJob", privateJobRouter);
app.use("/api/v1/offlineJob", offlinePostRouter);
app.use("/api/v1/notes", notesRouter);
app.use("/api/v1/question", questionRouter)


export {app}; 