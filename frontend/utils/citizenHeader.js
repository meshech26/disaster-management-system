export const getCitizenGreeting = (date = new Date()) => {
  const hour = Number(new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Colombo', hour: '2-digit', hourCycle: 'h23' }).format(date));
  return hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
};

export const countUnreadAlerts = (alerts, readIds) => {
  const read = new Set(readIds);
  return new Set(alerts.filter((alert) => alert.isActive !== false && !['draft', 'completed'].includes(alert.status))
    .map((alert) => alert._id || alert.id).filter((id) => id && !read.has(id))).size;
};
