# 🤖 NYX MD - WhatsApp Bot

<div align="center">

[![Node.js](https://img.shields.io/badge/Node.js->=20-brightgreen?style=for-the-badge&logo=node.js)](https://nodejs.org)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)
[![GitHub](https://img.shields.io/badge/GitHub-NYX-black?style=for-the-badge&logo=github)](https://github.com/blazetech-glitch/NYX)

*Advanced WhatsApp Bot with 100+ Commands | Multi-Platform Deployment Ready*

![NYX Typing Animation](assets/typing-animation.svg)

[🚀 Quick Start](#-quick-start) • [⚙️ Configuration](#-configuration) • [📚 Commands](#-commands) • [🌐 Deploy](#-deployment) • [👥 Developers](#-developers)

</div>

---

## ✨ Features

```
✅ 100+ Advanced Commands        ✅ Auto Status Reactions
✅ YouTube Music/Video Download  ✅ Welcome/Goodbye Messages
✅ Anti-Link Protection          ✅ Group Management Tools
✅ AI Chat Integration           ✅ Auto Typing & Recording
✅ Sticker Converter             ✅ Media Tools (Image/Video)
✅ Admin Controls                ✅ Multi-Platform Support
```

---

## 🚀 Quick Start

### Local Installation

```bash
git clone https://github.com/blazetech-glitch/NYX.git
cd NYX
npm install
node index.js
```

**First Run**: Bot will prompt for `SESSION_ID`. Scan QR code or provide SESSION_ID.

### Docker

```bash
docker build -t nyx-bot .
docker run -e SESSION_ID="your_session_id" nyx-bot
```

---

## ⚙️ Configuration

### Essential Variables

```env
SESSION_ID=your_mega_session_id           # Required: WhatsApp session
OWNER_NUMBER=255627417402                 # Primary owner
OWNER_NUMBER2=255754206718                # Secondary owner
BOT_NAME=NYX MD                            # Bot display name
PREFIX=.                                   # Command prefix
MODE=public                                # public|private|inbox|groups
```

### Optional Features

```env
AUTO_TYPING=true                          # Show typing indicator
AUTO_RECORDING=true                       # Show recording indicator
AUTO_STATUS_SEEN=true                     # Auto view statuses
AUTO_STATUS_REACT=true                    # Auto react with emoji
ANTI_LINK=true                            # Block link sharing
WELCOME=false                             # Welcome new members
GOODBYE=false                             # Goodbye leaving members
ALWAYS_ONLINE=false                       # Always online status
AUTO_REACT=false                          # React to all messages
```

---

## 📚 Commands

| Category | Commands |
|----------|----------|
| 🎵 Media | `.play`, `.video`, `.song` |
| 👑 Owner | `.owner`, `.mode`, `.auto-typing` |
| 📢 Group | `.antilink`, `.welcome`, `.goodbye` |
| ⚙️ Settings | `.env-list`, `.auto-seen`, `.status-react` |
| 🎨 Tools | 80+ additional commands |

---

## 🌐 Deployment

### ☁️ Heroku
[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/blazetech-glitch/NYX)

```bash
heroku create nyx-bot
git push heroku main
heroku config:set SESSION_ID=your_id
```

### 🚆 Railway
Connect repo → Set `SESSION_ID` env var → Deploy  
[railway.app](https://railway.app)

### 🎯 Koyeb
```bash
koyeb app create --docker blazetech-glitch/NYX
```

### ☁️ Cloudflare Workers
```bash
wrangler init
wrangler publish
```

### 🎨 Render
Connect GitHub → Add env vars → Deploy  
[render.com](https://render.com)

### 🖥️ VPS (Ubuntu/Debian)
```bash
sudo apt update && sudo apt install -y nodejs npm
git clone https://github.com/blazetech-glitch/NYX.git && cd NYX
npm install
npm start
```

Use PM2 for auto-restart:
```bash
npm install -g pm2
pm2 start index.js --name "NYX" && pm2 startup && pm2 save
```

---

## 📁 Project Structure

```
NYX/
├── index.js              Entry point
├── config.js             Configuration
├── command.js            Command system
├── plugins/              100+ commands
├── lib/                  Utilities
├── data/                 Database
├── assets/               Resources
└── sessions/             Credentials
```

---

## 🛠️ Tech Stack

| Component | Technology |
|-----------|------------|
| Runtime | Node.js 20+ |
| Bot Framework | @whiskeysockets/baileys 6.7.20 |
| Media Processing | FFmpeg, fluent-ffmpeg |
| Downloads | ytdl-core, @dark-yasiya/yt-dl.js |
| Database | SQLite3 |
| Hosting | Heroku, Railway, Koyeb, Render, VPS |

---

## 👥 Developers

<div align="center">

### 🇹🇿 BLAZE TECH Team

| Role | Name | Contact |
|------|------|---------|
| **Lead Developer** | BLAZE TECH | [WhatsApp](https://wa.me/255627417402) |
| **Co-Developer** | Team Member | [WhatsApp](https://wa.me/255754206718) |

**GitHub**: [@blazetech-glitch](https://github.com/blazetech-glitch)  
**Channel**: [WhatsApp Updates](https://whatsapp.com/channel/0029VbC49Bb2P59togOaEF2E)  
**Community**: [WhatsApp Group](https://chat.whatsapp.com/IrmNcI7Wn0C4bdLC70xVPJ)

</div>

---

## 📊 Stats

- **Commands**: 100+
- **Size**: 6.16 MB (optimized)
- **Node Version**: >=20
- **Last Updated**: January 2026

---

## 🔐 Security

- Keep `SESSION_ID` private
- Use `.env` file for secrets
- Enable `ANTI_LINK` in groups
- Monitor bot logs regularly

---

## ⚖️ License & Disclaimer

MIT License - For educational use only. Users responsible for WhatsApp ToS compliance.

---

<div align="center">

**Made with ❤️ by BLAZE TECH**  
*NYX MD v3.0.0*

</div>
