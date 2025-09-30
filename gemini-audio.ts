import {
  GoogleGenAI,
  LiveServerMessage,
  MediaResolution,
  Modality,
  Session,
} from '@google/genai';
import { writeFile } from 'fs/promises';

const responseQueue: LiveServerMessage[] = [];
let session: Session | undefined = undefined;

async function handleTurn(): Promise&lt;LiveServerMessage[]&gt; {
  const turn: LiveServerMessage[] = [];
  let done = false;
  
  while (!done) {
    const message = await waitMessage();
    turn.push(message);
    
    if (message.serverContent &amp;&amp; message.serverContent.turnComplete) {
      done = true;
    }
  }
  
  return turn;
}

async function waitMessage(): Promise&lt;LiveServerMessage&gt; {
  let done = false;
  let message: LiveServerMessage | undefined = undefined;
  
  while (!done) {
    message = responseQueue.shift();
    
    if (message) {
      handleModelTurn(message);
      done = true;
    } else {
      await new Promise((resolve) =&gt; setTimeout(resolve, 100));
    }
  }
  
  return message!;
}

const audioParts: string[] = [];

async function handleModelTurn(message: LiveServerMessage) {
  if (message.serverContent?.modelTurn?.parts) {
    const part = message.serverContent.modelTurn.parts[0];

    if (part?.fileData) {
      console.log(`File received: ${part.fileData.fileUri}`);
    }

    if (part?.inlineData) {
      const fileName = 'audio.wav';
      const inlineData = part.inlineData;

      audioParts.push(inlineData?.data ?? '');

      const buffer = convertToWav(audioParts, inlineData.mimeType ?? '');
      await saveBinaryFile(fileName, buffer);
    }

    if (part?.text) {
      console.log(`Text response: ${part.text}`);
    }
  }

  if (message.serverContent?.turnComplete) {
    console.log('Turn completed');
  }
}

async function saveBinaryFile(fileName: string, content: Buffer) {
  try {
    await writeFile(fileName, content);
    console.log(`Audio stream saved to ${fileName}`);
  } catch (err) {
    console.error(`Error writing file ${fileName}:`, err);
  }
}

interface WavConversionOptions {
  numChannels: number;
  sampleRate: number;
  bitsPerSample: number;
}

function convertToWav(rawData: string[], mimeType: string): Buffer {
  const options = parseMimeType(mimeType);
  const buffers = rawData.map(data =&gt; Buffer.from(data, 'base64'));
  const dataLength = buffers.reduce((sum, buf) =&gt; sum + buf.length, 0);
  
  const wavHeader = createWavHeader(dataLength, options);
  const audioBuffer = Buffer.concat(buffers);

  return Buffer.concat([wavHeader, audioBuffer]);
}

function parseMimeType(mimeType: string): WavConversionOptions {
  const [fileType, ...params] = mimeType.split(';').map(s =&gt; s.trim());
  const [_, format] = fileType.split('/');

  const options: Partial&lt;WavConversionOptions&gt; = {
    numChannels: 1,
    bitsPerSample: 16,
    sampleRate: 24000, // Default sample rate
  };

  if (format &amp;&amp; format.startsWith('L')) {
    const bits = parseInt(format.slice(1), 10);
    if (!isNaN(bits)) {
      options.bitsPerSample = bits;
    }
  }

  for (const param of params) {
    const [key, value] = param.split('=').map(s =&gt; s.trim());
    if (key === 'rate') {
      options.sampleRate = parseInt(value, 10);
    }
  }

  return options as WavConversionOptions;
}

function createWavHeader(dataLength: number, options: WavConversionOptions): Buffer {
  const { numChannels, sampleRate, bitsPerSample } = options;

  // WAV file format specification
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const buffer = Buffer.alloc(44);

  buffer.write('RIFF', 0);                      // ChunkID
  buffer.writeUInt32LE(36 + dataLength, 4);     // ChunkSize
  buffer.write('WAVE', 8);                      // Format
  buffer.write('fmt ', 12);                     // Subchunk1ID
  buffer.writeUInt32LE(16, 16);                 // Subchunk1Size (PCM)
  buffer.writeUInt16LE(1, 20);                  // AudioFormat (1 = PCM)
  buffer.writeUInt16LE(numChannels, 22);        // NumChannels
  buffer.writeUInt32LE(sampleRate, 24);         // SampleRate
  buffer.writeUInt32LE(byteRate, 28);           // ByteRate
  buffer.writeUInt16LE(blockAlign, 32);         // BlockAlign
  buffer.writeUInt16LE(bitsPerSample, 34);      // BitsPerSample
  buffer.write('data', 36);                     // Subchunk2ID
  buffer.writeUInt32LE(dataLength, 40);         // Subchunk2Size

  return buffer;
}

async function main() {
  // Validate API key
  if (!process.env.GEMINI_API_KEY) {
    console.error('Error: GEMINI_API_KEY environment variable is not set');
    console.error('Usage: GEMINI_API_KEY=your-key npx tsx gemini-audio.ts');
    process.exit(1);
  }

  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
  });

  const model = 'models/gemini-2.5-flash-native-audio-preview-09-2025';

  const config = {
    responseModalities: [Modality.AUDIO],
    mediaResolution: MediaResolution.MEDIA_RESOLUTION_MEDIUM,
    speechConfig: {
      voiceConfig: {
        prebuiltVoiceConfig: {
          voiceName: 'Zephyr',
        },
      },
    },
    contextWindowCompression: {
      triggerTokens: '25600',
      slidingWindow: { targetTokens: '12800' },
    },
  };

  console.log('Connecting to Gemini Live API...');

  try {
    session = await ai.live.connect({
      model,
      callbacks: {
        onopen: function () {
          console.log('✓ Connection established');
        },
        onmessage: function (message: LiveServerMessage) {
          responseQueue.push(message);
        },
        onerror: function (e: ErrorEvent) {
          console.error('Error:', e.message);
        },
        onclose: function (e: CloseEvent) {
          console.log('Connection closed:', e.reason);
        },
      },
      config,
    });

    // Send your prompt here - customize this!
    const prompt = 'Tell me an interesting fact about space exploration in a friendly tone.';
    
    console.log(`Sending prompt: "${prompt}"`);
    
    session.sendClientContent({
      turns: [prompt],
    });

    await handleTurn();

    session.close();
    console.log('✓ Session completed successfully');
  } catch (error) {
    console.error('Failed to connect or process:', error);
    process.exit(1);
  }
}

main();