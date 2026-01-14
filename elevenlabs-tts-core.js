const fs = require('fs');
const path = require('path');
const https = require('https');

// --- Logging Setup for Core Script ---
const coreLogFilePath = '/Users/bdwelle/lib/storyshell/elevenlabs-tts.log';
const coreLogStream = fs.createWriteStream(coreLogFilePath, { flags: 'a' });
const CORE_SCRIPT_NAME = 'elevenlabs-tts-core.js';

const originalCoreConsoleLog = console.log;
const originalCoreConsoleError = console.error;

console.log = (...args) => {
    coreLogStream.write(`[${new Date().toISOString()}] ${CORE_SCRIPT_NAME} LOG: ${args.join(' ')}\n`);
    // originalCoreConsoleLog.apply(console, args); // Option to also print to original console
};

console.error = (...args) => {
    coreLogStream.write(`[${new Date().toISOString()}] ${CORE_SCRIPT_NAME} ERROR: ${args.join(' ')}\n`);
    // originalCoreConsoleError.apply(console, args); // Option to also print to original console
};
// --- End Logging Setup ---


// --- Configuration ---
const API_HOST = 'api.elevenlabs.io';
const API_PATH_PREFIX = '/v1/text-to-speech';
const OUTPUT_FORMAT = 'mp3_44100_128'; // Default output format

// --- Helper Functions ---
function logError(message) {
    console.error(`ERROR: ${message}`);
    process.exit(1);
}

function logInfo(message) {
    console.log(`INFO: ${message}`); // Now logs to core log file
}

function generateSpeech(text, voiceId, apiKey, outputDir) {
    console.log('generateSpeech() - Entry');
    if (!text) {
        logError('Text to convert to speech is required.');
    }
    if (!voiceId) {
        logError('Voice ID is required.');
    }
    if (!apiKey) {
        logError('ElevenLabs API key is not set. Please configure it in opencode.json.');
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

    console.log('generateSpeech() - Making HTTPS request');
    return new Promise((resolve, reject) => {
        const tempFileName = `elevenlabs-tts-${Date.now()}.mp3`;
        const tempFilePath = path.join(outputDir, tempFileName);
        const fileStream = fs.createWriteStream(tempFilePath);

        const req = https.request(options, (res) => {
            if (res.statusCode !== 200) {
                let errorData = '';
                res.on('data', (chunk) => errorData += chunk);
                res.on('end', () => {
                    logError(`ElevenLabs API returned status code ${res.statusCode}: ${errorData}`);
                    reject(new Error(`API Error: ${errorData}`));
                });

                return;
            }

            res.pipe(fileStream);

            fileStream.on('finish', () => {
                logInfo(`Speech saved to ${tempFilePath}`);
                resolve(tempFilePath);
            });

            fileStream.on('error', (err) => {
                logError(`Error writing audio file: ${err.message}`);
                reject(err);
            });
        });

        req.on('error', (e) => {
            logError(`HTTP request error: ${e.message}`);
            reject(e);
        });

        req.write(postData);
        req.end();
    });
}

// --- Command Line Argument Parsing ---
async function run() {
    console.log('run() - Entry');
    const args = process.argv.slice(2);
    let text = '';
    let voiceId = ''; 

    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
        logError('ElevenLabs API key is not set. Please set the ELEVENLABS_API_KEY environment variable.');
        return;
    }

    // Parse arguments: expect --text "..." [--voiceId "..."]
        for (let i = 0; i < args.length; i++) {
            if (args[i] === '--text' && args[i + 1]) {
                text = args[i + 1];
                i++;
            } else if (args[i] === '--voiceId' && args[i + 1]) {
                voiceId = args[i + 1];
                i++;
            } else if (args[i].startsWith('--')) {
                logError(`Unknown argument: ${args[i]}`);
            }
        } // Closing brace for the for loop

        console.log('run() - Parsed text:', text);
        console.log('run() - Parsed voiceId:', voiceId);
        console.log('run() - API Key status:', apiKey ? 'Set' : 'Not Set');
        
        if (!text) {
            logError('Missing required argument: --text');
        }

        const projectRootDir = process.env.STORYSHELL_PROJECT_ROOT_DIR || process.cwd();
        const outputDir = path.join(projectRootDir, 'voice'); // Changed to 'voice' directory
        console.log('run() - Output directory:', outputDir);

        // Ensure output directory exists
        if (!fs.existsSync(outputDir)) {
            console.log('run() - Creating output directory:', outputDir);
            fs.mkdirSync(outputDir, { recursive: true });
        }

        try {
            console.log('run() - Calling generateSpeech...');
            const audioFilePath = await generateSpeech(text, voiceId, apiKey, outputDir);
            console.log(`Audio file generated: ${audioFilePath}`); 
			// Output the path to stdout for opencode to capture
			
        } catch (e) {
            logError(`Failed to generate speech: ${e.message}`);
        }
    }

if (require.main === module) {
    run();
}