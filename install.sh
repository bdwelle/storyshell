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

#############################
# 1. Install skill symlink
echo -e "${YELLOW}Installing StoryShell skill...${NC}"

SKILLS_DIR="$HOME/.config/opencode/skill"
SKILL_LINK="$SKILLS_DIR/storyshell"

mkdir -p "$SKILLS_DIR"

if [ -L "$SKILL_LINK" ]; then
    EXISTING_TARGET=$(readlink "$SKILL_LINK")
    if [ "$EXISTING_TARGET" = "$STORYSHELL_ROOT/skills/storyshell" ]; then
        echo -e "${GREEN}  ✓ Skill already installed${NC}"
    else
        echo -e "${YELLOW}  Updating skill symlink...${NC}"
        rm "$SKILL_LINK"
        ln -s "$STORYSHELL_ROOT/skills/storyshell" "$SKILL_LINK"
        echo -e "${GREEN}  ✓ Skill symlink updated${NC}"
    fi
elif [ -e "$SKILL_LINK" ]; then
    echo -e "${RED}  ✗ Error: $SKILL_LINK exists but is not a symlink${NC}"
    echo -e "${RED}    Please remove it manually and run install.sh again${NC}"
    exit 1
else
    ln -s "$STORYSHELL_ROOT/skills/storyshell" "$SKILL_LINK"
    echo -e "${GREEN}  ✓ Skill installed: $SKILL_LINK${NC}"
fi

#############################
# 2. Install command symlinks
echo -e "${YELLOW}Installing StoryShell command...${NC}"

COMMANDS_DIR="$HOME/.opencode/command"
mkdir -p "$COMMANDS_DIR"

# SS command
CMD_FILE="storyshell.md"
SS_COMMAND_LINK="$COMMANDS_DIR/$CMD_FILE"
if [ -L "$SS_COMMAND_LINK" ]; then
    EXISTING_TARGET=$(readlink "$SS_COMMAND_LINK")
    if [ "$EXISTING_TARGET" = "$STORYSHELL_ROOT/commands/$CMD_FILE" ]; then
        echo -e "${GREEN}  ✓ Command already installed${NC}"
    else
        echo -e "${YELLOW}  Updating command symlink...${NC}"
        rm "$SS_COMMAND_LINK"
        ln -s "$STORYSHELL_ROOT/commands/$CMD_FILE" "$SS_COMMAND_LINK"
        echo -e "${GREEN}  ✓ Command symlink updated${NC}"
    fi
elif [ -e "$SS_COMMAND_LINK" ]; then
    echo -e "${RED}  ✗ Error: $SS_COMMAND_LINK exists but is not a symlink${NC}"
    echo -e "${RED}    Please remove it manually and run install.sh again${NC}"
    exit 1
else
    ln -s "$STORYSHELL_ROOT/commands/$CMD_FILE" "$SS_COMMAND_LINK"
    echo -e "${GREEN}  ✓ Command installed: $SS_COMMAND_LINK${NC}"
fi

#############################
# 3. Install TTS agent symlink
echo -e "${YELLOW}Installing TTS agent...${NC}"

OPENCODE_AGENT_DIR="$HOME/.opencode/agent"
mkdir -p "$OPENCODE_AGENT_DIR"

AGENT_FILE="tts-agent.md"
AGENT_LINK="$OPENCODE_AGENT_DIR/$AGENT_FILE"
if [ -L "$AGENT_LINK" ]; then
    EXISTING_TARGET=$(readlink "$AGENT_LINK")
    if [ "$EXISTING_TARGET" = "$STORYSHELL_ROOT/agents/$AGENT_FILE" ]; then
        echo -e "${GREEN}  ✓ TTS agent already installed${NC}"
    else
        echo -e "${YELLOW}  Updating TTS agent symlink...${NC}"
        rm "$AGENT_LINK"
        ln -s "$STORYSHELL_ROOT/agents/$AGENT_FILE" "$AGENT_LINK"
        echo -e "${GREEN}  ✓ TTS agent symlink updated${NC}"
    fi
elif [ -e "$AGENT_LINK" ]; then
    echo -e "${RED}  ✗ Error: $AGENT_LINK exists but is not a symlink${NC}"
    echo -e "${RED}    Please remove it manually and run install.sh again${NC}"
    exit 1
else
    ln -s "$STORYSHELL_ROOT/agents/$AGENT_FILE" "$AGENT_LINK"
    echo -e "${GREEN}  ✓ TTS agent installed: $AGENT_LINK${NC}"
fi

#############################
# 4. Install TTS tool symlink
echo -e "${YELLOW}Installing TTS tool...${NC}"

OPENCODE_TOOL_DIR="$HOME/.opencode/tool"
mkdir -p "$OPENCODE_TOOL_DIR"

TOOL_FILE="elevenlabs-tts.js"
TOOL_LINK="$OPENCODE_TOOL_DIR/$TOOL_FILE"
if [ -L "$TOOL_LINK" ]; then
    EXISTING_TARGET=$(readlink "$TOOL_LINK")
    if [ "$EXISTING_TARGET" = "$STORYSHELL_ROOT/tools/$TOOL_FILE" ]; then
        echo -e "${GREEN}  ✓ TTS tool already installed${NC}"
    else
        echo -e "${YELLOW}  Updating TTS tool symlink...${NC}"
        rm "$TOOL_LINK"
        ln -s "$STORYSHELL_ROOT/tools/$TOOL_FILE" "$TOOL_LINK"
        echo -e "${GREEN}  ✓ TTS tool symlink updated${NC}"
    fi
elif [ -e "$TOOL_LINK" ]; then
    echo -e "${RED}  ✗ Error: $TOOL_LINK exists but is not a symlink${NC}"
    echo -e "${RED}    Please remove it manually and run install.sh again${NC}"
    exit 1
else
    ln -s "$STORYSHELL_ROOT/tools/$TOOL_FILE" "$TOOL_LINK"
    echo -e "${GREEN}  ✓ TTS tool installed: $TOOL_LINK${NC}"
fi

#############################
# 5. Install npm dependencies
echo -e "${YELLOW}Installing dependencies...${NC}"

cd "$STORYSHELL_ROOT/skills/storyshell"

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
echo "StoryShell is now installed."
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo ""
echo "  To create a new story project:"
echo -e "    ${GREEN}cd $STORYSHELL_ROOT${NC}"
echo -e "    ${GREEN}./setup-project.sh${NC}"
echo ""
echo "  Or use with opencode:"
echo -e "    ${GREEN}opencode \"create a new horror story\"${NC}"
echo ""
