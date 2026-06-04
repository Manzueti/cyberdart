# cyberdart

AI engineering workflow skills + fast headless browser for Claude Code and other AI agents.

## What it is

cyberdart gives AI agents structured roles for software development. Each skill is a specialist — CEO reviewer, engineer, designer, QA lead, release manager, debugger — so the agent knows exactly what to do and how to present results.

The browser component is real Chromium via Playwright at ~100ms per command, with a persistent daemon, annotated screenshots, network capture, and browser-skill automation.

## Install

```bash
git clone --depth 1 https://github.com/Manzueti/cyberdart.git ~/.claude/skills/cyberdart
cd ~/.claude/skills/cyberdart && ./setup
```

## Skills

| Skill | What it does |
|-------|-------------|
| `/office-hours` | Reframes your product idea before you write code |
| `/plan-ceo-review` | CEO-level review: find the 10-star product |
| `/plan-eng-review` | Lock architecture, data flow, edge cases, and tests |
| `/plan-design-review` | Rate each design dimension 0-10 |
| `/autoplan` | One command runs CEO → design → eng → DX review |
| `/review` | Pre-landing PR review — finds bugs that pass CI |
| `/investigate` | Systematic root-cause debugging |
| `/qa` | Open a real browser, find bugs, fix them, re-verify |
| `/ship` | Run tests, review, push, open PR |
| `/land-and-deploy` | Merge → CI → deploy → verify production |
| `/browse` | Headless browser — real Chromium, ~100ms/command |
| `/careful` | Warn before destructive commands |

Full skill list: [AGENTS.md](AGENTS.md)

## Build

```bash
bun install
bun test                  # free tests, no API spend
bun run build             # compile binaries + generate docs
bun run gen:skill-docs    # regenerate SKILL.md files from templates
bun run skill:check       # health dashboard
```

## Platform support

- **macOS / Linux**: full support
- **Windows**: Git Bash or MSYS required for setup; curated test suite runs on `windows-latest` via CI

## License

MIT
