#!/bin/bash

# StoryShell Project Setup Script
# Creates a new story project with interactive setup

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Get the directory where this script is located (StoryShell root)
STORYSHELL_ROOT="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Genre definitions (compatible with bash 3.2)
get_genre_value() {
    case "$1" in
        ACTION) echo "Life/Death" ;;
        HORROR) echo "Life/Death (Fate Worse Than Death)" ;;
        LOVE) echo "Love/Hate" ;;
        CRIME) echo "Justice/Injustice" ;;
        WAR) echo "Honor/Disgrace" ;;
    esac
}

get_genre_scenes() {
    case "$1" in
        ACTION) echo "Hero at Mercy of Villain|Speech in Praise of Villain|All is Lost Moment|Hero Gains Power/Ability|Asymmetrical Force Confrontation" ;;
        HORROR) echo "Introduction of Monster|Hero at Mercy of Monster|Protagonist Realizes Mistakes|False Ending|Final Confrontation" ;;
        LOVE) echo "Meet Cute|Rupture/Break-up|Proof of Love|Declaration|Lovers Reunite" ;;
        CRIME) echo "Discovery of Crime|Investigation Begins|Red Herrings|Hero at Mercy of Villain|Revelation of Criminal|Final Confrontation" ;;
        WAR) echo "Rally the Troops|Demonstrate Leadership|All is Lost|Sacrifice for Greater Good|Final Battle" ;;
    esac
}

# Helper function for slugifying names
slugify() {
    echo "$1" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | sed 's/--*/-/g' | sed 's/^-\|-$//g'
}

# Helper function to prompt with default
prompt_with_default() {
    local prompt="$1"
    local default="$2"
    local value
    
    if [ -n "$default" ]; then
        read -p "$prompt [$default]: " value
        echo "${value:-$default}"
    else
        read -p "$prompt: " value
        while [ -z "$value" ]; do
            echo -e "${RED}This field is required.${NC}"
            read -p "$prompt: " value
        done
        echo "$value"
    fi
}

echo -e "${BLUE}╔═══════════════════════════════════════╗${NC}"
echo -e "${BLUE}║    StoryShell Project Setup           ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════╝${NC}"
echo ""

# 1. Get project name
PROJECT_NAME=$(prompt_with_default "Enter project name" "")

# 2. Get project location
SLUG=$(slugify "$PROJECT_NAME")
DEFAULT_LOCATION="$HOME/stories/$SLUG"
PROJECT_DIR=$(prompt_with_default "Enter project directory" "$DEFAULT_LOCATION")

# Expand ~ to full path
PROJECT_DIR="${PROJECT_DIR/#\~/$HOME}"

# Check if directory already exists
if [ -d "$PROJECT_DIR" ]; then
    echo -e "${YELLOW}Warning: Directory $PROJECT_DIR already exists.${NC}"
    read -p "Continue and overwrite? (y/n): " CONTINUE
    if [ "$CONTINUE" != "y" ]; then
        echo "Setup cancelled."
        exit 0
    fi
fi

# 3. Select genre
echo ""
echo "Select genre:"
echo "  1) ACTION"
echo "  2) HORROR"
echo "  3) LOVE"
echo "  4) CRIME"
echo "  5) WAR"
GENRE_CHOICE=$(prompt_with_default "Genre" "1")

case $GENRE_CHOICE in
    1) GENRE="ACTION" ;;
    2) GENRE="HORROR" ;;
    3) GENRE="LOVE" ;;
    4) GENRE="CRIME" ;;
    5) GENRE="WAR" ;;
    ACTION|HORROR|LOVE|CRIME|WAR) GENRE="$GENRE_CHOICE" ;;
    *) 
        echo -e "${RED}Invalid choice. Using ACTION.${NC}"
        GENRE="ACTION"
        ;;
esac

GLOBAL_VALUE=$(get_genre_value "$GENRE")

echo ""
echo -e "${CYAN}Creating project: $PROJECT_NAME${NC}"
echo -e "${CYAN}  Genre: $GENRE${NC}"
echo -e "${CYAN}  Location: $PROJECT_DIR${NC}"
echo ""

# 4. Create project structure
echo -e "${YELLOW}Creating project structure...${NC}"
mkdir -p "$PROJECT_DIR"
mkdir -p "$PROJECT_DIR/prompts"
mkdir -p "$PROJECT_DIR/output/character"
mkdir -p "$PROJECT_DIR/output/storyline"
mkdir -p "$PROJECT_DIR/output/sketch"
mkdir -p "$PROJECT_DIR/output/scene"
mkdir -p "$PROJECT_DIR/templates"
mkdir -p "$PROJECT_DIR/.storyshell"
echo -e "${GREEN}  ✓ Directories created${NC}"

# 5. Copy prompt templates
echo -e "${YELLOW}Copying prompt templates...${NC}"
if [ -d "$STORYSHELL_ROOT/prompts" ]; then
    # Copy all prompts except main.md (we'll generate that)
    for file in "$STORYSHELL_ROOT/prompts"/*.md; do
        filename=$(basename "$file")
        if [ "$filename" != "main.md" ]; then
            cp "$file" "$PROJECT_DIR/prompts/"
        fi
    done
    echo -e "${GREEN}  ✓ Prompts copied${NC}"
else
    echo -e "${RED}  ✗ Warning: prompts directory not found in StoryShell root${NC}"
fi

# 6. Copy content templates
echo -e "${YELLOW}Copying content templates...${NC}"
if [ -d "$STORYSHELL_ROOT/templates" ]; then
    cp -r "$STORYSHELL_ROOT/templates"/* "$PROJECT_DIR/templates/" 2>/dev/null || true
    echo -e "${GREEN}  ✓ Templates copied${NC}"
else
    echo -e "${RED}  ✗ Warning: templates directory not found in StoryShell root${NC}"
fi

# 7. Ask about initialization
echo ""
read -p "Initialize project metadata now? (y/n): " INIT_NOW

TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")

if [ "$INIT_NOW" = "y" ] || [ "$INIT_NOW" = "Y" ]; then
    echo ""
    echo -e "${YELLOW}World & Setting${NC}"
    echo -e "${YELLOW}---------------${NC}"
    
    SETTING=$(prompt_with_default "Setting (time period, location)" "")
    TONE=$(prompt_with_default "Tone (emotional atmosphere)" "")
    TECH_LEVEL=$(prompt_with_default "Tech level (optional, for sci-fi/fantasy)" "")
    
    # Create fully initialized main.md
    cat > "$PROJECT_DIR/prompts/main.md" << EOF
---
name: $PROJECT_NAME
created: $TIMESTAMP
genre: $GENRE
status: planning
---

# Story Overview

## World Setting

**Setting**: $SETTING

**Tone**: $TONE

EOF
    
    if [ -n "$TECH_LEVEL" ]; then
        cat >> "$PROJECT_DIR/prompts/main.md" << EOF
**Technology Level**: $TECH_LEVEL

EOF
    fi
    
    cat >> "$PROJECT_DIR/prompts/main.md" << EOF
## Story Arc

[Describe the overall story arc and major plot points]

## Key Locations

- [Location 1]
- [Location 2]

## Timeline

[Key events in chronological order]

## Notes

[Add story-specific notes, themes, and other details]

## Your Narrative Goals

@include narrative-goals.md
EOF

    echo -e "${GREEN}  ✓ Project initialized${NC}"
    
else
    # Create minimal main.md (user can run 'project init' later)
    cat > "$PROJECT_DIR/prompts/main.md" << EOF
---
name: $PROJECT_NAME
created: $TIMESTAMP
genre: $GENRE
status: planning
---

# Story Overview

## World Setting

**Setting**: [Describe time period, location, world]

**Tone**: [Describe emotional atmosphere]

**Technology Level**: [For sci-fi/fantasy: tech or magic level]

## Story Arc

[Describe the overall story arc and major plot points]

## Key Locations

- [Location 1]
- [Location 2]

## Timeline

[Key events in chronological order]

## Notes

[Add story-specific notes, themes, and other details]

## Your Narrative Goals

@include narrative-goals.md
EOF

    echo -e "${GREEN}  ✓ Project structure created (not yet initialized)${NC}"
fi

# 8. Generate README
echo -e "${YELLOW}Creating README...${NC}"

# Convert pipe-separated scenes to bullet list
SCENES=$(get_genre_scenes "$GENRE" | tr '|' '\n' | sed 's/^/- [ ] /')

cat > "$PROJECT_DIR/README.md" << EOF
# $PROJECT_NAME

${GENRE} Story  
Genre: $GENRE  
Global Value: $GLOBAL_VALUE

## Project Structure

- **prompts/** - AI generation prompts and story overview
  - **main.md** - Core story metadata and world building (edit this!)
  - **storygrid.md** - Story structure methodology
  - **method-writing.md** - Scene writing techniques
  - **narrative-goals.md** - Specific narrative guidance
- **output/** - Generated content
  - **character/** - Character profiles
  - **storyline/** - Story arcs
  - **sketch/** - Scene sketches (outlines)
  - **scene/** - Full prose scenes
- **templates/** - Content templates

## Obligatory Scenes ($GENRE)

$SCENES

## Get Started

1. Edit \`prompts/main.md\` to define your world and story

2. Create characters:
\`\`\`bash
character new "Character Name" --role protagonist
\`\`\`

3. Develop storylines:
\`\`\`bash
storyline propose "Character Name"
\`\`\`

4. Create scenes:
\`\`\`bash
sketch new storyline-id scene-number
scene develop sketch-id
\`\`\`

Or use with pi-agent:
\`\`\`bash
pi "create my protagonist"
pi "develop a storyline for my character"
\`\`\`

## Commands

From within this project directory:

- \`project show\` - Display project info
- \`project init\` - Initialize/re-initialize project metadata
- \`project update\` - Update project metadata
- \`character list\` - List all characters
- \`character new "Name" --role TYPE\` - Create character
- \`storyline list\` - List storylines
- \`sketch list\` - List scene sketches
- \`scene list\` - List scenes

See individual command help: \`<command> --help\`
EOF

echo -e "${GREEN}  ✓ README created${NC}"

# Done!
echo ""
echo -e "${GREEN}╔═══════════════════════════════════════╗${NC}"
echo -e "${GREEN}║    ✓ Project Setup Complete           ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════╝${NC}"
echo ""
echo -e "${CYAN}Project: $PROJECT_NAME${NC}"
echo -e "${CYAN}Location: $PROJECT_DIR${NC}"
echo ""

if [ "$INIT_NOW" != "y" ] && [ "$INIT_NOW" != "Y" ]; then
    echo -e "${YELLOW}To initialize project metadata later:${NC}"
    echo -e "  cd $PROJECT_DIR"
    echo -e "  project init"
    echo ""
fi

echo -e "${YELLOW}Next steps:${NC}"
echo ""
echo "  1. cd $PROJECT_DIR"
echo "  2. Edit prompts/main.md to add world details"
echo "  3. Use pi-agent or run commands directly:"
echo ""
echo -e "     ${GREEN}pi \"create my protagonist\"${NC}"
echo -e "     ${GREEN}character new \"Name\" --role protagonist${NC}"
echo ""
