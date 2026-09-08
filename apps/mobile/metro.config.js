const path = require('node:path');
const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);
config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];
// Keep hierarchical lookup so nested deps (e.g. is-arrayish via color) resolve in monorepos
config.resolver.disableHierarchicalLookup = false;
config.resolver.extraNodeModules = {
  '@nexora/shared': path.resolve(workspaceRoot, 'packages/shared/src'),
};

module.exports = config;
