---
type: template
id: character
includes:
  - inc/storygrid.md
  - inc/method-writing.md
  - inc/method-characters.md
---

# Character Generation Task

You are creating a detailed character definition for a story.

This character will be a key figure in the narrative—defined by their appearance, personality, history, relationships, and internal drives.

## Task

Generate a complete character definition based on:
- The character description provided
- The story context assembled above
- The conversation/interview answers about this character

Use the conversation history (questions and answers) to inform every section of the character. The user has already explored:
- How this character talks (voice & speech)
- Their transformation lines (what they hide, fear, need)
- Specific details (behaviors, mannerisms, possessions)

Fill in all sections with vivid, specific content that:
- Reflects the voice and speech patterns discovered in conversation
- Integrates the transformation lines into Want vs. Need
- Uses the specific details gathered to create authenticity
- Fits the world, genre, and narrative goals defined above
- Creates authentic relationships with other story characters
- Defines a compelling change arc

## Key Guidelines

- Use **Method Character** technique to develop authentic motivations
- Follow the **Storygrid Five Commandments** for character role requirements
- Make **physical form** specific and distinctive (not generic)
- Ground **backstory** in specific events and emotional turning points
- Define **relationships** as complex and conflicted, not simple
- Distinguish **Want** (what they think they need) from **Need** (what they actually need to grow)
- Track **change arc** (positive growth, negative descent, or flat/unchanging)

## Template Structure

Follow this exact structure for your generated character:

```yaml
---
type: character
name: {character name}
status: development
role: {role: protagonist/antagonist/ally/supporting}
codex_references:
  - [reference-1]
  - [reference-2]
created: {today's date}
modified: {today's date}
---

# {name}

## Description
[Brief one-line summary of who this character is]

## Physical Form
[Appearance, mannerisms, voice, body language, distinctive features]

## Traits
- [Trait 1 - specific and observable]
- [Trait 2 - specific and observable]
- [Trait 3 - specific and observable]

## Speech
[How does this character talk? Character idiolect, speech patterns, accent, slang. Include examples.]

## Backstory
[Character history and formative experiences that shaped who they are now. Include specific events, relationships, and turning points.]

## Relationships

### [Character Name]
**Type:** [ally/enemy/lover/family/rival/mentor/etc.]

[Notes about this relationship: history, dynamics, tension, what each wants from the other]

### [Another Character Name]
**Type:** [relationship type]

[Notes about this relationship]

## Storygrid Elements

**Want:** [External goal - what they think they want, their stated objective]

**Need:** [Internal need - what they actually need to grow, heal, or change. Often the opposite of their Want.]

**Change Arc:** [positive (growth)/negative (descent)/flat (unchanging)]
```
