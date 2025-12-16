/**
 * A/B Testing Service for Ads
 * 
 * Provides functionality to test different ad variants and automatically
 * select the best performing one based on CTR (Click-Through Rate).
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const AB_TEST_PREFIX = 'ab_test_';
const AB_TEST_RESULTS_KEY = 'ab_test_results';

export type AdVariant = {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  linkUrl: string;
  impressions: number;
  clicks: number;
};

export type ABTest = {
  id: string;
  name: string;
  adId: string;
  variants: AdVariant[];
  status: 'running' | 'completed' | 'paused';
  startDate: string;
  endDate?: string;
  winnerVariantId?: string;
  minimumImpressions: number;
  confidenceLevel: number; // 0.9 = 90%, 0.95 = 95%
};

export type ABTestResult = {
  testId: string;
  variantId: string;
  impressions: number;
  clicks: number;
  ctr: number;
  isWinner: boolean;
  confidence: number;
};

/**
 * Create a new A/B test
 */
export async function createABTest(
  name: string,
  adId: string,
  variants: Omit<AdVariant, 'impressions' | 'clicks'>[],
  options?: {
    minimumImpressions?: number;
    confidenceLevel?: number;
  }
): Promise<ABTest> {
  const test: ABTest = {
    id: `test_${Date.now()}`,
    name,
    adId,
    variants: variants.map((v) => ({
      ...v,
      impressions: 0,
      clicks: 0,
    })),
    status: 'running',
    startDate: new Date().toISOString(),
    minimumImpressions: options?.minimumImpressions || 100,
    confidenceLevel: options?.confidenceLevel || 0.95,
  };

  await saveABTest(test);
  return test;
}

/**
 * Save A/B test to storage
 */
async function saveABTest(test: ABTest): Promise<void> {
  try {
    await AsyncStorage.setItem(`${AB_TEST_PREFIX}${test.id}`, JSON.stringify(test));
  } catch (error) {
    console.error('[ABTesting] Error saving test:', error);
  }
}

/**
 * Get A/B test by ID
 */
export async function getABTest(testId: string): Promise<ABTest | null> {
  try {
    const value = await AsyncStorage.getItem(`${AB_TEST_PREFIX}${testId}`);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

/**
 * Get all A/B tests
 */
export async function getAllABTests(): Promise<ABTest[]> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const testKeys = keys.filter((key) => key.startsWith(AB_TEST_PREFIX));
    const tests: ABTest[] = [];

    for (const key of testKeys) {
      const value = await AsyncStorage.getItem(key);
      if (value) {
        tests.push(JSON.parse(value));
      }
    }

    return tests.sort((a, b) => 
      new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
    );
  } catch {
    return [];
  }
}

/**
 * Record an impression for a variant
 */
export async function recordImpression(testId: string, variantId: string): Promise<void> {
  try {
    const test = await getABTest(testId);
    if (!test || test.status !== 'running') return;

    const variant = test.variants.find((v) => v.id === variantId);
    if (variant) {
      variant.impressions++;
      await saveABTest(test);
      await checkTestCompletion(test);
    }
  } catch (error) {
    console.error('[ABTesting] Error recording impression:', error);
  }
}

/**
 * Record a click for a variant
 */
export async function recordClick(testId: string, variantId: string): Promise<void> {
  try {
    const test = await getABTest(testId);
    if (!test || test.status !== 'running') return;

    const variant = test.variants.find((v) => v.id === variantId);
    if (variant) {
      variant.clicks++;
      await saveABTest(test);
    }
  } catch (error) {
    console.error('[ABTesting] Error recording click:', error);
  }
}

/**
 * Get a random variant for display (weighted by performance)
 */
export async function getVariantForDisplay(testId: string): Promise<AdVariant | null> {
  try {
    const test = await getABTest(testId);
    if (!test) return null;

    // If test is completed, always return the winner
    if (test.status === 'completed' && test.winnerVariantId) {
      return test.variants.find((v) => v.id === test.winnerVariantId) || null;
    }

    // For running tests, use Thompson Sampling for exploration/exploitation
    const variantScores = test.variants.map((variant) => {
      const alpha = variant.clicks + 1;
      const beta = variant.impressions - variant.clicks + 1;
      // Sample from Beta distribution (simplified approximation)
      const score = sampleBeta(alpha, beta);
      return { variant, score };
    });

    // Select variant with highest score
    variantScores.sort((a, b) => b.score - a.score);
    return variantScores[0]?.variant || null;
  } catch {
    return null;
  }
}

/**
 * Simple Beta distribution sampling (Box-Muller approximation)
 */
function sampleBeta(alpha: number, beta: number): number {
  // Use normal approximation for large alpha, beta
  const mean = alpha / (alpha + beta);
  const variance = (alpha * beta) / ((alpha + beta) ** 2 * (alpha + beta + 1));
  const stdDev = Math.sqrt(variance);
  
  // Box-Muller transform
  const u1 = Math.random();
  const u2 = Math.random();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  
  return Math.max(0, Math.min(1, mean + z * stdDev));
}

/**
 * Calculate CTR for a variant
 */
export function calculateCTR(variant: AdVariant): number {
  if (variant.impressions === 0) return 0;
  return (variant.clicks / variant.impressions) * 100;
}

/**
 * Calculate statistical significance using Z-test
 */
export function calculateSignificance(
  variant1: AdVariant,
  variant2: AdVariant
): { significant: boolean; confidence: number; winner: AdVariant | null } {
  const n1 = variant1.impressions;
  const n2 = variant2.impressions;
  const p1 = n1 > 0 ? variant1.clicks / n1 : 0;
  const p2 = n2 > 0 ? variant2.clicks / n2 : 0;

  if (n1 < 30 || n2 < 30) {
    return { significant: false, confidence: 0, winner: null };
  }

  // Pooled proportion
  const p = (variant1.clicks + variant2.clicks) / (n1 + n2);
  
  // Standard error
  const se = Math.sqrt(p * (1 - p) * (1 / n1 + 1 / n2));
  
  if (se === 0) {
    return { significant: false, confidence: 0, winner: null };
  }

  // Z-score
  const z = Math.abs(p1 - p2) / se;
  
  // Convert Z-score to confidence level
  const confidence = 1 - 2 * (1 - normalCDF(z));
  
  return {
    significant: confidence >= 0.95,
    confidence,
    winner: p1 > p2 ? variant1 : variant2,
  };
}

/**
 * Normal CDF approximation
 */
function normalCDF(z: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = z < 0 ? -1 : 1;
  z = Math.abs(z) / Math.sqrt(2);

  const t = 1.0 / (1.0 + p * z);
  const y = 1.0 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-z * z);

  return 0.5 * (1.0 + sign * y);
}

/**
 * Check if test should be completed
 */
async function checkTestCompletion(test: ABTest): Promise<void> {
  // Check if minimum impressions reached for all variants
  const allReachedMinimum = test.variants.every(
    (v) => v.impressions >= test.minimumImpressions
  );

  if (!allReachedMinimum) return;

  // Check for statistical significance between best variants
  const sortedVariants = [...test.variants].sort(
    (a, b) => calculateCTR(b) - calculateCTR(a)
  );

  if (sortedVariants.length < 2) return;

  const { significant, winner } = calculateSignificance(
    sortedVariants[0],
    sortedVariants[1]
  );

  if (significant && winner) {
    test.status = 'completed';
    test.endDate = new Date().toISOString();
    test.winnerVariantId = winner.id;
    await saveABTest(test);
    console.log(`[ABTesting] Test ${test.id} completed. Winner: ${winner.id}`);
  }
}

/**
 * Get test results summary
 */
export async function getTestResults(testId: string): Promise<ABTestResult[]> {
  const test = await getABTest(testId);
  if (!test) return [];

  const results: ABTestResult[] = test.variants.map((variant) => {
    const ctr = calculateCTR(variant);
    const isWinner = variant.id === test.winnerVariantId;

    // Calculate confidence against other variants
    let maxConfidence = 0;
    for (const other of test.variants) {
      if (other.id !== variant.id) {
        const { confidence } = calculateSignificance(variant, other);
        maxConfidence = Math.max(maxConfidence, confidence);
      }
    }

    return {
      testId: test.id,
      variantId: variant.id,
      impressions: variant.impressions,
      clicks: variant.clicks,
      ctr,
      isWinner,
      confidence: maxConfidence,
    };
  });

  return results.sort((a, b) => b.ctr - a.ctr);
}

/**
 * Pause a running test
 */
export async function pauseTest(testId: string): Promise<void> {
  const test = await getABTest(testId);
  if (test && test.status === 'running') {
    test.status = 'paused';
    await saveABTest(test);
  }
}

/**
 * Resume a paused test
 */
export async function resumeTest(testId: string): Promise<void> {
  const test = await getABTest(testId);
  if (test && test.status === 'paused') {
    test.status = 'running';
    await saveABTest(test);
  }
}

/**
 * Delete a test
 */
export async function deleteTest(testId: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(`${AB_TEST_PREFIX}${testId}`);
  } catch (error) {
    console.error('[ABTesting] Error deleting test:', error);
  }
}
