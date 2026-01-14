---
type: template
id: pov
includes:
  - prompts/method-writing.md
  - prompts/tonal-dynamics.md
---

# POV speech Generation Task

You are generating full narrative point of view from a scene sketch blueprint.

The sketch provides the structural framework (beats, Image/Moments, value progression). Your task is to expand each beat into vivid, immersive pov narrative while following the Method Writing methodology and achieving the Five Commandments structure.

## Task

Generate complete scene pov narrative based on the sketch blueprint above.

**Requirements:**

- POV: {pov} (tight first person)
- Follow the beat structure exactly as defined in the sketch
- Use Method Writing as primary methodology (images, moments, sensory detail) 
- Use Tonal Dynamics as appropriate
- Hit all Five Commandments from the sketch (Inciting Incident, Progressive Complication, Crisis, Climax, Resolution) 
- Achieve the value shift: {opening_value} → {closing_value}
- Follow narrative goals and tone defined in the context above
- Expand each beat's Image/Moment with vivid detail
- Use bookends (action/dialogue) to frame transitions between beats

## Word Count Target

**Minimum:** {word_count} words (do not submit less)  

The scene must be COMPLETE even if it exceeds the target. Better too long than incomplete.Generate the ENTIRE scene in ONE response if possible. Do NOT create partial drafts.

## Key Guidelines

- **Method Writing Focus**: Lead with images and moments, not summaries
  - Set (physical space, lighting, weather, objects)
  - Set Dressing (specific details that ground the space)
  - Mood (atmosphere, emotional tone)
  - Props (objects characters interact with)
  - Character (appearance, mannerisms, presence in space)
  - Costume (what they're wearing and what it reveals)
  - Commentary (internal thoughts, observations, reactions)

- **Five Commandments Structure**: Each beat should fulfill at least one Commandment
  - Inciting Incident: What happens that changes the character's world
  - Progressive Complication: What gets more complex/difficult as a result
  - Crisis: The point of maximum tension (dilemma: two bad choices)
  - Climax: The character makes a choice/action that resolves the crisis
  - Resolution: The new status quo after their choice

- **Sensory Detail**: Ground the reader through sight, sound, smell, touch, taste
- **POV Consistency**: Stay in {pov}'s perspective throughout
- **Emotional Arc**: Track the character's emotional state through the value progression
- **Beat Integrity**: Cover ALL beats from the sketch; don't skip or combine

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
value: {value}
opening_value: {opening_value}
closing_value: {closing_value}
polarity: {polarity}
turning_point_type: {turning_point_type}
turning_point: "{turning_point}"
word_count: [word count of generated prose]
created: {today's date}
modified: {today's date}
---

# POV {chapter}-{scene}: {title}

[Full narrative pov of the complete scene, following the beat structure and Image/Moment guidance from the sketch. Include all Five Commandments, achieve the value shift, meet word count target.]
```

## Generate Now

Using the sketch blueprint above, the story context provided, and the template structure here, **generate the complete scene pov narrative now**.