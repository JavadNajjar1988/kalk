export function toggleFavorite({ emitter, id, favorite, notify }) {
  const nextFavorite = !favorite
  notify({ id, favorite: nextFavorite })
  emitter.emit(nextFavorite ? 'pin' : 'unpin', { id })
  return nextFavorite
}
