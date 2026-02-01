const config = require('../config');
const { cmd } = require('../command');
const axios = require('axios');

// Common contextInfo configuration for downloads
const getContextInfo = (title = '', userJid = '', thumbnailUrl = '') => ({
    mentionedJid: [userJid],
    forwardingScore: 999,
    isForwarded: true,
    forwardedNewsletterMessageInfo: {
        newsletterJid: "120363421014261315@newsletter",
        newsletterName: config.BOT_NAME || "NYX Bot",
        serverMessageId: Math.floor(100000 + Math.random() * 900000),
    },
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

// YouTube Audio Download
cmd({
    pattern: "play",
    alias: ["song", "audio", "mp3", "ytmp3", "yta"],
    desc: "Download Audio from YouTube",
    category: "download",
    react: "🎵",
    filename: __filename
}, async (conn, m, { from, quoted, sender, reply, arg }) => {
    try {
        if (!arg[0]) {
            return reply("Please provide a song name or YouTube URL.\nExample: .play Imagine Dragons Believer");
        }

        const query = arg.join(" ");
        let videoUrl, videoTitle, videoThumbnail;

        // Check if input is a YouTube URL
        if (query.match(/(youtube\.com|youtu\.be)/i)) {
            videoUrl = query;
            const videoId = videoUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i)?.[1];
            if (!videoId) {
                return reply("Invalid YouTube URL provided.");
            }
            videoTitle = "YouTube Audio";
            videoThumbnail = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
        } else {
            // Search for the video using Keith API
            await conn.sendMessage(from, {
                text: "🔍 Searching YouTube... This may take a moment...",
                contextInfo: getContextInfo("Searching", sender)
            }, { quoted: m });

            try {
                const searchResponse = await axios.get(`https://apiskeith.vercel.app/search/yts?query=${encodeURIComponent(query)}`, { timeout: 15000 });
                const videos = searchResponse.data?.result;

                if (!Array.isArray(videos) || videos.length === 0) {
                    return reply("No videos found for your search query.");
                }

                const firstVideo = videos[0];
                videoUrl = firstVideo.url;
                videoTitle = firstVideo.title;
                videoThumbnail = firstVideo.thumbnail;
            } catch (searchError) {
                console.error('YouTube search error:', searchError);
                return reply("Failed to search YouTube. Please try again.");
            }
        }

        // Download audio using Keith API
        await conn.sendMessage(from, {
            text: "⬇️ Downloading audio... This may take a moment...",
            contextInfo: getContextInfo("Downloading", sender, videoThumbnail)
        }, { quoted: m });

        try {
            const downloadResponse = await axios.get(`https://apiskeith.vercel.app/download/audio?url=${encodeURIComponent(videoUrl)}`, { timeout: 30000 });
            const downloadUrl = downloadResponse.data?.result;

            if (!downloadUrl) {
                throw new Error("Failed to get download URL from API.");
            }

            const fileName = `${videoTitle}.mp3`.replace(/[^\w\s.-]/gi, '');
            const contextInfo = getContextInfo(videoTitle, sender, videoThumbnail);

            // Send audio stream
            await conn.sendMessage(from, {
                audio: { url: downloadUrl },
                mimetype: "audio/mpeg",
                fileName: fileName,
                contextInfo: contextInfo
            }, { quoted: m });

            // Send document stream (Optional)
            await conn.sendMessage(from, {
                document: { url: downloadUrl },
                mimetype: "audio/mpeg",
                fileName: fileName,
                contextInfo: {
                    ...contextInfo,
                    externalAdReply: {
                        ...contextInfo.externalAdReply,
                        body: 'Document version'
                    }
                }
            }, { quoted: m });

        } catch (downloadError) {
            console.error('Download error:', downloadError);
            return reply(`Download failed: ${downloadError.message}`);
        }

    } catch (error) {
        console.error('Audio download error:', error);
        reply(`Error: ${error.message}`);
    }
});

// YouTube Video Download
cmd({
    pattern: "video",
    alias: ["videodoc", "film", "mp4", "ytmp4", "ytv"],
    desc: "Download Video from YouTube",
    category: "download",
    react: "🎥",
    filename: __filename
}, async (conn, m, { from, quoted, sender, reply, arg }) => {
    try {
        if (!arg[0]) {
            return reply("Please provide a video name or YouTube URL.\nExample: .video Taylor Swift Anti-Hero");
        }

        const query = arg.join(" ");
        let videoUrl, videoTitle, videoThumbnail;

        // Check if input is a YouTube URL
        if (query.match(/(youtube\.com|youtu\.be)/i)) {
            videoUrl = query;
            const videoId = videoUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i)?.[1];
            if (!videoId) {
                return reply("Invalid YouTube URL provided.");
            }
            videoTitle = "YouTube Video";
            videoThumbnail = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
        } else {
            // Search for the video using Keith API
            await conn.sendMessage(from, {
                text: "🔍 Searching YouTube... This may take a moment...",
                contextInfo: getContextInfo("Searching", sender)
            }, { quoted: m });

            try {
                const searchResponse = await axios.get(`https://apiskeith.vercel.app/search/yts?query=${encodeURIComponent(query)}`, { timeout: 15000 });
                const videos = searchResponse.data?.result;

                if (!Array.isArray(videos) || videos.length === 0) {
                    return reply("No videos found for your search query.");
                }

                const firstVideo = videos[0];
                videoUrl = firstVideo.url;
                videoTitle = firstVideo.title;
                videoThumbnail = firstVideo.thumbnail;
            } catch (searchError) {
                console.error('YouTube search error:', searchError);
                return reply("Failed to search YouTube. Please try again.");
            }
        }

        // Download video using Keith API
        await conn.sendMessage(from, {
            text: "⬇️ Downloading video... This may take a moment...",
            contextInfo: getContextInfo("Downloading", sender, videoThumbnail)
        }, { quoted: m });

        try {
            const downloadResponse = await axios.get(`https://apiskeith.vercel.app/download/video?url=${encodeURIComponent(videoUrl)}`, { timeout: 30000 });
            const downloadUrl = downloadResponse.data?.result;

            if (!downloadUrl) {
                throw new Error("Failed to get download URL from API.");
            }

            const fileName = `${videoTitle}.mp4`.replace(/[^\w\s.-]/gi, '');
            const contextInfo = getContextInfo(videoTitle, sender, videoThumbnail);

            // Send video stream
            await conn.sendMessage(from, {
                video: { url: downloadUrl },
                mimetype: "video/mp4",
                caption: `🎥 *${videoTitle}*`,
                contextInfo: contextInfo
            }, { quoted: m });

            // Send document stream (Optional)
            await conn.sendMessage(from, {
                document: { url: downloadUrl },
                mimetype: "video/mp4",
                fileName: fileName,
                caption: `📁 *${videoTitle}* (Document)`,
                contextInfo: {
                    ...contextInfo,
                    externalAdReply: {
                        ...contextInfo.externalAdReply,
                        body: 'Document version'
                    }
                }
            }, { quoted: m });

        } catch (downloadError) {
            console.error('Download error:', downloadError);
            return reply(`Download failed: ${downloadError.message}`);
        }

    } catch (error) {
        console.error('Video download error:', error);
        reply(`Error: ${error.message}`);
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
}, async (conn, m, { from, quoted, sender, reply, arg }) => {
    try {
        if (!arg[0]) {
            return reply("Please provide a search query.\nExample: .ytsearch Imagine Dragons");
        }

        const query = arg.join(" ");

        await conn.sendMessage(from, {
            text: "🔍 Searching YouTube...",
            contextInfo: getContextInfo("Searching", sender)
        }, { quoted: m });

        try {
            const searchResponse = await axios.get(`https://apiskeith.vercel.app/search/yts?query=${encodeURIComponent(query)}`, { timeout: 15000 });
            const videos = searchResponse.data?.result;

            if (!Array.isArray(videos) || videos.length === 0) {
                return reply("No videos found for your search query.");
            }

            let message = `🔍 *YouTube Search Results for: ${query}*\n\n`;
            videos.slice(0, 5).forEach((video, index) => {
                message += `${index + 1}. *${video.title}*\n`;
                message += `📺 Channel: ${video.channel || 'Unknown'}\n`;
                message += `🔗 URL: ${video.url}\n`;
                message += `⏱️ Duration: ${video.duration || 'Unknown'}\n\n`;
            });

            message += `\n_Use .play or .video to download the media_`;

            await conn.sendMessage(from, {
                image: { url: videos[0].thumbnail },
                caption: message,
                contextInfo: getContextInfo(`Search: ${query}`, sender, videos[0].thumbnail)
            }, { quoted: m });

        } catch (searchError) {
            console.error('YouTube search error:', searchError);
            return reply("Failed to search YouTube. Please try again.");
        }

    } catch (error) {
        console.error('Search error:', error);
        reply(`Error: ${error.message}`);
    }
});
