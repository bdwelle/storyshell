LLM_USER_COMMAND---
name: storyshell
description: Simple story generation assistant for fiction writing. Use for creating fictional characters, scenes, storylines, and prose.
---

# Storyshell

Story generation system using templates with embedded instructions for fiction writing.

## When to Use

- Use for creating fictional characters, scenes, storylines, and prose.
- When the user's request includes words such as: character, scene, storyline, story, prose, fiction, writing

## How It Works

When the user requests story generation:
1. Run the appropriate template using `run.js`
2. The script automatically loads relevant context:
   - Project context from `prompts/main.md`
   - **Concept-specific knowledge** from user's prompt (see Entity Matching below)
   - **Character definitions** from user's prompt (see Entity Matching below)
   - Template-specific includes (methodology, etc.)
3. The script outputs a complete prompt (includes + template + user request) to stdout
4. Take that output and send it to the LLM to generate the content
5. Save the generated content if the user requests it

### Automatic Entity Matching (Concepts + Characters)

The system automatically detects and loads context files based on words in the user's prompt:
- **Concepts** from `codex/` directory (technology, world-building, themes)
- **Characters** from `characters/` directory (character definitions, relationships)

**How it works:**
- User mentions "shipchain" → system loads `codex/shipchain.md`
- User mentions "Maya" → system loads `characters/maya-chen.md`
- User mentions "Celeste" → system loads `characters/celeste-voss.md` + related characters
- User mentions "executable-contracts" → system loads `codex/steg.md` (via alias)

**Features:**
- **Alias matching:** Both concepts and characters can have multiple aliases
- **Related entities:** Automatically loads `related_concepts` and `related_characters`
- **Deduplication:** Same file never loaded twice
- **Logged:** All matches logged to `storyshell.log`

**Examples:**

*Characters only:*
```bash
{baseDir}/run.js scene "Celeste oversees Maya stretching session"
```
→ Loads `characters/celeste-voss.md` + `characters/maya-chen.md`

*Mix of characters and concepts:*
```bash
{baseDir}/run.js scene "Maya signs an execon while wearing a shipchain"
```
→ Loads `characters/maya-chen.md` + `codex/steg.md` + `codex/shipchain.md` + related concepts

**Entity File Format:**

*Concept file (codex/):*
```yaml
---
title: "Concept Name"
type: technology
aliases:
  - alternative-name
  - another-name
related_concepts:
  - other-concept
---
# Concept content...
```

*Character file (characters/):*
```yaml
---
type: character
name: Maya Chen
aliases:
  - maya
related_characters:
  - celeste
related_concepts:
  - gymnast
---
# Character content...
```

## Available Templates

These templates are stored in ~/lib/storyshell/tpl

- `character-interview` - Generate interview questions for character development (interactive)
- `character` - Create a character profile (use after interview conversation)
- `scene-suggest` - Brainstorm 3-5 scene concepts (quick exploration)
- `scene` - Create a detailed scene sketch (full development)
- `storyline-suggest` - Brainstorm 3-5 storyline concepts (quick exploration)
- `storyline` - Create a storyline/chapter arc (full development)
- `prose` - Generate prose from a scene sketch

## How to Invoke

The storyshell skill is invoked via the bash tool with environment variables to preserve the original user message.

**Invocation pattern:**
```bash
LLM_USER_COMMAND="<original-user-message>" bash -c '{baseDir}/run.js <template-name> "<agent-interpretation>"'
```

**Key points:**
- Set `LLM_USER_COMMAND` env var to the **original user message exactly as they typed it** - this ensures run.js has access to the actual prompt with all formatting and context
- `<template-name>` is one of: `character-interview`, `character`, `scene-suggest`, `scene`, `storyline-suggest`, `storyline`, `prose`
- `<agent-interpretation>` is your (the agent's) interpretation/processing of the user request
- The script automatically extracts filenames, concept tokens, and character names from both sources
- All relevant context is loaded and included in the output

**Why both?**
- `LLM_USER_COMMAND` preserves the original, unmodified user input
- The second argument captures any processing/clarifications the agent has done
- run.js uses the env var as the primary source for entity extraction

**Examples:**

Simple request:
```bash
LLM_USER_COMMAND="write prose for scenes/gallery-opening.md" bash -c '/path/to/run.js prose "scenes/gallery-opening.md"'
```

Complex multi-line request:
```bash
LLM_USER_COMMAND="develop a scene with the Twins about their first binding together. 
Beats:
1) they are led into the binding chamber
2) they are bound together..." bash -c '/path/to/run.js scene "develop a detailed scene with the Twins first binding"'
```

## Usage

### Develop a Character (Interactive Process)

When user says something like:
- "Develop a character named Bo, age 15, male"
- "Create a character that is a skateboarder, male, age 15..."
- "I want to develop a character who is a postman..."

Use the **two-step interactive process**:

**Step 1: Generate Interview Questions**
```bash
{baseDir}/run.js character-interview "[user's description]"
```

This generates 8-10 personalized questions about voice, transformation lines, and specific details.

**Step 2: Have Conversation**
- Present the questions to the user
- **Important:** User should answer IN CHARACTER, as if they ARE the character
- Have a natural conversation gathering their answers (in character's voice)
- Keep the full conversation in context

**Step 3: Generate Final Character**
```bash
{baseDir}/run.js character "[original description]"
```

The character template will use the conversation history (questions + answers) to create an authentic character.

**Example Workflow:**
```
User: "Develop a character named Bo, age 15, male"

You: 
1. Run: {baseDir}/run.js character-interview "Bo, age 15, male"
2. Show the generated questions to user
3. User answers the questions in conversation
4. Run: {baseDir}/run.js character "Bo, age 15, male"
   (with full conversation in context)
5. Generate and show the complete character profile
```

### Suggest Scene Concepts (Brainstorming)

When user says something like:
- "Suggest some scenes about..."
- "Give me scene ideas for..."
- "Brainstorm scenes with..."

Run:
```bash
{baseDir}/run.js scene-suggest "[user's description]"
```

This generates 3-5 quick scene concepts with value shifts and turning points.

**Example:**
```bash
{baseDir}/run.js scene-suggest "skateboarder and robot cop"
```

**Then:** User picks one concept and you develop it fully with `scene`.

### Create a Scene Sketch (Full Development)

When user says something like:
- "Create a scene about..."
- "Sketch a scene where..."
- "Develop scene #2" (after suggestions)

Run:
```bash
{baseDir}/run.js scene "[user's description or chosen concept]"
```

The output will be a complete prompt. Send it to the LLM to generate the full scene sketch.

**Example:**
```bash
{baseDir}/run.js scene "artist meets businessman at gallery opening"
```

**Workflow Example:**
```
User: "Suggest scenes about a skateboarder and robot cop"
You: Run scene-suggest, show 3-5 options
User: "I like #2, develop that"
You: Run scene with concept from #2
```

### Suggest Storyline Concepts (Brainstorming)

When user says something like:
- "Suggest some storylines about..."
- "Give me storyline ideas for..."
- "Brainstorm storylines with..."

Run:
```bash
{baseDir}/run.js storyline-suggest "[user's description]"
```

This generates 3-5 storyline arcs with character journeys, global values, and core conflicts.

**Example:**
```bash
{baseDir}/run.js storyline-suggest "skateboarder and robot cop"
```

**Then:** User picks one concept and you develop it fully with `storyline`.

### Create a Storyline (Full Development)

When user says something like:
- "Create a storyline about..."
- "Develop storyline #3" (after suggestions)
- "Generate a full storyline for..."

Run:
```bash
{baseDir}/run.js storyline "[user's description or chosen concept]"
```

The output will be a complete prompt. Send it to the LLM to generate the full storyline.

**Example:**
```bash
{baseDir}/run.js storyline "skateboarder confronted by robot cop"
```

**Workflow Example:**
```
User: "Suggest storylines about a skateboarder and robot cop"
You: Run storyline-suggest, show 3-5 options
User: "I love #3, develop that"
You: Run storyline with concept from #3
```

### Write prose

When user says something like:
- "Write prose for scenes/skateboarder-robot-cop.md"
- "Generate writing for scenes/skateboarder-robot-cop.md"

Run:
```bash
{baseDir}/run.js prose "[user's description]"
```

The output will be a complete prompt. Send it to the LLM to generate the prose.

**Example:**
```bash
{baseDir}/run.js prose "scenes/skateboarder-robot-cop.md"
```

### Saving Generated Content

If user asks to save the generated content, use the `output` field from the template frontmatter as a guide (e.g., `scenes/` for scene sketches), or save to wherever the user specifies.

## Workflow Example

```
User: "Create a scene where an artist meets a businessman at a gallery opening"

You:
1. Run: {baseDir}/run.js scene "artist meets a businessman at a gallery opening"
2. Take the stdout output (which includes context + template + user request)
3. Send that complete prompt to the LLM
4. LLM generates a scene sketch following the template structure
5. Show the generated scene to the user

User: "Save that as scenes/gallery-meeting.md"

You:
6. Save the generated content to scenes/gallery-meeting.md
```

## Notes

- **Project Context Required:** `run.js` requires `prompts/main.md` in the current working directory. This file contains project-specific context (world, tone, etc.). Processing will fail with an error if not found.
- **Concept Files:** Place domain-specific concept files in your project's `codex/` directory with frontmatter including `aliases` and `related_concepts` for automatic loading
- **Character Files:** Place character definitions in your project's `characters/` directory with frontmatter including `aliases`, `related_characters`, and `related_concepts`
- **Entity Matching:** Single words from user prompts are matched against entity filenames and aliases (case-insensitive, exact match)
- **Relationship Loading:** When a character/concept is matched, its `related_characters` and `related_concepts` are automatically loaded
- Templates also include story methodology files (Storygrid, Method Writing, etc.) from their frontmatter
- The `run.js` script logs all operations to `storyshell.log` in the current directory, including entity matching details
- Missing include files (other than prompts/main.md) generate warnings but don't stop processing
- User must be in their project directory when running commands
