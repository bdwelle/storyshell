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

// Inlined tool function logic (from original wrapper)
function tool(input) {
    return input;
}
tool.schema = z; // Attach zod as schema property

// --- generateSpeech function ---
async function generateSpeech(text, voiceId, apiKey) { 
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
        model_id: 'eleven_multilingual_v2' // Default model, can be made configurable
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
    
    return new Promise((resolve, reject) => {
        // Ensure voiceOutputDir exists before writing
        if (!fs.existsSync(voiceOutputDir)) {
            console.log('generateSpeech() - Creating output directory:', voiceOutputDir);
            fs.mkdirSync(voiceOutputDir, { recursive: true });
        }

        const voiceFileName = `${SCRIPT_ROOT}-${Date.now()}.mp3`;
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
    if (args.text && args.text.includes('/')) {
        const potentialPath = path.join(projectRootDir, args.text);
        console.log('Checking for file at:', potentialPath);
        if (fs.existsSync(potentialPath)) {
            console.log('Loading text from file:', potentialPath);
            args.text = fs.readFileSync(potentialPath, 'utf8');
            console.log('Loaded text length:', args.text.length);
        }
    }

    if (!args.text || args.text.trim() === '') {
        console.error('ERROR: Text argument is empty or missing.');
        throw new Error('Text argument is empty or missing for elevenlabs_tts tool.');
    }
    console.log('request text:', args.text);

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
        const audioFilePath = await generateSpeech(args.text, args.voiceId, apiKey); 
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
