// Utility functions for Tactical Symbol Designer Module

export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
};

export const calculateDistance = (x1: number, y1: number, x2: number, y2: number): number => {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
};

export const findClosestPoint = (points: { x: number; y: number }[], x: number, y: number, threshold = 10): { x: number; y: number } | null => {
  let closestPoint: { x: number; y: number } | null = null;
  let minDistance = Infinity;
  
  for (const point of points) {
    const distance = calculateDistance(point.x, point.y, x, y);
    if (distance < minDistance && distance < threshold) {
      minDistance = distance;
      closestPoint = point;
    }
  }
  
  return closestPoint;
};