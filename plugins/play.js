// play.js - YouTube Download Plugin with robust API fallbacks
const config = require('../config');
const { cmd } = require('../command');
const axios = require('axios');

// Safe ytsearch wrapper
let ytsearch;
try {
    ytsearch = require('@dark-yasiya/yt-dl.js').ytsearch;
} catch (e) {
    console.warn('yt-dl.js not available, search may fail');
    ytsearch = null;
}

// Helper: Safely extract args
function getQuery(args, q) {
    if (args && Array.isArray(args) && args.length > 0) {
        return args.join(" ").trim();
    }
    if (q && typeof q === 'string') {
        return q.trim();
    }
    return null;
}

// Helper: Get context info with fallbacks
const getContextInfo = (title = '', userJid = '', thumbnailUrl = '') => {
    try {
        return {
            mentionedJid: userJid ? [userJid] : [],
            externalAdReply: {
                showAdAttribution: false,
                title: config.BOT_NAME || 'YouTube Downloader',
                body: title || "Media Downloader",
                thumbnailUrl: thumbnailUrl || config.MENU_IMAGE_URL || 'https://files.catbox.moe/rw0yfd.png',
                sourceUrl: config.CHANNEL_LINK || ''
            }
        };
    } catch (e) {
        return {};
    }
};

// Audio download command
cmd({
    pattern: "play",
    alias: ["song", "audio", "mp3", "ytmp3", "yta"],
    desc: "Download Audio from YouTube",
    category: "download",
    react: "🎵",
    filename: __filename
}, async (conn, mek, m, { from, sender, reply, args, q }) => {
    try {
        const query = getQuery(args, q);
        if (!query) {
            return reply("📝 Usage: .play <song name or YouTube URL>\n\nExample: .play Imagine Dragons Believer");
        }

        const isUrl = /youtube\.com|youtu\.be/.test(query);
        let videoTitle = "Audio";
        let videoId = null;

        if (isUrl) {
            const match = query.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
            videoId = match ? match[1] : null;
            if (!videoId) return reply("❌ Invalid YouTube URL");
            videoTitle = "YouTube Audio";
        } else {
            // Search
            if (!ytsearch) return reply("⚠️ Search unavailable. Please provide a YouTube URL instead.");

            try {
                await reply("🔍 Searching...");
                const results = await ytsearch(query);
                const list = results && Array.isArray(results.results) ? results.results : (Array.isArray(results) ? results : []);
                const video = list && list.length ? list[0] : null;
                if (!video || !video.url) return reply("❌ No videos found");
                const urlMatch = (typeof video.url === 'string') ? video.url.match(/([a-zA-Z0-9_-]{11})/) : null;
                videoId = urlMatch && urlMatch[0] ? urlMatch[0] : null;
                if (!videoId) return reply("❌ Could not extract video ID");
                videoTitle = video.title || query;
            } catch (e) {
                return reply("❌ Search failed: " + (e.message || "unknown error"));
            }
        }

        await reply("⬇️ Downloading...");

        // Multiple API endpoints
        const apis = [
            { url: `https://apiskeith.vercel.app/download/audio?url=https://youtu.be/${videoId}` },
            { url: `https://api.vihangayt.com/download?url=https://youtu.be/${videoId}&type=audio` }
        ];

        let downloaded = false;
        for (const api of apis) {
            try {
                const res = await axios.get(api.url, { timeout: 30000 });
                let dlUrl = res.data?.result || res.data?.url || res.data?.data?.url;
                if (!dlUrl) continue;

                // Try send by URL
                try {
                    await conn.sendMessage(from, {
                        audio: { url: dlUrl },
                        mimetype: 'audio/mpeg',
                        ptt: false,
                        contextInfo: getContextInfo(videoTitle, sender)
                    }, { quoted: mek });
                    downloaded = true;
                    break;
                } catch (e) {
                    // Fallback: fetch and send buffer
                    try {
                        const bufRes = await axios.get(dlUrl, { responseType: 'arraybuffer', timeout: 60000 });
                        if (bufRes.data && bufRes.data.byteLength > 1000) {
                            await conn.sendMessage(from, {
                                audio: bufRes.data,
                                mimetype: 'audio/mpeg',
                                ptt: false
                            }, { quoted: mek });
                            downloaded = true;
                            break;
                        }
                    } catch (bufErr) {
                        // continue to next API
                    }
                }
            } catch (e) {
                // continue to next API
            }
        }

        if (!downloaded) {
            return reply("❌ Download failed. API servers may be down. Try again later.");
        }

    } catch (error) {
        console.error('Audio error:', error);
        reply("❌ Error: " + (error.message || "unknown error"));
    }
});

// Video download command
cmd({
    pattern: "video",
    alias: ["videodoc", "film", "mp4", "ytmp4", "ytv"],
    desc: "Download Video from YouTube",
    category: "download",
    react: "🎥",
    filename: __filename
}, async (conn, mek, m, { from, sender, reply, args, q }) => {
    try {
        const query = getQuery(args, q);
        if (!query) {
            return reply("📝 Usage: .video <video name or YouTube URL>\n\nExample: .video Lara Croft");
        }

        const isUrl = /youtube\.com|youtu\.be/.test(query);
        let videoTitle = "Video";
        let videoId = null;

        if (isUrl) {
            const match = query.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
            videoId = match ? match[1] : null;
            if (!videoId) return reply("❌ Invalid YouTube URL");
            videoTitle = "YouTube Video";
        } else {
            // Search
            if (!ytsearch) return reply("⚠️ Search unavailable. Please provide a YouTube URL instead.");

            try {
                await reply("🔍 Searching...");
                const results = await ytsearch(query);
                const list = results && Array.isArray(results.results) ? results.results : (Array.isArray(results) ? results : []);
                const video = list && list.length ? list[0] : null;
                if (!video || !video.url) return reply("❌ No videos found");
                const urlMatch = (typeof video.url === 'string') ? video.url.match(/([a-zA-Z0-9_-]{11})/) : null;
                videoId = urlMatch && urlMatch[0] ? urlMatch[0] : null;
                if (!videoId) return reply("❌ Could not extract video ID");
                videoTitle = video.title || query;
            } catch (e) {
                return reply("❌ Search failed: " + (e.message || "unknown error"));
            }
        }

        await reply("⬇️ Downloading...");

        const apis = [
            { url: `https://apiskeith.vercel.app/download/video?url=https://youtu.be/${videoId}` },
            { url: `https://api.vihangayt.com/download?url=https://youtu.be/${videoId}&type=video` }
        ];

        let downloaded = false;
        for (const api of apis) {
            try {
                const res = await axios.get(api.url, { timeout: 30000 });
                let dlUrl = res.data?.result || res.data?.url || res.data?.downloadUrl || res.data?.videoUrl;
                if (!dlUrl) continue;

                try {
                    await conn.sendMessage(from, {
                        video: { url: dlUrl },
                        mimetype: 'video/mp4',
                        caption: `🎥 ${videoTitle}`,
                        contextInfo: getContextInfo(videoTitle, sender)
                    }, { quoted: mek });
                    downloaded = true;
                    break;
                } catch (e) {
                    // Fallback: send as document
                    try {
                        await conn.sendMessage(from, {
                            document: { url: dlUrl },
                            mimetype: 'video/mp4',
                            fileName: `${videoTitle}.mp4`,
                            caption: `📁 ${videoTitle} (Document)`
                        }, { quoted: mek });
                        downloaded = true;
                        break;
                    } catch (docErr) {
                        // continue
                    }
                }
            } catch (e) {
                // continue to next API
            }
        }

        if (!downloaded) {
            return reply("❌ Download failed. API servers may be down. Try again later.");
        }

    } catch (error) {
        console.error('Video error:', error);
        reply("❌ Error: " + (error.message || "unknown error"));
    }
});

// YouTube search command
cmd({
    pattern: "ytsearch",
    alias: ["youtube", "yt", "yts"],
    desc: "Search YouTube Videos",
    category: "download",
    react: "🔍",
    filename: __filename
}, async (conn, mek, m, { from, sender, reply, args, q }) => {
    try {
        if (!ytsearch) return reply("⚠️ Search unavailable. Please use .play <URL> or .video <URL> directly.");

        const query = getQuery(args, q);
        if (!query) {
            return reply("📝 Usage: .ytsearch <search query>\n\nExample: .ytsearch Imagine Dragons");
        }

        await reply("🔍 Searching YouTube...");

        try {
            const results = await ytsearch(query);
            const videos = results && Array.isArray(results.results) ? results.results : (Array.isArray(results) ? results : []);

            if (!Array.isArray(videos) || videos.length === 0) {
                return reply("❌ No videos found");
            }

            const topVideos = videos.slice(0, 5);
            let msg = `📺 *YouTube Search Results*\n\n`;

            topVideos.forEach((video, i) => {
                msg += `${i + 1}. *${video.title || "Unknown"}*\n`;
                if (video.timestamp) msg += `   ⏱️ ${video.timestamp}\n`;
                if (video.views) msg += `   👁️ ${video.views}\n`;
                msg += `   🔗 ${video.url}\n\n`;
            });

            if (videos.length > 5) {
                msg += `📊 ${videos.length - 5} more results available\n`;
            }

            msg += `\n💡 Use .play <URL> or .video <URL> to download`;

            await conn.sendMessage(from, {
                text: msg,
                contextInfo: getContextInfo("YouTube Search", sender)
            }, { quoted: mek });

        } catch (e) {
            return reply("❌ Search failed: " + (e.message || "unknown error"));
        }

    } catch (error) {
        console.error('ytsearch error:', error);
        reply("❌ Error: " + (error.message || "unknown error"));
    }
});
