export const formatPolicyNumber = (id) => {
  if (!id) return 'N/A';
  const num = typeof id === 'number' ? id.toString() : id;
  return `POL-${num.padStart(8, '0')}`;
};

export const formatClaimNumber = (id) => {
  if (!id) return 'N/A';
  const num = typeof id === 'number' ? id.toString() : id;
  return `CLM-${num.padStart(8, '0')}`;
};

export const formatPercentage = (value, decimals = 1) => {
  if (value == null || isNaN(value)) return '0%';
  return `${parseFloat(value).toFixed(decimals)}%`;
};

export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  if (!bytes) return 'N/A';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const formatPhoneDisplay = (phone) => {
  if (!phone) return 'N/A';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
};

export const formatAccountNumber = (number) => {
  if (!number) return 'N/A';
  const str = number.toString();
  return '****' + str.slice(-4);
};

export const formatDuration = (months) => {
  if (!months) return 'N/A';
  if (months < 12) return `${months} month${months > 1 ? 's' : ''}`;
  const years = Math.floor(months / 12);
  const rem = months % 12;
  let result = `${years} year${years > 1 ? 's' : ''}`;
  if (rem > 0) result += ` ${rem} month${rem > 1 ? 's' : ''}`;
  return result;
};

export const capitalizeFirst = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export const formatStatus = (status) => {
  if (!status) return 'N/A';
  return status
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
};
