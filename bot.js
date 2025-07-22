require('dotenv').config();
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const geminiClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const client = new Client({
    authStrategy: new LocalAuth(),
});

const model = geminiClient.getGenerativeModel({ model: "gemini-pro" });

async function generate(prompt, message) {
    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        await message.reply(text);
    } catch (error) {
        console.error('Error generating content:', error);
        await message.reply("there was an error processing your request.");
    }
}

client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
});

client.on('authenticated', () => {
    console.log('Client is authenticated!');
});

client.on('ready', () => {
    console.log('Client is ready!');
});

client.on('disconnected', () => {
    console.log('Client is disconnected!');
});

client.on('auth_failure', () => {
    console.log('⚠Authentication failed!');
});

client.on('message', async (message) => {
    if (message.body.includes('.bot')) {
        const regxmatch = message.body.match(/.bot(.+)/);
        const query = regxmatch ? regxmatch[1].trim() : "Hi";
        await generate(query, message);
    }
});

client.initialize();
