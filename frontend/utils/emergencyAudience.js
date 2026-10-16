export const normalizeDistrict = (value) => String(value || '').trim().toLowerCase().replace(/\s+district$/, '').replace(/\s+/g, ' ');
export const canReceiveImmediateAlert = (user, warning) => {
  if (!['citizen', 'volunteer'].includes(user?.role) || !warning) return false;
  const affected = normalizeDistrict(warning.affectedDistrict);
  const district = normalizeDistrict(user.district);
  return affected === 'all districts' || (!!district && !!affected && district === affected);
};
export const immediateAlertKey = (warning) => `${warning._id || warning.id}:${warning.triggeredAt || warning.immediateTriggeredAt || warning.updatedAt || warning.createdAt || ''}`;
