---
type: template
id: scene
includes:
  - /Users/bdwelle/lib/storygen/inc/storygrid.md
  - /Users/bdwelle/lib/storygen/inc/method-writing.md
---

# Scene Generation Task

You are creating a detailed scene schematic for a story.

This is the structural blueprint for the scene—NOT full prose. It defines the beats, transitions, and emotional arc that will later be expanded into full narrative prose.

## Task

Generate a complete scene sketch based on the scene description provided and the story context assembled above.

The sketch should:
- Define the scene's structure using beats with Image/Moment details
- Track the story value's progression from opening to closing
- Specify pacing and tonal dynamics for each beat
- Include bookends (action/dialogue) that frame each beat's Image/Moment
- Provide guidance for later prose generation

## Key Guidelines

- Use **Image/Moment** structure for each beat (not action summary)
- Define **Tonal Dynamics** (which techniques to use: Transformation Line, Deep Voice, Dreaded Association, Straight Talk, Lost World, Read & Sung, Teeth & Mouth, Surrealism)
- Specify **Pacing** strategy for each beat (slow/medium/fast, how to use images to stretch psychological time)
- Include **Bookends** (action or dialogue) that frame each Image/Moment
- Track **Value progression** numerically (opening → closing)
- Provide **Prose Generation Notes** for later expansion by another agent
- Follow the Storygrid Five Commandments and Method Writing beat structure

## Template Structure

Follow this exact structure for your generated sketch:

```yaml
---
type: sketch
id: sketch-{title-slug}
status: development
title: {scene title}
chapter: {chapter number}
scene: {scene number}
storyline: {storyline id if applicable}
pov: {point of view character}
location: [Location description]
codex_references:
  - [reference-1]
  - [reference-2]
value: [Story Value]
opening_value: 0
closing_value: 0
polarity: [positive/negative/ironic]
turning_point_type: [action/revelation/decision]
turning_point: "[Brief description]"
created: {today's date}
modified: {today's date}
---

# Sketch {chapter}-{scene}: {title}

## Setting
[50 words max: physical space, key atmospheric elements, essential characters present]

## Characters Present
- **{pov}** (POV) - [Brief state/condition]
- [Other character] - [Brief role]

## Scene Purpose
- [What this accomplishes]
- [Key progression]
- [Value shift]

## Opening Value: {value} ({opening_value})
[1-2 sentences: starting state]

## Closing Value: {value} ({closing_value})
[1-2 sentences: ending state and why it changed]

## Beats

- Expand into detailed beats based on the scene
- Each beat follows Image/Moment structure from Method Writing

### Beat 1: [Name]

**Thruline:** [What this beat is about]
**Pacing:** [slow/medium/fast, how to use images to stretch psychological time]
**Tonal Dynamics:** [Which techniques to use and when - Transformation Line, Deep Voice, Dreaded Association, Straight Talk, Lost World, Read & Sung, Teeth & Mouth, Surrealism]
**Bookend:** [Action or dialogue]
**Image/Moment:** [use any or all of Set, Set Dressing, Mood, Props, Character, Costume, and/or Commentary as appropriate for the beat]
**Bookend:** [Action or dialogue]

### Beat 2: [Name]

**Thruline:** [What this beat is about]
**Pacing:** [slow/medium/fast, how to use images to stretch psychological time]
**Tonal Dynamics:** [Which techniques to use and when]
**Bookend:** [Action or dialogue]
**Image/Moment:** [use any or all of Set, Set Dressing, Mood, Props, Character, Costume, and/or Commentary as appropriate for the beat]
**Bookend:** [Action or dialogue]

[continue generating beats as needed for the scene]

## Prose Generation Notes

These are notes included here for eventual, subsequent prose generation. 
DO NOT generate full prose now. 

**Word Count:** [suggested length of scene words of prose]

**POV:** [POV approach and voice tracking]

**Sensory notes:**
- [Primary sense]
- [Secondary sense]
- [Tertiary sense]

**Emotional Track:** [Beat-by-beat emotional progression]

**Next Scene:** [What should happen next]

**[Additional guidance]:** [Scene-specific notes for prose generation]
```
