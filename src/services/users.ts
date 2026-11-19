import { findUserById, changeUsername, changePassword, deleteUser } from '../data/users.js';
import { hashPassword, verifyPassword } from '../auth/passwords.js';
import { ApiError } from '../middleware/errorHandler.js';

export function userDto(user: { user_id: number; username: string }) {
  const uri = `/api/users/${user.user_id}`;
  return {
    uri,
    username: user.username,
    bookmarksUri: `${uri}/bookmarks`,
    searchHistoryUri: `${uri}/search-history`,
    ratingHistoryUri: `${uri}/ratings`
  }; // Kun det som frontend må se, aldrig password_hash
}

export async function getUser(id: number) {
  const user = await findUserById(id);
  if (!user) throw new ApiError(404, 'User not found');
  return userDto(user);
}

export async function updateUsername(id: number, username: string) {
  if (!await changeUsername(id, username)) throw new ApiError(404, 'User not found');
  return getUser(id);
}

export async function updatePassword(id: number, currentPassword: string, newPassword: string) {
  const user = await findUserById(id);
  if (!user) throw new ApiError(404, 'User not found');
  if (!await verifyPassword(currentPassword, user.password_hash)) {
    throw new ApiError(401, 'Wrong current password');
  }

  const hash = await hashPassword(newPassword); // Gemmer kun den nye hash
  if (!await changePassword(id, hash)) throw new ApiError(404, 'User not found');
  return getUser(id);
}

export async function removeUser(id: number) {
  if (!await deleteUser(id)) throw new ApiError(404, 'User not found');
}
