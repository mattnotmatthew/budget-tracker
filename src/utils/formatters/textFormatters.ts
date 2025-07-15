/**
 * Text formatting utilities
 * Consolidated from various components
 */

/**
 * Truncate text with ellipsis
 */
export const truncateText = (
  text: string,
  maxLength: number,
  suffix: string = '...'
): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - suffix.length) + suffix;
};

/**
 * Convert to title case
 */
export const toTitleCase = (text: string): string => {
  return text.replace(/\w\S*/g, (txt) => {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
};

/**
 * Convert camelCase to readable text
 */
export const camelCaseToWords = (text: string): string => {
  return text
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
};

/**
 * Pluralize word based on count
 */
export const pluralize = (
  count: number,
  singular: string,
  plural?: string
): string => {
  if (count === 1) return `${count} ${singular}`;
  return `${count} ${plural || singular + 's'}`;
};

/**
 * Format list of items with proper grammar
 */
export const formatList = (
  items: string[],
  conjunction: 'and' | 'or' = 'and'
): string => {
  if (items.length === 0) return '';
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} ${conjunction} ${items[1]}`;
  
  const lastItem = items[items.length - 1];
  const otherItems = items.slice(0, -1);
  return `${otherItems.join(', ')}, ${conjunction} ${lastItem}`;
};

/**
 * Abbreviate text (e.g., "Budget vs Actual" -> "Budget vs Act.")
 */
export const abbreviateText = (text: string, abbreviations?: Record<string, string>): string => {
  const defaultAbbreviations: Record<string, string> = {
    'Budget vs Actual': 'Budget vs Act.',
    'Year to Date': 'YTD',
    'Month over Month': 'MoM',
    'Quarter over Quarter': 'QoQ',
    'Percentage': '%',
    'Amount': 'Amt',
    'Category': 'Cat.',
    'Department': 'Dept.',
    'Description': 'Desc.',
    'Allocation': 'Alloc.',
    'Variance': 'Var.',
    'Total': 'Tot.',
    ...abbreviations
  };
  
  let abbreviated = text;
  Object.entries(defaultAbbreviations).forEach(([full, abbrev]) => {
    abbreviated = abbreviated.replace(new RegExp(full, 'gi'), abbrev);
  });
  
  return abbreviated;
};

/**
 * Wrap text at word boundaries
 */
export const wrapText = (text: string, maxLineLength: number): string[] => {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  words.forEach(word => {
    if ((currentLine + word).length > maxLineLength) {
      if (currentLine) {
        lines.push(currentLine.trim());
        currentLine = word + ' ';
      } else {
        // Word is longer than max length, force break
        lines.push(word);
      }
    } else {
      currentLine += word + ' ';
    }
  });

  if (currentLine) {
    lines.push(currentLine.trim());
  }

  return lines;
};

/**
 * Extract initials from name
 */
export const getInitials = (name: string, maxInitials: number = 2): string => {
  const words = name.trim().split(/\s+/);
  const initials = words
    .map(word => word[0]?.toUpperCase())
    .filter(Boolean)
    .slice(0, maxInitials)
    .join('');
  
  return initials;
};

/**
 * Sanitize filename
 */
export const sanitizeFilename = (filename: string): string => {
  return filename
    .replace(/[^a-z0-9]/gi, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .toLowerCase();
};

/**
 * Generate slug from text
 */
export const generateSlug = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
};

/**
 * Format status text with proper casing
 */
export const formatStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    'active': 'Active',
    'inactive': 'Inactive',
    'pending': 'Pending',
    'completed': 'Completed',
    'in_progress': 'In Progress',
    'cancelled': 'Cancelled',
    'on_hold': 'On Hold'
  };
  
  return statusMap[status.toLowerCase()] || toTitleCase(status);
};