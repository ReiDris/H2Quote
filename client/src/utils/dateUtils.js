export const formatDateTime = (dateString, includeTime = true) => {
  if (!dateString || dateString === 'Pending' || dateString === '-' || dateString === 'N/A') {
    return dateString;
  }

  try {
    const date = new Date(dateString);

    if (isNaN(date.getTime())) {
      return dateString;
    }

    const dateOptions = {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    };

    const timeOptions = {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    };

    const formattedDate = date.toLocaleDateString('en-US', dateOptions);

    if (includeTime && (dateString.includes('T') || dateString.includes(':'))) {
      const formattedTime = date.toLocaleTimeString('en-US', timeOptions);
      return `${formattedDate} at ${formattedTime}`;
    }

    return formattedDate;
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateString;
  }
};

export const formatDate = (dateString) => {
  return formatDateTime(dateString, false);
};

export const formatDateForInput = (dateString) => {
  if (!dateString || dateString === 'Pending' || dateString === '-') {
    return '';
  }

  try {
    const date = new Date(dateString);
    
    if (isNaN(date.getTime())) {
      return '';
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error('Error formatting date for input:', error);
    return '';
  }
};

export const getCurrentDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const isDateOnly = (dateString) => {
  if (!dateString) return false;
  // Check if string contains time indicators
  return !dateString.includes('T') && !dateString.includes(':');
};

export const parseBackendDate = (dateString) => {
  if (!dateString || dateString === 'Pending' || dateString === '-') {
    return null;
  }

  try {
    if (isDateOnly(dateString) && /^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      const [year, month, day] = dateString.split('-').map(Number);
      return new Date(year, month - 1, day);
    }

    return new Date(dateString);
  } catch (error) {
    console.error('Error parsing backend date:', error);
    return null;
  }
};

export const formatPaymentDate = (paidOnDate) => {
  if (!paidOnDate || paidOnDate === 'Pending' || paidOnDate === '-') {
    return 'Pending';
  }
  if (/^[A-Z][a-z]{2}\s\d{1,2},\s\d{4}/.test(paidOnDate)) {
    return paidOnDate;
  }

  const parsedDate = parseBackendDate(paidOnDate);
  if (!parsedDate) return paidOnDate;

  return formatDate(parsedDate);
};

export default {
  formatDateTime,
  formatDate,
  formatDateForInput,
  getCurrentDate,
  isDateOnly,
  parseBackendDate,
  formatPaymentDate
};