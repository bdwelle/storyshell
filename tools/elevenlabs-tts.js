const fs = require('fs');
const path = require('path');
const https = require('https'); // Now directly required here
const { z } = require('zod');

const SCRIPT_ROOT = 'elevenlabs-tts'; // should get this from env
const SCRIPT_NAME = `${SCRIPT_ROOT}.js`;

const projectRootDir = process.cwd();
const voiceOutputDir = path.join(projectRootDir, 'voice');
const logDir = path.join(projectRootDir, 'log');

// --- Logging Setup ---
const logFilePath = `${logDir}/${SCRIPT_ROOT}.log`;
const logStream = fs.createWriteStream(logFilePath, { flags: 'a' });

const originalConsoleLog = console.log;
const originalConsoleError = console.error;

console.log = (...args) => {
    logStream.write(`[${new Date().toISOString()}] ${SCRIPT_NAME} LOG: ${args.join(' ')}\n`);
    // originalConsoleLog.apply(console, args); // Option to also print to original console
};

console.error = (...args) => {
    logStream.write(`[${new Date().toISOString()}] ${SCRIPT_NAME} ERROR: ${args.join(' ')}\n`);
    // originalConsoleError.apply(console, args); // Option to also print to original console
};
// --- End Logging Setup ---

// --- Configuration (from core script) ---
const API_HOST = 'api.elevenlabs.io';
const API_PATH_PREFIX = '/v1/text-to-speech';
const OUTPUT_FORMAT = 'mp3_44100_128'; // Default output format

// --- Helper Functions (from core script, adapted) ---
function logError(message) {
    console.error(`ERROR: ${message}`);
    // No process.exit(1) here, as this is now part of the tool's execution flow.
    // The tool should throw an error instead of exiting the entire process.
    throw new Error(message); 
}

function logInfo(message) {
    console.log(`INFO: ${message}`);
}

function parseFileContent(content) {
    console.log('parseFileContent() - Parsing content...');
    let fileId = null;
    let cleanedContent = content;

    // Check for YAML frontmatter
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (frontmatterMatch) {
        console.log('parseFileContent() - Found frontmatter.');
        const frontmatter = frontmatterMatch[1];
        const idMatch = frontmatter.match(/^id:\s*(.*)$/m);
        if (idMatch) {
            fileId = idMatch[1].trim();
            console.log(`parseFileContent() - Extracted fileId: ${fileId}`);
        }
        // Remove frontmatter from content
        cleanedContent = content.replace(/^---\n[\s\S]*?\n---/, '').trim();
    }

    // Remove first Markdown title (# Title)
    const titleMatch = cleanedContent.match(/^#\s+.+\n/);
    if (titleMatch) {
        console.log('parseFileContent() - Removing MD title.');
        cleanedContent = cleanedContent.replace(/^#\s+.+\n/, '').trim();
    }

    return { fileId, cleanedContent };
}

async function getVoiceName(voiceId, apiKey) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: API_HOST,
            path: `/v1/voices/${voiceId}`,
            method: 'GET',
            headers: {
                'xi-api-key': apiKey
            }
        };

        console.log(`getVoiceName() Trying to get name for voiceId: ${voiceId}`);

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    try {
                        const voice = JSON.parse(data);
                        const voiceName = voice.name || 'Unknown';
                        console.log(`getVoiceName() - Found voice name: ${voiceName}`);
                        resolve(voiceName);
                    } catch (e) {
                        console.error('getVoiceName() - Error parsing voice response:', e.message);
                        resolve('Unknown');
                    }
                } else {
                    console.error(`getVoiceName() - API returned status code ${res.statusCode}: ${data}`);
                    resolve('Unknown');
                }
            });
        });

        req.on('error', (e) => {
            console.error(`getVoiceName() - Request error: ${e.message}`);
            resolve('Unknown');
        });

        req.end();
    });
}

// Inlined tool function logic (from original wrapper)
function tool(input) {
    return input;
}
tool.schema = z; // Attach zod as schema property

// --- generateSpeech function ---
async function generateSpeech(text, voiceId, apiKey, fileId = null) { 
    console.log('generateSpeech() starting...');
    if (!text) {
        logError('Text to convert to speech is required.'); // Will now throw
    }
    if (!voiceId) {
        logError('Voice ID is required.'); // Will now throw
    }
    if (!apiKey) {
        logError('ElevenLabs API key is not set. Please set the ELEVENLABS_API_KEY environment variable.'); 
    }

    const apiUrl = `${API_PATH_PREFIX}/${voiceId}?output_format=${OUTPUT_FORMAT}`;
    const postData = JSON.stringify({
        text: text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
	        stability: 0.4,
	        style: 0.4,
	        speed: 1.1,
        }
    });

    const options = {
        hostname: API_HOST,
        path: apiUrl,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'xi-api-key': apiKey,
            'Accept': 'audio/mpeg'
        }
    };

    console.log(`generateSpeech() Making request to ${apiUrl}`);

    // Get voice name for filename
    console.log('Fetching voice name...');
    const voiceName = await getVoiceName(voiceId, apiKey);
    const safeVoiceName = voiceName.split(' ')[0].replace(/[^a-zA-Z0-9]/g, ''); // Use first word and remove special chars for filename
    console.log(`Using voice name: ${safeVoiceName}`);
    
    return new Promise((resolve, reject) => {
        // Ensure voiceOutputDir exists before writing
        if (!fs.existsSync(voiceOutputDir)) {
            console.log('generateSpeech() - Creating output directory:', voiceOutputDir);
            fs.mkdirSync(voiceOutputDir, { recursive: true });
        }

        const uniqueId = fileId || Date.now();
        const voiceFileName = `${SCRIPT_ROOT}-${uniqueId}-${safeVoiceName}.mp3`;
        const voiceFilePath = path.join(voiceOutputDir, voiceFileName);
        const fileStream = fs.createWriteStream(voiceFilePath);

        const req = https.request(options, (res) => {
            if (res.statusCode !== 200) {
                let errorData = '';
                res.on('data', (chunk) => errorData += chunk);
                res.on('end', () => {
                    // Changed from logError (which calls process.exit) to console.error and reject
                    console.error(`ElevenLabs API returned status code ${res.statusCode}: ${errorData}`);
                    reject(new Error(`API Error: ${errorData}`));
                });

                return;
            }

            res.pipe(fileStream);

            fileStream.on('finish', () => {
                logInfo(`Speech saved to ${voiceFilePath}`);
                resolve(voiceFilePath);
            });

            fileStream.on('error', (err) => {
                console.error(`Error writing audio file: ${err.message}`); // Changed from logError
                reject(err);
            });
        });

        req.on('error', (e) => {
            console.error(`HTTP request error: ${e.message}`); // Changed from logError
            reject(e);
        });

        req.write(postData);
        req.end();
    });
}


module.exports = tool({
  description: "Generates speech from text using ElevenLabs.",
  args: {
    text: tool.schema.string().describe("The text to convert to speech."),
    voiceId: tool.schema.string().optional().describe("The ElevenLabs Voice ID to use.") 
  },
  async execute(args) {
    console.log('execute() starting...'); 

    // --- arguments ---
    console.log('args.text:', args.text);

    // If args.text looks like a file path, load the file content
	// Note that opencode or the tts-agent often seems to just load the file content for us, 
	// even though I've asked it not to in tts-agent.md
	// If that's the case, we won't have access to the file name, or the YAML (that gets stipped out)
    let fileId = null;
    if (args.text && args.text.includes('/')) {
        const potentialPath = path.join(projectRootDir, args.text);
        console.log('Checking for file at:', potentialPath);
        if (fs.existsSync(potentialPath)) {
            console.log('Loading text from file:', potentialPath);
            const fileContent = fs.readFileSync(potentialPath, 'utf8');
            console.log('Loaded text length:', fileContent.length);

            // Parse the content
            const { fileId: extractedId, cleanedContent } = parseFileContent(fileContent);
            if (extractedId) {
                fileId = extractedId;
            }
            args.text = cleanedContent;
        }
    }

    if (!args.text || args.text.trim() === '') {
        console.error('ERROR: Text argument is empty or missing.');
        throw new Error('Text argument is empty or missing for elevenlabs_tts tool.');
    }
    console.log('request text:', args.text);
    if (fileId) {
        console.log('fileId for filename:', fileId);
    }

    // Set default voiceId if not provided
    console.log('args.voiceId:', args.voiceId);
    const VALID_VOICE_IDS = ["Xb7hH8MSUJpSbSDYk0k2", "FGY2WhTYpPnrIDTdsKH5", "EXAVITQu4vr4xnSDxMaL", "XrExE9yKIg1WjnnlVkGX", "cgSgspJ2msm6clMCkdW9", "pFZP5JQG7iQjIQuC4Bku", "uIZsnBL0YK1S5j69bAih"];
    const DEFAULT_VOICE_ID = "uIZsnBL0YK1S5j69bAih"; // Default to 'Samantha'

    if (!args.voiceId || !VALID_VOICE_IDS.includes(args.voiceId)) {
        console.log(`Voice ID '${args.voiceId}' is invalid or not provided, defaulting to:`, DEFAULT_VOICE_ID);
        args.voiceId = DEFAULT_VOICE_ID;
    }
    console.log('Voice ID:', args.voiceId);

    // call generateSpeech()
    try {
        console.log('Calling generateSpeech()');
        const apiKey = process.env.ELEVENLABS_API_KEY; // Get API key from environment
        const audioFilePath = await generateSpeech(args.text, args.voiceId, apiKey, fileId); 
        console.log(`Audio file generated: ${audioFilePath}`);
        console.log('execute() complete.'); 
        console.log(''); 
        return audioFilePath; // Return the path
    } catch (e) {
        console.error(`Failed to generate speech: ${e.message}`);
        throw new Error(`ElevenLabs TTS tool failed: ${e.message}`);
    }
  }
});
