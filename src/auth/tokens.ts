import jwt from 'jsonwebtoken';

const exampleSecret = 'SKIFT_DENNE_TIL_EN_LANG_TILFAELDIG_HEMMELIG_NOEGLE';

export interface Claims {
  userId: number;
}

function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32
    || secret === exampleSecret) {
    throw new Error('JWT_SECRET skal være mindst 32 tilfældige tegn'); // Serveren skal have sin egen nøgle
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
    const secret = process.env.JWT_SECRET;
    if (!secret || secret.length < 32 || secret === exampleSecret) throw error;
    return undefined; // Ugyldigt eller udløbet token
  }
}
