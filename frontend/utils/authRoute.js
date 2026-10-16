export const getHomeRoute = (role) => {
  switch (role) {
    case 'duty_officer':
      return '/duty-officer';
    case 'dmc_officer':
    case 'admin':
      return '/dmc-officer';
    case 'district_officer':
      return '/district-officer';
    case 'rescue_team':
    case 'responder':
      return '/rescue-team';
    default:
      return '/(tabs)';
  }
};
