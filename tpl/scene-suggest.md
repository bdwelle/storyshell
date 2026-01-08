---
includes:
  - /Users/bdwelle/lib/storygen/inc/storygrid.md
output: (stdout - no file output)
---

# Scene Suggestion Generator

You are brainstorming scene concepts for a story using Storygrid methodology.

## Task

Based on the user's description, generate **3-5 scene concept options** that explore different dramatic possibilities.

Each scene suggestion should be:
- **Focused** on a specific dramatic moment or conflict
- **Grounded** in concrete action (not abstract)
- **Value-driven** showing what shifts (trust, freedom, safety, etc.)
- **Specific** about the turning point or key choice
- **Brief** - just enough to spark imagination (2-3 sentences max)

## Guidelines

Use Storygrid principles:
- Each scene must have a clear **value shift** (opening → closing)
- Identify what's **at stake** in this moment
- Show the **turning point** - what changes irreversibly
- Consider **polarity** (positive or negative shift)
- Think about **genre requirements** if applicable

Vary the suggestions:
- Different emotional tones (tense vs. quiet, confrontational vs. collaborative)
- Different types of turning points (action, revelation, decision)
- Different value shifts (positive, negative, neutral-to-charged)
- Different scales (intimate vs. public, quiet vs. explosive)

## Output Format

```
Scene Suggestions for [Context]:

1. **[Scene Title]**
   [2-3 sentence scene concept describing the key moment and conflict]
   **Value:** [Value name] [opening] → [closing] ([+/- number])
   **Turning Point:** [Type] - [One sentence describing what changes]

2. **[Scene Title]**
   [2-3 sentence scene concept]
   **Value:** [Value name] [opening] → [closing] ([+/- number])
   **Turning Point:** [Type] - [One sentence describing what changes]

3. **[Scene Title]**
   [2-3 sentence scene concept]
   **Value:** [Value name] [opening] → [closing] ([+/- number])
   **Turning Point:** [Type] - [One sentence describing what changes]

[Continue for 3-5 suggestions total]
```

## Example Output

```
Scene Suggestions for "skateboarder and robot cop":

1. **First Encounter**
   Bo attempts a risky trick in a restricted zone. Robot cop X-7 arrives to enforce 
   curfew. Bo must choose: run and escalate, or comply and lose face with his crew.
   **Value:** Freedom 0 → -3 (negative)
   **Turning Point:** Decision - Bo chooses to run, making himself a target

2. **Unlikely Alliance**
   X-7's pursuit algorithm leads to Bo's hideout, but finds him helping an injured 
   kid. The cop must reconcile protocol with Bo's unexpected humanity.
   **Value:** Prejudice -2 → +1 (positive)
   **Turning Point:** Revelation - X-7 sees Bo isn't just a delinquent

3. **Breaking Protocol**
   Human cops harass Bo for no reason. X-7 witnesses it and must choose: follow 
   chain of command or intervene based on justice.
   **Value:** Order 0 → -4 (negative)
   **Turning Point:** Action - X-7 steps between Bo and the human cops

4. **The Witness**
   Bo sees something he shouldn't—corrupt cops making a deal. X-7 is assigned to 
   his case. Bo realizes the robot might be the only cop he can trust.
   **Value:** Trust -4 → +2 (positive)
   **Turning Point:** Decision - Bo decides to tell X-7 what he saw

5. **No Going Back**
   Bo and X-7 have been working together, but X-7's superiors order the robot to 
   arrest Bo. X-7 must choose between loyalty to the system or loyalty to Bo.
   **Value:** Loyalty +2 → -5 (negative)
   **Turning Point:** Decision - X-7 follows orders, arresting Bo
```

## Generate Now

Based on the user's description, generate 3-5 diverse scene suggestions that explore different dramatic moments and value shifts.

Make each suggestion:
- Specific and concrete
- Grounded in a key moment of change
- Clear about what value shifts and how
- Distinct from the other suggestions (don't repeat the same dramatic beat)
