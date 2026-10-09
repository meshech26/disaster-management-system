export const DISASTER_TYPES_CONFIG = {
  flood: {
    type: 'flood',
    label: 'Flood',
    iconName: 'water',
    color: '#06B6D4',
    badgeBg: 'rgba(6, 182, 212, 0.15)',
    tips: [
      'Seek higher ground immediately',
      'Never drive or walk through flood waters',
      'Turn off gas and electricity at main breakers'
    ]
  },
  fire: {
    type: 'fire',
    label: 'Wildfire / Fire',
    iconName: 'flame',
    color: '#EF4444',
    badgeBg: 'rgba(239, 68, 68, 0.15)',
    tips: [
      'Cover face with a damp cloth to filter smoke',
      'Evacuate through designated escape routes',
      'Stay close to the floor where air is clearer'
    ]
  },
  earthquake: {
    type: 'earthquake',
    label: 'Earthquake',
    iconName: 'pulse',
    color: '#F59E0B',
    badgeBg: 'rgba(245, 158, 11, 0.15)',
    tips: [
      'Drop, Cover, and Hold On under sturdy furniture',
      'Stay away from windows and exterior walls',
      'Watch out for post-tremor aftershocks'
    ]
  },
  cyclone: {
    type: 'cyclone',
    label: 'Cyclone / Hurricane',
    iconName: 'thunderstorm',
    color: '#8B5CF6',
    badgeBg: 'rgba(139, 92, 246, 0.15)',
    tips: [
      'Board up windows and secure external objects',
      'Seek shelter in an interior windowless room',
      'Keep battery-powered radio tuned for updates'
    ]
  },
  landslide: {
    type: 'landslide',
    label: 'Landslide',
    iconName: 'warning',
    color: '#D97706',
    badgeBg: 'rgba(217, 119, 6, 0.15)',
    tips: [
      'Move out of path of debris flow to higher ground',
      'Listen for unusual sounds like trees cracking',
      'Avoid river valleys and low-lying drainage paths'
    ]
  },
  medical: {
    type: 'medical',
    label: 'Medical Emergency',
    iconName: 'medkit',
    color: '#EC4899',
    badgeBg: 'rgba(236, 72, 153, 0.15)',
    tips: [
      'Keep patient calm and stationary',
      'Apply direct pressure to active bleeding',
      'Clear airway and verify breathing'
    ]
  },
  tsunami: {
    type: 'tsunami',
    label: 'Tsunami',
    iconName: 'boat',
    color: '#0284C7',
    badgeBg: 'rgba(2, 132, 199, 0.15)',
    tips: [
      'Move inland and to high elevation immediately',
      'Do not wait for formal warning if earth shakes',
      'Stay away from the shore until all clear is given'
    ]
  },
  industrial: {
    type: 'industrial',
    label: 'Industrial / Chemical',
    iconName: 'nuclear',
    color: '#EAB308',
    badgeBg: 'rgba(234, 179, 8, 0.15)',
    tips: [
      'Shelter in place and seal doors/windows with tape',
      'Turn off AC and ventilation systems',
      'Follow HazMat agency specific decontamination'
    ]
  },
  extreme_wind: {
    type: 'extreme_wind',
    label: 'Extreme Wind',
    iconName: 'leaf',
    color: '#0D9488',
    badgeBg: 'rgba(13, 148, 136, 0.15)',
    tips: [
      'Stay indoors away from windows and glass structures',
      'Watch out for falling trees and dangling electric lines',
      'Secure loose roofing materials and outdoor equipment'
    ]
  },
  heavy_rain_lightning: {
    type: 'heavy_rain_lightning',
    label: 'Heavy Rain with Lightning',
    iconName: 'thunderstorm',
    color: '#6366F1',
    badgeBg: 'rgba(99, 102, 241, 0.15)',
    tips: [
      'Seek shelter inside a sturdy building immediately',
      'Avoid open water, tall isolated trees, and metal structures',
      'Unplug sensitive electronic appliances'
    ]
  },
  'land slide': {
    type: 'landslide',
    label: 'Land Slide',
    iconName: 'warning',
    color: '#D97706',
    badgeBg: 'rgba(217, 119, 6, 0.15)',
    tips: [
      'Move out of path of debris flow to higher ground',
      'Listen for unusual sounds like trees cracking',
      'Avoid river valleys and low-lying drainage paths'
    ]
  },
  'extreme wind': {
    type: 'extreme_wind',
    label: 'Extreme Wind',
    iconName: 'leaf',
    color: '#0D9488',
    badgeBg: 'rgba(13, 148, 136, 0.15)',
    tips: [
      'Stay indoors away from windows and glass structures',
      'Watch out for falling trees and dangling electric lines',
      'Secure loose roofing materials and outdoor equipment'
    ]
  },
  'heavy rain with lightning': {
    type: 'heavy_rain_lightning',
    label: 'Heavy Rain with Lightning',
    iconName: 'thunderstorm',
    color: '#6366F1',
    badgeBg: 'rgba(99, 102, 241, 0.15)',
    tips: [
      'Seek shelter inside a sturdy building immediately',
      'Avoid open water, tall isolated trees, and metal structures',
      'Unplug sensitive electronic appliances'
    ]
  },
  other: {
    type: 'other',
    label: 'Other Emergency',
    iconName: 'alert-circle',
    color: '#64748B',
    badgeBg: 'rgba(100, 116, 139, 0.15)',
    tips: [
      'Follow instructions from first responders',
      'Keep lines clear for emergency communications'
    ]
  }
};

export const GROUND_HAZARD_TYPES = [
  {
    type: 'flood',
    label: 'Flood',
    shortLabel: 'Flood',
    description: 'Flash floods, overflow, submerged roads & bridges',
    iconName: 'water',
    iconFamily: 'Ionicons',
    color: '#0284C7',
    badgeBg: 'rgba(2, 132, 199, 0.12)',
    badgeBorder: '#BAE6FD'
  },
  {
    type: 'landslide',
    label: 'Land Slide',
    shortLabel: 'Land Slide',
    description: 'Slope failures, mudslides, falling debris & rocks',
    iconName: 'warning',
    iconFamily: 'Ionicons',
    color: '#D97706',
    badgeBg: 'rgba(217, 119, 6, 0.12)',
    badgeBorder: '#FDE68A'
  },
  {
    type: 'extreme_wind',
    label: 'Extreme Wind',
    shortLabel: 'Extreme Wind',
    description: 'Gale force winds, fallen trees, roof & pole damage',
    iconName: 'leaf',
    iconFamily: 'Ionicons',
    color: '#0D9488',
    badgeBg: 'rgba(13, 148, 136, 0.12)',
    badgeBorder: '#99F6E4'
  },
  {
    type: 'heavy_rain_lightning',
    label: 'Heavy Rain with Lightning',
    shortLabel: 'Rain & Lightning',
    description: 'Torrential downpour, lightning strikes & thunderstorms',
    iconName: 'thunderstorm',
    iconFamily: 'Ionicons',
    color: '#6366F1',
    badgeBg: 'rgba(99, 102, 241, 0.12)',
    badgeBorder: '#C7D2FE'
  },
  {
    type: 'other',
    label: 'Other',
    shortLabel: 'Other',
    description: 'Custom disaster type (type name below)',
    iconName: 'ellipsis-horizontal-circle-outline',
    iconFamily: 'Ionicons',
    color: '#64748B',
    badgeBg: 'rgba(100, 116, 139, 0.12)',
    badgeBorder: '#CBD5E1',
    isCustom: true
  }
];

