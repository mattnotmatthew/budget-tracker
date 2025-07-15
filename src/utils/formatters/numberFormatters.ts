/**
 * Number formatting utilities
 * Consolidated from various components
 */

/**
 * Format number with thousands separator
 */
export const formatWithCommas = (value: number): string => {
  return value.toLocaleString('en-US');
};

/**
 * Format number in compact notation (K, M, B)
 */
export const formatCompactNumber = (value: number): string => {
  const absValue = Math.abs(value);
  const sign = value < 0 ? '-' : '';

  if (absValue >= 1e9) {
    return `${sign}${(absValue / 1e9).toFixed(1)}B`;
  } else if (absValue >= 1e6) {
    return `${sign}${(absValue / 1e6).toFixed(1)}M`;
  } else if (absValue >= 1e3) {
    return `${sign}${(absValue / 1e3).toFixed(1)}K`;
  }
  
  return `${sign}${absValue.toFixed(0)}`;
};

/**
 * Format percentage with custom decimals and sign
 */
export const formatPercentage = (
  value: number,
  decimals: number = 1,
  includeSign: boolean = false
): string => {
  if (!isFinite(value)) return 'N/A';
  
  const formatted = value.toFixed(decimals);
  const sign = includeSign && value > 0 ? '+' : '';
  return `${sign}${formatted}%`;
};

/**
 * Format decimal number with fixed precision
 */
export const formatDecimal = (
  value: number,
  decimals: number = 2
): string => {
  return value.toFixed(decimals);
};

/**
 * Format number as ratio (e.g., "2.5:1")
 */
export const formatRatio = (
  numerator: number,
  denominator: number,
  decimals: number = 1
): string => {
  if (denominator === 0) return 'N/A';
  const ratio = numerator / denominator;
  return `${ratio.toFixed(decimals)}:1`;
};

/**
 * Format number with custom suffix
 */
export const formatWithSuffix = (
  value: number,
  suffix: string,
  decimals: number = 0
): string => {
  return `${value.toFixed(decimals)}${suffix}`;
};

/**
 * Format number as ordinal (1st, 2nd, 3rd, etc.)
 */
export const formatOrdinal = (value: number): string => {
  const suffixes = ['th', 'st', 'nd', 'rd'];
  const v = value % 100;
  return value + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
};

/**
 * Format number range
 */
export const formatRange = (
  min: number,
  max: number,
  formatter: (n: number) => string = formatWithCommas
): string => {
  return `${formatter(min)} - ${formatter(max)}`;
};

/**
 * Format number with sign always shown
 */
export const formatWithSign = (value: number): string => {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${formatWithCommas(value)}`;
};

/**
 * Format basis points (1 basis point = 0.01%)
 */
export const formatBasisPoints = (value: number): string => {
  return `${Math.round(value)} bps`;
};

/**
 * Format as multiplier (e.g., 1.5x)
 */
export const formatMultiplier = (value: number, decimals: number = 1): string => {
  return `${value.toFixed(decimals)}x`;
};

/**
 * Format large numbers with appropriate unit
 */
export const formatLargeNumber = (value: number): string => {
  const units = [
    { value: 1e12, suffix: 'T' },
    { value: 1e9, suffix: 'B' },
    { value: 1e6, suffix: 'M' },
    { value: 1e3, suffix: 'K' }
  ];

  const unit = units.find(u => Math.abs(value) >= u.value);
  
  if (unit) {
    return `${(value / unit.value).toFixed(2)}${unit.suffix}`;
  }
  
  return value.toFixed(0);
};

/**
 * Format number for table display (handles nulls/undefined)
 */
export const formatTableNumber = (
  value: number | null | undefined,
  defaultValue: string = '-'
): string => {
  if (value === null || value === undefined) return defaultValue;
  return formatWithCommas(value);
};