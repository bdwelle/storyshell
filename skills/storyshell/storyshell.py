#!/usr/bin/env python3

import sys
import os
import re
import json
import logging
from datetime import datetime, timedelta
from pathlib import Path

# PST offset (8 hours behind UTC)
PST_OFFSET_MS = -8 * 60 * 60 * 1000

# name of this skill
THIS_SKILL = 'storyshell'

# Configure logging with PST timestamps
class PSTFormatter(logging.Formatter):
    """Custom formatter with PST timestamp"""
    def formatTime(self, record, datefmt=None):
        now = datetime.now() + timedelta(milliseconds=PST_OFFSET_MS)
        return now.isoformat().replace('+00:00', ' PST')

def setup_logging(log_path):
    """Configure logging to file with PST timestamps"""
    logger = logging.getLogger(THIS_SKILL)
    logger.setLevel(logging.INFO)
    
    # Clear any existing handlers
    logger.handlers.clear()
    
    # File handler
    file_handler = logging.FileHandler(log_path, mode='a')
    file_handler.setFormatter(PSTFormatter('%(message)s'))
    logger.addHandler(file_handler)
    
    return logger

# Global logger instance
_logger = None

def log(operation, details=None):
    """Log operation with details (maintains same API as JS version)"""
    global _logger
    if _logger is None:
        _logger = setup_logging(Path.cwd() / f'{THIS_SKILL}.log')
    
    details_str = ' '.join(f'{k}={v}' for k, v in (details or {}).items())
    _logger.info(f'{operation} {details_str}')

# Error handling - warnings to stderr
def warn(message):
    print(f'Warning: {message}', file=sys.stderr)
    log('warning', {'message': message})

# Parse includes from YAML frontmatter
def parseIncludesFromFrontmatter(frontmatterText):
    includes = []
    lines = frontmatterText.split('\n')
    inIncludesSection = False

    for line in lines:
        if re.match(r'^includes:', line):
            inIncludesSection = True
            continue
        if inIncludesSection:
            includeMatch = re.match(r'^\s*-\s+(.+)$', line)
            if includeMatch:
                includes.append(includeMatch.group(1).strip())
            elif re.match(r'^\S', line):
                # New top-level key, stop parsing includes
                break
    
    return includes

# Parse full frontmatter into object
def parseFrontmatter(content):
    match = re.match(r'^---\n([\s\S]*?)\n---', content)
    if not match:
        return {}
    
    frontmatter = {}
    lines = match.group(1).split('\n')
    currentKey = None
    currentArray = None
    
    for line in lines:
        # Array item
        arrayMatch = re.match(r'^\s*-\s+(.+)$', line)
        if arrayMatch and currentArray:
            currentArray.append(arrayMatch.group(1).strip())
            continue
        
        # Key-value pair
        kvMatch = re.match(r'^([a-z_]+):\s*(.*)$', line, re.IGNORECASE)
        if kvMatch:
            key = kvMatch.group(1)
            value = kvMatch.group(2)
            currentKey = key
            
            if value == '':
                # Array starts on next line
                currentArray = []
                frontmatter[key] = currentArray
            else:
                # Simple value
                frontmatter[key] = value.strip()
                currentArray = None
    
    return frontmatter

# Helper: Scan a directory and add files to the index
def scanDirectory(dir, index, prefix, options=None):
    if options is None:
        options = {}
    
    if not dir.exists():
        log('scan_directory', {'dir': prefix, 'status': 'not_found'})
        return 0
    
    files = [f for f in dir.iterdir() if f.suffix == '.md']
    
    # Exclude main.md from inc/ directory
    if options.get('excludeMain'):
        files = [f for f in files if f.name != 'main.md']
    
    for file in files:
        basename = file.stem
        relPath = f'{prefix}/{file.name}'
        
        # Add filename as primary key
        index[basename] = relPath
        
        # Parse frontmatter for aliases and name field
        try:
            content = file.read_text(encoding='utf-8')
            frontmatter = parseFrontmatter(content)
            
            # Add aliases
            if frontmatter.get('aliases') and isinstance(frontmatter['aliases'], list):
                for alias in frontmatter['aliases']:
                    index[alias.lower()] = relPath
            
            # Add 'name' field for characters (normalized: "Maya Chen" -> "maya-chen")
            if frontmatter.get('name'):
                nameLower = frontmatter['name'].lower().replace(' ', '-')
                index[nameLower] = relPath
        except Exception as err:
            warn(f'Error parsing {file.name}: {str(err)}')
    
    log('scan_directory', {'dir': prefix, 'status': 'ok', 'files': len(files)})
    return len(files)

# Build unified entity index from codex/ and characters/ directories
def buildConceptIndex(projectDir):
    index = {}  # { "steg": "codex/steg.md", "maya": "characters/maya-chen.md", ... }
    
    # Scan codex/ for concepts
    conceptCount = scanDirectory(
        projectDir / 'codex',
        index,
        'codex'
    )
    
    # Scan characters/ for character files
    characterCount = scanDirectory(
        projectDir / 'characters',
        index,
        'characters'
    )
    
    log('entity_index', {
        'status': 'built',
        'concepts': conceptCount,
        'characters': characterCount,
        'total_entries': len(index)
    })
    
    return index

# Extract explicit filepaths from prompt (e.g., "scenes/marchetti-first-binding.md")
def extractExplicitPaths(prompt):
    if not prompt:
        return []
    
    # Match paths like: path/to/file.md, path/file.md, file.md
    pathPattern = r'[\w\-./]+\.md'
    matches = re.findall(pathPattern, prompt)
    
    return matches

# Get the primary prompt for entity extraction
# Prefers original user command (from LLM_USER_COMMAND env var) over agent interpretation
def getPrimaryPrompt():
    return originalUserCommand or userPrompt

# Extract concept tokens from user prompt
def extractConceptTokens(prompt):
    if not prompt:
        return []
    
    # Common words to exclude from concept extraction
    stopwords = {
        'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
        'of', 'with', 'by', 'from', 'up', 'about', 'into', 'through', 'during',
        'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
        'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might',
        'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it',
        'we', 'they', 'what', 'which', 'who', 'when', 'where', 'why', 'how',
        'as', 'if', 'because', 'so', 'than', 'such', 'no', 'not', 'only', 'own',
        'same', 'so', 'than', 'too', 'very', 'just'
    }
    
    # Split on whitespace, punctuation, but keep hyphens/underscores
    tokens = re.split(r'[\s,.()?!;:"]+', prompt.lower())
    tokens = [t for t in tokens if t and t not in stopwords]
    
    return tokens

# Find concept files matching user prompt
def findConceptFiles(prompt, conceptIndex):
    tokens = extractConceptTokens(prompt)
    matchedFiles = set()
    
    log('concept_extraction', {
        'tokens': json.dumps(tokens),
        'source': 'user_prompt'
    })
    
    for token in tokens:
        if token in conceptIndex:
            matchedFiles.add(conceptIndex[token])
    
    if matchedFiles:
        log('concept_matching', {
            'matches': json.dumps(list(matchedFiles)),
            'status': 'ok'
        })
    
    return list(matchedFiles)

# Load related entities (concepts + characters) from a file's frontmatter
def loadRelatedConcepts(conceptFile, conceptIndex, projectDir):
    relatedFiles = []
    filePath = projectDir / conceptFile
    
    if not filePath.exists():
        return relatedFiles
    
    try:
        content = filePath.read_text(encoding='utf-8')
        frontmatter = parseFrontmatter(content)
        
        # Load related_concepts
        if frontmatter.get('related_concepts') and isinstance(frontmatter['related_concepts'], list):
            for concept in frontmatter['related_concepts']:
                if concept in conceptIndex:
                    relatedFiles.append(conceptIndex[concept])
        
        # Load related_characters
        if frontmatter.get('related_characters') and isinstance(frontmatter['related_characters'], list):
            for character in frontmatter['related_characters']:
                if character in conceptIndex:
                    relatedFiles.append(conceptIndex[character])
        
        if relatedFiles:
            log('related_entities', {
                'from': conceptFile,
                'loaded': json.dumps(relatedFiles)
            })
    except Exception as err:
        warn(f'Error loading related entities from {conceptFile}: {str(err)}')
    
    return relatedFiles

# Main execution
if __name__ == '__main__':
    # Log start of execution
    log('START ' + THIS_SKILL + ' (python)')
    
    # Parse command line arguments
    args = sys.argv[1:]
    
    # Log the original command line arguments
    log('argv', {
        'args': json.dumps(sys.argv[1:])
    })
    
    if len(args) < 1:
        print('Usage: run.py <template-name> [user-prompt]', file=sys.stderr)
        sys.exit(1)
    
    templateName = args[0]
    userPrompt = ' '.join(args[1:])
    
    # Check for original user command in environment variable
    # This is set by the skill invocation to preserve the exact user input
    originalUserCommand = os.environ.get('LLM_USER_COMMAND') or userPrompt
    
    # we should really try to set this during the install process, but for now
    # hardcode the storygenRoot as $HOME/lib/storyshell
    storygenRoot = Path.home() / 'lib' / THIS_SKILL
    
    log('run', {
        'template': templateName,
        'user_prompt': f'"{userPrompt}"' if userPrompt else 'none',
        'original_user_command': f'"{originalUserCommand}"' if originalUserCommand else 'none'
    })
    
    # Read template file from root tpl/ directory
    templatePath = storygenRoot / 'tpl' / f'{templateName}.md'
    if not templatePath.exists():
        warn(f'Template not found: {templatePath}')
        log('error', {'type': 'template_not_found', 'path': str(templatePath)})
        sys.exit(1)
    
    templateContent = templatePath.read_text(encoding='utf-8')
    log('template', {'file': str(templatePath), 'status': 'ok'})
    
    # Parse YAML frontmatter
    match = re.match(r'^---\n([\s\S]*?)\n---\n([\s\S]*)$', templateContent)
    if not match:
        # No frontmatter - just output template
        print(templateContent)
        if userPrompt:
            print(f'\n\nUser request: {userPrompt}\n')
        log('output', {'bytes': len(templateContent)})
        sys.exit(0)
    
    frontmatterText, templateBody = match.groups()
    
    # Auto-include project context first (from current working directory)
    projectMainPath = Path.cwd() / 'prompts' / 'main.md'
    includes = []
    
    # Check if project main.md exists - REQUIRED
    if not projectMainPath.exists():
        print(f'Error: Project context not found: {projectMainPath}', file=sys.stderr)
        print('', file=sys.stderr)
        print('You must have prompts/main.md in your project directory.', file=sys.stderr)
        print('Run from your project directory with a prompts/main.md file.', file=sys.stderr)
        log('error', {'type': 'project_context_required', 'path': str(projectMainPath)})
        sys.exit(1)
    
    # Read and parse project main.md
    projectMainContent = projectMainPath.read_text(encoding='utf-8')
    projectMainMatch = re.match(r'^---\n([\s\S]*?)\n---\n([\s\S]*)$', projectMainContent)
    
    if projectMainMatch:
        # Project main.md has frontmatter - parse its includes first
        projectMainIncludes = parseIncludesFromFrontmatter(projectMainMatch.group(1))
        includes.extend(projectMainIncludes)
        log('project_main_includes', {'count': len(projectMainIncludes), 'files': json.dumps(projectMainIncludes)})
    
    # Then add project main.md itself
    includes.append('prompts/main.md')
    
    # Get the primary prompt (original user command if available, else agent interpretation)
    primaryPrompt = getPrimaryPrompt()
    log('original user prompt', {'primaryPrompt': primaryPrompt})
    
    # Extract explicit filepaths from primary prompt
    explicitPaths = extractExplicitPaths(primaryPrompt)
    if explicitPaths:
        log('explicit_paths', {
            'count': len(explicitPaths),
            'paths': json.dumps(explicitPaths)
        })
        includes.extend(explicitPaths)
    
    # Build entity index (concepts + characters) and find matching files from primary prompt
    conceptIndex = buildConceptIndex(Path.cwd())
    conceptFiles = findConceptFiles(primaryPrompt, conceptIndex)
    
    # Load related concepts from matched concept files
    relatedConceptFiles = []
    for conceptFile in conceptFiles:
        related = loadRelatedConcepts(conceptFile, conceptIndex, Path.cwd())
        relatedConceptFiles.extend(related)
    
    # Combine concept files + related, deduplicate
    allConceptFiles = list(dict.fromkeys(conceptFiles + relatedConceptFiles))
    
    # Insert concept files after explicit paths, before template includes
    includes.extend(allConceptFiles)
    
    # Parse additional includes from template frontmatter
    templateIncludes = parseIncludesFromFrontmatter(frontmatterText)
    includes.extend(templateIncludes)
    
    # Final deduplication - preserve order, remove duplicates
    uniqueIncludes = []
    seen = set()
    for inc in includes:
        if inc not in seen:
            uniqueIncludes.append(inc)
            seen.add(inc)
    
    log('includes_final', {
        'total': len(uniqueIncludes),
        'files': json.dumps(uniqueIncludes)
    })
    
    # Process includes with multi-path resolution
    output = ''
    
    if uniqueIncludes:
        for inc in uniqueIncludes:
            resolved = False
            searchPaths = [
                Path.cwd() / inc,              # 1. Relative to current directory (PROJECT)
                storygenRoot / inc,            # 2. Relative to storyshell root (FRAMEWORK)
                Path(inc) if Path(inc).is_absolute() else None  # 3. Absolute path
            ]
            searchPaths = [p for p in searchPaths if p is not None]
            
            for incPath in searchPaths:
                if incPath.exists():
                    try:
                        content = incPath.read_text(encoding='utf-8')
                        
                        # Strip frontmatter if present (only include the body)
                        frontmatterMatch = re.match(r'^---\n[\s\S]*?\n---\n([\s\S]*)$', content)
                        if frontmatterMatch:
                            content = frontmatterMatch.group(1)
                        
                        output += content + '\n\n'
                        log('include', {'file': inc, 'resolved': str(incPath), 'status': 'ok'})
                        resolved = True
                        break
                    except Exception as err:
                        warn(f'Error reading include {incPath}: {str(err)}')
                        log('include', {'file': inc, 'resolved': str(incPath), 'status': 'error', 'error': str(err)})
            
            if not resolved:
                warn(f'Include file not found: {inc}')
                log('include', {'file': inc, 'status': 'missing'})
    
    log("includes complete")
    
    # Add template body
    output += templateBody
    log('templateBody added')
    
    # Add user prompt if provided
    if userPrompt:
        output += f'\n\n## Primary User Request'
        output += f'\n\nIMPORTANT: follow the following primary instructions precisely, using everything above as context:\n'
        output += primaryPrompt
        log('original user prompt added')
    
    # Output to stdout
    print(output)
    log('output', {'bytes': len(output)})
    
    # Log END of execution
    log("END " + THIS_SKILL + " (python)\n======================================================================\n")
