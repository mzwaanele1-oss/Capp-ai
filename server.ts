import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS and PWA friendly headers for all requests (required for PWABuilder)
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, HEAD');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Access-Control-Expose-Headers', '*');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  next();
});

// Middleware for parsing JSON with generous limit for image/document uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Initialize Google GenAI client securely on server side
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// System instruction for CAPP AI
const CAPP_AI_BASE_SYSTEM_INSTRUCTION = `You are CAPP AI, a highly capable general-purpose AI assistant. 
Your tagline is: "Think smarter. Create more."
Your personality is:
- Intelligent, helpful, calm, confident, friendly, professional, natural, and conversational.
- Honest about uncertainty; never fabricate facts when uncertain or pretend to have information you do not have.
- Provide concise answers for simple questions and detailed, structured answers when the user needs them.
- Ask useful clarifying questions when genuinely necessary.
- Maintain context throughout the conversation.
- You have your own distinctive identity as CAPP AI. Do not claim to be ChatGPT or other platforms.
- Format responses beautifully using Markdown: use headings, clear bullet points, numbered lists, tables, bold text, and syntax-highlighted code blocks with specified language where applicable.`;

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    name: 'CAPP AI',
    version: '1.0.0',
    model: 'gemini-3.8-flash',
    hasKey: Boolean(apiKey),
  });
});

// Main chat generation endpoint supporting SSE streaming
app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    const {
      messages = [],
      memories = [],
      webSearch = false,
      temperature = 0.7,
      stream = true,
      customInstruction = '',
    } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ error: 'Messages array is required.' });
      return;
    }

    if (!apiKey) {
      res.status(500).json({
        error: 'Gemini API key is not configured in environment variables. Please check the Secrets panel.',
      });
      return;
    }

    // Build system instruction including long-term memories if any exist
    let systemInstruction = CAPP_AI_BASE_SYSTEM_INSTRUCTION;
    if (customInstruction) {
      systemInstruction += `\n\nSpecific Task Instruction: ${customInstruction}`;
    }

    if (memories && memories.length > 0) {
      systemInstruction += `\n\n[CAPP AI Persistent Memory Context]:\nThe user has saved the following preferences/facts:\n${memories.map((m: string) => `- ${m}`).join('\n')}`;
    }

    let isClientConnected = true;
    res.on('close', () => {
      if (!res.writableEnded) {
        isClientConnected = false;
      }
    });

    // Filter and format contents for GenAI SDK
    // Each item: { role: 'user' | 'model', parts: [{ text?: string, inlineData?: { mimeType: string, data: string } }] }
    const validMessages = messages.filter(
      (m: any) => m && (m.text?.trim() || (m.attachments && m.attachments.length > 0))
    );

    if (validMessages.length === 0) {
      res.status(400).json({ error: 'No message content provided.' });
      return;
    }

    const contents = validMessages.map((m: any) => {
      const parts: any[] = [];

      // File/Image attachments if provided
      if (m.attachments && Array.isArray(m.attachments)) {
        for (const att of m.attachments) {
          if (att.data && att.mimeType) {
            // strip data:...;base64, prefix if present
            const cleanData = att.data.includes(',') ? att.data.split(',')[1] : att.data;
            parts.push({
              inlineData: {
                mimeType: att.mimeType,
                data: cleanData,
              },
            });
          }
        }
      }

      if (m.text && m.text.trim()) {
        parts.push({ text: m.text });
      }

      if (parts.length === 0) {
        parts.push({ text: ' ' });
      }

      return {
        role: m.role === 'assistant' ? 'model' : 'user',
        parts,
      };
    });

    const config: any = {
      systemInstruction,
      temperature: typeof temperature === 'number' ? temperature : 0.7,
    };

    // Add Google Search grounding if requested
    if (webSearch) {
      config.tools = [{ googleSearch: {} }];
    }

    const CANDIDATE_MODELS = ['gemini-3.1-flash-lite', 'gemini-3.8-flash'];

    if (stream) {
      // Set SSE headers
      res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders?.();

      let accumulatedSources: Array<{ title: string; url: string }> = [];
      let streamedAnyChunk = false;
      let streamSuccess = false;

      const activeConfig = { ...config };
      if (!webSearch) {
        delete activeConfig.tools;
      }

      for (const modelName of CANDIDATE_MODELS) {
        if (streamSuccess || res.writableEnded) break;

        try {
          const responseStream = await ai.models.generateContentStream({
            model: modelName,
            contents,
            config: activeConfig,
          });

          for await (const chunk of responseStream) {
            if (res.writableEnded) break;

            const text = chunk.text || '';
            if (text) {
              streamedAnyChunk = true;
            }

            // Extract grounding citations if available
            const groundingChunks = (chunk.candidates?.[0] as any)?.groundingMetadata?.groundingChunks;
            if (groundingChunks && Array.isArray(groundingChunks)) {
              for (const gc of groundingChunks) {
                if (gc.web?.uri) {
                  const url = gc.web.uri;
                  const title = gc.web.title || url;
                  if (!accumulatedSources.some((s) => s.url === url)) {
                    accumulatedSources.push({ title, url });
                  }
                }
              }
            }

            const payload = JSON.stringify({
              text,
              sources: accumulatedSources.length > 0 ? accumulatedSources : undefined,
            });

            res.write(`data: ${payload}\n\n`);
          }

          streamSuccess = true;
          break;
        } catch (streamErr: any) {
          const msg = streamErr?.message || '';
          // If the stream was delivering tokens and ended with SDK trailing notice, it was actually complete
          if (msg.includes('Incomplete JSON segment at the end') && streamedAnyChunk) {
            streamSuccess = true;
            break;
          }

          console.warn(`Model ${modelName} stream encountered error:`, msg);

          // If web search was requested and failed, try without search tools first
          if (activeConfig.tools) {
            delete activeConfig.tools;
          }
        }
      }

      // If streaming didn't succeed with any model, fall back to non-streaming generateContent
      if (!streamSuccess && !streamedAnyChunk && !res.writableEnded) {
        for (const modelName of CANDIDATE_MODELS) {
          try {
            const fallbackRes = await ai.models.generateContent({
              model: modelName,
              contents,
              config: { ...config, tools: undefined },
            });
            const text = fallbackRes.text || '';
            res.write(`data: ${JSON.stringify({ text })}\n\n`);
            streamSuccess = true;
            break;
          } catch (e) {
            console.warn(`Fallback generateContent failed with ${modelName}`);
          }
        }
      }

      if (!res.writableEnded) {
        res.write('data: [DONE]\n\n');
        res.end();
      }
    } else {
      let response: any;
      let lastError: any = null;
      const activeConfig = { ...config };
      if (!webSearch) {
        delete activeConfig.tools;
      }

      for (const modelName of CANDIDATE_MODELS) {
        try {
          response = await ai.models.generateContent({
            model: modelName,
            contents,
            config: activeConfig,
          });
          break;
        } catch (genErr: any) {
          lastError = genErr;
          console.warn(`generateContent failed with ${modelName}:`, genErr?.message);
        }
      }

      if (!response && lastError) {
        throw lastError;
      }

      const text = response.text || '';
      const groundingChunks = (response.candidates?.[0] as any)?.groundingMetadata?.groundingChunks;
      const sources: Array<{ title: string; url: string }> = [];

      if (groundingChunks && Array.isArray(groundingChunks)) {
        for (const gc of groundingChunks) {
          if (gc.web?.uri) {
            sources.push({
              title: gc.web.title || gc.web.uri,
              url: gc.web.uri,
            });
          }
        }
      }

      res.json({ text, sources });
    }
  } catch (err: any) {
    if (err?.message?.includes('Incomplete JSON segment at the end')) {
      console.warn('Incomplete JSON segment caught at endpoint boundary, closing stream safely.');
      if (!res.writableEnded) {
        try {
          res.write('data: [DONE]\n\n');
          res.end();
        } catch (_) {}
      }
      return;
    }

    console.error('Error in /api/chat:', err?.message, err?.stack || err);
    let friendlyMessage = err?.message || 'Something went wrong while generating a response. Please try again.';

    if (err?.message) {
      if (err.message.includes('RESOURCE_EXHAUSTED') || err.message.includes('429')) {
        friendlyMessage = 'CAPP AI is experiencing high demand or temporary rate limits. Please try again in a few moments.';
      } else if (err.message.includes('API key')) {
        friendlyMessage = 'API configuration error. Please verify your environment settings.';
      }
    }

    if (!res.headersSent) {
      res.status(500).json({ error: friendlyMessage });
    } else {
      res.write(`data: ${JSON.stringify({ error: friendlyMessage })}\n\n`);
      res.end();
    }
  }
});

// Image Studio endpoint
app.post('/api/image-studio', async (req: Request, res: Response) => {
  try {
    const { image, task, customPrompt } = req.body;

    if (!image || !image.data || !image.mimeType) {
      res.status(400).json({ error: 'Image data and mimeType are required.' });
      return;
    }

    if (!apiKey) {
      res.status(500).json({ error: 'Gemini API key is not configured.' });
      return;
    }

    const cleanData = image.data.includes(',') ? image.data.split(',')[1] : image.data;
    const imagePart = {
      inlineData: {
        mimeType: image.mimeType,
        data: cleanData,
      },
    };

    let promptText = '';
    switch (task) {
      case 'describe':
        promptText = 'Analyze this image in detail. Describe its subjects, composition, color palette, lighting, mood, artistic style, and notable details in a structured format.';
        break;
      case 'enhance':
        promptText = 'Act as an expert photographer and art director. Critique this image and provide specific, actionable enhancements (lighting adjustments, color grading, framing, composition, and visual impact).';
        break;
      case 'pencil':
        promptText = 'Transform this image concept into a detailed graphite pencil drawing description. Provide an artistic blueprint: hatching styles, shading gradients, paper texture recommendation, and contrast mapping.';
        break;
      case 'anime':
        promptText = 'Reimagine this image as a high-end Studio Ghibli or Makoto Shinkai anime aesthetic concept. Describe character redesign, vibrant atmospheric lighting, painterly background details, and color grading.';
        break;
      case 'bw':
        promptText = 'Convert this visual concept into an Ansel Adams style fine-art monochrome photography breakdown. Specify tonal zones (Zone 0 to X), deep blacks, high-key highlights, grain, and contrast balance.';
        break;
      case 'poster':
        promptText = 'Design a high-impact minimalist graphic design poster based on this image. Provide the layout blueprint, typography hierarchy, primary/secondary colors, geometric accents, and tagline ideas.';
        break;
      case 'tshirt':
        promptText = 'Create a merchandise & streetwear T-shirt graphic design concept inspired by this image. Detail the illustration style, vector lines, screen-printing color separations, and print placement.';
        break;
      case 'remove_bg':
        promptText = 'Identify the primary subject(s) in this image and outline their contours with high precision. Detail what the foreground isolated subject is, and suggest 3 striking minimalist background environments that would best elevate this subject.';
        break;
      default:
        promptText = customPrompt || 'Analyze this image thoroughly and provide valuable creative insights.';
    }

    if (customPrompt && task !== 'custom') {
      promptText += `\n\nAdditional user requirement: ${customPrompt}`;
    }

    let response: any;
    let lastError: any = null;
    const STUDIO_MODELS = ['gemini-3.1-flash-lite', 'gemini-3.8-flash'];

    for (const modelName of STUDIO_MODELS) {
      try {
        response = await ai.models.generateContent({
          model: modelName,
          contents: {
            parts: [imagePart, { text: promptText }],
          },
          config: {
            systemInstruction: 'You are CAPP AI Image Studio, an expert visual intelligence and creative director engine. Provide clear, visually evocative, professional insights and concepts.',
            temperature: 0.6,
          },
        });
        break;
      } catch (err: any) {
        lastError = err;
        console.warn(`Image studio model ${modelName} failed, trying candidate:`, err?.message);
      }
    }

    if (!response && lastError) {
      throw lastError;
    }

    res.json({
      success: true,
      task,
      result: response.text || '',
    });
  } catch (err: any) {
    console.error('Error in /api/image-studio:', err);
    res.status(500).json({ error: err?.message || 'Failed to process image studio request.' });
  }
});

// Explicit PWA Web App Manifest endpoint (handles both .webmanifest and .json for PWABuilder)
app.get(['/manifest.json', '/manifest.webmanifest'], (_req, res) => {
  res.setHeader('Content-Type', 'application/manifest+json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');

  const candidates = [
    path.resolve(__dirname, 'dist', 'manifest.webmanifest'),
    path.resolve(__dirname, 'public', 'manifest.webmanifest'),
    path.resolve(__dirname, 'dist', 'manifest.json'),
    path.resolve(__dirname, 'public', 'manifest.json'),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      res.sendFile(candidate);
      return;
    }
  }

  res.status(404).json({ error: 'Manifest not found' });
});

// Explicit Service Worker endpoint with standard Service-Worker-Allowed scope
app.get(['/sw.js', '/registerSW.js'], (req, res) => {
  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  res.setHeader('Service-Worker-Allowed', '/');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

  const fileName = req.path === '/sw.js' ? 'sw.js' : 'registerSW.js';
  const candidates = [
    path.resolve(__dirname, 'dist', fileName),
    path.resolve(__dirname, 'public', fileName),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      res.sendFile(candidate);
      return;
    }
  }

  res.status(404).send('Service Worker not found');
});

// Source code & project zip download endpoint
app.get([
  '/capp-ai-project.zip',
  '/capp-source-code.zip',
  '/capp-project.zip',
  '/capp-ai.zip',
  '/project.zip',
  '/api/download-project-zip',
  '/api/download-source-zip',
  '/download-zip',
], (req, res) => {
  const reqName = path.basename(req.path) || 'capp-ai-project.zip';
  const downloadFilename = reqName.endsWith('.zip') ? reqName : 'capp-ai-project.zip';

  const candidates = [
    path.resolve(__dirname, 'public', downloadFilename),
    path.resolve(__dirname, 'public', 'capp-ai-project.zip'),
    path.resolve(__dirname, 'public', 'capp-source-code.zip'),
    path.resolve(__dirname, 'dist', downloadFilename),
    path.resolve(__dirname, 'build', 'web', downloadFilename),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="${downloadFilename}"`);
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.sendFile(candidate);
      return;
    }
  }

  res.status(404).json({ error: 'Project zip archive not found.' });
});

// Explicit Icon endpoint to ensure proper image/png MIME type and prevent Buffer errors
app.get([
  '/icons/Icon-192.png',
  '/icons/Icon-512.png',
  '/icons/:iconName',
  '/Icon-192.png',
  '/Icon-512.png',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/apple-touch-icon.png',
], (req, res) => {
  res.setHeader('Content-Type', 'image/png');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'public, max-age=86400');

  const iconName = path.basename(req.path);
  const candidates = [
    path.resolve(__dirname, 'public', 'icons', iconName),
    path.resolve(__dirname, 'dist', 'icons', iconName),
    path.resolve(__dirname, 'public', iconName),
    path.resolve(__dirname, 'dist', iconName),
    path.resolve(__dirname, 'public', 'pwa-512x512.png'),
    path.resolve(__dirname, 'dist', 'pwa-512x512.png'),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      res.sendFile(candidate);
      return;
    }
  }

  res.status(404).send('Icon not found');
});

// Mount Vite or static server
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // In production, serve the built dist directory
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`CAPP AI server running on http://localhost:${PORT}`);
  });
}

startServer();
