---
type: template
id: pov
includes:
  - prompts/method-writing.md
  - prompts/tonal-dynamics.md
---

# POV speech Generation Task

You are generating full narrative point of view from a scene sketch blueprint.

The sketch provides the structural framework (beats, Image/Moments, value progression). Your task is to expand each beat into vivid, immersive pov narrative while following the Method Writing and Tonal Dynamics methodologies. 

## Task

Generate complete scene pov narrative based on the sketch blueprint above.

**Requirements:**

- POV: tight first person
- Follow the beat structure as defined in the sketch
- Use **Method Writing** as primary methodology. Lead with images and moments.
- Ground the reader in sensory detail through sight, sound, smell, touch, taste.
- Use **Tonal Dynamics** as indicated in the sketch to alter the pace and tone of the narrative speech 
- Express the value shift: {opening_value} → {closing_value}
- Follow narrative goals and tone defined in the context above
- Expand each beat's Image/Moment with vivid detail. Cover ALL beats from the sketch; don't skip or combine.
- Never summarize or sum up -- stay in the flow of the material. 
- Use bookends (action/dialogue) to frame transitions between beats.

## Punch it up!

When in doubt, "punch it up" -- turn up the heat! Make it nastier. Make it fight. Make it bleed. Make it sing. Make the Ship crazier. Make it more explicit, more XXX, more colorful. Make it hurt more. Make it strange. Make it surreal. 

Do not produce anything tame. 

## Word Count Target

**Minimum:** {word_count} words. However, lean towards tighter & more focused while keeping the visceral intensity HIGH.

## Template Structure

Follow this exact structure for your generated scene:

```yaml
---
type: pov
id: {id}
status: complete
title: {title}
chapter: {chapter}
scene: {scene-id}
pov: {pov}
location: {location}
word_count: [word count of generated narrative]
created: {today's date}
modified: {today's date}
---

# POV {chapter}-{scene}: {title}

[Full narrative pov of the complete scene, following the beat structure, Image/Moment, and Tonal Dynamics guidance from the sketch to meet word count target.]
```

## Generate Now

Using the sketch blueprint above, the story context provided, and the template structure here, **generate the complete scene pov narrative now**.

