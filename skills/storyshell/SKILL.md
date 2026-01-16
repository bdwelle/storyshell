---
name: storyshell
description: Simple story generation assistant for fiction writing and text-to-speech. Use for creating fictional characters, scenes, storylines, pov, prose, voice, speech, audio. 
---

## How to use me 

- Use this skill for creating fictional characters, scenes, storylines, pov, prose, and text-to-speech voice. 
- When the user's request includes words such as: character, scene, storyline, story, prose, pov, fiction, writing, punch up, speak, say, voice, tts: 

1. Invoke the appropriate template with this **invocation pattern**

```bash
cd <SKILL_DIR> && PROJECT_DIR="{cwd}" bash -c 'node storyshell.js <template-name>' <<EOF
<original-user-message>
EOF
```

2. The script outputs a complete prompt (includes + template + user request) to stdout
3. Take that output and send it to the LLM to generate the content
4. Save the generated content if the user requests it

**Key points:**
- Set `PROJECT_DIR` env var to the **original working directory** where opencode was invoked - this ensures storyshell.js can find project files even after cd to skill directory
- Set `SKILL_DIR` env var to the directory where the storyshell skill in installed
- Pass the **original user message** via HEREDOC after `<<<` - this ensures storyshell.js has access to the actual prompt with all formatting and context
- `<template-name>` is one of: `character-interview`, `character`, `scene-suggest`, `scene`, `storyline-suggest`, `storyline`, `pov`, `prose`, `tts`
- The script automatically extracts filenames, concept tokens, and character names from the user prompt
- All relevant context is loaded and included in the output

**Examples:**

Simple request:
```bash
cd /Users/bdwelle/lib/storyshell/skills/storyshell && PROJECT_DIR="/Users/bdwelle/Library/CloudStorage/ProtonDrive-bdwelle@pm.me-folder/stories/ship" bash -c 'node storyshell.js character-interview' <<'EOF'
develop a character Tranh, 25, female, real estate agent
EOF
```

Complex multi-line request:
```bash
cd /Users/bdwelle/lib/storyshell/skills/storyshell && PROJECT_DIR="/Users/bdwelle/Library/CloudStorage/ProtonDrive-bdwelle@pm.me-folder/stories/ship" bash -c 'node storyshell.js character-interview' <<EOF
develop a character named Lucia. 
Beylorussian female, 32, emigated to US via Barcelona, Ibiza, Miami. huge eyes, daddy complex
EOF
```

## Usage


- When the user asks to "speak" or "say" something, or to "generate audio" or "tts" for a piece of text, use the `tts` template.

### Text-to-speech

When user says something like:
- "speak tmp/tts-test-1.md"
- "say tmp/tts-test-1.md"
- "tts tmp/tts-test-1.md"
- "generate tts tmp/tts-test-1.md"
- "generate speech tmp/tts-test-1.md"

Run:
```bash
cd <SKILL_DIR> && PROJECT_DIR="{cwd}" bash -c 'node storyshell.js tts' <<< "generate tts <target-file>"
```

The script will:
1. Parse the target file's frontmatter (extract `pov:` field)
2. Load the character file for the POV character
3. Generate a Director's Note (style prompt) via LLM
4. Call Gemini TTS with text, style prompt, and voice
5. Save audio to `voice/tts-<timestamp>-<filename>.wav`
6. Output the audio file path to stdout

**Voice Mapping:** is defined in `storyshell.js` VOICE_MAP constant
If no voice mapping exists, defaults to 'Leda'.

### Punch-up Writing (Interactive Process)

When user says something like:
- "punch up pov/celeste-stretching-test-1600.md"

Run:
- invoke the `punch-up` template

The output will be a complete prompt. Send it to the LLM to generate the punched-up prose. 
```

### Develop a Character (Interactive Process)

When user says something like:
- "Develop a character named Bo, age 15, male"
- "Build a new character named Bo, age 15, male"
- "Create a character that is a skateboarder, male, age 15..."
- "I want to develop a character who is a postman..."

Use the **two-step interactive process**:

**Step 1: Generate Interview Questions**
- invoke the `character-interview` template

This generates 8-10 personalized questions about voice, transformation lines, and specific details.

**Step 2: Have Conversation**
- Present the questions to the user
- **Important:** User should answer IN CHARACTER, as if they ARE the character
- Have a natural conversation gathering their answers (in character's voice)
- Keep the full conversation in context

**Step 3: Generate Final Character**
- invoke the `character` template

The character template will use the conversation history (questions + answers) to create an authentic character.

**Example Workflow:**
```
User: "Develop a character named Bo, age 15, male"

You: 
1. invoke the `character-interview` template
2. Show the generated questions to user
3. User answers the questions in conversation
4. invoke the `character` template
   (with full conversation in context)
5. Generate and show the complete character profile
```

### Suggest Scene Concepts (Brainstorming)

When user says something like:
- "Suggest some scenes about..."
- "Give me scene ideas for..."
- "Brainstorm scenes with..."

Run:
- invoke the `scene-suggest` template

This generates 3-5 quick scene concepts with value shifts and turning points.

**Then:** User picks one concept and you develop it fully with `scene`.

### Create a Scene Sketch (Full Development)

When user says something like:
- "Create a scene about..."
- "Sketch a scene where..."
- "Develop scene #2" (after suggestions)

Run:
- invoke the `scene` template

The output will be a complete prompt. Send it to the LLM to generate the full scene sketch.

**Workflow Example:**
```
User: "Suggest scenes about a skateboarder and robot cop"
You: invoke `scene-suggest`, show 3-5 options
User: "I like #2, develop that"
You: Invoke `scene` with concept from #2
```

### Suggest Storyline Concepts (Brainstorming)

When user says something like:
- "Suggest some storylines about..."
- "Give me storyline ideas for..."
- "Brainstorm storylines with..."

Run:
- invoke the `storyline-suggest` template

This generates 3-5 storyline arcs with character journeys, global values, and core conflicts.

**Then:** User picks one concept and you develop it fully with `storyline`.

### Create a Storyline (Full Development)

When user says something like:
- "Create a storyline about..."
- "Develop storyline #3" (after suggestions)
- "Generate a full storyline for..."

Run:
- invoke the `storyline` template

The output will be a complete prompt. Send it to the LLM to generate the full storyline.


**Workflow Example:**
```
User: "Suggest storylines about a skateboarder and robot cop"
You: Invoke `storyline-suggest`, show 3-5 options
User: "I love #3, develop that"
You: Invoke `storyline` with concept from #3
```

### Write pov

When user says something like:
- "Write pov for scenes/skateboarder-robot-cop.md"
- "Generate pov narrative for scenes/skateboarder-robot-cop.md"

Run:
- invoke the `pov` template

The output will be a complete prompt. Send it to the LLM to generate the pov narrative.

### Write prose

When user says something like:
- "Write prose for scenes/skateboarder-robot-cop.md"
- "Generate writing for scenes/skateboarder-robot-cop.md"

Run:
- invoke the `prose` template

The output will be a complete prompt. Send it to the LLM to generate the prose.

### Saving Generated Content

If user asks to save the generated content, use the `output` field from the template frontmatter as a guide (e.g., `scenes/` for scene sketches), or save to wherever the user specifies.

## Workflow Example

```
User: "Create a scene where an artist meets a businessman at a gallery opening"

You:
1. Invoke `scene` using HEREDOC with "Create a scene where an artist meets a businessman at a gallery opening"
2. Take the stdout output (which includes context + template + user request)
3. Send that complete prompt to the LLM
4. LLM generates a scene sketch following the template structure
5. Show the generated scene to the user

User: "Save that as scenes/gallery-meeting.md"

You:
6. Save the generated content to scenes/gallery-meeting.md
```

## Notes

- **Project Context Required:** `storyshell.js` requires `prompts/main.md` in the current working directory. This file contains project-specific context (world, tone, etc.). Processing will fail with an error if not found.
- **Concept Files:** Place domain-specific concept files in your project's `codex/` directory with frontmatter including `aliases` and `related_concepts` for automatic loading
- **Character Files:** Place character definitions in your project's `characters/` directory with frontmatter including `aliases`, `related_characters`, and `related_concepts`
- **Entity Matching:** Single words from user prompts are matched against entity filenames and aliases (case-insensitive, exact match)
- **Relationship Loading:** When a character/concept is matched, its `related_characters` and `related_concepts` are automatically loaded
- Templates also include story methodology files (Storygrid, Method Writing, etc.) from their frontmatter
- The `storyshell.js` script logs all operations to `log/storyshell.log` in the current directory, including entity matching details
- Missing include files (other than prompts/main.md) generate warnings but don't stop processing
- User must be in their project directory when running commands
