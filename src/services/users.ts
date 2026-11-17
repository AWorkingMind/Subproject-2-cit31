import { findUserById, changeUsername, deleteUser } from '../data/users.js';
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

export async function removeUser(id: number) {
  if (!await deleteUser(id)) throw new ApiError(404, 'User not found');
}
