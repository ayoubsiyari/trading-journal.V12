import React from 'react';
import CalendarComponent from '../../components/calendar/Calendar';
import useAnalyticsData from '../../hooks/useAnalyticsData';

const Calendar = () => {
  const { stats, loading, error, refreshData } = useAnalyticsData('calendar');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <CalendarComponent />
    </div>
  );
};

export default Calendar;

