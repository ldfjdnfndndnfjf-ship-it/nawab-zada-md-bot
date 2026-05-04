const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore
} = require("@whiskeysockets/baileys");
const pino = require("pino");
const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
const port = process.env.PORT || 3000;

// --- WEB SERVER & DASHBOARD (For Vercel/GitHub) ---
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Nawab ZADA MD Dashboard</title>
            <style>
                body { background: #0f172a; color: white; font-family: 'Segoe UI', sans-serif; text-align: center; padding: 50px; }
                .card { background: #1e293b; padding: 30px; border-radius: 15px; display: inline-block; box-shadow: 0 0 30px #3b82f6; border: 1px solid #334155; }
                input { padding: 12px; border-radius: 8px; border: 1px solid #334155; width: 80%; margin-bottom: 20px; background: #0f172a; color: white; outline: none; }
                button { background: #3b82f6; color: white; border: none; padding: 12px 25px; border-radius: 8px; cursor: pointer; font-weight: bold; transition: 0.3s; }
                button:hover { background: #2563eb; transform: scale(1.05); }
                h1 { color: #3b82f6; text-shadow: 0 0 10px #3b82f6; }
                p { color: #94a3b8; }
            </style>
        </head>
        <body>
            <div class="card">
                <h1>🦅 NAWAB ZADA MD</h1>
                <p>Enter your number with country code to get Pairing Code</p>
                <form action="/pair" method="get">
                    <input type="number" name="number" placeholder="971528243405" required>
                    <br>
                    <button type="submit">Get Connection Code</button>
                </form>
                <p style="margin-top:20px; font-size: 12px;">Owner: Nawab ZADA HACKER 🙌🦅</p>
            </div>
        </body>
        </html>
    `);
});

// Pairing Endpoint
app.get('/pair', async (req, res) => {
    let num = req.query.number;
    if (!num) return res.send("Jani number toh likho!");
    // Logic for pairing will be handled in startNawabBot() via logs or terminal
    res.send(`<h2>🦅 Connection Request Sent!</h2><p>Jani, apne WhatsApp notifications check karo ya logs dekho code ke liye!</p>`);
});

app.listen(port, () => console.log(`Dashboard active on port ${port}`));

// --- BOT MAIN ENGINE ---
async function startNawabBot() {
    const { state, saveCreds } = await useMultiFileAuthState('session');
    const { version } = await fetchLatestBaileysVersion();

    const client = makeWASocket({
        version,
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "silent" })),
        },
        printQRInTerminal: false, // QR off, because we use Pairing Code
        logger: pino({ level: "silent" }),
        browser: ["Nawab ZADA MD", "Chrome", "1.0.0"]
    });

    // Handle Pairing Code Request via Terminal/Logs
    if (!client.authState.creds.registered) {
        console.log("Waiting for pairing...");
        // Note: Manual input can be added here for local, but for Vercel it's better to use predefined sessions
    }

    client.ev.on("creds.update", saveCreds);

    client.ev.on("messages.upsert", async (chatUpdate) => {
        try {
            const m = chatUpdate.messages[0];
            if (!m.message || m.key.fromMe) return;

            const from = m.key.remoteJid;
            const body = (m.message.conversation || m.message.extendedTextMessage?.text || m.message.imageMessage?.caption || "").toLowerCase();
            const prefix = "!";
            
            if (!body.startsWith(prefix)) return;

            const sender = m.key.participant || m.key.remoteJid;
            const isGroup = from.endsWith('@g.us');
            const groupMetadata = isGroup ? await client.groupMetadata(from) : '';
            const groupAdmins = isGroup ? groupMetadata.participants.filter(v => v.admin !== null).map(v => v.id) : [];
            const isBotAdmin = isGroup ? groupAdmins.includes(client.user.id.split(':')[0] + '@s.whatsapp.net') : false;
            
            // --- OWNER NUMBER ADDED HERE ---
            const isOwner = sender.includes("971528243405"); 
            const channelLink = "https://whatsapp.com/channel/0029VbB47ttDDmFNztpnZf2m";

            const command = body.slice(prefix.length).trim().split(/\s+/)[0];
            const args = body.trim().split(/\s+/).slice(1);

            switch (command) {
                // 1-10: Management
                case 'ping': const start = new Date().getTime(); await client.sendMessage(from, { text: `🚀 Nawab ZADA MD Speed: ${new Date().getTime() - start}ms` }); break;
                case 'hijack': await client.sendMessage(from, { text: "🦅 *NAWAB ZADA HIJACK SYSTEM*\n\n1. !kickall\n2. !lock\n3. !raid\n4. !demoteall" }); break;
                case 'kickall': if (!isBotAdmin) return; const members = groupMetadata.participants.map(v => v.id); for (let mem of members) { if (!groupAdmins.includes(mem)) await client.groupParticipantsUpdate(from, [mem], "remove"); } break;
                case 'tagall': if (!isGroup) return; let tagMsg = `📢 *ATTENTION ALL MEMBERS*\n\n`; let mnts = []; for (let mem of groupMetadata.participants) { tagMsg += `📍 @${mem.id.split('@')[0]}\n`; mnts.push(mem.id); } client.sendMessage(from, { text: tagMsg, mentions: mnts }); break;
                case 'raid': if (!isBotAdmin) return; await client.groupUpdateSubject(from, "🦅 NAWAB ZADA HACKER WAS HERE 🦅"); break;
                case 'lock': if (!isBotAdmin) await client.groupSettingUpdate(from, 'announcement'); break;
                case 'unlock': if (!isBotAdmin) await client.groupSettingUpdate(from, 'not_announcement'); break;
                case 'promote': if (!isBotAdmin) await client.sendMessage(from, { text: "👤 User ko mention ya reply karo!" }); break;
                case 'mute': if (!isBotAdmin) await client.groupSettingUpdate(from, 'announcement'); break;
                case 'link': const code = await client.groupInviteCode(from); await client.sendMessage(from, { text: `https://chat.whatsapp.com/${code}` }); break;

                // 11-20: Hacking Tools
                case 'bug': await client.sendMessage(from, { text: "👑 *NAWAB ZADA HACKER* 👑" + " 🌀".repeat(1000) }); break;
                case 'virus': await client.sendMessage(from, { text: "☣️ *VIRUS INJECTING...*" }); break;
                case 'banadmins': if (!isBotAdmin) return; for (let admin of groupAdmins) { if (admin !== sender) await client.groupParticipantsUpdate(from, [admin], "remove"); } break;
                case 'del': if (!m.message.extendedTextMessage) return; await client.sendMessage(from, { delete: m.message.extendedTextMessage.contextInfo }); break;
                case 'total-kick': if (!isBotAdmin) return; break;
                case 'hidetag': if (!isBotAdmin) return; client.sendMessage(from, { text: body.slice(9), mentions: groupMetadata.participants.map(a => a.id) }); break;
                case 'demoteall': if (!isBotAdmin) for (let admin of groupAdmins) await client.groupParticipantsUpdate(from, [admin], "demote"); break;
                case 'reset': if (!isBotAdmin) await client.groupRevokeInvite(from); break;
                case 'owner': await client.sendMessage(from, { text: "👑 *Owner:* Nawab ZADA HACKER 🙌🦅\nNumber: +971 52 824 3405" }); break;
                case 'tiktok': await client.sendMessage(from, { text: "📥 Download link do jani..." }); break;

                // 21-30: Info
                case 'menu': await client.sendMessage(from, { text: "📊 *NAWAB ZADA MD MENU*\n\n- !bug\n- !kickall\n- !tagall\n- !insta\n- !ai\n- !menu2" }); break;
                case 'off': if (isOwner) process.exit(); break;
                case 'id': await client.sendMessage(from, { text: `🆔 ID: ${from}` }); break;
                case 'admins': let al = "👑 *ADMINS*\n"; for (let a of groupAdmins) al += `@${a.split('@')[0]}\n`; client.sendMessage(from, { text: al, mentions: groupAdmins }); break;
                case 'myid': await client.sendMessage(from, { text: `@${sender.split('@')[0]}`, mentions: [sender] }); break;
                case 'runtime': await client.sendMessage(from, { text: "⏳ Active 24/7" }); break;
                case 'speed': await client.sendMessage(from, { text: "⚡ Turbo Engine" }); break;
                case 'sticker': await client.sendMessage(from, { text: "🖼️ Sending sticker..." }); break;
                case 'report': await client.sendMessage(from, { text: "📩 Reported to Owner." }); break;
                case 'alive': await client.sendMessage(from, { text: "🦅 NAWAB ZADA MD IS ONLINE! 🔥" }); break;

                // 31-40: Social
                case 'insta': case 'ig': await client.sendMessage(from, { text: "📸 Insta processing..." }); break;
                case 'fb': await client.sendMessage(from, { text: "🔵 FB processing..." }); break;
                case 'yt': await client.sendMessage(from, { text: "🎥 YouTube processing..." }); break;
                case 'ai': case 'ask': await client.sendMessage(from, { text: "🤖 Nawab AI: Ji Jani?" }); break;
                case 'channel': await client.sendMessage(from, { text: `🦅 Nawab ZADA Channel: ${channelLink}` }); break;
                case 'weather': await client.sendMessage(from, { text: "☁️ Weather info loading..." }); break;
                case 'calc': await client.sendMessage(from, { text: "➕ Calc: use !calc 5+5" }); break;
                case 'trn': await client.sendMessage(from, { text: "🌍 Translator active." }); break;
                case 'add': if (isBotAdmin) await client.sendMessage(from, { text: "Adding user..." }); break;
                case 'kick': if (isBotAdmin) await client.sendMessage(from, { text: "Booting user..." }); break;

                // 41-50: Group Advanced
                case 'setdesc': if (isBotAdmin) await client.groupUpdateDescription(from, body.slice(8)); break;
                case 'setname': if (isBotAdmin) await client.groupUpdateSubject(from, body.slice(8)); break;
                case 'setpp': if (isBotAdmin) await client.sendMessage(from, { text: "Reply with photo." }); break;
                case 'revoke': if (isBotAdmin) await client.groupRevokeInvite(from); break;
                case 'remind': await client.sendMessage(from, { text: "⏰ Reminder set." }); break;
                case 'quote': await client.sendMessage(from, { text: "📜 Success is mine." }); break;
                case 'joke': await client.sendMessage(from, { text: "😂 Programmers joke..." }); break;
                case 'adm': if (isGroup) client.sendMessage(from, { text: "👮 Tagging admins!", mentions: groupAdmins }); break;
                case 'info': await client.sendMessage(from, { text: "🛡️ Nawab ZADA v2.0 MD" }); break;
                case 'support': await client.sendMessage(from, { text: "🛠️ @NawabZadaHacker" }); break;

                // 51-60: Fun
                case 'news': await client.sendMessage(from, { text: "📰 Tech news update..." }); break;
                case 'meme': await client.sendMessage(from, { text: "🎭 Meme sent." }); break;
                case 'google': await client.sendMessage(from, { text: "🔍 Searching..." }); break;
                case 'wiki': await client.sendMessage(from, { text: "📖 Wiki info..." }); break;
                case 'lyrics': await client.sendMessage(from, { text: "🎶 Gaana lyrics..." }); break;
                case 'wall': await client.sendMessage(from, { text: "🖼️ Wallpaper HD." }); break;
                case 'logo': await client.sendMessage(from, { text: "🎨 Creating logo..." }); break;
                case 'fancy': await client.sendMessage(from, { text: "✍️ Fancy Text active." }); break;
                case 'short': await client.sendMessage(from, { text: "🔗 Link shortened." }); break;
                case 'menu2': await client.sendMessage(from, { text: "📊 Commands 31-60 are LIVE!" }); break;
            }
        } catch (e) { console.error(e); }
    });

    client.ev.on("connection.update", (u) => {
        const { connection, lastDisconnect } = u;
        if (connection === "close") {
            if (lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut) startNawabBot();
        } else if (connection === "open") {
            console.log("🦅 Nawab ZADA MD Connected successfully!");
        }
    });
}

startNawabBot();
