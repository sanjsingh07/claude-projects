const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

const path = require('path');

// Add path alias resolution for Metro
config.resolver.alias = {
  '@components': path.resolve(__dirname, 'src/components'),
  '@screens': path.resolve(__dirname, 'src/screens'),
  '@hooks': path.resolve(__dirname, 'src/hooks'),
  '@services': path.resolve(__dirname, 'src/services'),
  '@store': path.resolve(__dirname, 'src/store'),
  '@types': path.resolve(__dirname, 'src/types'),
  '@utils': path.resolve(__dirname, 'src/utils'),
  '@constants': path.resolve(__dirname, 'src/constants'),
  '@config': path.resolve(__dirname, 'src/config'),
  '@navigation': path.resolve(__dirname, 'src/navigation'),
  'expo-auth-session/providers/Google': path.resolve(
    __dirname,
    'node_modules/expo-auth-session/build/providers/Google'
  ),
};

// ✅ Ensure .mjs files are handled
config.resolver.sourceExts = [...config.resolver.sourceExts, 'mjs'];

// ✅ Prevent server-side config packages from being bundled on web
config.resolver.blockList = [
  /node_modules\/tinyglobby\/.*/,
  /node_modules\/fdir\/.*/,
  /node_modules\/@expo\/config\/.*/,
  /node_modules\/sucrase\/.*/,
];

config.resolver.unstable_enablePackageExports = false;

module.exports = config;
