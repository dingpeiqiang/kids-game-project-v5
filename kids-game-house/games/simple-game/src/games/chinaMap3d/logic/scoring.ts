import { GAME_CONFIG } from '../config';
import { GeoPoint, ScoreResult } from '../types';

const EARTH_RADIUS = 6371000;

export function calculateDistance(point1: GeoPoint, point2: GeoPoint): number {
  const lat1 = (point1.lat * Math.PI) / 180;
  const lng1 = (point1.lng * Math.PI) / 180;
  const lat2 = (point2.lat * Math.PI) / 180;
  const lng2 = (point2.lng * Math.PI) / 180;

  const dLat = lat2 - lat1;
  const dLng = lng2 - lng1;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS * c;
}

export function calculateScore(playerPoint: GeoPoint, targetPoint: GeoPoint): ScoreResult {
  const distance = calculateDistance(playerPoint, targetPoint);

  let score: number;
  let rating: 'perfect' | 'excellent' | 'good' | 'fail';

  if (distance <= GAME_CONFIG.SCORE.PERFECT_THRESHOLD) {
    score = GAME_CONFIG.SCORE.PERFECT_SCORE;
    rating = 'perfect';
  } else if (distance <= GAME_CONFIG.SCORE.EXCELLENT_THRESHOLD) {
    score = GAME_CONFIG.SCORE.EXCELLENT_SCORE + Math.floor((GAME_CONFIG.SCORE.EXCELLENT_THRESHOLD - distance) / 30);
    rating = 'excellent';
  } else if (distance <= GAME_CONFIG.SCORE.GOOD_THRESHOLD) {
    score = GAME_CONFIG.SCORE.GOOD_SCORE + Math.floor((GAME_CONFIG.SCORE.GOOD_THRESHOLD - distance) / 50);
    rating = 'good';
  } else {
    const maxDistance = calculateDistance(
      { lat: GAME_CONFIG.MAP.LAT_MIN, lng: GAME_CONFIG.MAP.LNG_MIN },
      { lat: GAME_CONFIG.MAP.LAT_MAX, lng: GAME_CONFIG.MAP.LNG_MAX }
    );
    score = Math.max(0, Math.floor((1 - distance / maxDistance) * GAME_CONFIG.SCORE.GOOD_SCORE));
    rating = 'fail';
  }

  return { score, rating, distance };
}

export function calculateTimeBonus(timeRemaining: number): number {
  if (timeRemaining > GAME_CONFIG.TIME_BONUS.threshold) {
    return Math.floor((timeRemaining - GAME_CONFIG.TIME_BONUS.threshold) * GAME_CONFIG.TIME_BONUS.multiplier);
  }
  return 0;
}

export function isPassingScore(score: number): boolean {
  return score >= GAME_CONFIG.PASS_SCORE;
}