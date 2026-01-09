#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Logging function - single-line entries to storyshell.log
function log(operation, details = {}) {
  const timestamp = new Date().toISOString();
  const detailsStr = Object.entries(details)
    .map(([k, v]) => `${k}=${v}`)
    .join(' ');
  const logLine = `${timestamp} ${operation} ${detailsStr}\n`;
  
  const logPath = path.join(process.cwd(), 'storyshell.log');
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
  
  for (const token of tokens) {
    if (conceptIndex[token]) {
      matchedFiles.add(conceptIndex[token]);
    }
  }
  
  if (matchedFiles.size > 0) {
    log('concept_matching', { 
      matches: JSON.stringify(Array.from(matchedFiles)),
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

// Log start of execution
log('START storyshell skill');

// Parse command line arguments
const args = process.argv.slice(2);

// Log the original command line arguments
log('argv', { 
  args: JSON.stringify(process.argv.slice(2))
});

if (args.length < 1) {
  console.error('Usage: run.js <template-name> [user-prompt]');
  process.exit(1);
}

const templateName = args[0];
const userPrompt = args.slice(1).join(' ');
const baseDir = __dirname;
const storeygenRoot = path.join(baseDir, '../..');  // Go up to storyshell root

log('run', { 
  template: templateName, 
  user_prompt: userPrompt ? `"${userPrompt}"` : 'none'
});

////////////////
// TEMPLATES

// Read template file from root tpl/ directory
const templatePath = path.join(storeygenRoot, 'tpl', `${templateName}.md`);
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
  if (userPrompt) {
    console.log(`\n\nUser request: ${userPrompt}\n`);
  }
  log('output', { bytes: templateContent.length });
  process.exit(0);
}

const [, frontmatterText, templateBody] = match;

////////////////
// INCLUDES (context)

// Auto-include project context first (from current working directory)
const projectMainPath = path.join(process.cwd(), 'prompts/main.md');
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

// Build entity index (concepts + characters) and find matching files from user prompt
const conceptIndex = buildConceptIndex(process.cwd());
const conceptFiles = findConceptFiles(userPrompt, conceptIndex);

// Load related concepts from matched concept files
const relatedConceptFiles = [];
for (const conceptFile of conceptFiles) {
  const related = loadRelatedConcepts(conceptFile, conceptIndex, process.cwd());
  relatedConceptFiles.push(...related);
}

// Combine concept files + related, deduplicate
const allConceptFiles = [...new Set([...conceptFiles, ...relatedConceptFiles])];

// Insert concept files after project main, before template includes
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
      path.join(process.cwd(), inc),              // 1. Relative to current directory (PROJECT)
      path.join(storeygenRoot, inc),              // 2. Relative to storyshell root (FRAMEWORK)
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

// Add template body
output += templateBody;

// Add user prompt if provided
if (userPrompt) {
  output += `\n\n## User Request\n\n${userPrompt}\n`;
}

// Output to stdout
console.log(output);
log('output', { bytes: output.length });

// Log END of execution
log("END storyshell skill\n======================================================================\n");
