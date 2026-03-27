// metro.config.js — CivicSentinel AI
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Shim react-dom → empty module so @clerk/clerk-react doesn't crash
// when bundled in React Native (it imports react-dom but only uses
// it in the web renderer which we don't need).
config.resolver = {
    ...config.resolver,
    extraNodeModules: {
        ...config.resolver.extraNodeModules,
        'react-dom': path.resolve(__dirname, 'shims/react-dom.js'),
    },
};

module.exports = config;
