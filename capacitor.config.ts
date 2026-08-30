import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.blakelamb.price_compare',
  appName: 'Price Compare',
  webDir: 'dist/price-compare/browser',
  server: {
    androidScheme: 'https'
  }
};

export default config;
