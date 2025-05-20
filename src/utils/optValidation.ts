// Define a type for the codes object
type CodeStorage = {
  [key: string]: {
    code: string;
    expiresAt: number;
  };
};

// Initialize the codes object
const codes: CodeStorage = {};

// Set the expiration time for verification codes (in milliseconds)
const CODE_EXPIRATION_TIME = 10 * 60 * 1000; // 10 minutes

export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 9000).toString();
}

export function storeVerificationEmailCode(email: string, code: string): void {
  codes[email] = {
    code,
    expiresAt: Date.now() + CODE_EXPIRATION_TIME,
  };
}

export function storeVerificationPhoneCode(phone: string, code: string): void {
  codes[phone] = {
    code,
    expiresAt: Date.now() + CODE_EXPIRATION_TIME,
  };
}

export function verifyCode(email: string, code: string): boolean {
  const storedData = codes[email];
  if (
    storedData &&
    storedData.code === code &&
    Date.now() < storedData.expiresAt
  ) {
    delete codes[email]; // Remove the code after successful verification
    return true;
  }
  return false;
}

export function verifyPhoneCode(phone: string, code: string): boolean {
  const storedData = codes[phone];
  if (
    storedData &&
    storedData.code === code &&
    Date.now() < storedData.expiresAt
  ) {
    delete codes[phone]; // Remove the code after successful verification
    return true;
  }
  return false;
}

export function cleanupExpiredCodes(): void {
  const now = Date.now();
  for (const key in codes) {
    if (codes[key].expiresAt < now) {
      delete codes[key];
    }
  }
}

// Run cleanup periodically (e.g., every hour)
setInterval(cleanupExpiredCodes, 60 * 60 * 1000);
