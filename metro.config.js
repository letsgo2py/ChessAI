const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add support for .cjs files
config.resolver.sourceExts.push('cjs');
// Disable package.json exports to avoid require issues
config.resolver.unstable_enablePackageExports = false;

module.exports = config;

