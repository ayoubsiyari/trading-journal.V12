// Date formatting and calculation utilities
export const formatCurrency = (val) => 
  val == null ? 'N/A' : `$${parseFloat(val).toFixed(2)}`;

export const formatPercent = (val) =>
  val == null ? 'N/A' : `${parseFloat(val).toFixed(1)}%`;

export const formatNumber = (val) =>
  val == null ? 'N/A' : parseFloat(val).toFixed(2);

export const toDateKey = (date) => {
  if (!(date instanceof Date)) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const getDaysInMonth = (year, month) => 
  new Date(year, month + 1, 0).getDate();

export const getFirstDayOfMonth = (year, month) => 
  new Date(year, month, 1).getDay();

export const isSameDay = (date1, date2) => {
  if (!date1 || !date2) return false;
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

export const isDateInRange = (date, startDate, endDate) => {
  if (!date || !startDate) return false;
  const d = new Date(date);
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : null;
  
  start.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  
  if (end) {
    end.setHours(23, 59, 59, 999);
    return d >= start && d <= end;
  }
  return isSameDay(d, start);
};

export const getWeekNumber = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  return 1 + Math.round(((d - week1) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
};

export const exportToCSV = (data, filename = 'export') => {
  if (!data || !data.length) return;
  
  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(','),
    ...data.map(row => 
      headers.map(field => {
        const value = row[field];
        return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
      }).join(',')
    )
  ];

  const csvString = csvRows.join('\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
