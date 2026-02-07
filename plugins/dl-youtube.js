const config = require('../config');
const { cmd } = require('../command');
const axios = require('axios');

const getContextInfo = (title = '', userJid = '', thumbnailUrl = '') => ({
    mentionedJid: [userJid],
    forwardingScore: 999,
    isForwarded: true,
    externalAdReply: {
        showAdAttribution: true,
        title: config.BOT_NAME || 'YouTube Downloader',
        body: title || "Media Downloader",
        thumbnailUrl: thumbnailUrl || config.MENU_IMAGE_URL || '',
        sourceUrl: 'https://whatsapp.com',
        mediaType: 1,
        renderLargerThumbnail: false
    }
});

// Utility: Try multiple APIs with fallback
async function tryMultipleAPIs(apis) {
    for (const api of apis) {
        try {
            const response = await axios.get(api.url, { timeout: api.timeout || 30000 });
            if (api.validate(response.data)) {
                return { success: true, data: response.data, type: api.type };
            }
        } catch (err) {
            console.error(`API ${api.type} failed:`, err.message);
            continue;
        }
    }
    return { success: false };
}

// YouTube Audio Download with Fallbacks
cmd({
    pattern: "play",
    alias: ["song", "audio", "mp3", "ytmp3", "yta"],
    desc: "Download Audio from YouTube",
    category: "download",
    react: "🎵",
    filename: __filename
}, async (conn, m, { from, sender, reply, arg }) => {
    try {
        if (!arg[0]) {
            return reply("🎵 *Usage:* .play <song name or YouTube URL>\n\nExample: .play Imagine Dragons Believer");
        }

        const query = arg.join(" ");
        let videoUrl, videoTitle, videoThumbnail;

        // Extract YouTube URL if provided
        if (query.match(/(youtube\.com|youtu\.be)/i)) {
            videoUrl = query;
            const videoId = videoUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i)?.[1];
            if (!videoId) {
                return reply("❌ Invalid YouTube URL provided.");
            }
            videoTitle = "YouTube Audio";
            videoThumbnail = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
        } else {
            // Search for video
            await conn.sendMessage(from, {
                text: "🔍 *Searching YouTube...* Please wait",
                contextInfo: getContextInfo("Searching", sender)
            }, { quoted: m });

            try {
                // Try multiple search APIs
                const searchAPIs = [
                    {
                        type: 'keith',
                        url: `https://apiskeith.vercel.app/search/yts?query=${encodeURIComponent(query)}`,
                        timeout: 15000,
                        validate: (data) => data?.result && Array.isArray(data.result) && data.result.length > 0
                    },
                    {
                        type: 'rest-lily',
                        url: `https://rest-lily.vercel.app/api/search/yt?query=${encodeURIComponent(query)}`,
                        timeout: 15000,
                        validate: (data) => data?.result && Array.isArray(data.result) && data.result.length > 0
                    }
                ];

                const searchResult = await tryMultipleAPIs(searchAPIs);
                if (!searchResult.success) {
                    return reply("❌ No videos found or search service unavailable. Please try a direct YouTube URL.");
                }

                const firstVideo = searchResult.data.result[0];
                videoUrl = firstVideo.url || firstVideo.link;
                videoTitle = firstVideo.title;
                videoThumbnail = firstVideo.thumbnail || firstVideo.image;
            } catch (searchError) {
                console.error('YouTube search error:', searchError);
                return reply("❌ Failed to search YouTube. Try providing a direct URL instead.");
            }
        }

        // Download audio
        await conn.sendMessage(from, {
            text: "⬇️ *Downloading audio...* This may take a moment",
            contextInfo: getContextInfo("Downloading", sender, videoThumbnail)
        }, { quoted: m });

        try {
            const downloadAPIs = [
                {
                    type: 'keith',
                    url: `https://apiskeith.vercel.app/download/audio?url=${encodeURIComponent(videoUrl)}`,
                    timeout: 30000,
                    validate: (data) => data?.result && typeof data.result === 'string'
                },
                {
                    type: 'rest-lily',
                    url: `https://rest-lily.vercel.app/api/download/yta?url=${encodeURIComponent(videoUrl)}`,
                    timeout: 30000,
                    validate: (data) => data?.result && typeof data.result === 'string'
                }
            ];

            const downloadResult = await tryMultipleAPIs(downloadAPIs);
            if (!downloadResult.success) {
                return reply("❌ Download failed. The video may be unavailable or too long. Try another video.");
            }

            const downloadUrl = downloadResult.data.result;
            const fileName = `${videoTitle.replace(/[^\w\s.-]/gi, '')}.mp3`.slice(0, 50);
            const contextInfo = getContextInfo(videoTitle, sender, videoThumbnail);

            // Send audio
            await conn.sendMessage(from, {
                audio: { url: downloadUrl },
                mimetype: "audio/mpeg",
                fileName: fileName,
                contextInfo: contextInfo
            }, { quoted: m });

        } catch (downloadError) {
            console.error('Download error:', downloadError);
            return reply(`❌ Download failed: ${downloadError.message}`);
        }

    } catch (error) {
        console.error('Audio download error:', error);
        reply(`❌ Error: ${error.message}`);
    }
});

// YouTube Video Download with Fallbacks
cmd({
    pattern: "video",
    alias: ["videodoc", "film", "mp4", "ytmp4", "ytv"],
    desc: "Download Video from YouTube",
    category: "download",
    react: "🎥",
    filename: __filename
}, async (conn, m, { from, sender, reply, arg }) => {
    try {
        if (!arg[0]) {
            return reply("🎥 *Usage:* .video <video name or YouTube URL>\n\nExample: .video Taylor Swift Anti-Hero");
        }

        const query = arg.join(" ");
        let videoUrl, videoTitle, videoThumbnail;

        // Extract YouTube URL if provided
        if (query.match(/(youtube\.com|youtu\.be)/i)) {
            videoUrl = query;
            const videoId = videoUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i)?.[1];
            if (!videoId) {
                return reply("❌ Invalid YouTube URL provided.");
            }
            videoTitle = "YouTube Video";
            videoThumbnail = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
        } else {
            // Search for video
            await conn.sendMessage(from, {
                text: "🔍 *Searching YouTube...* Please wait",
                contextInfo: getContextInfo("Searching", sender)
            }, { quoted: m });

            try {
                const searchAPIs = [
                    {
                        type: 'keith',
                        url: `https://apiskeith.vercel.app/search/yts?query=${encodeURIComponent(query)}`,
                        timeout: 15000,
                        validate: (data) => data?.result && Array.isArray(data.result) && data.result.length > 0
                    }
                ];

                const searchResult = await tryMultipleAPIs(searchAPIs);
                if (!searchResult.success) {
                    return reply("❌ No videos found. Please try a direct YouTube URL.");
                }

                const firstVideo = searchResult.data.result[0];
                videoUrl = firstVideo.url || firstVideo.link;
                videoTitle = firstVideo.title;
                videoThumbnail = firstVideo.thumbnail || firstVideo.image;
            } catch (searchError) {
                console.error('YouTube search error:', searchError);
                return reply("❌ Failed to search YouTube.");
            }
        }

        // Download video
        await conn.sendMessage(from, {
            text: "⬇️ *Downloading video...* This may take a moment",
            contextInfo: getContextInfo("Downloading", sender, videoThumbnail)
        }, { quoted: m });

        try {
            const downloadAPIs = [
                {
                    type: 'keith',
                    url: `https://apiskeith.vercel.app/download/video?url=${encodeURIComponent(videoUrl)}`,
                    timeout: 30000,
                    validate: (data) => data?.result && typeof data.result === 'string'
                }
            ];

            const downloadResult = await tryMultipleAPIs(downloadAPIs);
            if (!downloadResult.success) {
                return reply("❌ Download failed. The video may be unavailable. Try another video.");
            }

            const downloadUrl = downloadResult.data.result;
            const fileName = `${videoTitle.replace(/[^\w\s.-]/gi, '')}.mp4`.slice(0, 50);
            const contextInfo = getContextInfo(videoTitle, sender, videoThumbnail);

            // Send video
            await conn.sendMessage(from, {
                video: { url: downloadUrl },
                mimetype: "video/mp4",
                caption: `🎥 *${videoTitle}*`,
                contextInfo: contextInfo
            }, { quoted: m });

        } catch (downloadError) {
            console.error('Download error:', downloadError);
            return reply(`❌ Download failed: ${downloadError.message}`);
        }

    } catch (error) {
        console.error('Video download error:', error);
        reply(`❌ Error: ${error.message}`);
    }
});

// YouTube Search Command
cmd({
    pattern: "ytsearch",
    alias: ["youtube", "yt", "yts"],
    desc: "Search YouTube Videos",
    category: "download",
    react: "🔍",
    filename: __filename
}, async (conn, m, { from, sender, reply, arg }) => {
    try {
        if (!arg[0]) {
            return reply("🔍 *Usage:* .ytsearch <search query>\n\nExample: .ytsearch Imagine Dragons");
        }

        const query = arg.join(" ");

        await conn.sendMessage(from, {
            text: "🔍 *Searching YouTube...*",
            contextInfo: getContextInfo("Searching", sender)
        }, { quoted: m });

        try {
            const searchAPIs = [
                {
                    type: 'keith',
                    url: `https://apiskeith.vercel.app/search/yts?query=${encodeURIComponent(query)}`,
                    timeout: 15000,
                    validate: (data) => data?.result && Array.isArray(data.result) && data.result.length > 0
                }
            ];

            const searchResult = await tryMultipleAPIs(searchAPIs);
            if (!searchResult.success) {
                return reply("❌ No videos found for that search.");
            }

            const videos = searchResult.data.result.slice(0, 5);
            let message = `🔍 *YouTube Search Results*\n*Query:* ${query}\n\n`;

            videos.forEach((video, index) => {
                message += `${index + 1}. *${video.title || 'Unknown'}*\n`;
                message += `📺 ${video.channel || 'Unknown Channel'}\n`;
                message += `🔗 ${video.url}\n\n`;
            });

            message += `\n_Use .play or .video to download_`;

            await conn.sendMessage(from, {
                image: { url: videos[0].thumbnail || videos[0].image },
                caption: message,
                contextInfo: getContextInfo(`Search: ${query}`, sender, videos[0].thumbnail)
            }, { quoted: m });

        } catch (searchError) {
            console.error('YouTube search error:', searchError);
            return reply("❌ Failed to search YouTube.");
        }

    } catch (error) {
        console.error('Search error:', error);
        reply(`❌ Error: ${error.message}`);
    }
});
