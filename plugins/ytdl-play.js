const config = require('../config');
const { cmd } = require('../command');
const { ytsearch } = require('@dark-yasiya/yt-dl.js');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const ytdl = require('ytdl-core');

cmd({
    pattern: "playx",
    alias: ["ytplay"],
    react: "🎵",
    desc: "Download YouTube audio with multiple API fallbacks (legacy)",
    category: "download",
    use: '.playx <song name or YouTube URL>',
    filename: __filename
}, async (conn, mek, m, { from, reply, q }) => {
    try {
        let input = q || (m.quoted && m.quoted.text?.trim());
        if (!input) return reply("❌ *Please enter a song name or YouTube link!*");

        await reply("🔍 *Searching YouTube...*");

        // Search YouTube
        const search = await ytsearch(input);
        const vid = search?.results?.[0];
        if (!vid || !vid.url) return reply("❌ *No results found!*");

        const title = vid.title.replace(/[^\w\s.-]/gi, "").slice(0, 50);
        const videoUrl = vid.url;
        const duration = vid.timestamp || "Unknown";
        const views = vid.views || "Unknown";
        const author = vid.author?.name || "Unknown";

        const outputPath = path.join(__dirname, '..', 'temp', `${Date.now()}_${title}.mp3`);

        // Create temp directory if it doesn't exist
        const tempDir = path.join(__dirname, '..', 'temp');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        // Send video info
        await conn.sendMessage(from, {
            image: { url: vid.thumbnail },
            caption: `
╭───〘 🎬 𝚈𝙾𝚄𝚃𝚄𝙱𝙴 𝙸𝙽𝙵𝙾 〙───◆
│ 📝 *ᴛɪᴛʟᴇ:* ${vid.title}
│ ⏱️ *ᴅᴜʀᴀᴛɪᴘɴ:* ${duration}
│ 👁️ *ᴠɪᴇᴡs:* ${views}
│ 👤 *ᴀᴜᴛʜᴏʀ:* ${author}
│ 🔗 *ᴜʀʟ:* ${videoUrl}
╰───────────────◆
🎧 *Downloading audio...*
            `.trim()
        }, { quoted: mek });

        // Multiple API endpoints as fallbacks - simpler and more reliable
        const apis = [
            {
                url: `https://api.cobalt.tools/api/json`,
                headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
                body: { url: videoUrl, vQuality: '128', aFormat: 'mp3' },
                method: 'POST',
                parseUrl: (data) => data?.url || data?.links?.download?.url
            },
            {
                url: `https://yt-api.p.rapidapi.com/dl?url=${encodeURIComponent(videoUrl)}`,
                headers: {
                    'X-RapidAPI-Key': 'demo',
                    'X-RapidAPI-Host': 'yt-api.p.rapidapi.com'
                },
                method: 'GET',
                parseUrl: (data) => data?.result?.downloadUrl || data?.url
            },
            {
                url: `https://api.vihangayt.com/download?url=${encodeURIComponent(videoUrl)}&type=audio`,
                headers: { 'User-Agent': 'Mozilla/5.0' },
                method: 'GET',
                parseUrl: (data) => data?.url || data?.data?.url || data?.result
            }
        ];

        let success = false;

        for (const apiConfig of apis) {
            try {
                console.log(`Trying API: ${apiConfig.url}`);

                let res;
                if (apiConfig.method === 'POST') {
                    res = await axios.post(apiConfig.url, apiConfig.body, {
                        headers: apiConfig.headers,
                        timeout: 30000
                    });
                } else {
                    res = await axios.get(apiConfig.url, {
                        headers: apiConfig.headers,
                        timeout: 30000
                    });
                }

                // Extract audio URL using the parser
                let audioUrl = apiConfig.parseUrl(res.data);

                if (!audioUrl) {
                    console.warn(`No audio URL found in API response`);
                    console.log('Response data:', JSON.stringify(res.data).substring(0, 200));
                    continue;
                }

                // Download the audio file
                const audioRes = await axios({
                    url: audioUrl,
                    method: "GET",
                    responseType: "arraybuffer",
                    timeout: 60000,
                    headers: { 'User-Agent': 'Mozilla/5.0' }
                });

                if (!audioRes.data || audioRes.data.length === 0) {
                    console.warn(`No audio data downloaded`);
                    continue;
                }

                console.log(`Downloaded ${audioRes.data.length} bytes of audio`);

                // Send audio file directly - no conversion needed
                await conn.sendMessage(from, {
                    audio: audioRes.data,
                    mimetype: 'audio/mpeg',
                    fileName: `${title}.mp3`,
                    ptt: false
                }, { quoted: mek });

                // Send success reaction
                await conn.sendMessage(from, {
                    react: { text: "✅", key: mek.key }
                });

                success = true;
                break;

            } catch (err) {
                console.warn(`⚠️ API failed: ${api} -`, err.message);
                continue;
            }
        }

        if (!success) {
            await conn.sendMessage(from, {
                react: { text: "❌", key: mek.key }
            });
            reply("🚫 *All download servers failed. Please try again later.*\nℹ️ Try again or check if the video is available.");
        }

    } catch (e) {
        console.error("❌ Error in .play command:", e);

        // Clean up temp file if it exists
        try {
            if (fs.existsSync(outputPath)) {
                fs.unlinkSync(outputPath);
            }
        } catch (cleanupErr) {
            // Ignore cleanup errors
        }

        await conn.sendMessage(from, {
            react: { text: "❌", key: mek.key }
        });
        reply("🚨 *Something went wrong!*\n" + e.message);
    }
});

// Enhanced play4 command with multiple APIs
cmd({
    pattern: "videox",
    alias: ["ytmp4x"],
    react: "🎬",
    desc: "Download YouTube video with multiple API fallbacks (legacy)",
    category: "download",
    use: '.videox <video name or YouTube URL>',
    filename: __filename
}, async (conn, mek, m, { from, reply, q }) => {
    try {
        let input = q || (m.quoted && m.quoted.text?.trim());
        if (!input) return reply("❌ *Please enter a video name or YouTube link!*");

        await reply("🔍 *Searching YouTube...*");

        let videoUrl = '';
        let vid;

        // Handle both search and direct URL
        if (/^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\//i.test(input)) {
            videoUrl = input.trim();
            // For direct URLs, we need to get video info
            const search = await ytsearch(input);
            vid = search?.results?.[0];
        } else {
            const search = await ytsearch(input);
            vid = search?.results?.[0];
            if (!vid) return reply("❌ *No results found!*");
            videoUrl = vid.url;
        }

        if (!vid) return reply("❌ *Could not get video information!*");

        const title = vid.title.replace(/[^\w\s.-]/gi, "").slice(0, 50);

        // Send video info
        await conn.sendMessage(from, {
            image: { url: vid.thumbnail },
            caption: `
╭───〘 🎬 𝚈𝙾𝚄𝚃𝚄𝙱𝙴 𝚅𝙸𝙳𝙴𝙾 〙───◆
│ 📝 *ᴛɪᴛʟᴇ:* ${vid.title}
│ ⏱️ *ᴅᴜʀᴀᴛɪᴘɴ:* ${vid.timestamp || "Unknown"}
│ 👁️ *ᴠɪᴇᴡs:* ${vid.views || "Unknown"}
│ 👤 *ᴀᴜᴛʜᴏʀ:* ${vid.author?.name || "Unknown"}
╰───────────────◆
🎬 *Downloading video...*
            `.trim()
        }, { quoted: mek });

        // Video download APIs - using reliable endpoints
        const videoApis = [
            `https://api.yt-downloader.org/download?url=${encodeURIComponent(videoUrl)}&type=video`,
            `https://api.davidcyriltech.my.id/download/ytvideo?url=${encodeURIComponent(videoUrl)}`,
            `https://api.vihangayt.com/download?url=${encodeURIComponent(videoUrl)}&type=video`,
            `https://ytstream-download.p.rapidapi.com/info?url=${encodeURIComponent(videoUrl)}`
        ];

        let success = false;

        for (const api of videoApis) {
            try {
                const res = await axios.get(api, { timeout: 30000 });

                let downloadUrl = res.data?.result?.download ||
                    res.data?.downloadUrl ||
                    res.data?.url ||
                    res.data?.result?.url ||
                    res.data?.videoUrl;

                if (downloadUrl) {
                    await conn.sendMessage(from, {
                        video: { url: downloadUrl },
                        caption: `🎬 *${vid.title}*`,
                        fileName: `${title}.mp4`
                    }, { quoted: mek });

                    await conn.sendMessage(from, {
                        react: { text: "✅", key: mek.key }
                    });
                    success = true;
                    break;
                }
            } catch (err) {
                console.warn(`Video API failed: ${api} -`, err.message);
                continue;
            }
        }

        if (!success) {
            await conn.sendMessage(from, {
                react: { text: "❌", key: mek.key }
            });
            reply("🚫 *All video download servers failed. Please try again later.*");
        }

    } catch (e) {
        console.error("❌ Error in .play4 command:", e);
        await conn.sendMessage(from, {
            react: { text: "❌", key: mek.key }
        });
        reply("🚨 *Something went wrong while downloading video!*");
    }
});

// Keep the original play2 command but enhance it
cmd({
    pattern: "oldplay",
    alias: ["legacyplay"],
    react: "🎵",
    desc: "Download high quality YouTube audio (legacy)",
    category: "media",
    use: "<song name>",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return reply("Please provide a song name\nExample: .oldplay Tum Hi Ho");

        // Step 1: Search YouTube
        await conn.sendMessage(from, { text: "🔍 Searching for your song..." }, { quoted: mek });
        const yt = await ytsearch(q);
        if (!yt?.results?.length) return reply("❌ No results found. Try a different search term.");

        const vid = yt.results[0];

        const caption =
            `*YT AUDIO DOWNLOADER*
╭━━❐━⪼
┇๏ *Title*    –  ${vid.title}
┇๏ *Duration* –  ${vid.timestamp}
┇๏ *Views*    –  ${vid.views}
┇๏ *Author*   –  ${vid.author.name}
╰━━❑━⪼
> *Downloading Audio File ♡*`;

        // Step 2: Send video info with thumbnail
        await conn.sendMessage(from, {
            image: { url: vid.thumbnail },
            caption
        }, { quoted: mek });

        // Multiple API fallbacks for play2
        const apis = [
            {
                url: `https://api.cobalt.tools/api/json`,
                headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
                body: { url: vid.url, vQuality: '128', aFormat: 'mp3' },
                method: 'POST',
                parseUrl: (data) => data?.url || data?.links?.download?.url
            },
            {
                url: `https://api.vihangayt.com/download?url=${encodeURIComponent(vid.url)}&type=audio`,
                headers: { 'User-Agent': 'Mozilla/5.0' },
                method: 'GET',
                parseUrl: (data) => data?.url || data?.data?.url
            }
        ];

        let success = false;

        for (const apiConfig of apis) {
            try {
                console.log(`Trying play2 API: ${apiConfig.url}`);

                let response;
                if (apiConfig.method === 'POST') {
                    response = await axios.post(apiConfig.url, apiConfig.body, {
                        headers: apiConfig.headers,
                        timeout: 30000
                    });
                } else {
                    response = await axios.get(apiConfig.url, {
                        headers: apiConfig.headers,
                        timeout: 30000
                    });
                }

                let audioUrl = apiConfig.parseUrl(response.data);
                if (!audioUrl) {
                    console.warn('No audio URL found in response');
                    continue;
                }

                // Download audio
                const audioRes = await axios({
                    url: audioUrl,
                    method: "GET",
                    responseType: "arraybuffer",
                    timeout: 60000,
                    headers: { 'User-Agent': 'Mozilla/5.0' }
                });

                if (!audioRes.data || audioRes.data.length === 0) {
                    console.warn('Downloaded empty audio');
                    continue;
                }

                // Send audio
                await conn.sendMessage(from, {
                    audio: audioRes.data,
                    mimetype: 'audio/mpeg',
                    ptt: false,
                    fileName: `${vid.title}.mp3`.replace(/[^\w\s.-]/gi, '')
                }, { quoted: mek });

                success = true;
                await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });
                break;

            } catch (err) {
                console.warn(`Play2 API failed -`, err.message);
                continue;
            }
        }

        if (!success) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
            reply("❌ All download attempts failed. Please try again later.");
        }

    } catch (error) {
        console.error('Play2 command error:', error);
        reply("⚠️ An unexpected error occurred. Please try again.");
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
    }
});
