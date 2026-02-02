const axios = require("axios");
const { cmd } = require("../command");

cmd({
    pattern: "tiktok2",
    alias: ["tt", "ttdl", "tiktokdl"],
    desc: "Download TikTok video or audio",
    category: "downloader",
    react: "🎵",
    filename: __filename
},
    async (conn, mek, m, { from, q, reply }) => {
        try {
            if (!q) return reply("📝 Please provide a TikTok video URL.");
            if (!/^https?:\/\/(www\.)?tiktok\.com\/.+$/.test(q)) return reply("❌ Invalid TikTok link.");

            reply("⏳ Fetching TikTok video, please wait...");

            const apiUrl = `https://delirius-apiofc.vercel.app/download/tiktok?url=${encodeURIComponent(q)}`;
            const { data } = await axios.get(apiUrl);

            if (!data || !data.status || !data.data || !data.data.meta) {
                return reply("⚠️ Couldn't retrieve the video. Please try another link.");
            }

            const { title, like, comment, share, author, meta } = data.data;
            const videoData = meta.media.find(v => v.type === "video");

            if (!videoData || !videoData.org) return reply("❌ Video URL not found.");
            const videoUrl = videoData.org;

            // Prepare list
            const sections = [
                {
                    title: "📥 Download Options",
                    rows: [
                        {
                            title: "▶️ Send as Video",
                            description: "Send TikTok video as streamable",
                            rowId: `.ttvideo ${videoUrl}`
                        },
                        {
                            title: "🗂️ Send as Document",
                            description: "Send TikTok video as file/document",
                            rowId: `.ttdoc ${videoUrl}`
                        },
                        {
                            title: "🎧 Send as Audio",
                            description: "Extract and send audio",
                            rowId: `.ttaudio ${videoUrl}`
                        }
                    ]
                }
            ];

            const listMessage = {
                text: `🎵 TikTok video found!

👤 User: ${author.nickname} (@${author.username})
📖 Title: ${title}
👍 Likes: ${like} | 💬 Comments: ${comment} | 🔁 Shares: ${share}

Select how you'd like to download below:`,
                footer: "NYX-XMD TikTok Downloader",
                buttonText: "📁 Select Format",
                sections
            };

            await conn.sendMessage(from, listMessage, { quoted: mek });

        } catch (e) {
            console.error("List menu TikTok error:", e);
            reply(`❌ Error occurred: ${e.message}`);
        }
    });
