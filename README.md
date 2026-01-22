# 🤖 NYX MD - WhatsApp Bot

<div align="center">

[![Node.js](https://img.shields.io/badge/Node.js->=20-brightgreen?style=for-the-badge&logo=node.js)](https://nodejs.org)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)
[![GitHub](https://img.shields.io/badge/GitHub-NYX-black?style=for-the-badge&logo=github)](https://github.com/blazetech-glitch/NYX)

*Advanced WhatsApp Bot with 100+ Commands | Multi-Platform Support*

![NYX Typing Animation](assets/typing-animation.svg)

</div>

---

## 🚀 Getting Started

### Quick Setup (Local)

```bash
git clone https://github.com/blazetech-glitch/NYX.git
cd NYX
npm install
node index.js
```

Scan QR code on first run or provide `SESSION_ID` from `.env`

### Docker Setup

```bash
docker build -t nyx-bot .
docker run -e SESSION_ID="your_id" nyx-bot
```

---

## ✨ Features

- 100+ Advanced Commands
- YouTube/Music Download
- Auto Status Reactions  
- Group Management Tools
- AI Chat Integration
- Sticker Converter
- Media Tools (Image/Video)
- Anti-Link Protection
- Admin Controls
- Multi-Platform Deployment

---

## ⚙️ Configuration

### Required Variables

```env
SESSION_ID=your_session_id        # WhatsApp session (required)
OWNER_NUMBER=255627417402         # Primary owner number
PREFIX=.                           # Command prefix
MODE=public                        # public|private|inbox|groups
```

### Optional Features

```env
AUTO_TYPING=true                  # Show typing indicator
AUTO_RECORDING=true               # Show recording indicator
AUTO_STATUS_SEEN=true             # Auto view statuses
AUTO_STATUS_REACT=true            # Auto react to statuses
ANTI_LINK=true                    # Block link sharing
WELCOME=false                     # Welcome new members
ALWAYS_ONLINE=false               # Always online status
```

---

## 📚 Commands

| Category | Examples |
|----------|----------|
| 🎵 Media | `.play`, `.video`, `.song`, `.tiktok`, `.instagram` |
| 👑 Owner | `.owner`, `.mode`, `.auto-typing`, `.env-list` |
| 📢 Group | `.antilink`, `.welcome`, `.goodbye`, `.group-info` |
| ⚙️ Settings | `.auto-seen`, `.status-react`, `.prefix` |
| 🎨 Tools | 80+ additional creative & utility commands |

---

## 🌐 Deploy

<div align="center">

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/blazetech-glitch/NYX)
[![](assets/btn-railway.svg)](https://railway.app)
[![](assets/btn-koyeb.svg)](https://koyeb.com)
[![](assets/btn-cloudflare.svg)](https://workers.cloudflare.com)
[![](assets/btn-render.svg)](https://render.com)
[![](assets/btn-ubuntu.svg)](https://ubuntu.com)

</div>

**Quick Deploy:**
- **Heroku**: Click button above → Set `SESSION_ID` → Deploy
- **Railway/Render**: Connect GitHub → Set env vars → Deploy
- **Koyeb**: `koyeb app create --docker blazetech-glitch/NYX`
- **Ubuntu VPS**: `git clone`, `npm install`, `npm start`
- **Cloudflare**: `wrangler init` → `wrangler publish`

---

## � Project Structure

```
NYX/
├── index.js           Entry point
├── config.js          Configuration
├── command.js         Command handler
├── plugins/           100+ command plugins
├── lib/               Utility functions
├── data/              Database & storage
├── assets/            SVG & resources
└── sessions/          WhatsApp sessions
```

---

## 🛠️ Tech Stack

- **Runtime**: Node.js 20+
- **Framework**: @whiskeysockets/baileys 6.7.20
- **Media**: FFmpeg, fluent-ffmpeg
- **Downloads**: ytdl-core, @dark-yasiya/yt-dl.js
- **Database**: SQLite3
- **Deployment**: Heroku, Railway, Koyeb, Render, VPS, Cloudflare

---

## 👥 Connect With Us

<div align="center">

### BLAZE TECH Team

[![](assets/btn-github.svg)](https://github.com/blazetech-glitch)
[![](assets/btn-whatsapp.svg)](https://wa.me/255627417402)
[![](assets/btn-channel.svg)](https://whatsapp.com/channel/0029VbC49Bb2P59togOaEF2E)
[![](assets/btn-community.svg)](https://chat.whatsapp.com/IrmNcI7Wn0C4bdLC70xVPJ)

**Lead Developer**: [BLAZE TECH](https://wa.me/255627417402) 🇹🇿

</div>

---

## � Security & License

- Keep `SESSION_ID` private in `.env`
- Never share credentials publicly
- Enable `ANTI_LINK` in group chats
- Monitor bot logs regularly

**License**: MIT - For educational purposes only  
**Disclaimer**: Users responsible for WhatsApp Terms of Service compliance

---

<div align="center">

**Made with ❤️ by BLAZE TECH** | NYX MD v3.0.0

</div>
