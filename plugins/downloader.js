const { cmd } = require("../command");
const axios = require("axios");

const BASE_API = "https://api.cinemind.name.ng/api";

const DOWNLOAD_SOURCES = {
    instagram: { endpoint: "instagram-dl", label: "Instagram Downloader" },
    tiktok: { endpoint: "tiktok-dl", label: "TikTok Downloader" },
    youtube: { endpoint: "youtube-dl", label: "YouTube Downloader" },
    ytmp3: { endpoint: "ytmp3", label: "YouTube MP3" },
    ytmp4: { endpoint: "ytmp4", label: "YouTube MP4" },
    facebook: { endpoint: "facebook-dl", label: "Facebook Downloader" },
    twitter: { endpoint: "twitter-dl", label: "Twitter/X Downloader" },
    spotify: { endpoint: "spotify-dl", label: "Spotify Downloader" },
    mediafire: { endpoint: "mediafire-dl", label: "MediaFire Downloader" },
    gdrive: { endpoint: "gdrive-dl", label: "Google Drive Downloader" },
    aio: { endpoint: "aio-dl", label: "AIO Downloader" },
    website: { endpoint: "website-dl", label: "Website Scraper" },
    apk: { endpoint: "apk-dl", label: "APK Downloader" },
    thumbnail: { endpoint: "youtube-thumbnail", label: "YouTube Thumbnail" },
    igprofile: { endpoint: "ig-profile-info", label: "Instagram Profile Info" },
    bilibili: { endpoint: "bilibili-dl", label: "Bilibili Downloader" }
};

function sanitizeJsonResponse(data) {
    if (!data) return "No data returned from API.";
    if (typeof data === "string") return data;
    if (data.url) return data.url;
    if (data.result && Array.isArray(data.result)) {
        return data.result.map((item, index) => `#${index + 1}: ${item.url || item}`).join("\n");
    }
    if (data.result) return JSON.stringify(data.result, null, 2);
    return JSON.stringify(data, null, 2);
}

function describeSources() {
    const lines = ["*Supported download sources:*\n"];
    for (const key in DOWNLOAD_SOURCES) {
        lines.push(`- ${key}: ${DOWNLOAD_SOURCES[key].label}`);
    }
    lines.push("\nUsage: .download <source> <url>");
    lines.push("Example: .download instagram https://instagram.com/p/xxxx");
    return lines.join("\n");
}

async function runShareDownloader(conn, mek, from, source, url, reply, requestedType) {
    if (!url || !/^https?:\/\//i.test(url)) {
        return reply(`❌ Please provide a valid URL. Example: .${requestedType} https://...`);
    }

    if (!source || !DOWNLOAD_SOURCES[source]) {
        return reply(`❌ Unknown source for .${requestedType}: ${source}\nUse .dlmenu to see supported sources.`);
    }

    const { endpoint, label } = DOWNLOAD_SOURCES[source];
    await reply(`⏳ ${requestedType.toUpperCase()} download: retrieving data from API...`);

    const apiUrl = `${BASE_API}/${endpoint}?url=${encodeURIComponent(url)}`;
    const response = await axios.get(apiUrl, { timeout: 120000 });

    if (!response || !response.data) {
        return reply("❌ Error: empty response from downloader API.");
    }

    let output = sanitizeJsonResponse(response.data);
    const replyText = `*${label}*\nType: ${requestedType}\nURL: ${url}\n\n*Result:*\n${output}`;
    return conn.sendMessage(from, { text: replyText }, { quoted: mek });
}

function sourceForType(type, url) {
    const lower = url.toLowerCase();
    if (type === "audio" || type === "song") {
        if (lower.includes("spotify.com")) return "spotify";
        if (lower.includes("youtube.com") || lower.includes("youtu.be")) return "ytmp3";
        if (lower.includes("tiktok.com")) return "tiktok";
        return "aio";
    }

    if (type === "video") {
        if (lower.includes("youtube.com") || lower.includes("youtu.be")) return "ytmp4";
        if (lower.includes("tiktok.com")) return "tiktok";
        if (lower.includes("instagram.com")) return "instagram";
        return "aio";
    }

    return "aio";
}

cmd({
    pattern: "download",
    alias: ["dl", "downloader"],
    react: "⬇️",
    desc: "Download media from various platforms via API",
    category: "downloader",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) {
            return reply(describeSources());
        }

        const [sourceRaw, ...urlParts] = q.trim().split(/\s+/);
        const source = sourceRaw?.toLowerCase();
        const url = urlParts.join(" ");

        if (!source || !DOWNLOAD_SOURCES[source]) {
            return reply(`❌ Unknown source: ${source || 'none'}\n\n${describeSources()}`);
        }

        if (!url || !/^https?:\/\//i.test(url)) {
            return reply("❌ Please provide a valid URL after the source. Example: .download tiktok https://www.tiktok.com/... ");
        }

        const { endpoint, label } = DOWNLOAD_SOURCES[source];
        await reply(`⏳ ${label}: retrieving data from API...`);

        const apiUrl = `${BASE_API}/${endpoint}?url=${encodeURIComponent(url)}`;
        const response = await axios.get(apiUrl, { timeout: 120000 });

        if (!response || !response.data) {
            return reply("❌ Error: empty response from downloader API.");
        }

        let output = sanitizeJsonResponse(response.data);

        if (source === "ytmp3" || source === "ytmp4" || source === "youtube") {
            // if response contains direct URL string, try send as media if small enough
            if (typeof response.data === "object" && response.data.url) {
                output = response.data.url;
            }
        }

        const replyText = `*${label}*\nSource: ${source}\nURL: ${url}\n\n*Result:*\n${output}`;

        await conn.sendMessage(from, { text: replyText }, { quoted: mek });

    } catch (error) {
        console.error("Downloader plugin error:", error);
        const errText = error.response?.data ? JSON.stringify(error.response.data, null, 2) : error.message;
        await reply(`❌ Download error: ${errText}`);
    }
});

cmd({
    pattern: "song",
    alias: ["music", "mp3"],
    react: "🎵",
    desc: "Download song / audio from URL (Spotify / YouTube / TikTok)",
    category: "downloader",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    const url = q ? q.trim() : "";
    if (!url) return reply("❌ Usage: .song <url>\nTry .youtube or .spotify links");
    const source = sourceForType("song", url);
    await runShareDownloader(conn, mek, from, source, url, reply, "song");
});

cmd({
    pattern: "audio",
    alias: ["mp3", "sound"],
    react: "🎧",
    desc: "Download audio from any supported URL",
    category: "downloader",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    const url = q ? q.trim() : "";
    if (!url) return reply("❌ Usage: .audio <url>");
    const source = sourceForType("audio", url);
    await runShareDownloader(conn, mek, from, source, url, reply, "audio");
});

cmd({
    pattern: "video",
    alias: ["mp4", "vid"],
    react: "🎬",
    desc: "Download video from any supported URL",
    category: "downloader",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    const url = q ? q.trim() : "";
    if (!url) return reply("❌ Usage: .video <url>");
    const source = sourceForType("video", url);
    await runShareDownloader(conn, mek, from, source, url, reply, "video");
});

cmd({
    pattern: "dlmenu",
    alias: ["downloadermenu"],
    react: "📥",
    desc: "Show the list of downloader APIs",
    category: "downloader",
    filename: __filename
}, async (conn, mek, m, { from, reply }) => {
    await reply(describeSources());
});