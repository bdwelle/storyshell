# Storygen Development Proposal

## Overview

Storygen is a simple story generation/fiction writing assistant implemented as a Pi skill. It uses markdown templates with embedded instructions and YAML frontmatter to generate characters, scenes, storylines, and prose.

## Core Concept

**Template-driven generation**: Templates are markdown files that combine:
1. **YAML frontmatter** - Metadata including files to include and output directory
2. **Structural format** - What the output should look like
3. **Embedded instructions** - How to generate the content

**Simple workflow**:
```
User request → run.js → concatenate includes + template → stdout → Pi → LLM → generated content
```

## Architecture

### Directory Structure

```
/Users/bdwelle/lib/storygen/
├── PROMPT.md                    # Original requirements
├── PROPOSAL.md                  # This document
├── inc/                         # Shared context files (reusable across projects)
│   ├── method-characters.md
│   ├── method-writing.md
│   ├── narrative-goals.md
│   ├── nsfw.md
│   ├── sexual-themes.md
│   ├── shipchain.md
│   ├── storygrid.md
│   └── themes.md
├── tpl/                         		# Templates
├── tpl-to-port/                         # Reference Templates to port from another storygen project 
│   ├── character.md
│   ├── prose.md
│   ├── scene.md
│   ├── storyline-suggest.md
│   └── storyline.md
├── pi-skills/
│   └── storygen/                # Pi skill (symlinked to ~/.pi/agent/skills/storygen)
│       ├── SKILL.md             # Pi skill definition
│       ├── run.js               # Template processor
│       ├── inc/
│       │   └── main.md          # Skill-level includes (if any)
│       └── tpl/                 # Skill templates (POC/examples)
│           ├── character.md
│           └── scene.md
└── proj/                        # Example story project
    │   └── SYSTEM.md              # Project-specific system prompt
    ├── inc/
    │   └── main.md              # Project-specific context
    ├── characters/              # Generated characters
    ├── scenes/                  # Generated scenes
    ├── storylines/              # Generated storylines
    └── prose/                   # Generated prose
```

### Template Format

Each template has YAML frontmatter + markdown body:

```markdown
---
includes:
  - inc/main.md
  - inc/storygrid.md
output: characters/
---

# Character Creation Task

Generate a character based on the context above and user's description below.

## Output Format

[Structural template showing what output should look like]

## Instructions

[Detailed instructions for generating the content]

Generate the character now.
```

### The run.js Script

Single purpose: Process templates and output complete prompts to stdout.

**What it does**:
1. Takes template name + optional user prompt as arguments
2. Reads `tpl/{template-name}.md`
3. Parses YAML frontmatter for `includes: [...]`
4. Reads and concatenates all included files (supports both relative and absolute paths)
5. Appends template body
6. Appends user prompt (if provided)
7. Logs all meaningful operations to a log file (single-line entries)
8. Outputs complete prompt to stdout

**What it doesn't do**:
- Call the LLM (Pi does this)
- Save files (Pi/user does this)
- Parse output (not needed)
- Complex template logic (keep it simple)

**Logging**:
All meaningful operations are logged to `storygen.log` in the current directory with single-line entries:
```
2026-01-07T20:26:15.123Z run template=scene user_prompt="artist meets businessman"
2026-01-07T20:26:15.124Z include file=inc/main.md status=ok
2026-01-07T20:26:15.125Z include file=../inc/storygrid.md status=ok
2026-01-07T20:26:15.126Z include file=proj/inc/main.md status=missing
2026-01-07T20:26:15.127Z output bytes=2451
```

### Pi Integration

Pi loads the skill when tasks match the description. The SKILL.md provides usage instructions:

```bash
{baseDir}/run.js character "skateboarder punk"
{baseDir}/run.js scene_suggest "artist and businessman"
{baseDir}/run.js prose scenes/scene-01.md
```

Pi sees the stdout output (complete prompt) and sends it to the LLM.

## Template Types

### 1. Character Templates

**character.md** - Create a detailed character
- Includes: main.md, storygrid.md
- Output: characters/
- Input: Natural language description
- Generates: Full character profile with background, want/need, arc

**character_suggest.md** - Brainstorm character ideas
- Includes: main.md, storygrid.md
- Output: (stdout only, user picks one)
- Input: Natural language description
- Generates: 3-5 character concepts

### 2. Scene Templates

**scene.md** - Create a scene sketch
- Includes: main.md, storygrid.md
- Output: scenes/
- Input: Natural language description
- Generates: Scene structure with beats, turning point, value shift

**scene_suggest.md** - Brainstorm scene ideas
- Includes: main.md, storygrid.md
- Output: (stdout only, user picks one)
- Input: Natural language description
- Generates: 3-5 scene concepts

### 3. Storyline Templates

**storyline.md** - Create a storyline/chapter arc
- Includes: main.md, storygrid.md
- Output: storylines/
- Input: Natural language description
- Generates: Full storyline with scenes, five commandments, value progression

**storyline_suggest.md** - Brainstorm storyline ideas
- Includes: main.md, storygrid.md
- Output: (stdout only, user picks one)
- Input: Natural language description
- Generates: 3-5 storyline concepts

### 4. Prose Template

**prose.md** - Write long-form prose from a scene
- Includes: main.md, method_writing.md, [scene-file]
- Output: prose/
- Input: Path to scene file
- Generates: Full narrative prose based on scene structure

## Include Files

### inc/main.md
Project-specific context that all templates include:
- Genre
- Setting
- Tone
- World overview
- Character list
- Story synopsis

### inc/storygrid.md
Story structure methodology:
- Five commandments
- Scene structure
- Value tracking
- Character arc principles

### inc/method_writing.md
Writing style guidance:
- POV approach
- Sensory detail
- Voice consistency
- Pacing notes

## Usage Examples

### Create a Character
```
User: "Create a character who is a skateboarder punk"
Pi: [reads SKILL.md, runs run.js character "skateboarder punk"]
Pi: [sends output to LLM]
LLM: [generates character following template]
User: "Save that as characters/bo.md"
Pi: [saves the character]
```

### Suggest Scenes
```
User: "Suggest some scenes about an artist and a businessman"
Pi: [runs run.js scene_suggest "artist and businessman"]
Pi: [sends output to LLM]
LLM: [generates 3-5 scene concepts]
User: "Let's develop #2"
Pi: [runs run.js scene with the chosen concept]
```

### Write Prose
```
User: "Write prose for scenes/confrontation.md"
Pi: [runs run.js prose scenes/confrontation.md]
Pi: [sends output to LLM]
LLM: [generates full narrative prose]
User: "Save as prose/confrontation.md"
Pi: [saves the prose]
```

## Configuration

### Project Setup

User creates a project directory with:
```
proj/
└── inc/
    └── main.md    # Project context
```

All `run.js` commands run from the project directory. Templates can reference includes from multiple locations:

```yaml
---
includes:
  - inc/main.md               			# Relatve path for Project-specific context
  - /Users/bdwelle/lib/storygen/inc/storygrid.md       # Absolute path 
---
```

**Include resolution** (checked in order):
1. Relative to current working directory (project directory)
2. Absolute paths (if specified)

Missing includes generate a warning to stderr but don't stop processing.

### No Other Configuration Needed

- No config files
- No API keys (Pi handles LLM)
- No installation beyond `npm install` once
- No database or state management

## Implementation Plan

### Phase 1A: Scene Template
1. Write run.js with:
   - Template processing (read, parse YAML frontmatter, concatenate)
   - Include resolution 
   - Logging function that writes single-line entries to storygen.log
   - Error handling (warnings to stderr, continue processing)
2. Manually create tpl/scene.md
3. Test scene.md with run.js

### Phase 1B: Other Core Templates 
1. Manually create tpl/storyline.md
2. Manually create tpl/prose.md
3. Manually create tpl/character.md
4. Test all templates with run.js

### Phase 2: Suggestion Templates
1. Create lightweight versions (_suggest variants)
2. Focus on brainstorming vs. full structure
3. Test suggestion → creation workflow

### Phase 3: Include Files
1. Create `inc/main.md` template for users
2. Port `inc/storygrid.md` from existing prompts
3. Port `inc/method_writing.md` from existing prompts
4. Test include combinations

### Phase 4: Documentation & Polish
1. Complete SKILL.md with all usage examples
2. Document template format for user customization
3. Create sample project structure
4. Test end-to-end workflows

## Design Decisions

### Why Templates?
- Easy to understand and customize
- Version controllable (markdown in git)
- Self-documenting (instructions embedded)
- Flexible (users can modify or create new ones)

### Why No State Management?
- File system is the database
- User manages project structure
- No syncing or consistency issues
- Simple mental model

### Why Minimal Scripts?
- One script (`run.js`) does one thing well
- Easy to understand and debug
- No framework dependencies
- Pi handles the heavy lifting (LLM, file ops)

### Why YAML Frontmatter?
- Standard markdown convention
- Easy to parse
- Clear separation of metadata and content
- Extensible (can add more fields later)

## Success Criteria

1. **Simple**: New user can understand the system in 5 minutes
2. **Flexible**: Users can easily modify templates or create new ones
3. **Fast**: No overhead beyond Pi's normal operation
4. **Maintainable**: No complex code or dependencies
5. **Extensible**: Easy to add new template types

## Design Questions (Resolved)

1. **Output saving**: ✓ `output` frontmatter is informational only for Pi. Pi handles saving naturally through user requests.

2. **Template discovery**: ✓ Not needed. SKILL.md documents all available templates.

3. **Error handling**: ✓ Print warning to stderr for missing includes/templates, continue processing with what's available.

4. **Logging**: ✓ All meaningful operations logged to `storygen.log` in current directory with single-line entries (timestamp, operation, parameters, status).

## Next Steps

1. Review this proposal
2. Refine based on feedback
3. Start with Phase 1 implementation
4. Test with real story project
5. Iterate based on usage

## Success Metrics

- Can generate a complete character in one interaction
- Can develop a storyline from concept to structured outline in 2-3 interactions
- Can write prose from scene sketch in one interaction
- Total time from idea to generated content: < 5 minutes
- User can customize templates without reading code
