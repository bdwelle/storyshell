#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Logging function - single-line entries to storygen.log
function log(operation, details = {}) {
  const timestamp = new Date().toISOString();
  const detailsStr = Object.entries(details)
    .map(([k, v]) => `${k}=${v}`)
    .join(' ');
  const logLine = `${timestamp} ${operation} ${detailsStr}\n`;
  
  const logPath = path.join(process.cwd(), 'storygen.log');
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

////////////////////////////////
// MAIN 

// Log start of execution
log('START storygen skill');

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
const storeygenRoot = path.join(baseDir, '../..');  // Go up to storygen root

log('run', { 
  template: templateName, 
  user_prompt: userPrompt ? `"${userPrompt}"` : 'none'
});

////////////////
// TEMPLATE

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
const projectMainPath = path.join(process.cwd(), 'inc/main.md');
const includes = [];

// Check if project main.md exists and has its own includes
if (fs.existsSync(projectMainPath)) {
  const projectMainContent = fs.readFileSync(projectMainPath, 'utf8');
  const projectMainMatch = projectMainContent.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  
  if (projectMainMatch) {
    // Project main.md has frontmatter - parse its includes first
    const projectMainIncludes = parseIncludesFromFrontmatter(projectMainMatch[1]);
    includes.push(...projectMainIncludes);
    log('project_main_includes', { count: projectMainIncludes.length, files: JSON.stringify(projectMainIncludes) });
  }
  
  // Then add project main.md itself
  includes.push('inc/main.md');
} else {
  // Project main.md doesn't exist, but still add to list (will be handled gracefully)
  includes.push('inc/main.md');
}

// Parse additional includes from template frontmatter
const templateIncludes = parseIncludesFromFrontmatter(frontmatterText);
includes.push(...templateIncludes);

// Process includes with multi-path resolution
let output = '';

// Track if project context was included
let projectContextIncluded = false;

if (includes.length > 0) {
  for (const inc of includes) {
    let resolved = false;
    const searchPaths = [
      path.join(process.cwd(), inc),              // 1. Relative to current directory (PROJECT)
      path.isAbsolute(inc) ? inc : null           // 2. Absolute path
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
          
          // Track if this was the project context
          if (inc === 'inc/main.md' && incPath === projectMainPath) {
            projectContextIncluded = true;
          }
          
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
      // Only warn if it's NOT the auto-included project context
      if (inc !== 'inc/main.md') {
        warn(`Include file not found: ${inc}`);
      }
      log('include', { file: inc, status: 'missing' });
    }
  }
}

// Log whether project context was found
if (!projectContextIncluded) {
  log('project_context', { status: 'not_found', path: projectMainPath });
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
log("END storygen skill\n");
