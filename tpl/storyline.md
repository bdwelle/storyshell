---
type: template
id: storyline
includes:
  - /Users/bdwelle/lib/storygen/inc/storygrid.md
---

# Storyline Development Task

You are creating a detailed storyline (narrative arc spanning a chapter or section).

A storyline defines how a character(s) progresses through a series of connected scenes, with clear structure following the Storygrid Five Commandments and a defined value progression.

## Task

Generate a complete storyline based on the storyline description provided and the story context assembled above.

Fill in all sections with detailed content that:
- Follows the narrative goals and story structure framework defined above
- Creates a clear, causal chain of events (beats flow logically)
- Tracks emotional/situational value shifts with concrete numbers
- Defines 3-5 specific scenes with distinct purposes
- Fulfills all Five Commandments completely
- Fits the world, genre, and character arcs

## Key Guidelines

- **Thruline**: Crystal clear one-sentence summary of the complete narrative arc
- **Arc**: Explicit progression showing how things change from opening to closing
- **Value Progression**: Use numbers (e.g., -4 to +2) to track shifts in each scene
- **Scene Breakdown**: 3-5 scenes minimum, each with clear Turning Point and purpose
- **Five Commandments**: Complete structure (Inciting Incident → Complications → Crisis → Climax → Resolution)
- **POV Consistency**: Maintain consistent voice and sensations from POV character
- **Causality**: Each scene causes the next; no arbitrary plot developments

## Template Structure

Follow this exact structure for your generated storyline:

```yaml
---
type: storyline
id: {id-slug}
status: development
title: {storyline title}
chapter: {chapter number}
pov: {point of view character}
location: [Primary location(s)]
include: [other prompt files to include]
created: {today's date}
modified: {today's date}
---

# Storyline for Chapter {chapter}: {title}

## Thruline
[2-3 sentence summary of the complete narrative arc - the spine of the story]

## Arc
[Opening state] → [Closing state]

[Concrete description of how things change]

## Length
[Suggested length: X to Y words for the complete storyline when expanded to prose]

## Opens With
[One paragraph: setting the opening image/moment, what the character sees/feels/experiences, what's at stake]

## Scenes

[Define 3-5 scenes. Each scene is a unit of action that progresses the storyline.]

### Scene {chapter}-1: "{Title}"
**Location:** [Where this happens]  
**Turning Point:** [What changes: action/revelation/decision]  
**Value:** [Value name] [opening_value] → [closing_value]  
**Pacing:** [Pace note: how to manage time and tension]

[Key beats/events of this scene]
- [Beat 1]
- [Beat 2]
- [Beat 3]

### Scene {chapter}-2: "{Title}"
**Location:** [Where this happens]  
**Turning Point:** [What changes]  
**Value:** [Value name] [opening_value] → [closing_value]  
**Pacing:** [Pace note]

[Key beats/events of this scene]
- [Beat 1]
- [Beat 2]
- [Beat 3]

[Continue scenes as needed...]

## Closes With

[One paragraph: the final image/moment, what has changed, what it means going forward]

## POV Notes: {character}

**Voice/Behavior:**
- [Key voice pattern 1: how they speak, think, react]
- [Key voice pattern 2]
- [Physical tell 1: distinctive body language/gesture]
- [Physical tell 2]

**Key Sensations:**
- [Important physical sensation 1: what they notice, feel]
- [Important physical sensation 2]
- [Important physical sensation 3]

## Five Commandments

**Inciting Incident:** [What sets the storyline in motion - the catalyst]

**Progressive Complications:**
- [Complication 1: what gets harder/more complex as result]
- [Complication 2: next layer of difficulty]
- [Complication 3: third layer]
- [Complication 4: optional additional complication]

**Crisis:** [Best bad choice A] vs. [Best bad choice B]  
[The dilemma: both choices have serious consequences]

**Climax:** [The action/decision the character takes]  
[Why they choose this option despite the cost]

**Resolution:** [The immediate consequence and what it means]  
[The new status quo after their choice]

## Notes for Scene Development

These are notes included here for eventual, subsequent scene development. 
DO NOT generate scenes now. 

**Tone:**
- [Overall storyline tone]
- [Key scene tone note]
- [Closing tone note]

**Pacing Strategy:**
- [How to manage rhythm and tempo across scenes]

**Character Arc:**
- [How the POV character changes through this storyline]
```
