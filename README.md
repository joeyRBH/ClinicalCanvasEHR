# ClinicalSpeak 🎙️

**AI-powered clinical note generation with voice transcription**

Transform your therapy sessions into professional clinical documentation with the power of AI. Record, transcribe, and generate comprehensive clinical notes in multiple formats - all while maintaining privacy with automatic audio deletion.

![ClinicalSpeak Demo](https://img.shields.io/badge/Status-Live-brightgreen) ![Privacy First](https://img.shields.io/badge/Privacy-First-blue) ![HIPAA Alternative](https://img.shields.io/badge/HIPAA-Alternative-orange)

## ✨ Features

- 🎙️ **Voice Recording** - Real-time session recording with pause/resume
- 🤖 **AI Transcription** - Powered by OpenAI Whisper for accurate transcription
- 📝 **Multiple Note Formats** - DAP, SOAP, BIRP, and GIRP clinical notes
- ✍️ **Digital Signatures** - Secure note signing and locking
- 🗑️ **Privacy-First** - Audio automatically deleted after transcription
- 📱 **Responsive Design** - Works on desktop, tablet, and mobile
- ⚡ **No Database Required** - Runs entirely on your device and cloud APIs

## 🏥 Supported Note Formats

| Format | Full Name | Use Case |
|--------|-----------|----------|
| **DAP** | Data, Assessment, Plan | General therapy sessions |
| **SOAP** | Subjective, Objective, Assessment, Plan | Medical/clinical documentation |
| **BIRP** | Behavior, Intervention, Response, Plan | Behavioral health |
| **GIRP** | Goals, Intervention, Response, Plan | Goal-oriented therapy |

## 🚀 Quick Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/clinicalspeak&env=OPENAI_API_KEY&envDescription=OpenAI%20API%20Key%20for%20transcription%20and%20note%20generation)

### One-Click Setup:
1. Click the deploy button above
2. Connect your GitHub account
3. Add your OpenAI API key
4. Deploy instantly to clinicalcanvas.com

## 🛠️ Manual Setup

### Prerequisites
- Node.js 18+ 
- OpenAI API key ([Get one here](https://platform.openai.com/api-keys))

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/clinicalspeak.git
cd clinicalspeak

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local

# Add your OpenAI API key to .env.local
OPENAI_API_KEY=your_openai_api_key_here

# Start development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see your app running.

## 📁 Project Structure

```
clinicalspeak/
├── components/
│   └── AIClinicalNotes.js      # Main AI Notes component
├── pages/
│   ├── api/
│   │   ├── transcribe.js       # OpenAI Whisper transcription
│   │   └── generate-notes.js   # AI note generation
│   ├── _app.js                 # Next.js app wrapper
│   └── index.js                # Home page
├── styles/
│   └── globals.css             # Global styles
├── .env.example                # Environment variables template
├── next.config.js              # Next.js configuration
├── package.json                # Dependencies
└── README.md                   # This file
```

## 🔒 Privacy & Security

**Privacy-First Design:**
- ✅ Audio recordings are **automatically deleted** after transcription
- ✅ No permanent storage of voice data or PHI
- ✅ Notes can be downloaded and auto-deleted after 24 hours
- ✅ Generic client references (no specific names stored)
- ✅ Secure API communication

**Data Flow:**
1. Record session audio locally
2. Send to OpenAI for transcription
3. **Audio immediately deleted** from all systems
4. Generate clinical notes from transcription text
5. User downloads notes (optional auto-deletion)

## 🚀 Deployment Options

### Vercel (Recommended)
```bash
npm i -g vercel
vercel
```

### Netlify
```bash
npm run build
# Upload 'out' folder to Netlify
```

### Other Platforms
- Railway
- Render
- Digital Ocean App Platform
- Any Node.js hosting

## 🎯 Usage

### For Therapists & Clinicians:
1. **Start Recording** - Click the record button during your session
2. **Speak Naturally** - The AI will transcribe everything accurately
3. **Stop & Process** - Recording auto-transcribes and deletes audio
4. **Generate Notes** - Choose your preferred clinical format
5. **Sign & Download** - Digitally sign and save your documentation

### Sample Workflow:
```
Session Start → Record Audio → Auto-Transcribe → Generate Notes → Sign → Download
     ↓              ↓              ↓              ↓          ↓         ↓
  Real-time    Privacy-first   OpenAI Whisper   GPT-4    Digital   Local Save
  recording    auto-deletion   transcription    notes   signature   (optional)
```

## 📊 Cost Estimates

| Component | Monthly Cost |
|-----------|-------------|
| Hosting (Vercel) | $0 (Free tier) |
| Domain | $1 (annual/12) |
| OpenAI API | $20-50 (usage-based) |
| **Total** | **~$25/month** |

*Costs scale with usage - transcription ~$0.006/minute*

## 🔧 Configuration

### Environment Variables

```bash
# Required
OPENAI_API_KEY=your_openai_api_key_here

# Optional
NEXT_PUBLIC_APP_URL=https://clinicalcanvas.com
AUTO_DELETE_TEMP_FILES=true
TEMP_FILE_TTL=86400000  # 24 hours in milliseconds
```

### Customization

The AI Notes component accepts these props:

```javascript
<AIClinicalNotes 
  clients={customClients}           // Custom client list
  services={customServices}         // Custom service codes
  clinicianName="Dr. Jane Smith"    // Default clinician
  clinicianLicense="TX123456"       // License number
  defaultFormat="SOAP"              // Default note format
/>
```

## 🧪 Development

```bash
# Development server
npm run dev

# Production build
npm run build
npm start

# Linting
npm run lint
```

## 📝 API Endpoints

- `POST /api/transcribe` - Audio transcription (auto-deletes audio)
- `POST /api/generate-notes` - AI clinical note generation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- 📧 **Email**: support@clinicalcanvas.com
- 🐛 **Issues**: [GitHub Issues](https://github.com/yourusername/clinicalspeak/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/yourusername/clinicalspeak/discussions)

## 🙏 Acknowledgments

- **OpenAI** for Whisper transcription and GPT-4 note generation
- **Vercel** for seamless deployment platform
- **Lucide React** for beautiful icons
- **Next.js** for the React framework

---

**Made with ❤️ for healthcare professionals who want to focus on patients, not paperwork.**

---

## 🎉 What's Next?

- [ ] Template library for common session types
- [ ] Multi-language transcription support  
- [ ] Team collaboration features
- [ ] Integration with popular EHR systems
- [ ] Mobile app versions
- [ ] Batch processing for multiple sessions

**Star ⭐ this repo if you find it helpful!**
