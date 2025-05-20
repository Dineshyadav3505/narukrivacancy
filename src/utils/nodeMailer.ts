import nodemailer, { Transporter, SendMailOptions } from "nodemailer";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config({ path: "./.env" });

// Get email credentials from environment variables
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;

// Throw a clear error if credentials are missing
if (!EMAIL_USER || !EMAIL_PASS) {
  throw new Error("EMAIL_USER and EMAIL_PASS must be set in your .env file");
}

// Create a reusable transporter object using Gmail SMTP
const transporter: Transporter = nodemailer.createTransport({
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
export async function sendEmail(mailOptions: SendMailOptions): Promise<boolean> {
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
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    return false;
  }
}
