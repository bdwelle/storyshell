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

Currently available:
- `scene` - Create a scene sketch (structural blueprint with beats, value progression, Five Commandments)

Coming soon:
- `character` - Create a character profile
- `storyline` - Create a storyline/chapter arc
- `prose` - Generate prose from a scene sketch

## Usage

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
