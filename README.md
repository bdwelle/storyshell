# Storyshell

Simple story generation/fiction writing assistant CLI built as a [Pi coding agent](https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent) skill.

## Overview

Storyshell uses markdown templates with embedded instructions to generate characters, scenes, storylines, and prose for fiction writing. It integrates Story Grid methodology and provides a simple, flexible workflow.

## Quick Start

1. **Install the skill**:
   ```bash
   ln -s /Users/bdwelle/lib/storyshell/pi-skills/storyshell ~/.pi/agent/skills/storyshell
   ```

2. **Set up a project**:
   ```bash
   mkdir myproject
   cd myproject
   mkdir -p inc characters scenes storylines prose
   cp /path/to/storyshell/proj/SYSTEM.md .
   cp /path/to/storyshell/proj/inc/main.md inc/
   ```

3. **Use with Pi**:
   ```bash
   pi
   # In Pi chat:
   # "Create a character who is a skateboarder punk"
   # "Suggest some scenes about an artist and a businessman"
   ```

## Other Documentation

- [pi-skills/storyshell/SKILL.md](SKILL.md) - the actual pi skill is mostly self-documenting 
- [PROPOSAL.md](PROPOSAL.md) - Design and implementation plan
- [PROMPT.md](PROMPT.md) - Original design prompt 

## Structure

```
storyshell/
├── inc/              # Shared context files (Story Grid, writing methods)
├── tpl/              # Templates
├── pi-skills/
│   └── storyshell/     # Pi skill implementation
├── example-project/             # Example project
```

## Status

Currently in development (see PROPOSAL.md for roadmap).

## License

MIT
