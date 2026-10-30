import { registerRootComponent } from 'expo';

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App)
// and sets up the environment for both Expo Go and native (Release) builds.
// The old "main": "node_modules/expo/AppEntry.js" pointer only resolved because
// node_modules happened to be nested; it breaks in Release builds, where
// SKIP_BUNDLING is not set. This explicit entry point is the SDK 50+ form.
registerRootComponent(App);
