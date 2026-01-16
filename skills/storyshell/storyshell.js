#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { GoogleGenAI } = require('@google/genai');
// PST offset (8 hours behind UTC)
const PST_OFFSET_MS = -8 * 60 * 60 * 1000;

const VOICE_MAP = {
  // 'celeste': 'Leda',
  'anya': 'Zephyr',
  'lucia': 'Zephyr',
  'lucia': 'Zephyr',
  'twins': 'Leda',
  'celeste': 'Zephyr',
};

const PROJECT_DIR = process.env.PROJECT_DIR || process.cwd();

// --- NEW FUNCTION: logRotation ---
function logRotation() {
  const logDir = path.join(PROJECT_DIR, 'log');
  const currentLogPath = path.join(logDir, 'storyshell.log');

  // Ensure log directory exists
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  if (fs.existsSync(currentLogPath)) {
    const now = new Date();
    // Using UTC to avoid local timezone issues in filename, and replace invalid chars
    const timestamp = now.toISOString().replace(/[:.]/g, '-');
    const oldLogPath = path.join(logDir, `storyshell.log.${timestamp}`);
    
    try {
      fs.renameSync(currentLogPath, oldLogPath);
      // Log this event to stderr, as `log` function might not be fully ready
      console.error(`[storyshell] Moved old log to: ${oldLogPath}`);
    } catch (err) {
      console.error(`[storyshell] Error during log rotation: ${err.message}`);
    }
  }
}
// --- END NEW FUNCTION ---

// Logging function - single-line entries to storyshell.log
function log(operation, details = undefined) {
  const now = new Date();
  const pstTime = new Date(now.getTime() + PST_OFFSET_MS);
  const timestamp = pstTime.toISOString().replace('Z', ' PST');
  let detailsStr = '';
  if (details && Object.keys(details).length > 0) {
    detailsStr = ' ' + Object.entries(details)
      .map(([k, v]) => `${k}=${v}`)
      .join(' ');
  }
  const logLine = `${timestamp} ${operation}${detailsStr}\n`;
  const logPath = path.join(PROJECT_DIR, 'log', 'storyshell.log');
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
function buildConceptIndex() {
  const index = {}; // { "steg": "codex/steg.md", "maya": "characters/maya-chen.md", ... }

  // Scan codex/ for concepts
  const conceptCount = scanDirectory(
    path.join(PROJECT_DIR, 'codex'),
    index,
    'codex',
    {}
  );

  // Scan characters/ for character files
  const characterCount = scanDirectory(
    path.join(PROJECT_DIR, 'characters'),
    index,
    'characters',
    {}
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

  log('findConceptFiles - looking for', {
    tokens: JSON.stringify(tokens),
    source: 'user_prompt'
  });

  // this is the actual matching
  // IMPORTANT: it only works on SINGLE WORDS
  // e.g. "the twins" <> "twins"
  for (const token of tokens) {
	log('findConceptFiles - looking for token', { token: JSON.stringify(token) });
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
function loadRelatedConcepts(conceptFile, conceptIndex) {
  const relatedFiles = [];
  const filePath = path.join(PROJECT_DIR, conceptFile);

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

// Generate TTS style prompt via LLM
async function generateTTSStylePrompt(projectMainContext, characterProfile, text) {
  if (!process.env.GEMINI_API_KEY) {
    warn('GEMINI_API_KEY not set, using default style');
    return 'Read this naturally.';
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  // generate a "Director's Note" that will be passed as a prompt along with the TTS text
  // https://ai.google.dev/gemini-api/docs/speech-generation#prompting-guide
  // for context here we pass in main.md, the pov character profile, 
  // and a snippet of the TTS text 
   
  const directorsNotePrompt = `Generate a very concise Director's Note (max 20 words) for text-to-speech voice performance, using the following context: 

## Project Context from main.md 
${projectMainContext}

## Character Profile
${characterProfile}

## Sample of Text to Read
${text.substring(0, 500)}

Write only the Director's Note - a very brief performance guide covering voice style, pacing, emotion, and any specific delivery instructions. Be specific and actionable. IMPORTANT: Omit any guidance about an accent.`;

// log('tts', { directorsNotePrompt: directorsNotePrompt.substring(0, 200) } );

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: [{ text: directorsNotePrompt }],
    });
    return response.text.trim();
  } catch (err) {
    warn(`Failed to generate style prompt: ${err.message}`);
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
function convertToWav(rawDataBuffer, mimeType) { // rawDataBuffer is already a Buffer
  const options = parseMimeType(mimeType);
  log('tts convertToWav options', { mimeType: mimeType, options: JSON.stringify(options) });
  // const decodedBuffer = Buffer.from(rawData, 'base64'); // NO LONGER NEEDED
  const wavHeader = createWavHeader(rawDataBuffer.length, options); // Use length of the passed buffer
  return Buffer.concat([wavHeader, rawDataBuffer]); // Concatenate header with passed buffer
}

async function handleTtsRequest(templateName, primaryPrompt, projectMainPath) {

  let TTSstylePrompt = '';
  // default voice from https://ai.google.dev/gemini-api/docs/speech-generation#voices
  let voiceName = 'Leda'; 

  // Extract TTS file from prompt
  const explicitPaths = extractExplicitPaths(primaryPrompt);
  if (explicitPaths.length === 0) {
    console.error('Error: No target file specified for TTS');
    process.exit(1);
  }

  const ttsFile = explicitPaths[0];
  const ttsPath = path.join(PROJECT_DIR, ttsFile);

  if (!fs.existsSync(ttsPath)) {
    console.error(`Error: TTS file not found: ${ttsPath}`);
    process.exit(1);
  }

  // Read TTS file and parse frontmatter
  const ttsFileContent = fs.readFileSync(ttsPath, 'utf8');
  const ttsFrontmatter = parseFrontmatter(ttsFileContent);

  // Extract body text (strip frontmatter)
  const ttsMatch = ttsFileContent.match(/^---\n([\s\S]*?\n---\n)?([\s\S]*)$/);
  const ttsText = ttsMatch ? ttsMatch[2].trim() : ttsFileContent.trim();

  // Extract Character/POV from frontmatter
  const characterName = ttsFrontmatter.pov;
  log('tts', { ttsFile: ttsFile, pov: characterName });

  // Check for voiceName in frontmatter 
  if (ttsFrontmatter.tts_voice) {
    voiceName = ttsFrontmatter.tts_voice;
    log('tts voice from YAML', { voiceName: ttsFrontmatter.tts_voice });
  }

  // Check for TTS style prompt in frontmatter 
  if (ttsFrontmatter.tts_style) { 
	  TTSstylePrompt = ttsFrontmatter.tts_style;
	  log('tts style from YAML', { TTSstylePrompt: ttsFrontmatter.tts_style }); 
  } else {

	  // Load character file for POV
	  let characterProfile = '';

	  if (characterName) {
	    const conceptIndex = buildConceptIndex();
	    log('tts looking for character in conceptIndex', { conceptIndex: JSON.stringify(conceptIndex) }); // DEBUG
	    const characterFiles = findConceptFiles(characterName, conceptIndex);

	    if (characterFiles.length > 0) {
	      const charFile = characterFiles[0];
		  log('tts matched character', { charFile: charFile });
	      const charPath = path.join(PROJECT_DIR, charFile);
	      const charContent = fs.readFileSync(charPath, 'utf8');
	      characterProfile = charContent.replace(/^---\n([\s\S]*?\n---\n)?/, '').trim();

	      // Look up voice from mapping
	      const normalizedPov = characterName.toLowerCase().replace(/\s+/g, '-');
	      if (VOICE_MAP[normalizedPov]) {
	        voiceName = VOICE_MAP[normalizedPov];
	      }
	    }
	  }

	  // Load project context WITHOUT processing includes
	  const projectMainContext = fs.readFileSync(projectMainPath, 'utf8')
	    .replace(/^---\n([\s\S]*?\n---\n)?/, '').trim();

	  // Generate style prompt
	  log('tts generating TTSstylePrompt' );
	  TTSstylePrompt = await generateTTSStylePrompt(projectMainContext, characterProfile, ttsText);
	  //log('tts', { TTSstylePrompt: TTSstylePrompt.substring(0, 200) } );
  }

  log('tts', { voiceName: voiceName });
  log('tts', { TTSstylePrompt: TTSstylePrompt });
  //log('tts', { ttsText: ttsText }); // can be very long, only log if debugging

  // Ensure voice directory exists
  const voiceDir = path.join(PROJECT_DIR, 'voice');
  if (!fs.existsSync(voiceDir)) {
    fs.mkdirSync(voiceDir, { recursive: true });
  }

  // Call Gemini TTS directly via API
  if (!process.env.GEMINI_API_KEY) {
    console.error('Error: GEMINI_API_KEY not set');
    process.exit(1);
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const model = 'gemini-2.5-flash-preview-tts';

  // Split text into paragraphs to avoid timeout
  // Use a regex that splits by one or more newlines, including those with spaces between.
  // Filters out empty strings from the split.
  log('tts splitting text into paragraphs to avoid timeout on audio generation');  
  const ttsParagraphs = ttsText.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  if (ttsParagraphs.length === 0) {
    console.error('Error: No meaningful text content found for TTS after splitting.');
    process.exit(1);
  }
  log('tts', { paragraphs: ttsParagraphs.length, method: 'paragraph_chunking' });

  let allAudioDataBuffers = [];
  let finalMimeType = null;

  for (const [index, paragraph] of ttsParagraphs.entries()) {
 	  
 	  // Skip paragraphs that look like MD headers (e.g., "# POV 1-1: The Hundred")
 	  if (/^\s*#+\s+/.test(paragraph)) {
 	    log('tts skipping MD header', { header: paragraph.trim() });
 	    continue;
 	  }
 	  
 	  const paragraphContentText = `
### DIRECTOR'S NOTES:
${TTSstylePrompt}

### TEXT TO SPEAK:
${paragraph}
`;

    const config = {
      temperature: 1,
      responseModalities: ['audio'],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName }
        }
      }
    };
    const contents = [{ role: 'user', parts: [{ text: paragraphContentText }] }];

    log('tts calling API for chunk', { index: index, chunkLength: paragraph.length, model: model });
    log('tts', { paragraph: paragraph }); // DEBUG
    try {
      const response = await ai.models.generateContentStream({ model, config, contents });
      for await (const chunk of response) {
        if (!chunk.candidates?.[0]?.content?.parts?.[0]?.inlineData) {
          log('tts API chunk missing inlineData', { chunk_details: JSON.stringify(chunk).substring(0, 500) });
          continue; // Skip to next chunk
        }
        const inlineData = chunk.candidates[0].content.parts[0].inlineData;
        if (!inlineData.data || inlineData.data.length === 0) {
          log('tts API inlineData.data is empty', { chunk_details: JSON.stringify(chunk).substring(0, 500) });
          continue; // Skip to next chunk
        }
        // Decode each chunk's data immediately and store buffer
        const decodedChunkBuffer = Buffer.from(inlineData.data, 'base64');
        
        if (!finalMimeType) {
          finalMimeType = inlineData.mimeType; // Capture mimeType from the first chunk
          log('tts captured finalMimeType', { mimeType: finalMimeType });
        }
        allAudioDataBuffers.push(decodedChunkBuffer); // Pushes decoded Buffer
        log('tts audio chunk received', { size: decodedChunkBuffer.length, current_total_chunks: allAudioDataBuffers.length });
      }
    } catch (apiError) {
      warn(`Gemini API call failed for chunk ${index}: ${apiError.message}`);
      console.error(`Error during TTS generation for a text chunk. Exiting.`);
      process.exit(1); // Exit on any chunk failure
    }
  }

  if (allAudioDataBuffers.length === 0) {
    console.error('Error: No audio data received from Gemini API after all chunks.');
    process.exit(1);
  }

  // Convert to WAV
  log('tts final allAudioData content', {
    total_items: allAudioDataBuffers.length,
    item_lengths: JSON.stringify(allAudioDataBuffers.map(item => item.length)).substring(0, 500)
  });
  log('tts converting all audio to WAV');
  const combinedBuffer = Buffer.concat(allAudioDataBuffers);
  const wavBuffer = convertToWav(combinedBuffer, finalMimeType);

  // Save to voice directory
  const timestamp = Date.now();
  const safeFileName = ttsFile.replace(/[^a-zA-Z0-9]/g, '-');
  const voiceFileName = `tts-${timestamp}-${safeFileName}.wav`;
  const voicePath = path.join(voiceDir, voiceFileName);
  fs.writeFileSync(voicePath, wavBuffer);
  console.log(voicePath);
  log('tts_complete', { file: voicePath });
}

async function main() {
  // --- NEW CALL ---
  logRotation(); // Call at the very beginning to rotate logs
  // --- END NEW CALL ---

  // Setup directory paths - must be before log function
  const baseDir = process.env.SKILL_DIR || process.cwd();
  const skillRoot = path.join(baseDir, '../..');  // Go up to storyshell root
  const projectMainPath = path.join(PROJECT_DIR, 'prompts/main.md');

  // Log start of execution
  log('START storyshell (js-big-skill)', {});

  // Log directory constants for debugging
  log('directory_constants', {
    baseDir: baseDir,
    skillRoot: skillRoot,
    PROJECT_DIR: PROJECT_DIR,
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

  // Read template file from root tpl/ directory
  const templatePath = path.join(skillRoot, 'tpl', `${templateName}.md`);
  if (!fs.existsSync(templatePath)) {
    warn(`Template not found: ${templatePath}`);
    log('error', { type: 'template_not_found', path: templatePath });
    process.exit(1);
  }

  let templateContent = fs.readFileSync(templatePath, 'utf8');
  log('template', { file: templatePath, status: 'ok' });

  // If TTS template, templateContent is not needed
  if (templateName === 'tts') {
    templateContent = '';
    await handleTtsRequest(templateName, primaryPrompt, projectMainPath);
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
    log('output', { bytes: templateContent.length });
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
  const conceptIndex = buildConceptIndex();
  const conceptFiles = findConceptFiles(primaryPrompt, conceptIndex);

  // Load related concepts from matched concept files
  const relatedConceptFiles = [];
  for (const conceptFile of conceptFiles) {
    const related = loadRelatedConcepts(conceptFile, conceptIndex);
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
        path.join(PROJECT_DIR, inc),         // 1. Relative to project directory (PROJECT)
        path.join(skillRoot, inc),          // 2. Relative to storyshell root (FRAMEWORK)
        path.isAbsolute(inc) ? inc : null   // 3. Absolute path
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
  log("includes complete", {});

  if (primaryPrompt) {
    output += primaryPrompt;
    log('primaryPrompt added', {});
  }

  output += "IMPORTANT: if you do save any output to a file, be sure not to clobber any of the files you may have read in as part of the context or templates!";
  log('noclobber hint added', { file: templatePath });

  output += templateBody;
  log('templateBody added', { file: templatePath });

  console.log(output);
  log('output', { bytes: output.length });
  log("END storyshell (js-big-skill)\n======================================================================\n", {});
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
