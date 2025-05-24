"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const db_config_1 = require("./config/db.config");
const app_1 = require("./app");
dotenv_1.default.config({
    path: "./.env"
});
(0, db_config_1.connectDB)()
    .then(() => {
    app_1.app.on("error", (error) => {
        console.log(error);
        throw error;
    });
    app_1.app.listen(process.env.PORT, () => {
        console.log(`Server is running at PORT : ${process.env.PORT}`);
    });
})
    .catch((error) => {
    console.log("MONGODB Connection failed :", error);
});
