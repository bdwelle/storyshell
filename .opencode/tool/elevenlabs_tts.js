const fs = require('fs'); // Added fs module
const { exec } = require('child_process');
const path = require('path');
const { z } = require('zod');

// --- Logging Setup ---
const logFilePath = '/Users/bdwelle/lib/storyshell/elevenlabs-tts-wrapper.log';
const logStream = fs.createWriteStream(logFilePath, { flags: 'a' }); // Append mode

const originalConsoleLog = console.log;
const originalConsoleError = console.error;

console.log = (...args) => {
    logStream.write(`[${new Date().toISOString()}] LOG: ${args.join(' ')}\n`);
    // originalConsoleLog.apply(console, args); // Also print to original console
};

console.error = (...args) => {
    logStream.write(`[${new Date().toISOString()}] ERROR: ${args.join(' ')}\n`);
    // originalConsoleError.apply(console, args); // Also print to original console
};
// --- End Logging Setup ---

// Inlined tool function logic
function tool(input) {
    return input;
}
tool.schema = z; // Attach zod as schema property

module.exports = tool({
  description: "Converts text to speech using ElevenLabs, saves to a temporary MP3 file, and returns the file path.",
  args: {
    text: tool.schema.string().describe("The text to convert to speech."),
    voiceId: tool.schema.string().describe("The voice_id of the voice to use.")
  },
  async execute(args) {
    console.log('Wrapper execute function started.'); 

    const projectRootDir = process.env.STORYSHELL_PROJECT_ROOT_DIR || process.cwd();
    const outputDir = path.join(projectRootDir, 'voice');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    const ttsScriptPath = path.resolve(__dirname, '../../elevenlabs-tts-core.js'); // the core script

    console.log(`Resolved core TTS script path: ${ttsScriptPath}`); // Debug log

    if (!fs.existsSync(ttsScriptPath)) {
        console.error(`ERROR: Core TTS script not found at ${ttsScriptPath}`);
        throw new Error(`Core TTS script missing: ${ttsScriptPath}`);
    }

    let command = `node ${ttsScriptPath} --text "${args.text}"`;
    if (args.voiceId) {
      console.log(`voiceID: ${args.voiceID}`); 
      command += ` --voiceId "${args.voiceId}"`;
    }

    console.log(`Executing command: ${command}`); 

    return new Promise((resolve, reject) => {
      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.error(`exec error: ${error}`);
          console.error(`stderr: ${stderr}`);
          return reject(new Error(`ElevenLabs TTS tool failed: ${stderr}`));
        }
        if (stderr) {
          console.warn(`ElevenLabs TTS tool warning: ${stderr}`);
          console.log(`Stderr: ${stderr}`); 
        }
        console.log(`Command stdout: ${stdout}`); 
        resolve(stdout.trim());
      });
    });
  }
});