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
exports.sendEmail = sendEmail;
const nodemailer_1 = __importDefault(require("nodemailer"));
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables from .env file
dotenv_1.default.config({ path: "./.env" });
// Get email credentials from environment variables
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
// Throw a clear error if credentials are missing
if (!EMAIL_USER || !EMAIL_PASS) {
    throw new Error("EMAIL_USER and EMAIL_PASS must be set in your .env file");
}
// Create a reusable transporter object using Gmail SMTP
const transporter = nodemailer_1.default.createTransport({
    service: "hostinger",
    host: "smtp.hostinger.com",
    port: 465,
    secure: true, // use SSL
    auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS,
    },
    tls: {
        rejectUnauthorized: false, // allow self-signed certs (optional)
    },
});
/**
 * Send an email using the configured transporter
 * @param mailOptions SendMailOptions
 * @returns Promise<boolean>
 */
function sendEmail(mailOptions) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Validate the recipient
            if (!mailOptions.to) {
                throw new Error("Recipient email (to) is required in mailOptions");
            }
            // Set a default "from" address if not provided
            if (!mailOptions.from) {
                mailOptions.from = EMAIL_USER;
            }
            // Send the email
            yield transporter.sendMail(mailOptions);
            return true;
        }
        catch (error) {
            return false;
        }
    });
}
