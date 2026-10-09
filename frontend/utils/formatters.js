export const formatDistance = (km) => {
  if (km === undefined || km === null) return 'N/A';
  if (km < 1) {
    return `${Math.round(km * 1000)} m`;
  }
  return `${km.toFixed(1)} km`;
};

export const formatTimeAgo = (dateStr) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ago`;
  const diffDay = Math.floor(diffHour / 24);
  return `${diffDay}d ago`;
};

export const getSeverityBadgeInfo = (severity) => {
  switch (severity) {
    case 'critical':
      return {
        bg: '#450A0A',
        text: '#F87171',
        border: '#991B1B',
        label: 'CRITICAL'
      };
    case 'high':
      return {
        bg: '#431407',
        text: '#FB923C',
        border: '#9A3412',
        label: 'HIGH'
      };
    case 'medium':
      return {
        bg: '#451A03',
        text: '#FBBF24',
        border: '#B45309',
        label: 'MEDIUM'
      };
    case 'low':
    default:
      return {
        bg: '#052E16',
        text: '#4ADE80',
        border: '#15803D',
        label: 'LOW'
      };
  }
};
