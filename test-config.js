import { resolveConfig } from './browse/src/config.js';

try {
  const config = resolveConfig();
  console.log('Project Dir:', config.projectDir);
  console.log('State File:', config.stateFile);
} catch (e) {
  console.error('Failed to resolve config:', e);
}
