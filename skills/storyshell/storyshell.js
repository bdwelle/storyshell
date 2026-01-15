#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
// PST offset (8 hours behind UTC)
const PST_OFFSET_MS = -8 * 60 * 60 * 1000;

// Setup directory paths - must be before log function
const baseDir = process.env.SKILL_DIR || process.cwd();
const skillRoot = path.join(baseDir, '../..');  // Go up to storyshell root
const projectDir = process.env.PROJECT_DIR || process.cwd();
const projectMainPath = path.join(projectDir, 'prompts/main.md');

// Log start of execution
log('START storyshell (js-big-skill)');

// Log directory constants for debugging
log('directory_constants', {
  baseDir: baseDir,
  skillRoot: skillRoot,
  projectDir: projectDir,
  projectMainPath: projectMainPath,
  cwd: process.cwd(),
  scriptPath: __filename
});

// Parse command line arguments
const args = process.argv.slice(2);

// Log the original command line arguments
log('argv', { 
  args: JSON.stringify(process.argv.slice(2))
});

if (args.length < 1) {
  console.error('Usage: storyshell.js <template-name>');
  process.exit(1);
}

const templateName = args[0];

// Read original user message from stdin
let originalUserMessage = '';
if (!process.stdin.isTTY) {
  try {
    originalUserMessage = fs.readFileSync('/dev/stdin', 'utf8').trim();
  } catch (e) {
    // stdin not available
  }
}

const primaryPrompt = originalUserMessage;

log('run', { 
  template: templateName, 
  primaryPrompt: primaryPrompt
});

// Logging function - single-line entries to storyshell.log
function log(operation, details = {}) {
  const now = new Date();
  const pstTime = new Date(now.getTime() + PST_OFFSET_MS);
  const timestamp = pstTime.toISOString().replace('Z', ' PST');
  const detailsStr = Object.entries(details)
    .map(([k, v]) => `${k}=${v}`)
    .join(' ');
  const logLine = `${timestamp} ${operation} ${detailsStr}\n`;
  const logPath = path.join(projectDir, 'log', 'storyshell.log');
  fs.appendFileSync(logPath, logLine);
}

// Error handling - warnings to stderr
function warn(message) {
  console.error(`Warning: ${message}`);
  log('warning', { message });
}

// Parse includes from YAML frontmatter
function parseIncludesFromFrontmatter(frontmatterText) {
  const includes = [];
  const lines = frontmatterText.split('\n');
  let inIncludesSection = false;

  for (const line of lines) {
    if (line.match(/^includes:/)) {
      inIncludesSection = true;
      continue;
    }
    if (inIncludesSection) {
      const includeMatch = line.match(/^\s*-\s+(.+)$/);
      if (includeMatch) {
        includes.push(includeMatch[1].trim());
      } else if (line.match(/^\S/)) {
        // New top-level key, stop parsing includes
        break;
      }
    }
  }
  
  return includes;
}

// Parse full frontmatter into object
function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  
  const frontmatter = {};
  const lines = match[1].split('\n');
  let currentKey = null;
  let currentArray = null;
  
  for (const line of lines) {
    // Array item
    const arrayMatch = line.match(/^\s*-\s+(.+)$/);
    if (arrayMatch && currentArray) {
      currentArray.push(arrayMatch[1].trim());
      continue;
    }
    
    // Key-value pair
    const kvMatch = line.match(/^([a-z_]+):\s*(.*)$/i);
    if (kvMatch) {
      const [, key, value] = kvMatch;
      currentKey = key;
      
      if (value === '') {
        // Array starts on next line
        currentArray = [];
        frontmatter[key] = currentArray;
      } else {
        // Simple value
        frontmatter[key] = value.trim();
        currentArray = null;
      }
    }
  }
  
  return frontmatter;
}

// Helper: Scan a directory and add files to the index
function scanDirectory(dir, index, prefix, options = {}) {
  if (!fs.existsSync(dir)) {
    log('scan_directory', { dir: prefix, status: 'not_found' });
    return 0;
  }
  
  let files = fs.readdirSync(dir).filter(f => f.endsWith('.md'));
  
  // Exclude main.md from inc/ directory
  if (options.excludeMain) {
    files = files.filter(f => f !== 'main.md');
  }
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const basename = file.replace(/\.md$/, '');
    const relPath = `${prefix}/${file}`;
    
    // Add filename as primary key
    index[basename] = relPath;
    
    // Parse frontmatter for aliases and name field
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const frontmatter = parseFrontmatter(content);
      
      // Add aliases
      if (frontmatter.aliases && Array.isArray(frontmatter.aliases)) {
        for (const alias of frontmatter.aliases) {
          index[alias.toLowerCase()] = relPath;
        }
      }
      
      // Add 'name' field for characters (normalized: "Maya Chen" -> "maya-chen")
      if (frontmatter.name) {
        const nameLower = frontmatter.name.toLowerCase().replace(/\s+/g, '-');
        index[nameLower] = relPath;
      }
    } catch (err) {
      warn(`Error parsing ${file}: ${err.message}`);
    }
  }
  
  log('scan_directory', { dir: prefix, status: 'ok', files: files.length });
  return files.length;
}

// Build unified entity index from codex/ and characters/ directories
function buildConceptIndex(projectDir) {
  const index = {}; // { "steg": "codex/steg.md", "maya": "characters/maya-chen.md", ... }
  
  // Scan codex/ for concepts
  const conceptCount = scanDirectory(
    path.join(projectDir, 'codex'), 
    index, 
    'codex'
  );
  
  // Scan characters/ for character files
  const characterCount = scanDirectory(
    path.join(projectDir, 'characters'), 
    index, 
    'characters'
  );
  
  log('entity_index', { 
    status: 'built',
    concepts: conceptCount,
    characters: characterCount,
    total_entries: Object.keys(index).length 
  });
  
  return index;
}

// Extract explicit filepaths from prompt (e.g., "scenes/marchetti-first-binding.md")
function extractExplicitPaths(prompt) {
  if (!prompt) return [];
  
  // Match paths like: path/to/file.md, path/file.md, file.md
  const pathPattern = /[\w\-./]+\.md/g;
  const matches = prompt.match(pathPattern) || [];
  
  return matches;
}

// Get the primary prompt for entity extraction
// Prefers original user command (from PI_USER_COMMAND env var) over agent interpretation
function getPrimaryPrompt() {
  return originalUserCommand || userPrompt;
}

// Extract concept tokens from user prompt
function extractConceptTokens(prompt) {
  if (!prompt) return [];
  
  // Common words to exclude from concept extraction
  const stopwords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'up', 'about', 'into', 'through', 'during',
    'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
    'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might',
    'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it',
    'we', 'they', 'what', 'which', 'who', 'when', 'where', 'why', 'how',
    'as', 'if', 'because', 'so', 'than', 'such', 'no', 'not', 'only', 'own',
    'same', 'so', 'than', 'too', 'very', 'just'
  ]);
  
  // Split on whitespace, punctuation, but keep hyphens/underscores
  const tokens = prompt
    .toLowerCase()
    .split(/[\s,.()?!;:"]+/)
    .filter(t => t.length > 0)
    .filter(t => !stopwords.has(t));
  
  return tokens;
}

// Find concept files matching user prompt
function findConceptFiles(prompt, conceptIndex) {
  const tokens = extractConceptTokens(prompt);
  const matchedFiles = new Set();
  
  log('concept_extraction', { 
    tokens: JSON.stringify(tokens),
    source: 'user_prompt'
  });
  
  // this is the actual matching
  // IMPORTANT: it only works on SINGLE WORDS
  // e.g. "the twins" <> "twins"
  for (const token of tokens) {
    if (conceptIndex[token]) {
      matchedFiles.add(conceptIndex[token]);
      log('concept token matched', { 
        matched_token: conceptIndex[token]
      });
    }
  }
  
  if (matchedFiles.size > 0) {
    log('concept_matching', { 
      matches: matchedFiles.size,
      status: 'ok'
    });
  }
  
  return Array.from(matchedFiles);
}

// Load related entities (concepts + characters) from a file's frontmatter
function loadRelatedConcepts(conceptFile, conceptIndex, projectDir) {
  const relatedFiles = [];
  const filePath = path.join(projectDir, conceptFile);
  
  if (!fs.existsSync(filePath)) return relatedFiles;
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const frontmatter = parseFrontmatter(content);
    
    // Load related_concepts
    if (frontmatter.related_concepts && Array.isArray(frontmatter.related_concepts)) {
      for (const concept of frontmatter.related_concepts) {
        if (conceptIndex[concept]) {
          relatedFiles.push(conceptIndex[concept]);
        }
      }
    }
    
    // Load related_characters
    if (frontmatter.related_characters && Array.isArray(frontmatter.related_characters)) {
      for (const character of frontmatter.related_characters) {
        if (conceptIndex[character]) {
          relatedFiles.push(conceptIndex[character]);
        }
      }
    }
    
    if (relatedFiles.length > 0) {
      log('related_entities', {
        from: conceptFile,
        loaded: JSON.stringify(relatedFiles)
      });
    }
  } catch (err) {
    warn(`Error loading related entities from ${conceptFile}: ${err.message}`);
  }
  
  return relatedFiles;
}

////////////////////////////////
// MAIN 

////////////////
// TEMPLATES

// Read template file from root tpl/ directory
const templatePath = path.join(skillRoot, 'tpl', `${templateName}.md`);
if (!fs.existsSync(templatePath)) {
  warn(`Template not found: ${templatePath}`);
  log('error', { type: 'template_not_found', path: templatePath });
  process.exit(1);
}

const templateContent = fs.readFileSync(templatePath, 'utf8');
log('template', { file: templatePath, status: 'ok' });

// Parse YAML frontmatter
const match = templateContent.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
if (!match) {
  // No frontmatter - just output template
  console.log(templateContent);
  if (primaryPrompt) {
    console.log(`\n\nUser request: ${primaryPrompt}\n`);
  }
  log('output', { bytes: templateContent.length });
  process.exit(0);
}

const [, frontmatterText, templateBody] = match;

////////////////
// INCLUDES (context)

// Auto-include project context first (from PROJECT_DIR env var or current working directory)
const includes = [];

// Check if project main.md exists - REQUIRED
if (!fs.existsSync(projectMainPath)) {
  console.error(`Error: Project context not found: ${projectMainPath}`);
  console.error('');
  console.error('You must have prompts/main.md in your project directory.');
  console.error('Run from your project directory with a prompts/main.md file.');
  log('error', { type: 'project_context_required', path: projectMainPath });
  process.exit(1);
}

// Read and parse project main.md
const projectMainContent = fs.readFileSync(projectMainPath, 'utf8');
const projectMainMatch = projectMainContent.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);

if (projectMainMatch) {
  // Project main.md has frontmatter - parse its includes first
  const projectMainIncludes = parseIncludesFromFrontmatter(projectMainMatch[1]);
  includes.push(...projectMainIncludes);
  log('project_main_includes', { count: projectMainIncludes.length, files: JSON.stringify(projectMainIncludes) });
}

// Then add project main.md itself
includes.push('prompts/main.md');

// Extract explicit filepaths from primary prompt
const explicitPaths = extractExplicitPaths(primaryPrompt);
if (explicitPaths.length > 0) {
  log('explicit_paths', { 
    count: explicitPaths.length,
    paths: JSON.stringify(explicitPaths)
  });
  includes.push(...explicitPaths);
}

// Build entity index (concepts + characters) and find matching files from primary prompt
const conceptIndex = buildConceptIndex(projectDir);
const conceptFiles = findConceptFiles(primaryPrompt, conceptIndex);

// Load related concepts from matched concept files
const relatedConceptFiles = [];
for (const conceptFile of conceptFiles) {
  const related = loadRelatedConcepts(conceptFile, conceptIndex, projectDir);
  relatedConceptFiles.push(...related);
}

// Combine concept files + related, deduplicate
const allConceptFiles = [...new Set([...conceptFiles, ...relatedConceptFiles])];

// Insert concept files after explicit paths, before template includes
includes.push(...allConceptFiles);

// Parse additional includes from template frontmatter
const templateIncludes = parseIncludesFromFrontmatter(frontmatterText);
includes.push(...templateIncludes);

// Final deduplication - preserve order, remove duplicates
const uniqueIncludes = [];
const seen = new Set();
for (const inc of includes) {
  if (!seen.has(inc)) {
    uniqueIncludes.push(inc);
    seen.add(inc);
  }
}

// Alpha sort by filename
uniqueIncludes.sort();

log('includes_final', {
  total: uniqueIncludes.length,
  files: JSON.stringify(uniqueIncludes)
});

// Process includes with multi-path resolution
let output = '';

if (uniqueIncludes.length > 0) {
  for (const inc of uniqueIncludes) {
    let resolved = false;
    const searchPaths = [
      path.join(projectDir, inc),                 // 1. Relative to project directory (PROJECT)
      path.join(skillRoot, inc),            // 2. Relative to storyshell root (FRAMEWORK)
      path.isAbsolute(inc) ? inc : null           // 3. Absolute path
    ].filter(p => p !== null);

    for (const incPath of searchPaths) {
      if (fs.existsSync(incPath)) {
        try {
          let content = fs.readFileSync(incPath, 'utf8');
          
          // Strip frontmatter if present (only include the body)
          const frontmatterMatch = content.match(/^---\n[\s\S]*?\n---\n([\s\S]*)$/);
          if (frontmatterMatch) {
            content = frontmatterMatch[1];
          }
          
          output += content + '\n\n';
          log('include', { file: inc, resolved: incPath, status: 'ok' });
          resolved = true;
          break;
        } catch (err) {
          warn(`Error reading include ${incPath}: ${err.message}`);
          log('include', { file: inc, resolved: incPath, status: 'error', error: err.message });
        }
      }
    }

    if (!resolved) {
      warn(`Include file not found: ${inc}`);
      log('include', { file: inc, status: 'missing' });
    }
  }
}
log("includes complete");

// Add user prompt 
if (primaryPrompt) {
  // commented out because the template body has the final instructions 
  // output += `\n\n## Primary User Request`
  // output += `\n\nIMPORTANT: follow the following primary instructions precisely, using everything above as context:\n`;
  output += primaryPrompt;
  log('primaryPrompt added');
}

// Add noclobber hint
output += "IMPORTANT: if you do save any output to a file, be sure not to clobber any of the files you may have read in as part of the context or templates!";
log('noclobber hint added', { file: templatePath });

// Add template body
output += templateBody;
log('templateBody added', { file: templatePath });

// Output to stdout
console.log(output);
log('output', { bytes: output.length });

// Log END of execution
log("END storyshell (js-big-skill)\n======================================================================\n");
