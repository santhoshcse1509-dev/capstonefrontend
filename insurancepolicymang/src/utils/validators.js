export const validateEmail = (email) => {
  if (!email) return 'Email is required';
  const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!re.test(email)) return 'Please enter a valid email address';
  return '';
};

export const validatePassword = (password) => {
  if (!password) return 'Password is required';
  if (password.length < 8) return 'Password must be at least 8 characters';
  if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter';
  if (!/[a-z]/.test(password)) return 'Password must contain at least one lowercase letter';
  if (!/[0-9]/.test(password)) return 'Password must contain at least one number';
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password))
    return 'Password must contain at least one special character';
  return '';
};

export const validateConfirmPassword = (password, confirmPassword) => {
  if (!confirmPassword) return 'Please confirm your password';
  if (password !== confirmPassword) return 'Passwords do not match';
  return '';
};

export const validatePhone = (phone) => {
  if (!phone) return 'Phone number is required';
  const cleaned = phone.replace(/[\s\-()]/g, '');
  if (!/^\+?[0-9]{10,15}$/.test(cleaned))
    return 'Please enter a valid phone number (10-15 digits)';
  return '';
};

export const validateRequired = (value, fieldName = 'This field') => {
  if (!value || (typeof value === 'string' && !value.trim()))
    return `${fieldName} is required`;
  return '';
};

export const validateMinLength = (value, min, fieldName = 'This field') => {
  if (!value) return `${fieldName} is required`;
  if (value.length < min)
    return `${fieldName} must be at least ${min} characters`;
  return '';
};

export const validateMaxLength = (value, max, fieldName = 'This field') => {
  if (value && value.length > max)
    return `${fieldName} must not exceed ${max} characters`;
  return '';
};

export const validateAmount = (amount) => {
  if (!amount && amount !== 0) return 'Amount is required';
  const num = parseFloat(amount);
  if (isNaN(num)) return 'Please enter a valid amount';
  if (num <= 0) return 'Amount must be greater than 0';
  return '';
};

export const validateForm = (values, rules) => {
  const errors = {};
  Object.keys(rules).forEach((field) => {
    const fieldRules = rules[field];
    for (const rule of fieldRules) {
      const error = rule(values[field], values);
      if (error) {
        errors[field] = error;
        break;
      }
    }
  });
  return errors;
};
