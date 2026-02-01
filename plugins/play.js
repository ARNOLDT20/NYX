// play.js - YouTube Download Plugin
const config = require('../config');
const { cmd } = require('../command');
const axios = require('axios');
const { ytsearch } = require('@dark-yasiya/yt-dl.js');

// Common contextInfo configuration
const getContextInfo = (title = '', userJid = '', thumbnailUrl = '') => ({
    mentionedJid: [userJid],
    forwardingScore: 999,
    isForwarded: true,
    forwardedNewsletterMessageInfo: {
        newsletterJid: config.NEWSLETTER_JID || "120363421014261315@newsletter",
        newsletterName: config.BOT_NAME || 'NYX Bot',
        serverMessageId: Math.floor(100000 + Math.random() * 900000),
    },
    externalAdReply: {
        showAdAttribution: true,
        title: config.BOT_NAME || 'YouTube Downloader',
        body: title || "Media Downloader",
        thumbnailUrl: thumbnailUrl || config.MENU_IMAGE_URL || '',
        sourceUrl: config.CHANNEL_LINK || '',
        mediaType: 1,
        renderLargerThumbnail: false
    }
});

// Audio download command
cmd({
    pattern: "play",
    alias: ["song", "audio", "mp3", "ytmp3", "yta"],
    desc: "Download Audio from YouTube",
    category: "download",
    react: "🎵",
    filename: __filename
}, async (conn, mek, m, { from, quoted, sender, reply, args, q }) => {
    try {
        const arg = args || (q ? String(q).trim().split(/\s+/) : []);
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
            // Search for the video
            await reply("🔍 Searching YouTube... This may take a moment...");

            try {
                const searchResponse = await ytsearch(query);
                const video = searchResponse?.results?.[0];

                if (!video) {
                    return reply("No videos found for your search query.");
                }

                videoUrl = video.url;
                videoTitle = video.title;
                videoThumbnail = video.thumbnail;
            } catch (searchError) {
                console.error('YouTube search error:', searchError);
                return reply("Failed to search YouTube. Please try again.");
            }
        }

        // Download audio using multiple API fallbacks
        await reply("⬇️ Downloading audio... This may take a moment...");

        const audioApis = [
            {
                method: 'get',
                url: `https://apiskeith.vercel.app/download/audio?url=${encodeURIComponent(videoUrl)}`,
                parse: (d) => d?.result || d?.url || d?.data || null
            },
            {
                method: 'post',
                url: `https://api.cobalt.tools/api/json`,
                body: { url: videoUrl, vQuality: '128', aFormat: 'mp3' },
                parse: (d) => d?.url || d?.links?.download?.url || null
            },
            {
                method: 'get',
                url: `https://api.vihangayt.com/download?url=${encodeURIComponent(videoUrl)}&type=audio`,
                parse: (d) => d?.result || d?.url || d?.data?.url || null
            }
        ];

        let resolved = false;
        let lastError = null;

        for (const api of audioApis) {
            try {
                let res;
                if (api.method === 'post') {
                    res = await axios.post(api.url, api.body, { headers: { 'Content-Type': 'application/json' }, timeout: 30000 });
                } else {
                    res = await axios.get(api.url, { timeout: 30000 });
                }

                const downloadUrl = api.parse(res.data);
                if (!downloadUrl) {
                    lastError = new Error('No download URL in API response');
                    continue;
                }

                const fileName = `${videoTitle}.mp3`.replace(/[^\w\s.-]/gi, '');
                const contextInfo = getContextInfo(videoTitle, sender, videoThumbnail);

                // Try sending by URL first
                try {
                    await conn.sendMessage(from, {
                        audio: { url: downloadUrl },
                        mimetype: 'audio/mpeg',
                        fileName: fileName,
                        contextInfo
                    }, { quoted: mek });

                    resolved = true;
                    break;
                } catch (sendErr) {
                    // fallback to downloading the bytes and sending buffer
                    try {
                        const audioRes = await axios.get(downloadUrl, { responseType: 'arraybuffer', timeout: 60000 });
                        if (audioRes.data && audioRes.data.byteLength > 1000) {
                            await conn.sendMessage(from, {
                                audio: audioRes.data,
                                mimetype: 'audio/mpeg',
                                fileName: fileName,
                                contextInfo
                            }, { quoted: mek });
                            resolved = true;
                            break;
                        } else {
                            lastError = new Error('Downloaded empty audio');
                        }
                    } catch (bufErr) {
                        lastError = bufErr;
                        continue;
                    }
                }

            } catch (err) {
                lastError = err;
                continue;
            }
        }

        if (!resolved) {
            console.error('Audio download failed for all APIs:', lastError);
            return reply(`Download failed: ${lastError?.message || 'No available API worked'}`);
        }

    } catch (error) {
        console.error('Audio download error:', error);
        reply(`Error: ${error.message}`);
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
}, async (conn, mek, m, { from, quoted, sender, reply, args, q }) => {
    try {
        const arg = args || (q ? String(q).trim().split(/\s+/) : []);
        if (!arg[0]) {
            return reply("Please provide a video name or YouTube URL.\nExample: .video Lara Croft");
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
            // Search for the video
            await reply("🔍 Searching YouTube... This may take a moment...");

            try {
                const searchResponse = await ytsearch(query);
                const video = searchResponse?.results?.[0];

                if (!video) {
                    return reply("No videos found for your search query.");
                }

                videoUrl = video.url;
                videoTitle = video.title;
                videoThumbnail = video.thumbnail;
            } catch (searchError) {
                console.error('YouTube search error:', searchError);
                return reply("Failed to search YouTube. Please try again.");
            }
        }

        // Download video using multiple API fallbacks
        await reply("⬇️ Downloading video... This may take a moment...");

        const videoApis = [
            `https://apiskeith.vercel.app/download/video?url=${encodeURIComponent(videoUrl)}`,
            `https://api.vihangayt.com/download?url=${encodeURIComponent(videoUrl)}&type=video`,
            `https://api.yt-downloader.org/download?url=${encodeURIComponent(videoUrl)}&type=video`
        ];

        let vResolved = false;
        let vLastErr = null;

        for (const apiUrl of videoApis) {
            try {
                const res = await axios.get(apiUrl, { timeout: 30000 });
                const downloadUrl = res.data?.result || res.data?.downloadUrl || res.data?.url || res.data?.videoUrl || null;
                if (!downloadUrl) {
                    vLastErr = new Error('No download URL in API response');
                    continue;
                }

                const fileName = `${videoTitle}.mp4`.replace(/[^\w\s.-]/gi, '');
                const contextInfo = getContextInfo(videoTitle, sender, videoThumbnail);

                try {
                    await conn.sendMessage(from, {
                        video: { url: downloadUrl },
                        mimetype: 'video/mp4',
                        caption: `🎥 *${videoTitle}*`,
                        contextInfo
                    }, { quoted: mek });

                    vResolved = true;
                    break;
                } catch (sendErr) {
                    // try to send as document (fallback)
                    try {
                        await conn.sendMessage(from, {
                            document: { url: downloadUrl },
                            mimetype: 'video/mp4',
                            fileName,
                            caption: `📁 *${videoTitle}* (Document)`,
                            contextInfo
                        }, { quoted: mek });
                        vResolved = true;
                        break;
                    } catch (docErr) {
                        vLastErr = docErr;
                        continue;
                    }
                }

            } catch (err) {
                vLastErr = err;
                continue;
            }
        }

        if (!vResolved) {
            console.error('Video download failed for all APIs:', vLastErr);
            return reply(`Download failed: ${vLastErr?.message || 'No available API worked'}`);
        }

    } catch (error) {
        console.error('Video download error:', error);
        reply(`Error: ${error.message}`);
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
}, async (conn, mek, m, { from, quoted, sender, reply, args, q }) => {
    try {
        const arg = args || (q ? String(q).trim().split(/\s+/) : []);
        if (!arg[0]) {
            return reply("Please provide a search query.\nExample: .ytsearch Imagine Dragons");
        }

        const query = arg.join(" ");

        await reply("🔍 Searching YouTube...");

        try {
            const searchResponse = await ytsearch(query);
            const videos = searchResponse?.results;

            if (!Array.isArray(videos) || videos.length === 0) {
                return reply("No videos found for your search query.");
            }

            // Display first 5 results
            const topVideos = videos.slice(0, 5);

            let resultMessage = `📺 *YouTube Search Results*\n\n`;

            topVideos.forEach((video, index) => {
                resultMessage += `${index + 1}. *${video.title}*\n`;
                resultMessage += `   ⏱️ ${video.timestamp || "Unknown"}\n`;
                resultMessage += `   👁️ ${video.views || "Unknown"}\n`;
                resultMessage += `   👤 ${video.author?.name || "Unknown"}\n`;
                resultMessage += `   🔗 ${video.url}\n\n`;
            });

            if (videos.length > 5) {
                resultMessage += `📊 *${videos.length - 5} more results available*\n`;
            }

            resultMessage += `\n*Usage:*\nUse .play <URL> to download audio\nUse .video <URL> to download video`;

            const contextInfo = getContextInfo("YouTube Search Results", sender, topVideos[0]?.thumbnail);

            await conn.sendMessage(from, {
                text: resultMessage,
                contextInfo: contextInfo
            }, { quoted: mek });

        } catch (searchError) {
            console.error('YouTube search error:', searchError);
            return reply(`Search failed: ${searchError.message}`);
        }

    } catch (error) {
        console.error('YouTube search error:', error);
        reply(`Error: ${error.message}`);
    }
});
