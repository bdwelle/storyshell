# StoryShell Agent Guidelines

Keep it SIMPLE, easy to understand, easy to configure, and flexible. 
Write as little code as possible. 
Write functions instead of duplicating blocks of code.
Use an interactive process: Start at the high level and ask questions as you go along to verify your approach. 

## Project Overview

StoryShell is a fiction writing assistant CLI built as a coding agent skill. It uses markdown templates with embedded instructions to generate characters, scenes, storylines, and prose for fiction writing, integrating Story Grid methodology. 

While originally built for the _pi_ coding agent, it should work with Claude Code, Gemini CLI, or _opencode_.

## Development Workflow

1. **Changes**: Edit files directly in the repository. 

IMPORTANT: Default to only making changes requested by the user. If you determine that other changes would be beneficial, ASK THE USER before making ANY changes not explicitly requested. 

2. **Testing**: Use manual testing with `node -c` for syntax
3. **Installation**: Test with `./install.sh` after changes
4. **Projects**: Test project creation with `./setup-project.sh`
5. **Skills**: Test pi skill integration with actual pi-agent

## Code Style Guidelines

### JavaScript (Node.js)
- **Runtime**: Node.js with shebang `#!/usr/bin/env node`
- **Error Handling**: Use warnings to stderr, logging to file
- **File I/O**: Synchronous operations (`fs.readFileSync`, `fs.writeFileSync`) for simplicity
- **Path Resolution**: Use `path.join()` for cross-platform compatibility
- **Logging**: Single-line entries to `storyshell.log` with PST timestamps
- **Functions**: Prefer pure functions, avoid complex classes
- **Constants**: Use `UPPER_SNAKE_CASE` for constants
- **Variable Naming**: `camelCase` for variables and functions
- **Comments**: Minimal, only for complex logic

### Shell Scripts
- **Shebang**: Use `#!/bin/bash` with `set -e` for error handling
- **Colors**: Use ANSI color codes for user feedback
- **Functions**: Create helper functions for repeated operations
- **User Input**: Use `read -p` with default values support
- **Error Handling**: Check for existing files/directories before creation
- **Symlinks**: Use relative symlinks for portability

### Markdown Files
- **Frontmatter**: YAML format with `---` delimiters
- **File Structure**: Templates in `tpl/`, prompts in `prompts/`, projects use standard structure
- **Includes**: Use `@include filename.md` syntax in project files
- **Entity Files**: Use frontmatter with `type`, `aliases`, `related_*` fields

## File Structure Conventions

### Core Framework
```
storyshell/
├── skills/storyshell/         # LLM CLI agent skill implementation
│   ├── storyshell.js                 # Main template processor
│   └── SKILL.md               # Skill documentation
├── tpl/                       # Templates (character.md, scene.md, etc.)
├── prompts/                   # Methodology files (storygrid.md, etc.)
├── commands/storyshell/       # Custom LLM CLM commands (ss.md, noss.md)
├── agents/                    # agent skills
├── tools/                     # custom agent tools
├── install.sh                 # Global installation
└── setup-project.sh           # Project creation
```

### Project Structure
```
project/
├── prompts/main.md            # REQUIRED: Project context
├── characters/                # Character definitions
├── codex/                     # Concept library
├── scenes/                    # Scene sketches
├── storylines/                # Story arcs
├── prose/                     # Full prose scenes
└── log/storyshell.log         # Execution log
```

## Import & Module Patterns

### JavaScript
- Use CommonJS (`require`, `module.exports`) for Node.js compatibility
- Group imports: built-in modules first, then third-party, then local
- Avoid circular dependencies
- Use relative paths for local modules

### Frontmatter Parsing
- Use regex patterns for YAML extraction
- Handle missing frontmatter gracefully
- Support both simple values and arrays
- Normalize keys to lowercase

## Naming Conventions

### Files & Directories
- **Templates**: kebab-case (`character-interview.md`)
- **Characters**: kebab-case with full name (`maya-chen.md`)
- **Concepts**: kebab-case (`executable-contracts.md`)
- **Commands**: lowercase (`ss.md`, `noss.md`)
- **Scripts**: kebab-case with extension (`setup-project.sh`)

### Variables
- **JavaScript**: 
	- `UPPER_SNAKE_CASE` for global constants
	- `camelCase` (`templateName`, `conceptIndex`) for variables
- **Shell**: `UPPER_SNAKE_CASE` for constants, `lower_case` for variables
- **Frontmatter**: `snake_case` for keys (`related_concepts`)

### Functions
- **JavaScript**: Verb phrases (`parseFrontmatter`, `buildConceptIndex`)
- **Shell**: Verb phrases (`prompt_with_default`, `slugify`)

## Debugging

- **Logs**: Check `storyshell.log` in project directory for detailed execution info
- **Verbose**: Script output includes color-coded status messages
- **Errors**: Warnings go to stderr, errors cause script exit
- **Paths**: Log file resolution and entity matching details

## Integration Points

- **Projects**: User projects can be anywhere with proper structure
- **Templates**: Framework templates in `tpl/`, project-specific overrides supported
