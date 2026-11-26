import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.fitnesstracker.app',
  appName: 'FITNESSTRACKER',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;
