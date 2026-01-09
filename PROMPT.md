# Storyshell 
A simple story generation/fiction writing assistant CLI built on top of  [https://github.com/badlogic/pi-mono/tree/main/packages/coding-agent](pi-agent). 

## Requirements
1. There is a local copy of the pi-agent repo in ~/lib/pi-mono/packages/agent
2. try do do it without using pi-skills or pi-commands -- or only very minimally (no skill helper code, if possible)
3. keep it VERY SIMPLE, easy to understand, easy to configure, and flexible. 
4. use MD templates (maybe with YAML frontmatter, if that helps) for storylines, scenes, characters, and prose. 
5. templates will include desired formatting _and_ embedded instructions. 
6. The basic paradigm is to have the llm "run" a template -> with some given prompt context, generate content to fill in the template, following the embedded instructions.
7. we need a way to add to/set the system prompt
8. additional context can be pulled into a template using @include syntax or the Include field in the frontmatter. 
9. overall context for the project is pulled in from inc/main.md (maybe all the templates simply @include main.md)?
10. See tpl/storyline.md tpl/storyline_suggest.md tpl/prose.md for example templates.

## Character
Person in a Story or Scene. 

**Natural Language Commands**
- "suggest some skateboarder characters" -> run templates/character_suggest.md
- "create a character who is a sculptor" -> run templates/character.md

## Scene
Schematic definition of the essentials of a Scene, including a summary of the key Beats. Use prompts/storygrid.md scene structure and prompts/method_writing.md for writing style. 

**Natural Language Commands**
- "suggest some scenes about a skateboarder and a robot cop" -> run templates/scene_suggest.md
- "create a sketch about an artist and a businessman" -> run templates/scene.md

## Storyline
Schematic definition of the essentials of a chapter or short story, including a summary of the Scenes. Use prompts/storygrid.md for storyline and scene structure. 

**Natural Language Commands**
- "suggest some storylines about a skateboarder and a robot cop" -> run  templates/storyline_suggest.md 
- "create a storyline about an artist and a businessman" -> run templates/storyline.md

## Prose
Long-form writing that writes out a story, using the definition in a Sketch. Use prompts/method_writing.md for writing style. 

**Natural Language Commands**
- "write SCENE_FILE" -> run templates/prose.md using SCENE_FILE as prompt
