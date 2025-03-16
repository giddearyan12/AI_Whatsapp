const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { API_KEY, OPENWEATHER_API_KEY } = require('./config');
const { User } = require('./database');


const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

const client = new Client({
    authStrategy: new LocalAuth(),
});

client.on('qr', (qr) => qrcode.generate(qr, { small: true }));
client.on('ready', () => console.log('✅ WhatsApp Bot is Ready!'));
client.on('disconnected', () => console.log('❌ Bot Disconnected'));

async function generateResponse(prompt, message) {
    try {
        const result = await model.generateContent(prompt);
        await message.reply(result.response.text());
    } catch {
        await message.reply("Sorry, I couldn't process that.");
    }
}

async function getWeather(city) {
    try {
        const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${OPENWEATHER_API_KEY}&units=metric`;
        const { data } = await axios.get(url);
        return `🌤 Weather in ${data.name}: ${data.weather[0].description}, Temp: ${data.main.temp}°C`;
    } catch {
        return "❌ Couldn't fetch weather data.";
    }
}

async function getNews() {
    try {
        const { data } = await axios.get('https://newsapi.org/v2/top-headlines?country=in&apiKey=your_newsapi_key');
        return `📰 Latest News: ${data.articles[0].title}\n${data.articles[0].url}`;
    } catch {
        return "❌ Couldn't fetch news.";
    }
}


client.on('message', async (message) => {
    const text = message.body.toLowerCase();
    const chatId = message.from;

    
    let user = await User.findOne({ number: chatId });
    if (!user) user = await User.create({ number: chatId, messages: [] });
    user.messages.push(text);
    await user.save();

    if (text.startsWith('.bot')) {
        const query = text.replace('.bot', '').trim() || "Hello!";
        generateResponse(query, message);
    } 
    else if (text.startsWith('.weather')) {
        const city = text.replace('.weather', '').trim();
        message.reply(await getWeather(city));
    } 
    else if (text.startsWith('.news')) {
        message.reply(await getNews());
    } 
    else if (text.startsWith('.help')) {
        message.reply(`🤖 Available Commands:
        - .bot [query] → Chat with AI
        - .weather [city] → Get weather info
        - .news → Get the latest news
        - .joke → Get a random joke
        - .help → Show this menu`);
    } 
    else {
        message.reply("❌ Invalid Command! Type `.help` for commands.");
    }
});

client.initialize();
