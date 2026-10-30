const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// The deal math and shared types live in ../shared, linked via `file:../shared`.
// That link points outside the project root, so Metro needs to be told to (a)
// watch that folder for changes and (b) resolve modules from both node_modules
// trees. We deliberately do NOT set resolver.disableHierarchicalLookup — the
// usual monorepo advice — because expo-asset/expo-constants/expo-file-system are
// nested under expo/node_modules and depend on hierarchical lookup to resolve.
const config = getDefaultConfig(__dirname);

config.watchFolders = [path.resolve(__dirname, '../shared')];
config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, 'node_modules'),
  path.resolve(__dirname, '../shared/node_modules'),
];

module.exports = config;
