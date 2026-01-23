const config = require('../config');
const { cmd } = require('../command');
const { ytsearch } = require('@dark-yasiya/yt-dl.js');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const ytdl = require('ytdl-core');

cmd({
    pattern: "play",
    alias: ["ytplay", "ytmp3", "song", "audio", "yta"],
    react: "🎵",
    desc: "Download YouTube audio with multiple API fallbacks",
    category: "download",
    use: '.play <song name or YouTube URL>',
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

        // Multiple API endpoints as fallbacks - tested working APIs
        const apis = [
            `https://api.davidcyriltech.my.id/download/ytaudio?url=${encodeURIComponent(videoUrl)}`,
            `https://api.vihangayt.com/download?url=${encodeURIComponent(videoUrl)}&type=audio`,
            `https://rest.firebear.cloud/download/youtube/audio?url=${encodeURIComponent(videoUrl)}`,
            `https://y2api.getAwesomeness.app/api/v1/convert?url=${encodeURIComponent(videoUrl)}&operationType=Download`,
            `https://api.cobalt.tools/api/json?url=${encodeURIComponent(videoUrl)}&vQuality=128`
        ];

        let success = false;

        for (const api of apis) {
            try {
                console.log(`Trying API: ${api}`);
                const res = await axios.get(api, { timeout: 30000 });

                // Extract audio URL from different API response formats
                let audioUrl = res.data?.result?.downloadUrl ||
                    res.data?.url ||
                    res.data?.download?.url ||
                    res.data?.data?.downloadURL ||
                    res.data?.data?.url ||
                    res.data?.result ||
                    res.data?.downloadUrl ||
                    (typeof res.data === 'string' && res.data);

                if (!audioUrl) {
                    console.warn(`No audio URL found in API response: ${api}`);
                    continue;
                }

                console.log(`Downloading from: ${audioUrl}`);

                // Download and convert audio
                const stream = await axios({
                    url: audioUrl,
                    method: "GET",
                    responseType: "stream",
                    timeout: 60000
                });

                if (stream.status !== 200) {
                    console.warn(`Stream failed with status: ${stream.status}`);
                    continue;
                }

                // Convert to MP3 using ffmpeg
                await new Promise((resolve, reject) => {
                    ffmpeg(stream.data)
                        .audioCodec('libmp3lame')
                        .audioBitrate(128)
                        .format('mp3')
                        .on('end', () => {
                            console.log('Audio conversion completed');
                            resolve();
                        })
                        .on('error', (err) => {
                            console.error('FFmpeg error:', err);
                            reject(err);
                        })
                        .save(outputPath);
                });

                // Verify file was created
                if (!fs.existsSync(outputPath)) {
                    throw new Error('Output file not created');
                }

                const fileStats = fs.statSync(outputPath);
                if (fileStats.size === 0) {
                    throw new Error('Output file is empty');
                }

                console.log(`File created successfully: ${outputPath} (${fileStats.size} bytes)`);

                // Send audio file
                await conn.sendMessage(from, {
                    audio: fs.readFileSync(outputPath),
                    mimetype: 'audio/mpeg',
                    fileName: `${title}.mp3`,
                    ptt: false
                }, { quoted: mek });

                // Clean up
                fs.unlinkSync(outputPath);
                success = true;

                // Send success reaction
                await conn.sendMessage(from, {
                    react: { text: "✅", key: mek.key }
                });

                break;

            } catch (err) {
                console.warn(`⚠️ API failed: ${api} -`, err.message);
                continue;
            }
        }

        if (!success) {
            // Final fallback: try downloading directly with ytdl-core
            try {
                console.log('Attempting fallback with ytdl-core...');
                const info = await ytdl.getInfo(videoUrl);
                const audioFormat = ytdl.chooseFormat(info.formats, { quality: 'highestaudio' });
                if (audioFormat && audioFormat.url) {
                    const stream = ytdl.downloadFromInfo(info, { quality: 'highestaudio' });

                    await new Promise((resolve, reject) => {
                        ffmpeg(stream)
                            .audioCodec('libmp3lame')
                            .audioBitrate(128)
                            .format('mp3')
                            .on('end', () => {
                                resolve();
                            })
                            .on('error', (err) => {
                                reject(err);
                            })
                            .save(outputPath);
                    });

                    if (fs.existsSync(outputPath)) {
                        await conn.sendMessage(from, {
                            audio: fs.readFileSync(outputPath),
                            mimetype: 'audio/mpeg',
                            fileName: `${title}.mp3`,
                            ptt: false
                        }, { quoted: mek });
                        fs.unlinkSync(outputPath);
                        success = true;
                        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });
                    }
                }
            } catch (ydlErr) {
                console.warn('ytdl-core fallback failed:', ydlErr && ydlErr.message ? ydlErr.message : ydlErr);
            }
            // Try one final fallback - send audio directly without conversion
            for (const api of apis) {
                try {
                    const res = await axios.get(api, { timeout: 30000 });
                    let audioUrl = res.data?.result?.downloadUrl ||
                        res.data?.url ||
                        res.data?.data?.downloadURL ||
                        res.data?.result;

                    if (audioUrl) {
                        await conn.sendMessage(from, {
                            audio: { url: audioUrl },
                            mimetype: "audio/mpeg",
                            fileName: `${title}.mp3`
                        }, { quoted: mek });

                        await conn.sendMessage(from, {
                            react: { text: "✅", key: mek.key }
                        });
                        success = true;
                        break;
                    }
                } catch (finalErr) {
                    continue;
                }
            }
        }

        if (!success) {
            await conn.sendMessage(from, {
                react: { text: "❌", key: mek.key }
            });
            reply("🚫 *All download servers failed. Please try again later.*");
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
    pattern: "video",
    alias: ["ytmp4", "ytvideo", "yta4"],
    react: "🎬",
    desc: "Download YouTube video with multiple API fallbacks",
    category: "download",
    use: '.play4 <video name or YouTube URL>',
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
            `https://api.davidcyriltech.my.id/download/ytvideo?url=${encodeURIComponent(videoUrl)}`,
            `https://api.vihangayt.com/download?url=${encodeURIComponent(videoUrl)}&type=video`,
            `https://rest.firebear.cloud/download/youtube?url=${encodeURIComponent(videoUrl)}`,
            `https://y2api.getAwesomeness.app/api/v1/convert?url=${encodeURIComponent(videoUrl)}&operationType=Download`
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
    pattern: "play2",
    alias: ["yta2", "song2"],
    react: "🎵",
    desc: "Download high quality YouTube audio",
    category: "media",
    use: "<song name>",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return reply("Please provide a song name\nExample: .play2 Tum Hi Ho");

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
            `https://api.davidcyriltech.my.id/download/ytaudio?url=${encodeURIComponent(vid.url)}`,
            `https://api.vihangayt.com/download?url=${encodeURIComponent(vid.url)}&type=audio`,
            `https://rest.firebear.cloud/download/youtube/audio?url=${encodeURIComponent(vid.url)}`
        ];

        let success = false;

        for (const api of apis) {
            try {
                const response = await axios.get(api, { timeout: 30000 });
                let audioUrl;

                // Handle different API response formats
                if (api.includes('api.vihangayt')) {
                    audioUrl = response.data?.url || response.data?.data?.url;
                } else if (api.includes('rest.firebear')) {
                    audioUrl = response.data?.url || response.data?.data?.url;
                } else if (api.includes('y2api')) {
                    audioUrl = response.data?.links?.download?.url;
                } else if (api.includes('cobalt')) {
                    audioUrl = response.data?.url;
                } else {
                    audioUrl = response.data?.download?.url || response.data?.url || response.data?.result;
                }

                if (!audioUrl) continue;

                // Download audio
                const audioRes = await axios({
                    url: audioUrl,
                    method: "GET",
                    responseType: "arraybuffer",
                    timeout: 60000
                });

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
                console.warn(`Play2 API failed: ${api} -`, err.message);
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
