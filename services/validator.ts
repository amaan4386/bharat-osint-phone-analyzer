
/**
 * Simple validator for Indian Phone Numbers
 * Expected formats: +91XXXXXXXXXX, 91XXXXXXXXXX, 0XXXXXXXXXX, or XXXXXXXXXX
 */
export const validateIndianNumber = (number: string): { isValid: boolean; sanitized: string; error?: string } => {
  // Remove all non-numeric characters except '+'
  const cleaned = number.replace(/[^\d+]/g, '');
  
  // Basic Regex for Indian Numbers
  // 1. Starts with +91 or 91 followed by 10 digits
  // 2. Starts with 0 followed by 10 digits
  // 3. Just 10 digits starting with 6, 7, 8, or 9
  const pattern = /^(?:\+91|91|0)?[6-9]\d{9}$/;

  if (!pattern.test(cleaned)) {
    return { 
      isValid: false, 
      sanitized: cleaned, 
      error: 'Please enter a valid 10-digit Indian phone number (starting with 6, 7, 8, or 9).' 
    };
  }

  // Extract the 10-digit core
  const core = cleaned.slice(-10);
  const normalized = `+91 ${core.slice(0, 5)} ${core.slice(5)}`;

  return { isValid: true, sanitized: normalized };
};
