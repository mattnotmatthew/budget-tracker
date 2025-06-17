/**
 * Utility functions for currency formatting
 */

/**
 * Formats a number as currency in thousands format (e.g., $1,234K)
 * Prevents negative zero display for very small values
 * @param amount - The amount in dollars
 * @returns Formatted currency string
 */
export const formatCurrencyThousands = (amount: number): string => {
  const amountInThousands = amount / 1000;
  // Prevent negative zero display by rounding very small values to zero
  const normalizedAmount =
    Math.abs(amountInThousands) < 0.001 ? 0 : amountInThousands;

  // For non-zero amounts, round UP to nearest thousand
  const roundedAmount =
    normalizedAmount === 0
      ? 0
      : Math.ceil(Math.abs(normalizedAmount)) * Math.sign(normalizedAmount);

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(roundedAmount); //roundedAmount or normalizedAmount
};

/**
 * Formats a number as full currency (e.g., $1,234,567)
 * Prevents negative zero display for very small values
 * @param amount - The amount in dollars
 * @returns Formatted currency string
 */
export const formatCurrencyFull = (amount: number): string => {
  // Prevent negative zero display by rounding very small values to zero
  const normalizedAmount = Math.abs(amount) < 0.01 ? 0 : amount;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(normalizedAmount);
};

/**
 * Formats a number for K notation with negative zero prevention
 * @param amount - The amount in dollars
 * @returns Formatted number string with K suffix
 */
export const formatNumberThousands = (amount: number): string => {
  const value = Math.abs(amount / 1000);
  const normalizedValue = value < 0.01 ? 0 : value;
  return normalizedValue.toLocaleString();
};

/**
 * Formats a number as currency in thousands format with parentheses for negative values
 * Prevents negative zero display for very small values
 * @param amount - The amount in dollars
 * @returns Formatted currency string with parentheses for negatives
 */
export const formatCurrencyWithParentheses = (amount: number): string => {
  const amountInThousands = amount / 1000;
  // Reduced threshold from 0.01 to 0.001 to show variances as small as $1
  // This prevents small but meaningful variances from being hidden
  const normalizedAmount =
    Math.abs(amountInThousands) < 0.001 ? 0 : amountInThousands;

  // Handle zero case
  if (normalizedAmount === 0) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(0);
  }

  // Format positive value with appropriate precision
  const absoluteValue = Math.abs(normalizedAmount);
  let formattedValue;

  if (absoluteValue < 1) {
    // For amounts less than $1K, show with one decimal place (no rounding up needed)
    formattedValue = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(absoluteValue);
  } else {
    // For amounts $1K and above, round UP to nearest thousand
    const roundedValue = Math.ceil(absoluteValue);
    formattedValue = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(roundedValue);
  }
  // Return with parentheses for negative values
  return normalizedAmount < 0 ? `(${formattedValue})` : formattedValue;
};

/**
 * Formats a number using Excel custom format: _(* $#,##0,_);_(* ($#,##0,);_(* "-"??_);_(@_)
 * - Positive numbers: $X,XXX (in thousands, rounded to nearest whole number)
 * - Negative numbers: ($X,XXX) (in thousands, with parentheses)
 * - Zero values: "-" (dash)
 * - Divides by 1000 and rounds to nearest whole number (standard rounding, not up)
 * @param amount - The amount in dollars
 * @returns Formatted string matching Excel custom format
 */
export const formatCurrencyExcelStyle = (amount: number): string => {
  // Handle very small amounts as zero to prevent negative zero
  const normalizedAmount = Math.abs(amount) < 0.5 ? 0 : amount;

  // Zero case: return dash
  if (normalizedAmount === 0) {
    return "-";
  }

  // Convert to thousands and round to nearest whole number (standard rounding)
  const thousands = Math.round(normalizedAmount / 1000);

  if (thousands === 0) {
    return "-";
  }

  // Format the absolute value with commas
  const absoluteThousands = Math.abs(thousands);
  const formattedNumber = absoluteThousands.toLocaleString("en-US");

  // Apply Excel format based on sign
  if (normalizedAmount >= 0) {
    // Positive: $X,XXX
    return `$${formattedNumber}`;
  } else {
    // Negative: ($X,XXX)
    return `($${formattedNumber})`;
  }
};
