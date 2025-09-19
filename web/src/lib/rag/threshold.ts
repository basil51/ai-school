import { HybridResult } from "./query";

export interface ThresholdConfig {
  minSimilarity: number;
  minScore: number;
  maxResults: number;
}

export const DEFAULT_THRESHOLD_CONFIG: ThresholdConfig = {
  minSimilarity: 0.7,
  minScore: 0.5,
  maxResults: 10,
};

/**
 * Apply similarity thresholding to filter out low-quality results
 */
export function applyThresholding(
  results: HybridResult[],
  config: ThresholdConfig = DEFAULT_THRESHOLD_CONFIG
): HybridResult[] {
  return results
    .filter(result => result.similarity >= config.minSimilarity)
    .filter(result => result.score >= config.minScore)
    .slice(0, config.maxResults);
}

/**
 * Re-rank results using a combination of similarity and score
 */
export function reRankResults(results: HybridResult[]): HybridResult[] {
  return results
    .map(result => ({
      ...result,
      // Boost score based on similarity
      finalScore: result.score * 0.7 + result.similarity * 0.3,
    }))
    .sort((a, b) => (b.finalScore || 0) - (a.finalScore || 0))
    .map(({ finalScore: _finalScore, ...result }) => result); // Remove finalScore from output
}

/**
 * Apply both thresholding and re-ranking
 */
export function processResults(
  results: HybridResult[],
  config: ThresholdConfig = DEFAULT_THRESHOLD_CONFIG
): HybridResult[] {
  const thresholded = applyThresholding(results, config);
  return reRankResults(thresholded);
}

/**
 * Dynamic thresholding based on result quality distribution
 */
export function adaptiveThresholding(results: HybridResult[]): HybridResult[] {
  if (results.length === 0) return results;
  
  // Calculate statistics
  const similarities = results.map(r => r.similarity);
  const scores = results.map(r => r.score);
  
  const avgSimilarity = similarities.reduce((a, b) => a + b, 0) / similarities.length;
  const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
  
  // Use adaptive thresholds based on result quality
  const adaptiveConfig: ThresholdConfig = {
    minSimilarity: Math.max(0.5, avgSimilarity * 0.8),
    minScore: Math.max(0.3, avgScore * 0.8),
    maxResults: Math.min(10, Math.max(3, results.length)),
  };
  
  return applyThresholding(results, adaptiveConfig);
}
