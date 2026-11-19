import bcrypt from 'bcryptjs';

export function validPassword(password: unknown): password is string {
  return typeof password === 'string'
    && password.length >= 8
    && Buffer.byteLength(password, 'utf8') <= 72
    && /[A-Za-zÆØÅæøå]/.test(password)
    && /[0-9]/.test(password); // Mindst et bogstav og et tal
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12); // Laver salt og hash, aldrig gem adgangskoden
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash); // Tjekker adgangskoden mod den gemte hash
}
