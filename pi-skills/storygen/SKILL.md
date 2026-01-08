---
name: storygen
description: Simple story generation assistant for fiction writing. Use for creating characters, scenes, storylines, and prose. Trigger words: character, scene, storyline, story, prose, fiction, writing.
---

# Storygen

Story generation system using templates with embedded instructions for fiction writing.

## How It Works

When the user requests story generation:
1. Run the appropriate template using `run.js`
2. The script outputs a complete prompt (includes + template + user request) to stdout
3. Take that output and send it to the LLM to generate the content
4. Save the generated content if the user requests it

## Available Templates

- `character-interview` - Generate interview questions for character development (interactive)
- `character` - Create a character profile (use after interview conversation)
- `storyline` - Create a storyline/chapter arc
- `scene` - Create a detailed scene sketch 
- `prose` - Generate prose from a scene sketch

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
- Have a natural conversation gathering their answers
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

### Create a Scene Sketch

When user says something like:
- "Create a scene about..."
- "Sketch a scene where..."
- "Generate a scene with..."

Run:
```bash
{baseDir}/run.js scene "[user's description]"
```

The output will be a complete prompt. Send it to the LLM to generate the scene sketch.

**Example:**
```bash
{baseDir}/run.js scene "artist meets businessman at gallery opening"
```

### Create a Storyline

When user says something like:
- "Create a storyline about..."
- "Develop a storyline where..."
- "Generate a storyline with..."

Run:
```bash
{baseDir}/run.js storyline "[user's description]"
```

The output will be a complete prompt. Send it to the LLM to generate the storyline.

**Example:**
```bash
{baseDir}/run.js storyline "skateboarder confronted by robot cop "
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

- Templates automatically include story context and methodology (Storygrid, Method Writing, etc.)
- The `run.js` script logs all operations to `storygen.log` in the current directory
- Missing include files generate warnings but don't stop processing
- User should be in their project directory when running commands
