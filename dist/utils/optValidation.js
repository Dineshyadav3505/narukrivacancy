"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateVerificationCode = generateVerificationCode;
exports.storeVerificationEmailCode = storeVerificationEmailCode;
exports.storeVerificationPhoneCode = storeVerificationPhoneCode;
exports.verifyCode = verifyCode;
exports.verifyPhoneCode = verifyPhoneCode;
exports.cleanupExpiredCodes = cleanupExpiredCodes;
// Initialize the codes object
const codes = {};
// Set the expiration time for verification codes (in milliseconds)
const CODE_EXPIRATION_TIME = 10 * 60 * 1000; // 10 minutes
function generateVerificationCode() {
    return Math.floor(100000 + Math.random() * 9000).toString();
}
function storeVerificationEmailCode(email, code) {
    codes[email] = {
        code,
        expiresAt: Date.now() + CODE_EXPIRATION_TIME,
    };
}
function storeVerificationPhoneCode(phone, code) {
    codes[phone] = {
        code,
        expiresAt: Date.now() + CODE_EXPIRATION_TIME,
    };
}
function verifyCode(email, code) {
    const storedData = codes[email];
    if (storedData &&
        storedData.code === code &&
        Date.now() < storedData.expiresAt) {
        delete codes[email]; // Remove the code after successful verification
        return true;
    }
    return false;
}
function verifyPhoneCode(phone, code) {
    const storedData = codes[phone];
    if (storedData &&
        storedData.code === code &&
        Date.now() < storedData.expiresAt) {
        delete codes[phone]; // Remove the code after successful verification
        return true;
    }
    return false;
}
function cleanupExpiredCodes() {
    const now = Date.now();
    for (const key in codes) {
        if (codes[key].expiresAt < now) {
            delete codes[key];
        }
    }
}
// Run cleanup periodically (e.g., every hour)
setInterval(cleanupExpiredCodes, 60 * 60 * 1000);
