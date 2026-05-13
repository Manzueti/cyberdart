import type { HostConfig } from '../scripts/host-config';

const slate: HostConfig = {
  name: 'slate',
  displayName: 'Slate',
  cliCommand: 'slate',
  cliAliases: [],

  globalRoot: '.slate/skills/cyberdart',
  localSkillRoot: '.slate/skills/cyberdart',
  hostSubdir: '.slate',
  usesEnvVars: true,

  frontmatter: {
    mode: 'allowlist',
    keepFields: ['name', 'description'],
    descriptionLimit: null,
  },

  generation: {
    generateMetadata: false,
    skipSkills: ['codex'],
  },

  pathRewrites: [
    { from: '~/.claude/skills/cyberdart', to: '~/.slate/skills/cyberdart' },
    { from: '.claude/skills/cyberdart', to: '.slate/skills/cyberdart' },
    { from: '.claude/skills', to: '.slate/skills' },
  ],

  suppressedResolvers: ['GBRAIN_CONTEXT_LOAD', 'GBRAIN_SAVE_RESULTS'],

  runtimeRoot: {
    globalSymlinks: ['bin', 'browse/dist', 'browse/bin', 'cyberdart-upgrade', 'ETHOS.md'],
    globalFiles: {
      'review': ['checklist.md', 'TODOS-format.md'],
    },
  },

  install: {
    prefixable: false,
    linkingStrategy: 'symlink-generated',
  },

  learningsMode: 'basic',
};

export default slate;
