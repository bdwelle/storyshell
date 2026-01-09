#!/bin/bash

# StoryShell Installation Script
# Installs StoryShell globally for pi-agent (one-time setup)

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get the directory where this script is located (StoryShell root)
STORYSHELL_ROOT="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo -e "${BLUE}╔═══════════════════════════════════════╗${NC}"
echo -e "${BLUE}║    StoryShell Installation            ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════╝${NC}"
echo ""

# 1. Install pi-skill symlink
echo -e "${YELLOW}Installing StoryShell skill...${NC}"

PI_SKILLS_DIR="$HOME/.pi/agent/skills"
SKILL_LINK="$PI_SKILLS_DIR/storyshell"

mkdir -p "$PI_SKILLS_DIR"

if [ -L "$SKILL_LINK" ]; then
    EXISTING_TARGET=$(readlink "$SKILL_LINK")
    if [ "$EXISTING_TARGET" = "$STORYSHELL_ROOT/pi-skills/storyshell" ]; then
        echo -e "${GREEN}  ✓ Skill already installed${NC}"
    else
        echo -e "${YELLOW}  Updating skill symlink...${NC}"
        rm "$SKILL_LINK"
        ln -s "$STORYSHELL_ROOT/pi-skills/storyshell" "$SKILL_LINK"
        echo -e "${GREEN}  ✓ Skill symlink updated${NC}"
    fi
elif [ -e "$SKILL_LINK" ]; then
    echo -e "${RED}  ✗ Error: $SKILL_LINK exists but is not a symlink${NC}"
    echo -e "${RED}    Please remove it manually and run install.sh again${NC}"
    exit 1
else
    ln -s "$STORYSHELL_ROOT/pi-skills/storyshell" "$SKILL_LINK"
    echo -e "${GREEN}  ✓ Skill installed: $SKILL_LINK${NC}"
fi

# 2. Install pi-command symlinks
echo -e "${YELLOW}Installing StoryShell command...${NC}"

PI_COMMANDS_DIR="$HOME/.pi/agent/commands"
mkdir -p "$PI_COMMANDS_DIR"

# SS command
CMD_FILE="ss.md"
SS_COMMAND_LINK="$PI_COMMANDS_DIR/$CMD_FILE"
if [ -L "$SS_COMMAND_LINK" ]; then
    EXISTING_TARGET=$(readlink "$SS_COMMAND_LINK")
    if [ "$EXISTING_TARGET" = "$STORYSHELL_ROOT/pi-commands/$CMD_FILE" ]; then
        echo -e "${GREEN}  ✓ Command already installed${NC}"
    else
        echo -e "${YELLOW}  Updating command symlink...${NC}"
        rm "$SS_COMMAND_LINK"
        ln -s "$STORYSHELL_ROOT/pi-commands/$CMD_FILE" "$SS_COMMAND_LINK"
        echo -e "${GREEN}  ✓ Command symlink updated${NC}"
    fi
elif [ -e "$SS_COMMAND_LINK" ]; then
    echo -e "${RED}  ✗ Error: $SS_COMMAND_LINK exists but is not a symlink${NC}"
    echo -e "${RED}    Please remove it manually and run install.sh again${NC}"
    exit 1
else
    ln -s "$STORYSHELL_ROOT/pi-commands/$CMD_FILE" "$SS_COMMAND_LINK"
    echo -e "${GREEN}  ✓ Command installed: $SS_COMMAND_LINK${NC}"
fi

# NOSS command
CMD_FILE="noss.md"
SS_COMMAND_LINK="$PI_COMMANDS_DIR/$CMD_FILE"
if [ -L "$SS_COMMAND_LINK" ]; then
    EXISTING_TARGET=$(readlink "$SS_COMMAND_LINK")
    if [ "$EXISTING_TARGET" = "$STORYSHELL_ROOT/pi-commands/$CMD_FILE" ]; then
        echo -e "${GREEN}  ✓ Command already installed${NC}"
    else
        echo -e "${YELLOW}  Updating command symlink...${NC}"
        rm "$SS_COMMAND_LINK"
        ln -s "$STORYSHELL_ROOT/pi-commands/$CMD_FILE" "$SS_COMMAND_LINK"
        echo -e "${GREEN}  ✓ Command symlink updated${NC}"
    fi
elif [ -e "$SS_COMMAND_LINK" ]; then
    echo -e "${RED}  ✗ Error: $SS_COMMAND_LINK exists but is not a symlink${NC}"
    echo -e "${RED}    Please remove it manually and run install.sh again${NC}"
    exit 1
else
    ln -s "$STORYSHELL_ROOT/pi-commands/$CMD_FILE" "$SS_COMMAND_LINK"
    echo -e "${GREEN}  ✓ Command installed: $SS_COMMAND_LINK${NC}"
fi

# 3. Install npm dependencies
echo -e "${YELLOW}Installing dependencies...${NC}"

cd "$STORYSHELL_ROOT/pi-skills/storyshell"

if [ ! -d "node_modules" ]; then
    npm install --silent
    echo -e "${GREEN}  ✓ Dependencies installed${NC}"
else
    echo -e "${GREEN}  ✓ Dependencies already installed${NC}"
fi

# Done!
echo ""
echo -e "${GREEN}╔═══════════════════════════════════════╗${NC}"
echo -e "${GREEN}║    ✓ Installation Complete            ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════╝${NC}"
echo ""
echo "StoryShell is now installed for pi-agent."
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo ""
echo "  To create a new story project:"
echo -e "    ${GREEN}cd $STORYSHELL_ROOT${NC}"
echo -e "    ${GREEN}./setup-project.sh${NC}"
echo ""
echo "  Or use with pi-agent:"
echo -e "    ${GREEN}pi \"create a new horror story\"${NC}"
echo ""
