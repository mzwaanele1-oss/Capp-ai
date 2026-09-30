# CAPP AI — Think Smarter. Create More.

CAPP AI is a modern, high-performance Progressive Web Application (PWA) and AI Workspace built with React 19, TypeScript, Tailwind CSS, Express, and Google Gemini API.

---

## 🚀 Key Features

- **Conversational Intelligence**: Powered by Gemini (`gemini-3.8-flash`), featuring streaming responses, markdown rendering, and code syntax highlighting.
- **Multimodal Visual Intelligence**: Image Studio for image generation, visual editing, and analysis.
- **Tools Suite**: Pre-configured templates for code generation, writing assistance, summaries, brainstorming, and translation.
- **Voice Capabilities**: Real-time Web Speech recognition (Speech-to-Text) and natural voice synthesis (Text-to-Speech).
- **Persistent Personal Memory**: Custom memory system remembering user preferences across sessions.
- **PDF & Conversation Export**: One-click export of transcripts to PDF, JSON, or project archive.
- **PWA Ready**: 100% compliant Progressive Web App with offline service worker, responsive mobile shell, and 192x192 & 512x512 maskable icons.
- **PWABuilder & Android APK Compatible**: Fully prepared for packaging into Google Play Store APK / TWA via PWABuilder.

---

## 🛠 Project Structure

```text
├── src/
│   ├── components/         # UI Components (ChatArea, Sidebar, Header, Modals)
│   │   └── pwa/            # PWA modals, install banners, and offline notifications
│   ├── hooks/              # Custom hooks (Speech, PWA install, Android back navigation)
│   ├── services/           # API proxies and LocalStorage management
│   ├── types/              # TypeScript interfaces and type definitions
│   ├── utils/              # PDF export, usage tracking, prompt generators
│   ├── App.tsx             # Main Application root
│   ├── index.css           # Tailwind CSS imports and global styling
│   └── main.tsx            # React DOM mounting
├── public/                 # Static assets, Web Manifest, Service Worker, and icons
├── web/                    # Alternative Web Root with icons and manifest
├── scripts/                # Utility scripts (icon generation and project exporter)
├── server.ts               # Isolated Express server proxy for Gemini API and assets
├── vite.config.ts          # Vite configuration
├── package.json            # Project dependencies and scripts
└── tsconfig.json           # TypeScript configuration
```

---

## 🏁 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (version 18 or later)
- npm or yarn

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the root directory:

```env
GEMINI_API_KEY=your_gemini_api_key_here
PORT=3000
```

### 3. Start Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` in your web browser.

### 4. Build for Production

```bash
npm run build
```

This will generate production assets in `dist/` and `build/web/`.

### 5. Start Production Server

```bash
npm start
```

---

## 📱 Packaging as an Android App (PWABuilder / TWA)

1. Deploy your app to your domain or hosting service (e.g. Firebase Hosting, Cloud Run, Vercel).
2. Go to [PWABuilder](https://www.pwabuilder.com).
3. Enter your live app URL.
4. Click **"Package for Stores"** > **"Android"**.
5. Download your generated APK / AAB package ready for installation or the Google Play Store!

---

## 📄 License

MIT License. Designed and built with CAPP AI.
