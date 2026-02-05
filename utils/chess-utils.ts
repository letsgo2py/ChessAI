export const getPieceColor = (piece: string): 'w' | 'b' | null => {
  if (!piece) return null;
  return piece[0] === 'w' ? 'w' : 'b';
};