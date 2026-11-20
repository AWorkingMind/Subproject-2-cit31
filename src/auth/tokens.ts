import jwt from 'jsonwebtoken';
import type { Claims } from '../types/Claims.js';

function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET skal mindst vaere 32 tegn'); // Serveren skal have sin egen nøgle
  }
  return secret;
}

export function signToken(userId: number): string {
  return jwt.sign({ userId }, getSecret(), { expiresIn: '1h', algorithm: 'HS256' }); // 1 time
}

export function verifyToken(token: string): Claims | undefined {
  try {
    const data = jwt.verify(token, getSecret(), { algorithms: ['HS256'] }); // Tjekker signatur og udløb
    if (typeof data === 'string' || !Number.isSafeInteger(data.userId) || data.userId <= 0) {
      return undefined; // Token mangler et rigtigt bruger-id
    }
    return { userId: data.userId };
  } catch (error) {
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) throw error;
    return undefined; // Ugyldigt eller udløbet token
  }
}
