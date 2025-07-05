import crypto from 'crypto';

export const generateChecksum = (payload: string, endpoint: string): string => {
  const saltKey = process.env.PHONEPE_SALT_KEY;
  const saltIndex = process.env.PHONEPE_SALT_INDEX || '1';
  
  if (!saltKey) {
    throw new Error('PHONEPE_SALT_KEY environment variable is required');
  }

  const concatenatedString = payload + endpoint + saltKey;
  const hash = crypto.createHash('sha256').update(concatenatedString).digest('hex');
  
  return hash + '###' + saltIndex;
}; 