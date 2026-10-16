const normalizeDistrict = (value) => String(value || '').trim().toLowerCase().replace(/\s+district$/, '').replace(/\s+/g, ' ');
const isPublicRecipient = (role) => ['citizen', 'volunteer'].includes(role);
const districtRoom = (district) => `emergency_district_${normalizeDistrict(district)}`;
const emitImmediateAlert = (io, warning) => {
  const district = normalizeDistrict(warning.affectedDistrict);
  if (!district) return;
  io.to(district === 'all districts' ? 'emergency_recipients' : districtRoom(district))
    .emit('immediate_emergency_alert', {
      ...warning.toObject(),
      autoDismissSeconds: 10,
      triggeredAt: warning.immediateTriggeredAt || warning.updatedAt
    });
};
module.exports = { normalizeDistrict, isPublicRecipient, districtRoom, emitImmediateAlert };
