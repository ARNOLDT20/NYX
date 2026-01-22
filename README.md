#  NYX MD - WhatsApp Bot

<div align="center">

![NYX Typing Animation](assets/typing-animation.svg)

** The Ultimate WhatsApp Bot with 100+ Advanced Commands **

[![Node.js](https://img.shields.io/badge/Node.js->=20-brightgreen?style=for-the-badge&logo=node.js)](https://nodejs.org)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)
[![GitHub](https://img.shields.io/badge/GitHub-NYX-black?style=for-the-badge&logo=github)](https://github.com/blazetech-glitch/NYX)
[![Version](https://img.shields.io/badge/Version-3.0.0-green?style=for-the-badge)]()

</div>

---

##  Key Features

<table>
<tr>
<td>

###  Media & Download
-  YouTube Music/Video
-  Instagram Posts/Reels
-  TikTok Videos
-  Facebook Videos
-  Ringtone Downloads

</td>
<td>

###  Admin Tools
-  Group Management
-  Member Control
-  Auto-Kick Bad Links
-  Welcome/Goodbye
-  Status Reactions

</td>
</tr>
<tr>
<td>

###  Smart Features
-  AI Chat Integration
-  Auto Typing Indicator
-  Auto Recording Indicator
-  Message Auto-React
-  Status Auto-Seen

</td>
<td>

###  Creative Tools
-  Sticker Converter
-  Image Editor
-  Fancy Text
-  Meme Generator
-  And 80+ more!

</td>
</tr>
</table>

---

##  Installation

###  Local Setup

`ash
git clone https://github.com/blazetech-glitch/NYX.git
cd NYX
npm install
node index.js
`

** First Run**: Scan QR code or provide SESSION_ID from .env

###  Docker

`ash
docker build -t nyx-bot .
docker run -e SESSION_ID="your_session_id" nyx-bot
`

---

##  Configuration

| Variable | Value | Purpose |
|:--------:|:-----:|:--------|
| SESSION_ID | your_session_id | WhatsApp authentication (required) |
| OWNER_NUMBER | 255627417402 | Primary owner |
| PREFIX | . | Command trigger character |
| MODE | public | Bot mode (public/private/groups) |
| AUTO_TYPING | true | Show typing indicator |
| ANTI_LINK | true | Block link sharing |

---

##  Popular Commands

`
 Media Commands
  .play <query>         Play music from YouTube
  .video <query>        Download video
  .song <name>          Download song
  .tiktok <url>         Download TikTok video
  .instagram <url>      Download Instagram post

 Admin Commands
  .owner                Get bot info
  .mode <type>          Change bot mode
  .group-info           Group information
  .antilink             Toggle anti-link
  .welcome              Toggle welcome message

 Fun Commands
  .meme                 Random meme
  .joke                 Random joke
  .ship <name1> <name2> Ship two people
  .fancy <text>         Fancy text conversion
`

---

##  Deploy Anywhere

<div align="center">

** Choose your platform and get started in minutes!**

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/blazetech-glitch/NYX)
[![](assets/btn-railway.svg)](https://railway.app)
[![](assets/btn-koyeb.svg)](https://koyeb.com)
[![](assets/btn-cloudflare.svg)](https://workers.cloudflare.com)
[![](assets/btn-render.svg)](https://render.com)
[![](assets/btn-ubuntu.svg)](https://ubuntu.com)

</div>

| Platform | Description |
|:--------:|:------------|
| ** Heroku** | Click deploy button  Set env vars  Done  |
| ** Railway** | Connect GitHub  Set vars  Auto deploy  |
| ** Render** | Link repo  Configure  Deploy  |
| ** Koyeb** | \koyeb app create --docker blazetech-glitch/NYX\ |
| ** Cloudflare** | \wrangler init\  \wrangler publish\ |
| ** Ubuntu VPS** | Clone  Install  \
pm start\ |

---

##  Built With

<div align="center">

![Node.js](https://img.shields.io/badge/Node.js_20+-339933?logo=node.js&logoColor=white&style=for-the-badge)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black&style=for-the-badge)
![SQLite](https://img.shields.io/badge/SQLite-003B57?logo=sqlite&logoColor=white&style=for-the-badge)
![FFmpeg](https://img.shields.io/badge/FFmpeg-007808?logo=ffmpeg&logoColor=white&style=for-the-badge)
![Docker](https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white&style=for-the-badge)

</div>

** Core Dependencies:**
-  **@whiskeysockets/baileys** - WhatsApp automation
-  **ytdl-core** - YouTube downloader
-  **fluent-ffmpeg** - Media processing
-  **SQLite3** - Database

---

##  Connect With Us

<div align="center">

###  BLAZE TECH Team

[![](assets/btn-github.svg)](https://github.com/blazetech-glitch)
[![](assets/btn-whatsapp.svg)](https://wa.me/255627417402)
[![](assets/btn-channel.svg)](https://whatsapp.com/channel/0029VbC49Bb2P59togOaEF2E)
[![](assets/btn-community.svg)](https://chat.whatsapp.com/IrmNcI7Wn0C4bdLC70xVPJ)

** Lead Developer**: [BLAZE TECH](https://wa.me/255627417402) 

</div>

---

##  Security & License

-  Keep \SESSION_ID\ private in \.env\
-  Never share credentials publicly
-  Enable \ANTI_LINK\ in group chats
-  Monitor bot logs regularly

** License**: MIT - For educational purposes only  
** Disclaimer**: Users responsible for WhatsApp Terms of Service compliance

---

<div align="center">

** Made with  by BLAZE TECH** | *NYX MD v3.0.0*

</div>
