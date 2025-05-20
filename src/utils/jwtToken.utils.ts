import jwt from 'jsonwebtoken';

export const generateToken = (user: { _id: string }) => {
  const token = jwt.sign(
    { _id: user._id },
    process.env.JWT_SECRET as jwt.Secret,
    {
      expiresIn: '24h',
    }
  );
  return token;
};

export const options = {
  httpOnly: true,
  secure: true,
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day from now
  // OR, using maxAge (in seconds):
  // maxAge: 24 * 60 * 60 // 1 day in seconds
};

