# StoryShell Agent Guidelines

Keep it SIMPLE, easy to understand, easy to configure, and flexible. 
Write as little code as possible. 
Write functions instead of duplicating blocks of code.
Use an interactive process: Start at the high level and ask questions as you go along to verify your approach. 

## Project Overview

StoryShell is a fiction writing assistant CLI built as a coding agent skill. It uses markdown templates with embedded instructions to generate characters, scenes, storylines, and prose for fiction writing, integrating Story Grid methodology. 

While originally built for the _pi_ coding agent, it should work with Claude Code, Gemini CLI, or _opencode_.

## Commands

### Installation & Setup
```bash
# Install StoryShell globally (one-time setup)
./install.sh

# Create new story project
./setup-project.sh
```

### Running StoryShell
```bash
# Use with pi-agent
pi
"create a character named Jimmy"
"suggest some scenes about a skateboarder"
"develop scene #2"
```

### Testing
```bash
# Test individual templates
node skills/storyshell/run.js character "test character"
node skills/storyshell/run.js scene "test scene"

# Test with project context
cd /path/to/project
PI_USER_COMMAND="create a character" node /path/to/storyshell/skills/storyshell/run.js character "character description"
```

### Linting & Code Quality
```bash
# No formal linting setup - maintain clean code manually
# Check Node.js syntax:
node -c skills/storyshell/run.js

# Validate shell scripts:
bash -n install.sh
bash -n setup-project.sh
```

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
│   ├── run.js                 # Main template processor
│   └── SKILL.md               # Skill documentation
├── tpl/                       # Templates (character.md, scene.md, etc.)
├── prompts/                   # Methodology files (storygrid.md, etc.)
├── commands/storyshell/       # Custom LLM CLM commands (ss.md, noss.md)
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
├── storylines/               # Story arcs
├── prose/                    # Full prose scenes
└── storyshell.log            # Execution log
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

## Error Handling Patterns

### JavaScript
```javascript
// Warning to stderr + log
function warn(message) {
  console.error(`Warning: ${message}`);
  log('warning', { message });
}

// Graceful file handling
if (!fs.existsSync(filePath)) {
  warn(`File not found: ${filePath}`);
  return defaultValue;
}
```

### Shell Scripts
```bash
# Check before create
if [ -L "$SKILL_LINK" ]; then
    echo -e "${GREEN}  ✓ Already installed${NC}"
else
    ln -s "$TARGET" "$LINK"
fi
```

## Naming Conventions

### Files & Directories
- **Templates**: kebab-case (`character-interview.md`)
- **Characters**: kebab-case with full name (`maya-chen.md`)
- **Concepts**: kebab-case (`executable-contracts.md`)
- **Commands**: lowercase (`ss.md`, `noss.md`)
- **Scripts**: kebab-case with extension (`setup-project.sh`)

### Variables
- **JavaScript**: `camelCase` (`templateName`, `conceptIndex`)
- **Shell**: `UPPER_SNAKE_CASE` for constants, `lower_case` for variables
- **Frontmatter**: `snake_case` for keys (`related_concepts`)

### Functions
- **JavaScript**: Verb phrases (`parseFrontmatter`, `buildConceptIndex`)
- **Shell**: Verb phrases (`prompt_with_default`, `slugify`)

## Testing Approach

### Manual Testing
1. Test template generation with various inputs
2. Verify entity matching (concepts, characters)
3. Test project creation and setup
4. Validate include resolution and frontmatter parsing

### Test Scenarios
```bash
# Template generation
node run.js character "test character"
node run.js scene "test scene"

# Entity matching
echo "Maya signs execon" | node run.js scene "test"

# Project context
cd test-project
node ../storyshell/skills/storyshell/run.js character "test"
```

## Performance Considerations

- **File Operations**: Use synchronous operations for simplicity and predictability
- **Logging**: Minimal overhead, append-only log file
- **Memory**: Load files individually, avoid caching large datasets
- **Path Resolution**: Check multiple search paths in order of priority

## Security Notes

- **File Paths**: Validate and sanitize user-provided paths
- **Command Injection**: Use parameterized execution patterns
- **Symlinks**: Check existing targets before creation
- **User Input**: Validate with defaults and required fields

## Development Workflow

1. **Changes**: Edit files directly in the repository
2. **Testing**: Use manual testing with `node -c` for syntax
3. **Installation**: Test with `./install.sh` after changes
4. **Projects**: Test project creation with `./setup-project.sh`
5. **Skills**: Test pi skill integration with actual pi-agent

## Debugging

- **Logs**: Check `storyshell.log` in project directory for detailed execution info
- **Verbose**: Script output includes color-coded status messages
- **Errors**: Warnings go to stderr, errors cause script exit
- **Paths**: Log file resolution and entity matching details

## Integration Points

- **Pi Agent**: Skill integration via `~/.pi/agent/skills/`
- **Commands**: Pi commands via `~/.pi/agent/commands/`
- **Projects**: User projects can be anywhere with proper structure
- **Templates**: Framework templates in `tpl/`, project-specific overrides supported
