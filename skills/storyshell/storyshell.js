#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { GoogleGenAI } = require('@google/genai');
// PST offset (8 hours behind UTC)
const PST_OFFSET_MS = -8 * 60 * 60 * 1000;

// Voice mapping for TTS
const VOICE_MAP = {
  'celeste': 'Leda',
};

// Logging function - single-line entries to storyshell.log
function log(operation, details = {}, projectDir) {
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
function warn(message, projectDir) {
  console.error(`Warning: ${message}`);
  log('warning', { message }, projectDir);
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
function scanDirectory(dir, index, prefix, options = {}, projectDir) {
  if (!fs.existsSync(dir)) {
    log('scan_directory', { dir: prefix, status: 'not_found' }, projectDir);
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
      warn(`Error parsing ${file}: ${err.message}`, projectDir);
    }
  }

  log('scan_directory', { dir: prefix, status: 'ok', files: files.length }, projectDir);
  return files.length;
}

// Build unified entity index from codex/ and characters/ directories
function buildConceptIndex(projectDir) {
  const index = {}; // { "steg": "codex/steg.md", "maya": "characters/maya-chen.md", ... }

  // Scan codex/ for concepts
  const conceptCount = scanDirectory(
    path.join(projectDir, 'codex'),
    index,
    'codex',
    {},
    projectDir
  );

  // Scan characters/ for character files
  const characterCount = scanDirectory(
    path.join(projectDir, 'characters'),
    index,
    'characters',
    {},
    projectDir
  );

  log('entity_index', {
    status: 'built',
    concepts: conceptCount,
    characters: characterCount,
    total_entries: Object.keys(index).length
  }, projectDir);

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
function findConceptFiles(prompt, conceptIndex, projectDir) {
  const tokens = extractConceptTokens(prompt);
  const matchedFiles = new Set();

  log('concept_extraction', {
    tokens: JSON.stringify(tokens),
    source: 'user_prompt'
  }, projectDir);

  // this is the actual matching
  // IMPORTANT: it only works on SINGLE WORDS
  // e.g. "the twins" <> "twins"
  for (const token of tokens) {
    if (conceptIndex[token]) {
      matchedFiles.add(conceptIndex[token]);
      log('concept token matched', {
        matched_token: conceptIndex[token]
      }, projectDir);
    }
  }

  if (matchedFiles.size > 0) {
    log('concept_matching', {
      matches: matchedFiles.size,
      status: 'ok'
    }, projectDir);
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
      }, projectDir);
    }
  } catch (err) {
    warn(`Error loading related entities from ${conceptFile}: ${err.message}`, projectDir);
  }

  return relatedFiles;
}

// Generate TTS style prompt via LLM
async function generateStylePrompt(projectContext, characterProfile, text, projectDir) {
  if (!process.env.GEMINI_API_KEY) {
    warn('GEMINI_API_KEY not set, using default style', projectDir);
    return 'Read this naturally.';
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const directorsNotePrompt = `Generate a concise Director's Note (max 100 words) for text-to-speech voice performance.

## Project Context
${projectContext}

## Character Profile
${characterProfile}

## Text to Read
${text.substring(0, 500)}

Write only the Director's Note - a brief performance guide covering voice style, pacing, emotion, and any specific delivery instructions. Be specific and actionable.`;

  log('tts', { directorsNotePrompt: directorsNotePrompt.substring(0, 200) }, projectDir);

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ text: directorsNotePrompt }],
    });
    return response.text.trim();
  } catch (err) {
    warn(`Failed to generate style prompt: ${err.message}`, projectDir);
    return 'Read this naturally.';
  }
}

// Parse mime type for WAV conversion
function parseMimeType(mimeType) {
  const [fileType, ...params] = mimeType.split(';').map(s => s.trim());
  const [_, format] = fileType.split('/');

  const options = { numChannels: 1, sampleRate: 24000, bitsPerSample: 16 };

  if (format && format.startsWith('L')) {
    const bits = parseInt(format.slice(1), 10);
    if (!isNaN(bits)) options.bitsPerSample = bits;
  }

  for (const param of params) {
    const [key, value] = param.split('=').map(s => s.trim());
    if (key === 'rate') options.sampleRate = parseInt(value, 10);
  }

  return options;
}

// Create WAV header
function createWavHeader(dataLength, options) {
  const { numChannels, sampleRate, bitsPerSample } = options;
  const byteRate = sampleRate * numChannels * bitsPerSample / 8;
  const blockAlign = numChannels * bitsPerSample / 8;
  const buffer = Buffer.alloc(44);

  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataLength, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataLength, 40);

  return buffer;
}

// Convert raw PCM to WAV
function convertToWav(rawData, mimeType) {
  const options = parseMimeType(mimeType);
  const wavHeader = createWavHeader(rawData.length, options);
  const buffer = Buffer.from(rawData, 'base64');
  return Buffer.concat([wavHeader, buffer]);
}

async function handleTtsRequest(templateName, primaryPrompt, projectDir, projectMainPath, VOICE_MAP, log, warn, extractExplicitPaths, parseFrontmatter, buildConceptIndex, findConceptFiles, loadRelatedConcepts, generateStylePrompt, GoogleGenAI, convertToWav, skillRoot) {
  // Extract target file from prompt
  const explicitPaths = extractExplicitPaths(primaryPrompt);
  if (explicitPaths.length === 0) {
    console.error('Error: No target file specified for TTS');
    process.exit(1);
  }

  const targetFile = explicitPaths[0];
  const targetPath = path.join(projectDir, targetFile);

  if (!fs.existsSync(targetPath)) {
    console.error(`Error: Target file not found: ${targetPath}`);
    process.exit(1);
  }

  // Read target file and parse frontmatter
  const targetContent = fs.readFileSync(targetPath, 'utf8');
  const targetFrontmatter = parseFrontmatter(targetContent);

  // Extract body text (strip frontmatter)
  const bodyMatch = targetContent.match(/^---\n([\s\S]*?\n---\n)?([\s\S]*)$/);
  const bodyText = bodyMatch ? bodyMatch[2].trim() : targetContent.trim();

  // Extract POV from frontmatter
  const povName = targetFrontmatter.pov;
  log('tts', { target: targetFile, pov: povName }, projectDir);

  // Load character file for POV
  let characterProfile = '';
  let voiceName = 'Leda'; // default

  if (povName) {
    const conceptIndex = buildConceptIndex(projectDir);
    const characterFiles = findConceptFiles(povName, conceptIndex, projectDir);

    if (characterFiles.length > 0) {
      const charFile = characterFiles[0];
      const charPath = path.join(projectDir, charFile);
      const charContent = fs.readFileSync(charPath, 'utf8');
      characterProfile = charContent.replace(/^---\n([\s\S]*?\n---\n)?/, '').trim();

      // Look up voice from mapping
      const normalizedPov = povName.toLowerCase().replace(/\s+/g, '-');
      if (VOICE_MAP[normalizedPov]) {
        voiceName = VOICE_MAP[normalizedPov];
      }
    }
  }

  // Load project context
  const projectContext = fs.readFileSync(projectMainPath, 'utf8')
    .replace(/^---\n([\s\S]*?\n---\n)?/, '').trim();

  // Generate style prompt
  const stylePrompt = await generateStylePrompt(projectContext, characterProfile, bodyText, projectDir);
  log('tts', { stylePrompt: stylePrompt.substring(0, 200), voiceName }, projectDir);
  log('tts', { voiceName: voiceName }, projectDir);

  // Ensure voice directory exists
  const voiceDir = path.join(projectDir, 'voice');
  if (!fs.existsSync(voiceDir)) {
    fs.mkdirSync(voiceDir, { recursive: true });
  }

  // Call Gemini TTS directly via API
  if (!process.env.GEMINI_API_KEY) {
    console.error('Error: GEMINI_API_KEY not set');
    process.exit(1);
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const contentText = stylePrompt ? `${stylePrompt}\n\n${bodyText}` : bodyText;
  const config = {
    temperature: 1,
    responseModalities: ['audio'],
    speechConfig: {
      voiceConfig: {
        prebuiltVoiceConfig: { voiceName }
      }
    }
  };

  const model = 'gemini-2.5-flash-preview-tts';
  const contents = [{ role: 'user', parts: [{ text: contentText }] }];

  const response = await ai.models.generateContentStream({
    model, config, contents
  });

  let audioChunks = [];
  let mimeType = null;

  for await (const chunk of response) {
    if (!chunk.candidates?.[0]?.content?.parts?.[0]?.inlineData) continue;
    const inlineData = chunk.candidates[0].content.parts[0].inlineData;
    mimeType = inlineData.mimeType;
    audioChunks.push(inlineData.data);
  }

  if (audioChunks.length === 0) {
    console.error('Error: No audio data received from Gemini API');
    process.exit(1);
  }

  // Convert to WAV
  const combinedBase64 = audioChunks.join('');
  const wavBuffer = convertToWav(combinedBase64, mimeType);

  // Save to voice directory
  const timestamp = Date.now();
  const safeFileName = targetFile.replace(/[^a-zA-Z0-9]/g, '-');
  const voiceFileName = `tts-${timestamp}-${safeFileName}.wav`;
  const voicePath = path.join(voiceDir, voiceFileName);
  fs.writeFileSync(voicePath, wavBuffer);
  console.log(voicePath);
  log('tts_complete', { file: voicePath }, projectDir);
}

async function main() {
  // Setup directory paths - must be before log function
  const baseDir = process.env.SKILL_DIR || process.cwd();
  const skillRoot = path.join(baseDir, '../..');  // Go up to storyshell root
  const projectDir = process.env.PROJECT_DIR || process.cwd();
  const projectMainPath = path.join(projectDir, 'prompts/main.md');

  // Log start of execution
  log('START storyshell (js-big-skill)', {}, projectDir);

  // Log directory constants for debugging
  log('directory_constants', {
    baseDir: baseDir,
    skillRoot: skillRoot,
    projectDir: projectDir,
    projectMainPath: projectMainPath,
    cwd: process.cwd(),
    scriptPath: __filename
  }, projectDir);

  // Parse command line arguments
  const args = process.argv.slice(2);

  // Log the original command line arguments
  log('argv', {
    args: JSON.stringify(process.argv.slice(2))
  }, projectDir);

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
  }, projectDir);

  // Read template file from root tpl/ directory
  const templatePath = path.join(skillRoot, 'tpl', `${templateName}.md`);
  if (!fs.existsSync(templatePath)) {
    warn(`Template not found: ${templatePath}`, projectDir);
    log('error', { type: 'template_not_found', path: templatePath }, projectDir);
    process.exit(1);
  }

  let templateContent = fs.readFileSync(templatePath, 'utf8');
  log('template', { file: templatePath, status: 'ok' }, projectDir);

  // If TTS template, templateContent is not needed
  if (templateName === 'tts') {
    templateContent = '';
    await handleTtsRequest(templateName, primaryPrompt, projectDir, projectMainPath, VOICE_MAP, log, warn, extractExplicitPaths, parseFrontmatter, buildConceptIndex, findConceptFiles, loadRelatedConcepts, generateStylePrompt, GoogleGenAI, convertToWav, skillRoot);
    process.exit(0); // Exit after handling TTS
  }

  // Normal template processing continues below...

  // Parse YAML frontmatter
  const match = templateContent.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) {
    // No frontmatter - just output template
    console.log(templateContent);
    if (primaryPrompt) {
      console.log(`\n\nUser request: ${primaryPrompt}\n`);
    }
    log('output', { bytes: templateContent.length }, projectDir);
    process.exit(0);
  }

  const [, frontmatterText, templateBody] = match;

  //////////////////////////////
  // INCLUDES (context)

  // Auto-include project context first (from PROJECT_DIR env var or current working directory)
  const includes = [];

  // Check if project main.md exists - REQUIRED
  if (!fs.existsSync(projectMainPath)) {
    console.error(`Error: Project context not found: ${projectMainPath}`);
    console.error('');
    console.error('You must have prompts/main.md in your project directory.');
    console.error('Run from your project directory with a prompts/main.md file.');
    log('error', { type: 'project_context_required', path: projectMainPath }, projectDir);
    process.exit(1);
  }

  // Read and parse project main.md
  const projectMainContent = fs.readFileSync(projectMainPath, 'utf8');
  const projectMainMatch = projectMainContent.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);

  if (projectMainMatch) {
    // Project main.md has frontmatter - parse its includes first
    const projectMainIncludes = parseIncludesFromFrontmatter(projectMainMatch[1]);
    includes.push(...projectMainIncludes);
    log('project_main_includes', { count: projectMainIncludes.length, files: JSON.stringify(projectMainIncludes) }, projectDir);
  }

  // Then add project main.md itself
  includes.push('prompts/main.md');

  // Extract explicit filepaths from primary prompt
  const explicitPaths = extractExplicitPaths(primaryPrompt);
  if (explicitPaths.length > 0) {
    log('explicit_paths', {
      count: explicitPaths.length,
      paths: JSON.stringify(explicitPaths)
    }, projectDir);
    includes.push(...explicitPaths);
  }

  // Build entity index (concepts + characters) and find matching files from primary prompt
  const conceptIndex = buildConceptIndex(projectDir);
  const conceptFiles = findConceptFiles(primaryPrompt, conceptIndex, projectDir);

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
  }, projectDir);

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
            const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
            if (frontmatterMatch) {
              content = frontmatterMatch[1];
            }

            output += content + '\n\n';
            log('include', { file: inc, resolved: incPath, status: 'ok' }, projectDir);
            resolved = true;
            break;
          } catch (err) {
            warn(`Error reading include ${incPath}: ${err.message}`, projectDir);
            log('include', { file: inc, resolved: incPath, status: 'error', error: err.message }, projectDir);
          }
        }
      }

      if (!resolved) {
        warn(`Include file not found: ${inc}`, projectDir);
        log('include', { file: inc, status: 'missing' }, projectDir);
      }
    }
  }
  log("includes complete", {}, projectDir);

  if (primaryPrompt) {
    output += primaryPrompt;
    log('primaryPrompt added', {}, projectDir);
  }

  output += "IMPORTANT: if you do save any output to a file, be sure not to clobber any of the files you may have read in as part of the context or templates!";
  log('noclobber hint added', { file: templatePath }, projectDir);

  output += templateBody;
  log('templateBody added', { file: templatePath }, projectDir);

  console.log(output);
  log('output', { bytes: output.length }, projectDir);
  log("END storyshell (js-big-skill)\n======================================================================\n", {}, projectDir);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
