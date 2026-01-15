const fs = require('fs');
const path = require('path');
const { GoogleGenAI } = require('@google/genai');
const mime = require('mime');

const SCRIPT_ROOT = 'gemini-tts';
const SCRIPT_NAME = `${SCRIPT_ROOT}.js`;

const projectRootDir = process.cwd();
const voiceOutputDir = path.join(projectRootDir, 'voice');
const logDir = path.join(projectRootDir, 'log');

const logFilePath = `${logDir}/${SCRIPT_ROOT}.log`;
const logStream = fs.createWriteStream(logFilePath, { flags: 'a' });

function log(message) {
    const timestamp = new Date().toISOString();
    logStream.write(`[${timestamp}] ${SCRIPT_NAME}: ${message}\n`);
}

function logError(message) {
    const timestamp = new Date().toISOString();
    logStream.write(`[${timestamp}] ${SCRIPT_ROOT} ERROR: ${message}\n`);
    throw new Error(message);
}

function saveBinaryFile(fileName, buffer) {
    const fullPath = path.join(voiceOutputDir, fileName);
    fs.writeFileSync(fullPath, buffer);
    log(`Saved audio to ${fullPath}`);
    return fullPath;
}

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

function convertToWav(rawData, mimeType) {
    const options = parseMimeType(mimeType);
    const wavHeader = createWavHeader(rawData.length, options);
    const buffer = Buffer.from(rawData, 'base64');
    return Buffer.concat([wavHeader, buffer]);
}

function tool(input) {
    return input;
}
tool.schema = require('zod');

async function generateGeminiSpeech(text, voiceName, stylePrompt) {
    if (!process.env.GEMINI_API_KEY) {
        logError('GEMINI_API_KEY environment variable is not set.');
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

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
    const contentText = stylePrompt ? `${stylePrompt}\n\n${text}` : text;
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
        logError('No audio data received from Gemini API.');
    }

    const combinedBase64 = audioChunks.join('');
    log(`mimeType: ${mimeType}, base64 length: ${combinedBase64.length}`);

    const extension = 'wav';
    const options = parseMimeType(mimeType);
    log(`parseMimeType options: ${JSON.stringify(options)}`);
    const buffer = convertToWav(combinedBase64, mimeType);
    log(`wav buffer length: ${buffer.length}`);

    const timestamp = Date.now();
    const safeVoiceName = voiceName.replace(/[^a-zA-Z0-9]/g, '');
    const fileName = `${SCRIPT_ROOT}-${timestamp}-${safeVoiceName}.${extension}`;
    return saveBinaryFile(fileName, buffer);
}

module.exports = tool({
    description: 'Generates speech from text using Google Gemini TTS.',
    args: {
        text: tool.schema.string().describe('The text to convert to speech.'),
        voiceName: tool.schema.string().optional().describe('Prebuilt voice name (default: Leda).'),
        stylePrompt: tool.schema.string().optional().describe('Prompt to guide TTS style/delivery.')
    },
    async execute(args) {
        log(`execute() starting with text length: ${args.text?.length}`);

        let text = args.text;
        if (!text || text.trim() === '') {
            throw new Error('Text argument is empty or missing for gemini-tts tool.');
        }

        const voiceName = args.voiceName || 'Leda';
        const stylePrompt = args.stylePrompt || 'null';
        log(`Using voice: ${voiceName}`);
        if (stylePrompt) log(`Using stylePrompt: ${stylePrompt}`);

        try {
            const audioFilePath = await generateGeminiSpeech(text, voiceName, stylePrompt);
            log(`Audio file generated: ${audioFilePath}`);
            log(``);
            return audioFilePath;
        } catch (e) {
            logError(`Failed to generate speech: ${e.message}`);
        }
    }
});
