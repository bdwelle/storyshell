# Storyshell

Simple story generation/fiction writing assistant CLI built as an agent and agent skill for opencode.

## Overview

Storyshell uses markdown templates with embedded instructions to generate characters, scenes, storylines, and pov/prose for fiction writing. It integrates Story Grid methodology with Method Writing technique and provides a simple, flexible workflow.

### Writing
`agents/storyshell-writer.md` defines a _Storyshell-Writer_ [agent](https://opencode.ai/docs/agents/) that should be used for all writing tasks. 
`skills/storyshell/SKILL.md` defines an agent skill that lays out all of the _Storyshell_ commands. 
`skills/storyshell/storyshell.js` implements specific _Storyshell_ commands (invoked by SKILL.md). 

### Text to Speech
`agents/elevenlabs-tts.md` defines an _Elevenlabs-TTS_ Text-to-Speech subagent. This can be used to convert user-provided text into spoken audio using the ElevenLabs service.
`tools/elevenlabs-tts.js` defines an _Elevenlabs-TTS_ Text-to-Speech tool. This is called by `agents/elevenlabs-tts.md` to communicate with the Elevenlabs API. 


## Quick Start

1. **Install the skill**:
   ```bash
   install.sh
   ```

2. **Set up a project**:
   ```bash
   ./setup_project.sh
   ```

3. **Use with Opencode**:
   ```bash
   cd myproject
   opencode
   # In opencode chat:
   # Switch to the _storyshell-writer_ agent
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
├── agents/
├── commands/
├── tools/
├── skills/
│   └── storyshell/     # Pi skill implementation
├── example-project/             # Example project
```

## Status

Currently in development (see PROPOSAL.md for roadmap).

## License

MIT
