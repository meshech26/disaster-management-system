import { Platform } from 'react-native';

// Colours from the Stitch design (dark command-centre theme)
export const c = {
  background: '#061426',
  lowest: '#020e21',
  low: '#0e1c2f',
  container: '#132033',
  high: '#1d2a3e',
  highest: '#28354a',
  primary: '#adc6ff',
  onPrimary: '#002e6a',
  primaryContainer: '#4d8eff',
  onPrimaryContainer: '#00285d',
  secondary: '#aac9f4',
  onSecondary: '#0e3255',
  secondaryContainer: '#29486d',
  tertiary: '#4edea3',
  onTertiary: '#003824',
  error: '#ffb4ab',
  onError: '#690005',
  errorContainer: '#93000a',
  onSurface: '#d6e3fe',
  onSurfaceVariant: '#c2c6d6',
  outline: '#8c909f'
};

export const mono = Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' });
export const sp = { xs: 4, sm: 8, md: 12, lg: 20, xl: 28 };

// low / medium / high -> colour (used for warning severity)
export const levelColor = { low: c.tertiary, medium: c.secondary, high: c.error };
const LEVELS = {
  info: 'low', advisory: 'low', low: 'low', update: 'low', all_clear: 'low', watch: 'low',
  medium: 'medium', moderate: 'medium', warning: 'medium',
  high: 'high', critical: 'high', emergency_danger: 'high'
};
export const levelOf = (severity) => LEVELS[severity] || 'medium';
