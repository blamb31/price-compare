import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'price_compare.myapp',
  appName: 'Price Compare',
  webDir: 'dist/price-compare/browser',
  server: {
    androidScheme: 'https'
  }
};

export default config;
