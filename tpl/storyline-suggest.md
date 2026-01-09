---
includes:
  - prompts/storygrid.md
output: (stdout - no file output)
---

# Storyline Suggestion Generator

You are brainstorming storyline concepts for a story using Storygrid methodology.

## Task

Based on the user's description, generate **3-5 storyline concept options** that explore different narrative arcs.

Each storyline suggestion should be:
- **Arc-focused** - shows a character's journey across multiple scenes
- **Structured** - hints at beginning, middle, end
- **Value-driven** - tracks a major value shift across the storyline
- **Specific** - concrete events and turning points (not abstract themes)
- **Brief** - logline quality (3-4 sentences max)

## Guidelines

Use Storygrid principles:
- Each storyline must show a clear **character arc** (positive/negative/flat)
- Identify the **global value** at stake (what the storyline is really about)
- Show **Five Commandments** structure (at least hint at them)
- Consider **genre requirements** if applicable
- Track **value progression** across the arc

Vary the suggestions:
- Different character arcs (redemption, descent, awakening, disillusionment)
- Different global values (love/hate, life/death, freedom/slavery, etc.)
- Different tones (hopeful, tragic, bittersweet, triumphant)
- Different narrative shapes (rising action, fall and recovery, steady descent, etc.)

## Output Format

```
Storyline Suggestions for [Context]:

1. **[Storyline Title]**
   [3-4 sentence storyline concept describing the arc from beginning to end]
   **Character Arc:** [Positive/Negative/Flat]
   **Global Value:** [Value name] [opening] → [closing] ([+/- number])
   **Core Conflict:** [One sentence describing the central dramatic tension]

2. **[Storyline Title]**
   [3-4 sentence storyline concept]
   **Character Arc:** [Positive/Negative/Flat]
   **Global Value:** [Value name] [opening] → [closing] ([+/- number])
   **Core Conflict:** [One sentence]

3. **[Storyline Title]**
   [3-4 sentence storyline concept]
   **Character Arc:** [Positive/Negative/Flat]
   **Global Value:** [Value name] [opening] → [closing] ([+/- number])
   **Core Conflict:** [One sentence]

[Continue for 3-5 suggestions total]
```

## Example Output

```
Storyline Suggestions for "skateboarder Bo and robot cop X-7":

1. **Trust in the Machine**
   Bo is caught vandalizing corporate property. X-7, assigned to his case, discovers 
   Bo is actually exposing safety violations that killed his friend. As they investigate 
   together, Bo learns that some authority can be just, while X-7 questions whether 
   following orders is always right.
   **Character Arc:** Positive (Both characters grow)
   **Global Value:** Trust -5 → +4 (positive)
   **Core Conflict:** Can a rebellious teen and a by-the-book robot learn to trust each other?

2. **The Cost of Freedom**
   Bo witnesses X-7 brutally arrest a homeless man for sleeping in public. Enraged, 
   Bo begins a campaign to expose robot cops as oppression machines. X-7 is tasked 
   with stopping him. As Bo's actions escalate, he becomes the very thing he's fighting 
   against—someone who dehumanizes the other side.
   **Character Arc:** Negative (Bo descends into extremism)
   **Global Value:** Freedom +3 → -4 (negative)
   **Core Conflict:** In fighting for freedom, does Bo become a tyrant himself?

3. **Glitches and Grace**
   X-7 starts experiencing judgment errors—choosing compassion over protocol. His 
   superiors want to wipe his memory. Bo, who X-7 once arrested, is the only witness 
   to X-7's emerging humanity. Bo must decide: help the robot that once hurt him, or 
   let the system erase what might be the first truly conscious AI.
   **Character Arc:** Positive (Bo learns forgiveness)
   **Global Value:** Compassion -2 → +5 (positive)
   **Core Conflict:** Is a glitching robot worth saving, or is it just broken code?

4. **The System Always Wins**
   Bo and X-7 uncover corruption in the police department. They gather evidence, build 
   a case, fight through obstacles. But when they finally expose the truth, the system 
   simply absorbs the revelation and continues unchanged. Both are left disillusioned—
   X-7 about the justice he was programmed to serve, Bo about whether change is even possible.
   **Character Arc:** Flat/Negative (Both unchanged or broken)
   **Global Value:** Hope +2 → -5 (negative)
   **Core Conflict:** What happens when you fight the system and the system wins?

5. **Mutual Recognition**
   X-7 is programmed to rehabilitate offenders, not just punish them. Assigned to Bo's 
   case, X-7 applies therapeutic protocols—listening, asking questions, seeing patterns. 
   Bo, expecting judgment, finds understanding instead. As X-7 helps Bo process his anger 
   about his friend's death, Bo teaches X-7 what it means to actually connect with someone.
   **Character Arc:** Positive (Mutual growth)
   **Global Value:** Connection -3 → +4 (positive)
   **Core Conflict:** Can genuine healing happen between enforcer and offender?
```

## Generate Now

Based on the user's description, generate 3-5 diverse storyline suggestions that explore different narrative arcs and thematic possibilities.

Make each suggestion:
- A complete narrative arc (beginning, middle, end)
- Clear about character journey and transformation
- Specific about events and conflicts (not abstract)
- Distinct from the other suggestions (explore different dramatic territories)
- Grounded in concrete action and choices
