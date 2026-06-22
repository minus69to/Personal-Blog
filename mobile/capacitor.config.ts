import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'me.insomniyuck.app',
  appName: 'Insomniyuck',
  webDir: 'www',
  server: {
    url: 'https://insomniyuck.me/studio',
    cleartext: false,
    allowNavigation: [
      'insomniyuck.me',
      'www.insomniyuck.me',
      'media.insomniyuck.me'
    ]
  },
  android: {
    allowMixedContent: false
  }
};

export default config;
