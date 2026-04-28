const http = require('http');
const https = require('https');
const axios = require('axios');
const puppeteer = require('puppeteer');

// IZEN API CONFIGURATION
const IZEN_API_KEY = process.env.IZEN_API_KEY;
const IZEN_API_URL = "https://api.izen.lol/v1/bypass";
let bypassInProgress = false;
let bypassStopRequested = false;
let REPO_GITHUB_TOKEN = null; // <-- Yahan daalo
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

const { Client, GatewayIntentBits, EmbedBuilder, PermissionsBitField, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { MongoClient } = require("mongodb");

let permissionCollection; // To store user permissions
const requestLimits = new Map(); // To track 6 requests/minute
// Keep-alive server and Feedback API
http.createServer((req, res) => {
    // CORS headers for Roblox
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

if (req.method === 'POST' && req.url === '/api/feedback') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', async () => {
            try {
                const data = JSON.parse(body);
                const { player, gameName, text } = data;
                
                const channelId = '1481563402856828949';
                const channel = client.channels.cache.get(channelId);
                
                if (channel) {
                    const date = new Date();
                    const day = String(date.getDate()).padStart(2, '0');
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const year = String(date.getFullYear()).slice(2);
                    const dateString = `${day}/${month}/${year}`;
                    
                    const message = `**${player}** ${dateString} ( ${gameName || 'Unknown Game'} )\n- ${text}`;
                    await channel.send(message);
                    
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: true }));
                } else {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Channel not found' }));
                }
            } catch (e) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid JSON or Request' }));
            }
        });
    } else if (req.method === 'POST' && req.url === '/webhook/otp') {
        const BOT_SECRET_KEY = process.env.BOT_SECRET_KEY || 'my_super_secret_key_123';
        const providedSecret = req.headers['x-bot-secret'];

        if (providedSecret !== BOT_SECRET_KEY) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Unauthorized' }));
            return;
        }

        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', async () => {
            try {
                const data = JSON.parse(body);
                const otpChannelId = process.env.OTP_CHANNEL_ID;
                
                if (!otpChannelId) {
                    console.log('⚠️ OTP_CHANNEL_ID is not set in environment variables!');
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Channel ID not configured' }));
                    return;
                }

                const channel = client.channels.cache.get(otpChannelId);
                if (channel && data.otp && data.email) {
                    await channel.send(`**New OTP Received!**\nGmail: ${data.email}\nPC - \`\`\`${data.otp}\`\`\`\nMobile - \`${data.otp}\``);
                }
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true }));
            } catch (e) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid JSON' }));
            }
        });
    } else {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('Bot is running!');
    }
}).listen(3000, () => {
    console.log('Keep-alive server running on port 3000');
});

// Self-ping every 5 minutes
setInterval(() => {
    https.get('https://bot-lyny.onrender.com', () => {
        console.log('Self-ping successful');
    }).on('error', err => {
        console.log('Self-ping failed:', err.message);
    });
}, 5 * 60 * 1000);

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

let vouchCollection;
let cooldownCollection;
let staffCollection;
let warnCollection;
let balanceCollection;
let giveawayCollection;
let logCollection;
let activeKeyCollection;
let keyHistoryCollection;
let dailyStatsCollection;
let userStatsCollection;
let ytCollection;
let ytTrackedCollection;
let ytProcessedCollection;

const COOLDOWN_TIME = 10 * 60 * 1000;
const STAFF_ROLE_ID = "1449394350009356481";
const OWNER_ID = "1319539205885526018";

// GitHub configuration
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_OWNER = "wendigothe48-maker";
const REPO_OWNER = process.env.REPO_OWNER || "nitroglitch5444"; // ?repo wala
const GITHUB_REPO = "promoteds";
const GITHUB_BACKUP_REPO = "backup";
const GITHUB_DIRECTX_REPO = "directx";
const GITHUB_BACKOPS_REPO = "backops";
const GITHUB_BRANCH = "main";

// ========================================
// IZEN BYPASS API CONFIGURATION
// ========================================
const BYPASS_LINK_PATTERNS = [
    // Linkvertise
    /https?:\/\/linkvertise\.com[^\s]*/i,
    /https?:\/\/link-to\.net[^\s]*/i,
    /https?:\/\/link-hub\.net[^\s]*/i,
    /https?:\/\/link-target\.org[^\s]*/i,
    /https?:\/\/link-target\.net[^\s]*/i,
    /https?:\/\/link-center\.net[^\s]*/i,
    /https?:\/\/direct-link\.net[^\s]*/i,
    
    // Admaven (lootlabs, free-content, etc.) - 84 domains
    /https?:\/\/loot-link\.com[^\s]*/i,
    /https?:\/\/lootdest\.org[^\s]*/i,
    /https?:\/\/free-content\.pro[^\s]*/i,
    /https?:\/\/lootdest\.com[^\s]*/i,
    /https?:\/\/bleleadersto\.com[^\s]*/i,
    /https?:\/\/daughablelea\.com[^\s]*/i,
    /https?:\/\/fast-links\.org[^\s]*/i,
    /https?:\/\/best-links\.org[^\s]*/i,
    /https?:\/\/free-leaks\.com[^\s]*/i,
    /https?:\/\/discordlink\.cc[^\s]*/i,
    /https?:\/\/rapid-links\.net[^\s]*/i,
    /https?:\/\/onlylinksmegas\.xyz[^\s]*/i,
    /https?:\/\/lootlinks\.co[^\s]*/i,
    /https?:\/\/redeem-nitro\.com[^\s]*/i,
    /https?:\/\/lootdest\.net[^\s]*/i,
    /https?:\/\/tonordersitye\.com[^\s]*/i,
    /https?:\/\/mega-redirect\.com[^\s]*/i,
    /https?:\/\/butthedshookh\.org[^\s]*/i,
    /https?:\/\/certainlywhenev\.org[^\s]*/i,
    /https?:\/\/aywithmehesa\.org[^\s]*/i,
    /https?:\/\/loot-links\.com[^\s]*/i,
    /https?:\/\/onlyshare\.info[^\s]*/i,
    /https?:\/\/mega-guy\.com[^\s]*/i,
    /https?:\/\/megadropz\.com[^\s]*/i,
    /https?:\/\/depravityweb\.co[^\s]*/i,
    /https?:\/\/missleakz\.com[^\s]*/i,
    /https?:\/\/godxnationds\.com[^\s]*/i,
    /https?:\/\/direct-links\.net[^\s]*/i,
    /https?:\/\/of-leaks\.xyz[^\s]*/i,
    /https?:\/\/direct-links\.org[^\s]*/i,
    /https?:\/\/ofhub-leaks\.com[^\s]*/i,
    /https?:\/\/linksloot\.net[^\s]*/i,
    /https?:\/\/worldpacks\.co[^\s]*/i,
    /https?:\/\/links-loot\.com[^\s]*/i,
    /https?:\/\/lootdest\.info[^\s]*/i,
    /https?:\/\/lootlink\.org[^\s]*/i,
    /https?:\/\/pkofs\.com[^\s]*/i,
    /https?:\/\/mdlinkshub\.com[^\s]*/i,
    /https?:\/\/nswfbox\.com[^\s]*/i,
    /https?:\/\/thhaven\.net[^\s]*/i,
    /https?:\/\/onlymega\.co[^\s]*/i,
    /https?:\/\/goldmega\.online[^\s]*/i,
    /https?:\/\/onlyfunlink\.com[^\s]*/i,
    /https?:\/\/rbxdrops\.org[^\s]*/i,
    /https?:\/\/leaksmix\.com[^\s]*/i,
    /https?:\/\/darkmodz-links\.com[^\s]*/i,
    /https?:\/\/megaplugleaks\.com[^\s]*/i,
    /https?:\/\/best-leaks\.com[^\s]*/i,
    /https?:\/\/risquemega\.com[^\s]*/i,
    /https?:\/\/of-area\.com[^\s]*/i,
    /https?:\/\/gateway-links\.com[^\s]*/i,
    /https?:\/\/tbv-hub\.com[^\s]*/i,
    /https?:\/\/attiktok22\.com[^\s]*/i,
    /https?:\/\/megalinks\.one[^\s]*/i,
    /https?:\/\/cemendemons\.com[^\s]*/i,
    /https?:\/\/content-hub\.club[^\s]*/i,
    /https?:\/\/oui-chu\.com[^\s]*/i,
    /https?:\/\/thotshaven\.online[^\s]*/i,
    /https?:\/\/nsfw-paradise\.club[^\s]*/i,
    /https?:\/\/megadumpz\.com[^\s]*/i,
    /https?:\/\/allbestonlyfans\.com[^\s]*/i,
    /https?:\/\/megaspremium\.com[^\s]*/i,
    /https?:\/\/hotstars-leaks\.com[^\s]*/i,
    /https?:\/\/secret-packs\.com[^\s]*/i,
    /https?:\/\/crip-hub\.com[^\s]*/i,
    /https?:\/\/holedonly\.store[^\s]*/i,
    /https?:\/\/luvsquad-links\.com[^\s]*/i,
    /https?:\/\/of4lm-links\.com[^\s]*/i,
    /https?:\/\/rapid-links\.com[^\s]*/i,
    /https?:\/\/nitroclaim\.com[^\s]*/i,
    /https?:\/\/op-packs\.com[^\s]*/i,
    /https?:\/\/streamergirls\.org[^\s]*/i,
    /https?:\/\/bizzarestorage\.com[^\s]*/i,
    /https?:\/\/onlyfriends\.club[^\s]*/i,
    /https?:\/\/milky-center\.com[^\s]*/i,
    /https?:\/\/leaksfreeday\.com[^\s]*/i,
    /https?:\/\/bigassleak\.com[^\s]*/i,
    /https?:\/\/mega-leaked\.com[^\s]*/i,
    /https?:\/\/watchnsfw\.co[^\s]*/i,
    /https?:\/\/leaks-heaven\.com[^\s]*/i,
    /https?:\/\/folderscontent\.com[^\s]*/i,
    /https?:\/\/onlyfanscloud\.com[^\s]*/i,
    
    // Workink
    /https?:\/\/work\.ink[^\s]*/i,
    /https?:\/\/workink\.net[^\s]*/i,
    
    // Fly.inc
    /https?:\/\/rinku\.pro[^\s]*/i,
    /https?:\/\/7mb\.io[^\s]*/i,
    
    // Shrtfly
    /https?:\/\/stfly\.vip[^\s]*/i,
    /https?:\/\/shrtslug\.biz[^\s]*/i,
    
    // Linkunlocker
    /https?:\/\/linkunlocker\.com[^\s]*/i,
    
    // Link-unlock
    /https?:\/\/link-unlock\.com[^\s]*/i,
    
    // Arolinks
    /https?:\/\/arolinks\.com[^\s]*/i,
    
    // Socialwolvez
    /https?:\/\/socialwolvez\.com[^\s]*/i,
    
    // Linkify
    /https?:\/\/go\.linkify\.ru[^\s]*/i,
    
    // Mboost
    /https?:\/\/mboost\.me[^\s]*/i,
    
    // Social-unlock
    /https?:\/\/social-unlock\.com[^\s]*/i,
    
    // Rekonise
    /https?:\/\/rekonise\.com[^\s]*/i,
    /https?:\/\/rekonise\.org[^\s]*/i,
    /https?:\/\/rkns\.link[^\s]*/i,
    
    // Sub2Unlock
    /https?:\/\/sub2unlock\.com[^\s]*/i,
    /https?:\/\/sub2unlock\.me[^\s]*/i,
    
    // Sub4Unlock
    /https?:\/\/sub4unlock\.com[^\s]*/i,
    /https?:\/\/sub4unlock\.me[^\s]*/i,
    /https?:\/\/sub4unlock\.io[^\s]*/i,
    /https?:\/\/sub4unlock\.pro[^\s]*/i,
    
    // Scriptpastebins
    /https?:\/\/scriptpastebins\.com[^\s]*/i,
    
    // Bstshrt
    /https?:\/\/bstshrt\.com[^\s]*/i,
    
    // Sfl.gl
    /https?:\/\/sfl\.gl[^\s]*/i,
    
    // Yorurl
    /https?:\/\/go\.yorurl\.com[^\s]*/i,
    /https?:\/\/yorurl\.com[^\s]*/i,
    
    // Robloxscripts
    /https?:\/\/(?:www\.)?robloxscripts\.gg[^\s]*/i,
    
    // Loanbuzz
    /https?:\/\/lnbz\.la[^\s]*/i,
    
    // Linkzy
    /https?:\/\/linkzy\.space[^\s]*/i,
    
    // Ez4Short (no specific domain listed, add if you have one)
];

function needsBypass(url) {
    return BYPASS_LINK_PATTERNS.some(pattern => pattern.test(url));
}

// ========================================
// RECURSIVE BYPASS WITH STOP COMMAND
// ========================================

async function recursiveBypassWithIzen(url, message, depth = 0, maxDepth = 10, context = { userId: null, limited: false }) {
    if (bypassStopRequested) {
        bypassStopRequested = false;
        bypassInProgress = false;
        return { stopped: true };
    }

    if (depth >= maxDepth) return { error: true, message: `⚠️ Max depth (${maxDepth}) reached.` };

    // RATE LIMIT CHECK
    if (context.limited && context.userId) {
        const allowed = checkRateLimit(context.userId);
        if (!allowed) {
            bypassInProgress = false;
            return { error: true, message: "⏳ **Rate Limit:** 6 requests per minute. Please wait." };
        }
    }

    try {
const progressMsg = await message.channel.send(`🔄 **Processing...**\nLink: \`${url}\``);
        const response = await axios.get(`${IZEN_API_URL}?url=${encodeURIComponent(url)}`, {
            headers: { 'x-api-key': IZEN_API_KEY },
            timeout: 60000
        });

        setTimeout(() => progressMsg.delete().catch(() => {}), 1500);

        if (!response.data || !response.data.result) return { error: true, message: '❌ No result from system.' };

        const result = response.data.result.trim();

        // Queue detection
        if (/waiting for token|position in queue|<Queue>/i.test(result)) {
            await message.channel.send(`⏳ **Queue detected, retrying...**`).then(m => setTimeout(() => m.delete().catch(() => {}), 2000));
            await new Promise(r => setTimeout(r, 5000));
            // Retry same URL
            return await recursiveBypassWithIzen(url, message, depth, maxDepth, context);
        }

        // STRICT RECURSION: Only recurse if it matches a known bypass pattern
        // This prevents the bot from treating random https links as new bypass targets
        if (needsBypass(result)) {
            await message.channel.send(`⚠️ **Chain detected, processing next link...**`).then(m => setTimeout(() => m.delete().catch(() => {}), 2000));
            await new Promise(r => setTimeout(r, 2000));
            return await recursiveBypassWithIzen(result, message, depth + 1, maxDepth, context);
        }

        bypassInProgress = false;
        return { success: true, result: result, attempts: depth + 1 };

    } catch (error) {
        bypassInProgress = false;
        return { error: true, message: error.response?.data?.message || error.message };
    }
}
// ========================================
// BROWSER SESSION MANAGEMENT
// ========================================
let globalBrowser = null;
let browserLastUsed = null;
let browserCloseTimer = null;
const BROWSER_TIMEOUT = 12 * 60 * 1000; // 12 minutes

async function getBrowser() {
    if (browserCloseTimer) {
        clearTimeout(browserCloseTimer);
        browserCloseTimer = null;
    }

    if (globalBrowser && globalBrowser.isConnected()) {
        console.log('♻️ Reusing existing browser session');
        browserLastUsed = Date.now();
        scheduleBrowserClose();
        return globalBrowser;
    }

    console.log('🚀 Launching new browser session...');
    globalBrowser = await puppeteer.launch({
        headless: true,
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium',
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--disable-web-security',
            '--disable-features=IsolateOrigins,site-per-process',
            '--disable-software-rasterizer',
            '--no-zygote',
            '--single-process'
        ]
    });

    browserLastUsed = Date.now();
    scheduleBrowserClose();
    return globalBrowser;
}

function scheduleBrowserClose() {
    if (browserCloseTimer) {
        clearTimeout(browserCloseTimer);
    }

    browserCloseTimer = setTimeout(async () => {
        if (globalBrowser && globalBrowser.isConnected()) {
            console.log('⏰ Closing browser after 12 minutes of inactivity');
            await globalBrowser.close();
            globalBrowser = null;
            browserLastUsed = null;
        }
    }, BROWSER_TIMEOUT);
}

// ========================================
// UNIVERSAL KEY SYSTEM TEMPLATE
// ========================================
function generateKeySystemScript(scriptUrl, devId = null) {
    const devIdLine = devId ? `_G.DevID = "${devId}"\n` : "";
    return `${devIdLine}--[[ 
    SAIRO KEY SYSTEM [PREMIUM v2]
    Features: Smooth Animations, Info Tab, Close Button, Fixed Layouts
]]

local KeySystem = Instance.new("ScreenGui")
local MainCanvas = Instance.new("CanvasGroup")
local Sidebar = Instance.new("Frame")
local ContentArea = Instance.new("Frame")
local Title = Instance.new("TextLabel")
local Glow = Instance.new("ImageLabel")
local CloseBtn = Instance.new("ImageButton") -- New Close Button

-- Sidebar Buttons
local TabHome = Instance.new("TextButton")
local TabInfo = Instance.new("TextButton")

-- Pages
local HomePage = Instance.new("Frame")
local InfoPage = Instance.new("Frame")

-- Home Elements
local KeyBox = Instance.new("TextBox")
local GetKeyBtn = Instance.new("TextButton")
local VerifyBtn = Instance.new("TextButton")
local Status = Instance.new("TextLabel")

-- Notification Container
local NotifContainer = Instance.new("Frame")
local UIListLayout_Notif = Instance.new("UIListLayout")

-- Services
local TweenService = game:GetService("TweenService")
local HttpService = game:GetService("HttpService")
local UserInputService = game:GetService("UserInputService")
local HWID = game:GetService("RbxAnalyticsService"):GetClientId()

-- Config
local API_URL = "https://sairo.online" 
local SCRIPT_URL = "${scriptUrl}" 
local DEV_ID = _G.DevID or "admin" -- Uses global DevID if defined, else defaults to admin

-- THEME: PREMIUM ORANGE-RED
local COLOR_ACCENT = Color3.fromRGB(255, 87, 34) -- Vibrant Orange
local COLOR_ACCENT_HOVER = Color3.fromRGB(255, 112, 67)
local COLOR_BG = Color3.fromRGB(12, 12, 12) 
local COLOR_SIDE = Color3.fromRGB(18, 18, 18) 
local COLOR_STROKE = Color3.fromRGB(45, 45, 45)
local COLOR_TEXT = Color3.fromRGB(240, 240, 240)
local COLOR_TEXT_DIM = Color3.fromRGB(160, 160, 160)

-- --- HELPER FUNCTIONS ---

local function round(obj, radius)
    local uic = Instance.new("UICorner")
    uic.CornerRadius = UDim.new(0, radius)
    uic.Parent = obj
end

local function addStroke(obj, color, thickness)
    local stroke = Instance.new("UIStroke")
    stroke.Color = color
    stroke.Thickness = thickness
    stroke.ApplyStrokeMode = Enum.ApplyStrokeMode.Border
    stroke.Parent = obj
    return stroke
end

local function createGradient(obj, c1, c2)
    local grad = Instance.new("UIGradient")
    grad.Color = ColorSequence.new{
        ColorSequenceKeypoint.new(0, c1),
        ColorSequenceKeypoint.new(1, c2)
    }
    grad.Rotation = 45
    grad.Parent = obj
end

-- Fixed Animation Function (Prevents button from staying small)
local function animateButton(btn)
    btn.AutoButtonColor = false
    local originalSize = btn.Size
    
    btn.MouseEnter:Connect(function()
        TweenService:Create(btn, TweenInfo.new(0.2), {BackgroundColor3 = COLOR_ACCENT_HOVER}):Play()
    end)
    btn.MouseLeave:Connect(function()
        TweenService:Create(btn, TweenInfo.new(0.2), {BackgroundColor3 = COLOR_ACCENT}):Play()
    end)
    btn.MouseButton1Down:Connect(function()
        -- FIXED: Scale both Scale and Offset to prevent buttons with Offset height from disappearing
        local targetSize = UDim2.new(
            originalSize.X.Scale * 0.95, 
            originalSize.X.Offset * 0.95, 
            originalSize.Y.Scale * 0.95, 
            originalSize.Y.Offset * 0.95
        )
        TweenService:Create(btn, TweenInfo.new(0.1), {Size = targetSize}):Play()
    end)
    btn.MouseButton1Up:Connect(function()
        TweenService:Create(btn, TweenInfo.new(0.1, Enum.EasingStyle.Bounce), {Size = originalSize}):Play()
    end)
end

-- --- NOTIFICATION SYSTEM ---

local function Notify(title, text, duration)
    local frame = Instance.new("Frame")
    frame.Name = "Notif"
    frame.Parent = NotifContainer
    frame.BackgroundColor3 = Color3.fromRGB(25, 25, 25)
    frame.BorderSizePixel = 0
    frame.Size = UDim2.new(1, 0, 0, 50)
    frame.BackgroundTransparency = 1 
    round(frame, 6)
    
    local stroke = addStroke(frame, COLOR_STROKE, 1)
    
    local tLabel = Instance.new("TextLabel")
    tLabel.Parent = frame
    tLabel.BackgroundTransparency = 1
    tLabel.Position = UDim2.new(0, 10, 0, 5)
    tLabel.Size = UDim2.new(1, -20, 0, 20)
    tLabel.Font = Enum.Font.GothamBold
    tLabel.Text = title
    tLabel.TextColor3 = COLOR_ACCENT
    tLabel.TextSize = 13
    tLabel.TextXAlignment = Enum.TextXAlignment.Left
    tLabel.TextTransparency = 1
    
    local cLabel = Instance.new("TextLabel")
    cLabel.Parent = frame
    cLabel.BackgroundTransparency = 1
    cLabel.Position = UDim2.new(0, 10, 0, 22)
    cLabel.Size = UDim2.new(1, -20, 0, 20)
    cLabel.Font = Enum.Font.Gotham
    cLabel.Text = text
    cLabel.TextColor3 = COLOR_TEXT_DIM
    cLabel.TextSize = 12
    cLabel.TextXAlignment = Enum.TextXAlignment.Left
    cLabel.TextTransparency = 1

    -- Animate In
    TweenService:Create(frame, TweenInfo.new(0.3), {BackgroundTransparency = 0.05}):Play()
    TweenService:Create(tLabel, TweenInfo.new(0.3), {TextTransparency = 0}):Play()
    TweenService:Create(cLabel, TweenInfo.new(0.3), {TextTransparency = 0}):Play()
    
    task.delay(duration or 3, function()
        TweenService:Create(frame, TweenInfo.new(0.3), {BackgroundTransparency = 1}):Play()
        TweenService:Create(tLabel, TweenInfo.new(0.3), {TextTransparency = 1}):Play()
        TweenService:Create(cLabel, TweenInfo.new(0.3), {TextTransparency = 1}):Play()
        TweenService:Create(stroke, TweenInfo.new(0.3), {Transparency = 1}):Play()
        wait(0.3)
        frame:Destroy()
    end)
end

-- --- UI CONSTRUCTION ---

KeySystem.Name = "SairoPremium"
KeySystem.Parent = game.CoreGui
KeySystem.ZIndexBehavior = Enum.ZIndexBehavior.Sibling

-- Main Canvas
MainCanvas.Name = "Main"
MainCanvas.Parent = KeySystem
MainCanvas.BackgroundColor3 = COLOR_BG
MainCanvas.Position = UDim2.new(0.5, -240, 0.5, -140)
MainCanvas.Size = UDim2.new(0, 480, 0, 280)
MainCanvas.BorderSizePixel = 0
MainCanvas.GroupTransparency = 0
round(MainCanvas, 14)
addStroke(MainCanvas, Color3.fromRGB(60, 60, 60), 1)

-- Close Button (Top Right)
CloseBtn.Name = "Close"
CloseBtn.Parent = KeySystem
CloseBtn.BackgroundTransparency = 1
CloseBtn.Position = UDim2.new(0.5, 215, 0.5, -165) -- Positioned outside top right
CloseBtn.Size = UDim2.new(0, 24, 0, 24)
CloseBtn.Image = "rbxassetid://3926305904" -- Close Icon
CloseBtn.ImageRectOffset = Vector2.new(284, 4)
CloseBtn.ImageRectSize = Vector2.new(24, 24)
CloseBtn.ImageColor3 = Color3.fromRGB(200, 200, 200)
CloseBtn.ZIndex = 10
CloseBtn.MouseEnter:Connect(function() TweenService:Create(CloseBtn, TweenInfo.new(0.2), {ImageColor3 = Color3.fromRGB(255, 80, 80)}):Play() end)
CloseBtn.MouseLeave:Connect(function() TweenService:Create(CloseBtn, TweenInfo.new(0.2), {ImageColor3 = Color3.fromRGB(200, 200, 200)}):Play() end)
CloseBtn.MouseButton1Click:Connect(function() 
    TweenService:Create(MainCanvas, TweenInfo.new(0.3), {Size = UDim2.new(0,0,0,0), GroupTransparency = 1}):Play()
    TweenService:Create(CloseBtn, TweenInfo.new(0.3), {ImageTransparency = 1}):Play()
    wait(0.3)
    KeySystem:Destroy()
end)

-- Glow Effect
Glow.Name = "Glow"
Glow.Parent = MainCanvas
Glow.BackgroundTransparency = 1
Glow.Position = UDim2.new(0, -120, 0, -120)
Glow.Size = UDim2.new(1, 240, 1, 240)
Glow.Image = "rbxassetid://5028857472"
Glow.ImageColor3 = COLOR_ACCENT
Glow.ImageTransparency = 0.94
Glow.ZIndex = 0

-- Notification Container Setup
NotifContainer.Name = "Notifications"
NotifContainer.Parent = KeySystem
NotifContainer.Position = UDim2.new(1, -230, 1, -310) 
NotifContainer.Size = UDim2.new(0, 220, 0, 300)
NotifContainer.BackgroundTransparency = 1

UIListLayout_Notif.Parent = NotifContainer
UIListLayout_Notif.SortOrder = Enum.SortOrder.LayoutOrder
UIListLayout_Notif.VerticalAlignment = Enum.VerticalAlignment.Bottom
UIListLayout_Notif.Padding = UDim.new(0, 6)

-- Sidebar Setup
Sidebar.Name = "Side"
Sidebar.Parent = MainCanvas
Sidebar.BackgroundColor3 = COLOR_SIDE
Sidebar.Size = UDim2.new(0, 140, 1, 0)
Sidebar.ZIndex = 2
addStroke(Sidebar, Color3.fromRGB(30, 30, 30), 1).ApplyStrokeMode = Enum.ApplyStrokeMode.Border

Title.Parent = Sidebar
Title.BackgroundTransparency = 1
Title.Position = UDim2.new(0, 0, 0, 30)
Title.Size = UDim2.new(1, 0, 0, 30)
Title.Font = Enum.Font.GothamBlack
Title.Text = "SAIRO"
Title.TextColor3 = Color3.fromRGB(255, 255, 255)
Title.TextSize = 24
Title.ZIndex = 2
createGradient(Title, Color3.fromRGB(255, 255, 255), COLOR_ACCENT)

local function createTabBtn(name, iconId, yPos)
    local btn = Instance.new("TextButton")
    btn.Parent = Sidebar
    btn.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
    btn.BackgroundTransparency = 1
    btn.Position = UDim2.new(0, 15, 0, yPos)
    btn.Size = UDim2.new(1, -30, 0, 36)
    btn.Font = Enum.Font.GothamMedium
    btn.Text = "  " .. name
    btn.TextColor3 = COLOR_TEXT_DIM
    btn.TextSize = 13
    btn.TextXAlignment = Enum.TextXAlignment.Left
    btn.ZIndex = 2
    round(btn, 8)
    
    return btn
end

TabHome = createTabBtn("Gateway", "", 100)
TabInfo = createTabBtn("Information", "", 145)

-- Content Area
ContentArea.Parent = MainCanvas
ContentArea.BackgroundTransparency = 1
ContentArea.Position = UDim2.new(0, 140, 0, 0)
ContentArea.Size = UDim2.new(1, -140, 1, 0)
ContentArea.ZIndex = 2

-- Pages
HomePage.Parent = ContentArea
HomePage.Size = UDim2.new(1, 0, 1, 0)
HomePage.BackgroundTransparency = 1
HomePage.Visible = true

InfoPage.Parent = ContentArea
InfoPage.Size = UDim2.new(1, 0, 1, 0)
InfoPage.BackgroundTransparency = 1
InfoPage.Visible = false

-- HOME UI Elements
local InfoTitle = Instance.new("TextLabel")
InfoTitle.Parent = HomePage
InfoTitle.BackgroundTransparency = 1
InfoTitle.Position = UDim2.new(0, 35, 0, 30)
InfoTitle.Size = UDim2.new(1, -70, 0, 20)
InfoTitle.Font = Enum.Font.GothamBold
InfoTitle.Text = "AUTHENTICATION"
InfoTitle.TextColor3 = COLOR_TEXT
InfoTitle.TextSize = 16
InfoTitle.TextXAlignment = Enum.TextXAlignment.Left

local InfoDesc = Instance.new("TextLabel")
InfoDesc.Parent = HomePage
InfoDesc.BackgroundTransparency = 1
InfoDesc.Position = UDim2.new(0, 35, 0, 50)
InfoDesc.Size = UDim2.new(1, -70, 0, 30)
InfoDesc.Font = Enum.Font.Gotham
InfoDesc.Text = "A license key is required to access the features of this script."
InfoDesc.TextColor3 = COLOR_TEXT_DIM
InfoDesc.TextSize = 12
InfoDesc.TextWrapped = true
InfoDesc.TextXAlignment = Enum.TextXAlignment.Left

KeyBox.Parent = HomePage
KeyBox.BackgroundColor3 = Color3.fromRGB(20, 20, 20)
KeyBox.Position = UDim2.new(0, 35, 0, 100)
KeyBox.Size = UDim2.new(1, -70, 0, 48)
KeyBox.Font = Enum.Font.Code
KeyBox.PlaceholderText = "Paste License Key..."
KeyBox.PlaceholderColor3 = Color3.fromRGB(70, 70, 70)
KeyBox.Text = ""
KeyBox.TextColor3 = COLOR_ACCENT
KeyBox.TextSize = 14
KeyBox.TextXAlignment = Enum.TextXAlignment.Center
round(KeyBox, 10)
addStroke(KeyBox, COLOR_STROKE, 1)

-- Verify Button
VerifyBtn.Parent = HomePage
VerifyBtn.BackgroundColor3 = COLOR_ACCENT
VerifyBtn.Position = UDim2.new(0, 35, 0, 165)
VerifyBtn.Size = UDim2.new(0.45, 0, 0, 42)
VerifyBtn.Font = Enum.Font.GothamBold
VerifyBtn.Text = "VERIFY KEY"
VerifyBtn.TextColor3 = Color3.fromRGB(255, 255, 255)
VerifyBtn.TextSize = 12
round(VerifyBtn, 10)
animateButton(VerifyBtn)

-- Get Key Button
GetKeyBtn.Parent = HomePage
GetKeyBtn.BackgroundColor3 = Color3.fromRGB(28, 28, 28)
GetKeyBtn.Position = UDim2.new(0.52, 0, 0, 165)
GetKeyBtn.Size = UDim2.new(0.38, 0, 0, 42)
GetKeyBtn.Font = Enum.Font.GothamBold
GetKeyBtn.Text = "GET KEY"
GetKeyBtn.TextColor3 = Color3.fromRGB(220, 220, 220)
GetKeyBtn.TextSize = 12
round(GetKeyBtn, 10)
addStroke(GetKeyBtn, COLOR_STROKE, 1)

-- Hover for Get Key (Simpler)
GetKeyBtn.MouseEnter:Connect(function() TweenService:Create(GetKeyBtn, TweenInfo.new(0.2), {BackgroundColor3 = Color3.fromRGB(38,38,38)}):Play() end)
GetKeyBtn.MouseLeave:Connect(function() TweenService:Create(GetKeyBtn, TweenInfo.new(0.2), {BackgroundColor3 = Color3.fromRGB(28,28,28)}):Play() end)
GetKeyBtn.MouseButton1Click:Connect(function() 
    TweenService:Create(GetKeyBtn, TweenInfo.new(0.1), {Size = UDim2.new(0.38*0.95,0,0,42*0.95)}):Play()
    wait(0.1)
    TweenService:Create(GetKeyBtn, TweenInfo.new(0.1), {Size = UDim2.new(0.38,0,0,42)}):Play()
end)

Status.Parent = HomePage
Status.BackgroundTransparency = 1
Status.Position = UDim2.new(0, 35, 1, -35)
Status.Size = UDim2.new(1, -70, 0, 20)
Status.Font = Enum.Font.GothamBold
Status.Text = "WAITING FOR INPUT"
Status.TextColor3 = Color3.fromRGB(80, 80, 80)
Status.TextSize = 10
Status.TextXAlignment = Enum.TextXAlignment.Center

-- INFO PAGE Elements
local InfoScroll = Instance.new("ScrollingFrame")
InfoScroll.Parent = InfoPage
InfoScroll.BackgroundTransparency = 1
InfoScroll.Position = UDim2.new(0, 20, 0, 20)
InfoScroll.Size = UDim2.new(1, -40, 1, -40)
InfoScroll.ScrollBarThickness = 2
InfoScroll.BorderSizePixel = 0

local InfoHeader = Instance.new("TextLabel")
InfoHeader.Parent = InfoScroll
InfoHeader.BackgroundTransparency = 1
InfoHeader.Size = UDim2.new(1, 0, 0, 30)
InfoHeader.Font = Enum.Font.GothamBold
InfoHeader.Text = "INFORMATION"
InfoHeader.TextColor3 = COLOR_TEXT
InfoHeader.TextSize = 16
InfoHeader.TextXAlignment = Enum.TextXAlignment.Left

local UIList_Info = Instance.new("UIListLayout")
UIList_Info.Parent = InfoScroll
UIList_Info.SortOrder = Enum.SortOrder.LayoutOrder
UIList_Info.Padding = UDim.new(0, 10)

local function createLinkCard(title, subtitle, icon, callback)
    local card = Instance.new("TextButton")
    card.Parent = InfoScroll
    card.BackgroundColor3 = Color3.fromRGB(22, 22, 22)
    card.Size = UDim2.new(1, 0, 0, 60)
    card.AutoButtonColor = false
    card.Text = ""
    round(card, 10)
    addStroke(card, COLOR_STROKE, 1)
    
    local cTitle = Instance.new("TextLabel")
    cTitle.Parent = card
    cTitle.BackgroundTransparency = 1
    cTitle.Position = UDim2.new(0, 15, 0, 12)
    cTitle.Size = UDim2.new(1, -30, 0, 20)
    cTitle.Font = Enum.Font.GothamBold
    cTitle.Text = title
    cTitle.TextColor3 = COLOR_TEXT
    cTitle.TextSize = 14
    cTitle.TextXAlignment = Enum.TextXAlignment.Left
    
    local cSub = Instance.new("TextLabel")
    cSub.Parent = card
    cSub.BackgroundTransparency = 1
    cSub.Position = UDim2.new(0, 15, 0, 32)
    cSub.Size = UDim2.new(1, -30, 0, 15)
    cSub.Font = Enum.Font.Gotham
    cSub.Text = subtitle
    cSub.TextColor3 = COLOR_TEXT_DIM
    cSub.TextSize = 11
    cSub.TextXAlignment = Enum.TextXAlignment.Left
    
    local cIcon = Instance.new("ImageLabel")
    cIcon.Parent = card
    cIcon.BackgroundTransparency = 1
    cIcon.Position = UDim2.new(1, -40, 0.5, -10)
    cIcon.Size = UDim2.new(0, 20, 0, 20)
    cIcon.Image = icon or "rbxassetid://7072719659" -- Link icon
    cIcon.ImageColor3 = COLOR_ACCENT
    
    card.MouseEnter:Connect(function()
        TweenService:Create(card, TweenInfo.new(0.2), {BackgroundColor3 = Color3.fromRGB(30, 30, 30)}):Play()
    end)
    card.MouseLeave:Connect(function()
        TweenService:Create(card, TweenInfo.new(0.2), {BackgroundColor3 = Color3.fromRGB(22, 22, 22)}):Play()
    end)
    card.MouseButton1Click:Connect(callback)
end

createLinkCard("Discord Server", "Join our community for support.", "rbxassetid://16123490977", function()
    setclipboard("https://discord.gg/yourinvite")
    Notify("Discord", "Invite copied to clipboard.", 3)
end)

createLinkCard("Website", "Visit the official site.", "rbxassetid://16123492577", function()
    setclipboard("https://sairo.online")
    Notify("Website", "Link copied to clipboard.", 3)
end)

createLinkCard("Credits", "Developed by Sairo Team.", "rbxassetid://16123492213", function()
    Notify("Credits", "Script by Sairo Devs", 3)
end)

-- --- LOGIC & FUNCTIONS ---

local function switchTab(page)
    HomePage.Visible = false
    InfoPage.Visible = false
    page.Visible = true
    
    TabHome.TextColor3 = COLOR_TEXT_DIM
    TabInfo.TextColor3 = COLOR_TEXT_DIM
    TabHome.BackgroundTransparency = 1
    TabInfo.BackgroundTransparency = 1
    
    local activeBtn = (page == HomePage) and TabHome or TabInfo
    activeBtn.TextColor3 = COLOR_TEXT
    -- Highlight active tab with a subtle background
    TweenService:Create(activeBtn, TweenInfo.new(0.3), {BackgroundTransparency = 0.92}):Play()
end

local function setStatus(text, color)
    Status.Text = string.upper(text)
    Status.TextColor3 = color
end

local function getKey()
    setStatus("CONTACTING SERVER...", COLOR_TEXT)
    
    local robloxName = "Unknown"
    pcall(function() robloxName = game.Players.LocalPlayer.Name end)
    
    local url = API_URL .. "/api/init"
    local body = HttpService:JSONEncode({hwid = HWID, robloxName = robloxName, devId = DEV_ID})
    
    local success, response = pcall(function()
        if syn and syn.request then
            return syn.request({Url = url, Method = "POST", Headers = {["Content-Type"] = "application/json"}, Body = body})
        elseif http and http.request then
            return http.request({Url = url, Method = "POST", Headers = {["Content-Type"] = "application/json"}, Body = body})
        elseif request then
            return request({Url = url, Method = "POST", Headers = {["Content-Type"] = "application/json"}, Body = body})
        else
            return {StatusCode = 500, Body = "Executor not supported"}
        end
    end)
    
    if success and response.StatusCode == 200 then
        local data = HttpService:JSONDecode(response.Body)
        if data.url then
            setclipboard(data.url)
            setStatus("LINK COPIED TO CLIPBOARD", Color3.fromRGB(100, 255, 100))
            Notify("Link Generated", "Key link copied to clipboard.", 4)
        else
            setStatus("SERVER ERROR", Color3.fromRGB(255, 80, 80))
            Notify("Error", "Invalid response from server.", 4)
        end
    else
        setStatus("CONNECTION FAILED", Color3.fromRGB(255, 80, 80))
        Notify("Connection Error", "Could not reach server.", 4)
    end
end

local function closeUI()
    TweenService:Create(MainCanvas, TweenInfo.new(0.4, Enum.EasingStyle.Back, Enum.EasingDirection.In), {Size = UDim2.new(0, 0, 0, 0), GroupTransparency = 1}):Play()
    task.wait(0.4)
    KeySystem:Destroy()
end

local function verify(inputKey)
    if inputKey == "" then 
        Notify("Input Required", "Please paste your key.", 3)
        return 
    end
    
    setStatus("AUTHENTICATING...", COLOR_TEXT)
    VerifyBtn.Text = "CHECKING..."
    
    local url = API_URL .. "/api/verify-key?key=" .. inputKey .. "&hwid=" .. HWID
    local success, response = pcall(function() return game:HttpGet(url) end)
    
    if success then
        local data = HttpService:JSONDecode(response)
        if data.status == "valid" then
            setStatus("ACCESS GRANTED", Color3.fromRGB(100, 255, 100))
            Notify("Success", "Key verified. Loading script...", 4)
            
            if writefile then writefile("Sairo_Last.txt", inputKey) end
            
            closeUI()
            
            loadstring(game:HttpGet(SCRIPT_URL, true))()
        elseif data.status == "invalid_hwid" then
             setStatus("HWID MISMATCH", Color3.fromRGB(255, 80, 80))
             Notify("Access Denied", "Key is linked to another device.", 5)
        else
            setStatus("INVALID KEY", Color3.fromRGB(255, 80, 80))
            Notify("Access Denied", "Key is invalid or expired.", 4)
        end
    else
        setStatus("CONNECTION FAILED", Color3.fromRGB(255, 80, 80))
        Notify("Error", "Server unreachable.", 4)
    end
    VerifyBtn.Text = "VERIFY KEY"
end

-- --- EVENTS & INIT ---

GetKeyBtn.MouseButton1Click:Connect(getKey)
VerifyBtn.MouseButton1Click:Connect(function() verify(KeyBox.Text) end)

TabHome.MouseButton1Click:Connect(function() switchTab(HomePage) end)
TabInfo.MouseButton1Click:Connect(function() switchTab(InfoPage) end)

-- Draggable Logic
local dragging, dragInput, dragStart, startPos
local function update(input)
    local delta = input.Position - dragStart
    MainCanvas.Position = UDim2.new(startPos.X.Scale, startPos.X.Offset + delta.X, startPos.Y.Scale, startPos.Y.Offset + delta.Y)
    -- Keep Close button attached relative to main canvas logic if needed, but here it's absolute
    -- Update close button position to follow frame
    CloseBtn.Position = UDim2.new(startPos.X.Scale, startPos.X.Offset + delta.X + 225, startPos.Y.Scale, startPos.Y.Offset + delta.Y - 130)
end

MainCanvas.InputBegan:Connect(function(input)
    if input.UserInputType == Enum.UserInputType.MouseButton1 then
        dragging = true
        dragStart = input.Position
        startPos = MainCanvas.Position
        input.Changed:Connect(function() if input.UserInputState == Enum.UserInputState.End then dragging = false end end)
    end
end)
MainCanvas.InputChanged:Connect(function(input) if input.UserInputType == Enum.UserInputType.MouseMovement then dragInput = input end end)
UserInputService.InputChanged:Connect(function(input) if input == dragInput and dragging then update(input) end end)

-- Initial State
switchTab(HomePage)

-- Sync Close Button Initial Position
CloseBtn.Position = UDim2.new(MainCanvas.Position.X.Scale, MainCanvas.Position.X.Offset + 225, MainCanvas.Position.Y.Scale, MainCanvas.Position.Y.Offset - 130)

if readfile and pcall(function() readfile("Sairo_Last.txt") end) then
    local saved = readfile("Sairo_Last.txt")
    KeyBox.Text = saved
    task.delay(0.5, function() verify(saved) end)
end

return KeySystem`;
}

// ========================================
// EXISTING BOT CODE CONTINUES BELOW
// ========================================

let activeGiveaway = null;

let devIdCollection; // Sairo DevId mapping
let shortcutCollection;

async function connectDB() {
    const mongoClient = new MongoClient(process.env.MONGODB_URI);
    await mongoClient.connect();
    const db = mongoClient.db("gobloxbot");

    vouchCollection = db.collection("vouches");
    cooldownCollection = db.collection("cooldowns");
    staffCollection = db.collection("staff");
    warnCollection = db.collection("warnings");
    balanceCollection = db.collection("balances");
    giveawayCollection = db.collection("giveaways");
    logCollection = db.collection("logs");
    permissionCollection = db.collection("permissions");
devIdCollection = db.collection("devids"); // NEW
shortcutCollection = db.collection("shortcuts");
    const defaultDb = mongoClient.db();
    activeKeyCollection = defaultDb.collection("activekeys");
    keyHistoryCollection = defaultDb.collection("keyhistories");
    dailyStatsCollection = defaultDb.collection("dailystats");
    userStatsCollection = defaultDb.collection("userstats");
    ytCollection = defaultDb.collection("ytchannels");
    ytTrackedCollection = defaultDb.collection("yttracked");
    ytProcessedCollection = defaultDb.collection("ytprocessed");

    console.log("Connected to MongoDB!");
}

// ===== SAIRO DEV ID FUNCTIONS =====
const SAIRO_ADMIN_AUTH = process.env.SAIRO_ADMIN_AUTH; // .env mein set karo

async function getDevId(userId) {
    const data = await devIdCollection.findOne({ userId });
    return data?.devId || null;
}

async function saveDevId(userId, devId) {
    await devIdCollection.updateOne(
        { userId },
        { $set: { userId, devId } },
        { upsert: true }
    );
}
// ===== VOUCH FUNCTIONS =====

async function getVouch(userId) {
    let data = await vouchCollection.findOne({ userId });
    if (!data) {
        data = { userId, plus: 0, minus: 0, history: [] };
        await vouchCollection.insertOne(data);
    }
    return data;
}

async function updateVouch(userId, data) {
    await vouchCollection.updateOne({ userId }, { $set: data }, { upsert: true });
}

async function checkCooldown(oderId) {
    let data = await cooldownCollection.findOne({ oderId });
    if (!data) return null;

    let timeLeft = COOLDOWN_TIME - (Date.now() - data.lastVouch);
    return timeLeft > 0 ? timeLeft : null;
}

async function setCooldown(oderId) {
    await cooldownCollection.updateOne(
        { oderId },
        { $set: { oderId, lastVouch: Date.now() } },
        { upsert: true }
    );
}

// ===== STAFF FUNCTIONS =====

async function isStaff(userId, member) {
    const hasRole = member?.roles?.cache.has(STAFF_ROLE_ID);
    const inDB = !!(await staffCollection.findOne({ userId }));
    return hasRole || inDB;
}

async function addStaff(userId) {
    await staffCollection.updateOne({ userId }, { $set: { userId } }, { upsert: true });
}

async function removeStaff(userId) {
    await staffCollection.deleteOne({ userId });
}

// ===== BALANCE FUNCTIONS =====

async function getBalance(userId) {
    let data = await balanceCollection.findOne({ userId });
    if (!data) {
        data = { userId, robux: 0 };
        await balanceCollection.insertOne(data);
    }
    return data;
}

async function addBalance(userId, amount) {
    await balanceCollection.updateOne(
        { userId },
        { $inc: { robux: amount } },
        { upsert: true }
    );
}

async function setBalance(userId, amount) {
    await balanceCollection.updateOne(
        { userId },
        { $set: { robux: amount } },
        { upsert: true }
    );
}

// ===== LOG FUNCTIONS =====

async function getLogChannel(guildId) {
    const data = await logCollection.findOne({ guildId });
    return data?.channelId || null;
}

async function setLogChannel(guildId, channelId) {
    await logCollection.updateOne(
        { guildId },
        { $set: { guildId, channelId } },
        { upsert: true }
    );
}

async function sendLog(guild, action, executor, details) {
    const logChannelId = await getLogChannel(guild.id);
    if (!logChannelId) return;

    const logChannel = guild.channels.cache.get(logChannelId);
    if (!logChannel) return;

    const embed = new EmbedBuilder()
        .setTitle(`📋 ${action}`)
        .setColor("Blue")
        .setDescription(details)
        .setFooter({ text: `Executed by ${executor.tag}`, iconURL: executor.displayAvatarURL() })
        .setTimestamp();

    logChannel.send({ embeds: [embed] }).catch(console.error);
}

// 1. Rate Limit Checker (6 requests per minute)
function checkRateLimit(userId) {
    const now = Date.now();
    let data = requestLimits.get(userId);

    // If no data or 1 minute has passed, reset
    if (!data || (now - data.startTime > 60000)) {
        data = { count: 0, startTime: now };
    }

    if (data.count >= 6) {
        return false; // Limit exceeded
    }

    data.count++;
    requestLimits.set(userId, data);
    return true;
}

// 2. Set Permission in DB
async function setUserPermission(userId, perm) {
    await permissionCollection.updateOne(
        { userId },
        { $addToSet: { perms: perm } },
        { upsert: true }
    );
}

// 3. Check Permission from DB
async function hasPermission(userId, perm) {
    const data = await permissionCollection.findOne({ userId });
    return data && data.perms && data.perms.includes(perm);
}
// ===== GITHUB FUNCTIONS =====

async function createGitHubFile(fileName, content, repo = GITHUB_REPO) {
    try {
        const url = `https://api.github.com/repos/${GITHUB_OWNER}/${repo}/contents/${fileName}`;
        
        const response = await axios.put(url, {
            message: `Add ${fileName}`,
            content: Buffer.from(content).toString('base64'),
            branch: GITHUB_BRANCH
        }, {
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            }
        });

        const rawUrl = `https://raw.githubusercontent.com/${GITHUB_OWNER}/${repo}/${GITHUB_BRANCH}/${fileName}`;
        return rawUrl;
    } catch (error) {
        console.error('GitHub API Error:', error.response?.data || error.message);
        return null;
    }
}

async function listGitHubFiles(repo = GITHUB_REPO) {
    try {
        const url = `https://api.github.com/repos/${GITHUB_OWNER}/${repo}/contents/`;
        
        const response = await axios.get(url, {
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        const files = response.data
            .filter(item => item.type === 'file' && !item.name.match(/^(README|LICENSE|\.)/))
            .map(item => item.name);

        return files;
    } catch (error) {
        console.error('GitHub List Error:', error.response?.data || error.message);
        return null;
    }
}

async function deleteGitHubFile(fileName, repo = GITHUB_REPO) {
    try {
        const getUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${repo}/contents/${fileName}`;
        const getResponse = await axios.get(getUrl, {
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        const fileSha = getResponse.data.sha;

        const deleteUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${repo}/contents/${fileName}`;
        await axios.delete(deleteUrl, {
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json'
            },
            data: {
                message: `Delete ${fileName}`,
                sha: fileSha,
                branch: GITHUB_BRANCH
            }
        });

        return true;
    } catch (error) {
        console.error('GitHub Delete Error:', error.response?.data || error.message);
        return false;
    }
}

async function getGitHubFileContent(fileName, repo = GITHUB_REPO) {
    try {
        const url = `https://api.github.com/repos/${GITHUB_OWNER}/${repo}/contents/${fileName}`;
        
        const response = await axios.get(url, {
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        const content = Buffer.from(response.data.content, 'base64').toString('utf-8');
        return { content, sha: response.data.sha };
    } catch (error) {
        console.error('GitHub Get Content Error:', error.response?.data || error.message);
        return null;
    }
}

async function updateGitHubFile(fileName, content, repo = GITHUB_REPO) {
    try {
        const getUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${repo}/contents/${fileName}`;
        const getResponse = await axios.get(getUrl, {
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        const fileSha = getResponse.data.sha;

        const updateUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${repo}/contents/${fileName}`;
        await axios.put(updateUrl, {
            message: `Update ${fileName}`,
            content: Buffer.from(content).toString('base64'),
            sha: fileSha,
            branch: GITHUB_BRANCH
        }, {
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        return true;
    } catch (error) {
        console.error('GitHub Update Error:', error.response?.data || error.message);
        return false;
    }
}

function extractScriptName(url) {
    const match = url.match(/\/([^\/]+)$/);
    return match ? match[1] : null;
}

function extractRawUrl(input) {
    // Match with or without true parameter
    const loadstringMatch = input.match(/game:HttpGet\("([^"]+)"(?:,\s*true)?\)/);
    if (loadstringMatch) {
        return loadstringMatch[1];
    }
    
    if (input.startsWith('http')) {
        return input;
    }
    
    return null;
}

function isValidGitHubUrl(url) {
    return url && (
        url.includes('raw.githubusercontent.com') || 
        url.includes('github.com') && url.includes('/raw/')
    );
}

// ===== OBFUSCATION FUNCTIONS =====
async function obfuscateCode(luaCode) {
    let page;
    try {
        console.log('🚀 Getting browser for obfuscation...');
        
        const browser = await getBrowser();
        page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 800 });
        
        console.log('🌐 Opening WeAreDevs obfuscator...');
        await page.goto('https://wearedevs.net/obfuscator', {
            waitUntil: 'domcontentloaded',
            timeout: 60000
        });

        await page.waitForSelector('.CodeMirror', { timeout: 20000 });
        await new Promise(r => setTimeout(r, 3000));

        console.log('📝 Inserting code into textarea...');
        
        await page.evaluate((code) => {
            const cmElement = document.querySelector('.CodeMirror');
            if (cmElement && cmElement.CodeMirror) {
                cmElement.CodeMirror.setValue(code);
            }
        }, luaCode);

        await new Promise(r => setTimeout(r, 1000));

        console.log('🔘 Clicking Obfuscate button...');
        
        await page.evaluate(() => {
            const obfuscateBtn = document.querySelector('button.btn-obfuscate');
            if (obfuscateBtn) {
                obfuscateBtn.click();
            }
        });

        const lineCount = luaCode.split('\n').length;
        const waitTime = Math.max(5000, Math.min(20000, lineCount * 100));
        console.log(`⏳ Waiting ${waitTime}ms for obfuscation...`);
        await new Promise(r => setTimeout(r, waitTime));

        console.log('📋 Extracting obfuscated code...');
        
        const obfuscatedCode = await page.evaluate(() => {
            const cmElements = document.querySelectorAll('.CodeMirror');
            
            if (cmElements.length >= 2) {
                const outputCM = cmElements[1];
                if (outputCM && outputCM.CodeMirror) {
                    return outputCM.CodeMirror.getValue();
                }
            }
            
            for (let cm of cmElements) {
                if (cm && cm.CodeMirror) {
                    const code = cm.CodeMirror.getValue();
                    if (code.includes('wearedevs.net/obfuscator')) {
                        return code;
                    }
                }
            }
            
            return null;
        });

        if (!obfuscatedCode) {
            console.error('❌ Obfuscation failed - no output received');
            await page.close();
            return null;
        }

        if (obfuscatedCode === luaCode) {
            console.error('❌ Output is same as input');
            await page.close();
            return null;
        }

        if (!obfuscatedCode.includes('wearedevs.net/obfuscator')) {
            console.error('❌ Output missing obfuscator signature');
            await page.close();
            return null;
        }

        console.log('✅ Obfuscation successful!');
        console.log(`📊 Original: ${luaCode.length} chars → Obfuscated: ${obfuscatedCode.length} chars`);
        
        await page.close();
        return obfuscatedCode;

    } catch (error) {
        console.error('💥 Browser automation error:', error.message);
        if (page) await page.close();
        return null;
    }
}

function isObfuscated(code) {
    return code.includes('--[[') && 
           code.includes('https://wearedevs.net/obfuscator') &&
           code.includes('return(function(...)');
}

// ===== UPDATE SCRIPT LOGIC =====

async function processUpdate(fileName, message, statusMsg) {
    try {
        // 1. Fetch CLEAN source from BACKUP repo
        const backupData = await getGitHubFileContent(fileName, GITHUB_BACKUP_REPO);
        
        if (!backupData || !backupData.content) {
            return { success: false, reason: "Backup file not found. Cannot extract URL." };
        }

        // 2. Extract original URL from clean code
        // Matches: local SCRIPT_URL = "https://..."
        const urlMatch = backupData.content.match(/local\s+SCRIPT_URL\s*=\s*"([^"]+)"/);
        
        if (!urlMatch || !urlMatch[1]) {
             return { success: false, reason: "Could not find SCRIPT_URL in backup file." };
        }
        
        const originalUrl = urlMatch[1];
        
        // 2.5 Extract DevID if exists
        const devIdMatch = backupData.content.match(/_G\.DevID\s*=\s*"([^"]+)"/);
        const existingDevId = devIdMatch ? devIdMatch[1] : null;
        
        // 3. Generate NEW script with updated template but SAME URL and DevID
        const newScriptContent = generateKeySystemScript(originalUrl, existingDevId);
        
        // 4. Update Backup Repo with new clean code
        await updateGitHubFile(fileName, newScriptContent, GITHUB_BACKUP_REPO);
        
        // 5. Obfuscate new code
        if (statusMsg) await statusMsg.edit(`🔄 Obfuscating **${fileName}**...`);
        const obfuscatedCode = await obfuscateCode(newScriptContent);
        
        // 6. Update Main Repo (Obfuscated or Clean if failed)
        await updateGitHubFile(fileName, obfuscatedCode || newScriptContent, GITHUB_REPO);
        
        return { success: true };

    } catch (e) {
        console.error(`Update failed for ${fileName}:`, e);
        return { success: false, reason: e.message };
    }
}

// ===== GIVEAWAY FUNCTIONS =====

function parseTime(timeStr) {
    const match = timeStr.match(/^(\d+)([smhd])$/);
    if (!match) return null;
    
    const value = parseInt(match[1]);
    const unit = match[2];
    
    const multipliers = {
        s: 1000,
        m: 60000,
        h: 3600000,
        d: 86400000
    };
    
    return value * multipliers[unit];
}

async function endGiveaway(channel, giveaway, reroll = false) {
    if (!giveaway.participants || giveaway.participants.length === 0) {
        return channel.send("❌ No one participated in the giveaway!");
    }

    const winners = [];
    const participants = [...giveaway.participants];
    
    for (let i = 0; i < Math.min(giveaway.winners, participants.length); i++) {
        const randomIndex = Math.floor(Math.random() * participants.length);
        winners.push(participants[randomIndex]);
        participants.splice(randomIndex, 1);
    }

    for (const winnerId of winners) {
        await addBalance(winnerId, giveaway.prize);
    }

    const winnerMentions = winners.map(id => `<@${id}>`).join(", ");

    const endEmbed = new EmbedBuilder()
        .setTitle("🎉 GIVEAWAY ENDED 🎉")
        .setDescription(`**Prize:** ${giveaway.prize} Robux`)
        .addFields(
            { name: "Winners", value: winnerMentions || "None" },
            { name: "Hosted by", value: `<@${giveaway.host}>` }
        )
        .setColor("Gold")
        .setTimestamp();

    if (giveaway.image) {
        endEmbed.setImage(giveaway.image);
    }

    await channel.send({ content: `🎊 Congratulations ${winnerMentions}!`, embeds: [endEmbed] });

    if (reroll) {
        await channel.send(`🔄 Giveaway rerolled! New winners: ${winnerMentions}`);
    }

    activeGiveaway = null;
    await giveawayCollection.deleteOne({ messageId: giveaway.messageId });
}

// ===== BOT READY =====
client.once("ready", async () => {
    console.log(`Bot is online as ${client.user.tag}`);

    // Token DB se load karo
    const savedRepoToken = await logCollection.findOne({ _id: "repoToken" }).catch(() => null);
    if (savedRepoToken?.token) {
        REPO_GITHUB_TOKEN = savedRepoToken.token;
        console.log("✅ Repo GitHub token loaded from DB");
    }

    const giveaway = await giveawayCollection.findOne({});
    if (giveaway) {
        const timeLeft = giveaway.endTime - Date.now();
        
        if (timeLeft > 0) {
            activeGiveaway = giveaway;
            
            try {
                const channel = await client.channels.fetch(giveaway.channelId);
                if (channel) {
                    await channel.messages.fetch(giveaway.messageId);
                    console.log(`✅ Restored giveaway in channel ${giveaway.channelId}, ends in ${Math.floor(timeLeft / 1000)}s`);
                    
                    const updateInterval = setInterval(async () => {
                        if (!activeGiveaway || activeGiveaway.messageId !== giveaway.messageId) {
                            clearInterval(updateInterval);
                            return;
                        }
                        await giveawayCollection.updateOne(
                            { messageId: giveaway.messageId },
                            { $set: { participants: activeGiveaway.participants, lastUpdate: Date.now() } }
                        );
                    }, 3600000);
                    
                    setTimeout(async () => {
                        clearInterval(updateInterval);
                        const ch = await client.channels.fetch(giveaway.channelId).catch(() => null);
                        if (ch) await endGiveaway(ch, activeGiveaway);
                    }, timeLeft);
                } else {
                    throw new Error("Channel not found");
                }
            } catch (error) {
                console.log("❌ Giveaway message not found, cleaning up...");
                await giveawayCollection.deleteOne({ messageId: giveaway.messageId });
                activeGiveaway = null;
            }
        } else {
            console.log("⏰ Giveaway expired, ending now...");
            const channel = await client.channels.fetch(giveaway.channelId).catch(() => null);
            if (channel) {
                await endGiveaway(channel, giveaway);
            } else {
                await giveawayCollection.deleteOne({ messageId: giveaway.messageId });
            }
        }
    }

    // Background YouTube Scraper Loop (Optimized with MongoDB)
    setInterval(async () => {
        try {
            console.log("[YT-AutoCheck] Starting background check for tracked channels...");
            const trackedChannels = await ytTrackedCollection.find({}).toArray();
            if (!trackedChannels.length) return;

            for (const tracked of trackedChannels) {
                const channelHandle = tracked.channelHandle;
                const qty = tracked.qty || 30;
                const targetChannelId = '1460943448017207479';
                const targetCh = client.channels.cache.get(targetChannelId);

                if (!targetCh) continue;

                const videos = await fetchYouTubeVideoIds(channelHandle);
                if (!videos.length) continue;

                // Only check the top 'qty' videos
                const videosToProcess = videos.slice(0, qty); 
                for (const video of videosToProcess) {
                    const alreadySeen = await ytProcessedCollection.findOne({ videoId: video.id });
                    if (alreadySeen) continue; 
                    
                    console.log(`[YT-AutoCheck] New video found for ${channelHandle}: ${video.id}`);
                    const mockMessage = {
                        channel: {
                            send: async () => ({
                                edit: async () => {},
                                delete: async () => {}
                            })
                        },
                        author: { id: client.user?.id || 'bot' },
                        client: client
                    };
                    await processSingleVideo(video.id, mockMessage, targetChannelId, true, channelHandle);
                }
            }
        } catch (err) {
            console.error("[YT-AutoCheck] Error in periodic check:", err);
        }
    }, 60 * 60 * 1000); // 1 hour
});
// ===== BUTTON INTERACTION =====

client.on("interactionCreate", async (interaction) => {
    if (!interaction.isButton()) return;

    if (interaction.customId === "join_giveaway") {
        if (!activeGiveaway) {
            return interaction.reply({ content: "This giveaway has ended!", ephemeral: true });
        }

        const userId = interaction.user.id;
        
        if (activeGiveaway.participants.includes(userId)) {
            return interaction.reply({ content: "You already joined this giveaway!", ephemeral: true });
        }

        activeGiveaway.participants.push(userId);
        await giveawayCollection.updateOne(
            { messageId: activeGiveaway.messageId },
            { $push: { participants: userId } }
        );

        await interaction.reply({ content: "✅ You joined the giveaway! Good luck!", ephemeral: true });
    }

    // ... (Existing delete/backup buttons) ...
    
    if (interaction.customId === "confirm_update_all") {
        await interaction.update({ 
            content: "⏳ Updating ALL scripts... This process will take a significant amount of time due to obfuscation.", 
            components: [] 
        });

        const files = await listGitHubFiles(GITHUB_BACKUP_REPO);

        if (!files || files.length === 0) {
            return interaction.followUp("📭 No backup scripts found to update!");
        }

        let updated = 0;
        let failed = 0;
        
        // Notify progress periodically
        const statusMsg = await interaction.followUp(`🔄 Starting bulk update of ${files.length} scripts...`);

        for (let i = 0; i < files.length; i++) {
            const fileName = files[i];
            // Update progress message every 5 scripts
            if (i % 5 === 0) await statusMsg.edit(`🔄 Processing ${i + 1}/${files.length}: **${fileName}**...`);
            
            // Re-using the message object is tricky in loop, simpler to pass statusMsg for editing if needed
            const result = await processUpdate(fileName, null, statusMsg);
            
            if (result.success) updated++;
            else failed++;
        }

        return interaction.followUp(
            `✅ **Bulk Update Complete!**\n\n` +
            `🟢 Updated: ${updated}\n` +
            `🔴 Failed: ${failed}`
        );
    }

    if (interaction.customId === "cancel_update_all") {
        await interaction.update({ 
            content: "❌ Update cancelled.", 
            components: [] 
        });
        return;
    }

    // ... (Existing logic for delete/backup)
    if (interaction.customId === "confirm_delete_all") {
        await interaction.update({ 
            content: "⏳ Deleting all scripts...", 
            components: [] 
        });

        const files = await listGitHubFiles();

        if (!files || files.length === 0) {
            return interaction.followUp("📭 No scripts to delete!");
        }

        let deleted = 0;
        let failed = 0;

        for (const file of files) {
            const success = await deleteGitHubFile(file);
            if (success) deleted++;
            else failed++;
        }

        return interaction.followUp(`✅ Deleted ${deleted} scripts!${failed > 0 ? `\n❌ Failed to delete ${failed} scripts.` : ''}`);
    }

    if (interaction.customId === "cancel_delete_all") {
        await interaction.update({ 
            content: "❌ Deletion cancelled.", 
            components: [] 
        });
        return;
    }

    if (interaction.customId.startsWith("confirm_delete_") && interaction.customId !== "confirm_delete_all") {
        const scriptNumber = parseInt(interaction.customId.split("_")[2]);

        await interaction.update({ 
            content: "⏳ Deleting script...", 
            components: [] 
        });

        const files = await listGitHubFiles();

        if (!files || files.length === 0) {
            return interaction.followUp("📭 No scripts found!");
        }

        if (scriptNumber < 1 || scriptNumber > files.length) {
            return interaction.followUp(`❌ Script number ${scriptNumber} not found!`);
        }

        const scriptName = files[scriptNumber - 1];
        const success = await deleteGitHubFile(scriptName);

        if (success) {
            return interaction.followUp(`✅ Successfully deleted script: **${scriptName}**`);
        } else {
            return interaction.followUp(`❌ Failed to delete script: **${scriptName}**`);
        }
    }

    if (interaction.customId.startsWith("cancel_delete_") && interaction.customId !== "cancel_delete_all") {
        await interaction.update({ 
            content: "❌ Deletion cancelled.", 
            components: [] 
        });
        return;
    }

    if (interaction.customId === "confirm_backup_all") {
        await interaction.update({ 
            content: "⏳ Restoring all scripts from backup...", 
            components: [] 
        });

        const backupFiles = await listGitHubFiles(GITHUB_BACKUP_REPO);
        const mainFiles = await listGitHubFiles(GITHUB_REPO);

        if (!backupFiles || backupFiles.length === 0) {
            return interaction.followUp("📭 No backup scripts found!");
        }

        let restored = 0;
        let failed = 0;

        for (const fileName of backupFiles) {
            try {
                const backupData = await getGitHubFileContent(fileName, GITHUB_BACKUP_REPO);
                if (!backupData) {
                    failed++;
                    continue;
                }

                if (mainFiles.includes(fileName)) {
                    const success = await updateGitHubFile(fileName, backupData.content, GITHUB_REPO);
                    if (success) restored++;
                    else failed++;
                } else {
                    const url = await createGitHubFile(fileName, backupData.content, GITHUB_REPO);
                    if (url) restored++;
                    else failed++;
                }
            } catch (error) {
                console.error(`Failed to restore ${fileName}:`, error);
                failed++;
            }
        }

        return interaction.followUp(`✅ Restored ${restored} scripts from backup!${failed > 0 ? `\n❌ Failed to restore ${failed} scripts.` : ''}`);
    }

    if (interaction.customId === "cancel_backup_all") {
        await interaction.update({ 
            content: "❌ Backup restore cancelled.", 
            components: [] 
        });
        return;
    }

    if (interaction.customId === "confirm_obfuscate_all") {
        await interaction.update({ 
            content: "⏳ Obfuscating all scripts... This may take several minutes.", 
            components: [] 
        });

        const files = await listGitHubFiles(GITHUB_REPO);

        if (!files || files.length === 0) {
            return interaction.followUp("📭 No scripts to obfuscate!");
        }

        let obfuscated = 0;
        let skipped = 0;
        let failed = 0;

        for (const fileName of files) {
            try {
                const fileData = await getGitHubFileContent(fileName, GITHUB_REPO);
                
                if (!fileData) {
                    failed++;
                    continue;
                }

                if (isObfuscated(fileData.content)) {
                    skipped++;
                    continue;
                }

                const obfuscatedCode = await obfuscateCode(fileData.content);
                
                if (!obfuscatedCode) {
                    failed++;
                    continue;
                }

                const success = await updateGitHubFile(fileName, obfuscatedCode, GITHUB_REPO);
                
                if (success) {
                    obfuscated++;
                } else {
                    failed++;
                }

            } catch (error) {
                console.error(`Failed to obfuscate ${fileName}:`, error);
                failed++;
            }
        }

        return interaction.followUp(
            `✅ **Obfuscation Complete!**\n\n` +
            `🟢 Obfuscated: ${obfuscated}\n` +
            `⚪ Skipped (already obfuscated): ${skipped}\n` +
            `${failed > 0 ? `❌ Failed: ${failed}` : ''}`
        );
    }

    if (interaction.customId === "cancel_obfuscate_all") {
        await interaction.update({ 
            content: "❌ Obfuscation cancelled.", 
            components: [] 
        });
        return;
    }
});

// ===== COMMAND HANDLER =====



client.on("messageCreate", async (message) => {
    if (message.author.bot) return;

    const args = message.content.trim().split(/ +/g);
    const cmd = args.shift()?.toLowerCase();
    // loadstring command
    if (cmd === "?ld") {
    const text = args.join(" ").trim();
    if (!text) return message.reply("Usage: `?ld <url>`");
    return message.channel.send(`\`\`\`lua\nloadstring(game:HttpGet("${text}","true"))()\n\`\`\``);
}

// --- PERM COMMAND ---
    if (cmd === "?perm") {
        // Staff/Owner only check
        if (!(await isStaff(message.author.id, message.member)) && message.author.id !== OWNER_ID) {
            return message.reply("❌ Staff only.");
        }
        
        const type = args[0]?.toLowerCase();
        const target = message.mentions.users.first();
        
        if (!type || !target) return message.reply("Usage: `?perm <bypass/by> @user`");
        
        // Normalize permission name
        let cleanPerm = type.replace('?', '');
        if (cleanPerm === 'by') cleanPerm = 'bypass';

        const validPerms = ['bypass'];
        if (!validPerms.includes(cleanPerm)) return message.reply(`Invalid perm. Valid: ${validPerms.join(', ')}`);
        
        await setUserPermission(target.id, cleanPerm);
        
        return message.reply(`✅ Granted **${cleanPerm}** to <@${target.id}>\n*Note: User is limited to 6 requests per minute.*`);
    }
    // ============ UPDATE Command ==========
    if (cmd === "?update" || cmd === "?up") {
        if (!(await isStaff(message.author.id, message.member))) {
            return message.reply("❌ Staff only command.");
        }

        let input = args.join(" ");
        if (!input) {
            return message.reply("❌ Usage: `?update all` or `?update <number/name>`");
        }

        // UPDATE ALL
        if (input.toLowerCase() === "all") {
            const confirmButton = new ButtonBuilder()
                .setCustomId("confirm_update_all")
                .setLabel("Confirm Update ALL")
                .setStyle(ButtonStyle.Danger);

            const cancelButton = new ButtonBuilder()
                .setCustomId("cancel_update_all")
                .setLabel("Cancel")
                .setStyle(ButtonStyle.Secondary);

            const row = new ActionRowBuilder().addComponents(confirmButton, cancelButton);

            return message.reply({
                content: "⚠️ **WARNING:** This will re-generate and re-obfuscate ALL scripts with the new key system UI. This process is slow!",
                components: [row]
            });
        }

        // UPDATE SINGLE
        await message.reply("⏳ Fetching script info...");

        // Try to resolve filename from number or name
        let fileName = input;
        
        // If numeric, lookup in list
        if (/^\d+$/.test(input.trim())) {
             const scriptNumber = parseInt(input);
             const files = await listGitHubFiles(GITHUB_BACKUP_REPO); // Look in backup list
             
             if (!files || files.length === 0) return message.reply("📭 No scripts found in backup!");
             if (scriptNumber < 1 || scriptNumber > files.length) return message.reply(`❌ Invalid number! Choose 1-${files.length}`);
             
             fileName = files[scriptNumber - 1];
        } else {
            // Assume filename input, check existence
            const files = await listGitHubFiles(GITHUB_BACKUP_REPO);
            if (!files.includes(fileName)) {
                // Try appending .lua
                if (files.includes(fileName + ".lua")) fileName += ".lua";
                else return message.reply(`❌ Script **${fileName}** not found in backup!`);
            }
        }

        const statusMsg = await message.reply(`🔄 Updating **${fileName}**...`);
        const result = await processUpdate(fileName, message, statusMsg);

        if (result.success) {
            const githubUrl = `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/${GITHUB_BRANCH}/${fileName}`;
            const loadstringCode = `\`\`\`lua\nloadstring(game:HttpGet("${githubUrl}"))()\n\`\`\``;
            
            const embed = new EmbedBuilder()
                .setTitle("✅ Script Updated!")
                .setColor("Green")
                .setDescription(`Successfully regenerated **${fileName}** with the latest key system UI.`)
                .addFields({ name: "Loadstring", value: loadstringCode })
                .setTimestamp();
            
            await statusMsg.delete().catch(()=>{});
            return message.channel.send({ embeds: [embed] });
        } else {
            await statusMsg.delete().catch(()=>{});
            return message.channel.send(`❌ Update failed: ${result.reason}`);
        }
    }

// ============ STOP Command ==========
    if (cmd === "?stop") {
        if (!bypassInProgress) {
            return message.reply("❌ No bypass in progress!");
        }
        
        bypassStopRequested = true;
        return message.reply("🛑 **Stopping bypass process...**");
    }

    // ============ Bypass Command ==========
// --- BYPASS COMMAND ---
    if (cmd === "?bypass" || cmd === "?by") {
        const staff = await isStaff(message.author.id, message.member);
        const owner = message.author.id === OWNER_ID;
        const hasPerm = await hasPermission(message.author.id, 'bypass');
        
        // If not staff, not owner, and no perm -> Deny
        if (!staff && !owner && !hasPerm) {
            return message.reply("❌ Permission denied.");
        }
        
        if (bypassInProgress) return message.reply("⚠️ System busy. Please wait.");
        
        const url = args[0];
        if (!url) return message.reply("Usage: `?bypass <url>`");
        
        bypassInProgress = true;
        bypassStopRequested = false;
        
        // Determine if rate limit applies (Apply to perm users who are NOT staff/owner)
        const applyLimit = (!staff && !owner);
        
        const result = await recursiveBypassWithIzen(url, message, 0, 10, {
            userId: message.author.id,
            limited: applyLimit
        });
        
        if (result.stopped) return message.channel.send("🛑 Stopped.");
        
        if (result.error) {
            // If rate limit hit, show specific message
            if (result.message.includes("Rate Limit")) {
                 return message.channel.send(`⏳ **Rate Limit Reached**\nYou have used your 6 requests for this minute.`);
            }
            return message.channel.send(`❌ Error: ${result.message}`);
        }
        
        // SUCCESS
        const embed = new EmbedBuilder()
            .setColor("Green")
            .setTitle("Bypass Successful")
            .addFields(
                { name: "Original", value: `\`${url.substring(0, 80)}...\`` },
                { name: "Attempts", value: `${result.attempts}`, inline: true },
                { name: "Status", value: "✅ Success", inline: true }
            )
            .setFooter({ text: "Sairo System" });
            
        await message.channel.send({ embeds: [embed] });
        // Send raw code block
        return message.channel.send(`\`\`\`\n${result.result}\n\`\`\``);
    }

// ----- Queue ------ 
    if (cmd === "?queue") {
        if (!(await isStaff(message.author.id, message.member)) && message.author.id !== OWNER_ID) {
            return message.reply("❌ Staff only command.");
        }

        return message.reply("ℹ️ **PRIME X HUB**\n✅ Direct API - No queue system needed!\n💡 Use `?stop` to cancel active bypass");
    }

    // ===== KEY SYSTEM COMMANDS =====
    if (cmd === "?keys") {
        if (!(await isStaff(message.author.id, message.member)) && message.author.id !== OWNER_ID) {
            return message.reply("❌ Staff only command.");
        }
        try {
            const latestKeys = await keyHistoryCollection.find({}).sort({ createdAt: -1 }).limit(10).toArray();
            if (!latestKeys.length) return message.reply("📭 No keys generated yet.");
            
            const embed = new EmbedBuilder()
                .setTitle("🔑 Latest 10 Generated Keys")
                .setColor("Blue")
                .setTimestamp();
                
            let desc = "";
            latestKeys.forEach((k, i) => {
                const timeStr = `<t:${Math.floor(new Date(k.createdAt).getTime() / 1000)}:R>`;
                desc += `**${i+1}.** \`${k.key}\`\n└ HWID: \`${k.hwid}\` | ${timeStr}\n\n`;
            });
            embed.setDescription(desc);
            return message.reply({ embeds: [embed] });
        } catch (e) {
            return message.reply("❌ Error fetching keys.");
        }
    }

    if (cmd === "?keyd") {
        if (!(await isStaff(message.author.id, message.member)) && message.author.id !== OWNER_ID) {
            return message.reply("❌ Staff only command.");
        }
        try {
            const now = new Date();
            const startOfHour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours());
            
            const todayStr = now.toISOString().split('T')[0];
            const monthPrefix = todayStr.substring(0, 7); // YYYY-MM

            const [hourCount, todayStat, monthStats] = await Promise.all([
                keyHistoryCollection.countDocuments({ createdAt: { $gte: startOfHour } }),
                dailyStatsCollection.findOne({ date: todayStr }),
                dailyStatsCollection.find({ date: { $regex: `^${monthPrefix}` } }).toArray()
            ]);

            const dayCount = todayStat ? todayStat.count : 0;
            const monthCount = monthStats.reduce((acc, curr) => acc + curr.count, 0);

            const embed = new EmbedBuilder()
                .setTitle("📊 Key Generation Statistics")
                .setColor("Green")
                .addFields(
                    { name: "This Hour", value: `**${hourCount}** keys`, inline: true },
                    { name: "Today", value: `**${dayCount}** keys`, inline: true },
                    { name: "This Month", value: `**${monthCount}** keys`, inline: true }
                )
                .setTimestamp();
            return message.reply({ embeds: [embed] });
        } catch (e) {
            return message.reply("❌ Error fetching statistics.");
        }
    }

    if (cmd === "?key") {
        if (!(await isStaff(message.author.id, message.member)) && message.author.id !== OWNER_ID) {
            return message.reply("❌ Staff only command.");
        }
        const hwid = args[0];
        if (!hwid) return message.reply("Usage: `?key <hwid>` (Note: Use HWID as there are no usernames)");

        try {
            const userStat = await userStatsCollection.findOne({ hwid });
            const totalGenerated = userStat ? userStat.totalKeys : 0;
            const activeKey = await activeKeyCollection.findOne({ hwid });

            const embed = new EmbedBuilder()
                .setTitle(`🔍 Key Info for HWID`)
                .setDescription(`\`${hwid}\``)
                .setColor(activeKey ? "Green" : "Red")
                .addFields(
                    { name: "Total Keys Generated", value: `**${totalGenerated}**`, inline: true },
                    { name: "Active Key", value: activeKey ? `\`${activeKey.key}\`` : "None", inline: false }
                );
            
            if (activeKey) {
                embed.addFields({ name: "Expires", value: `<t:${Math.floor(new Date(activeKey.expiresAt).getTime() / 1000)}:R>`, inline: true });
            }

            return message.reply({ embeds: [embed] });
        } catch (e) {
            return message.reply("❌ Error fetching user keys.");
        }
    }

    if (cmd === "?keyr") {
        if (!(await isStaff(message.author.id, message.member)) && message.author.id !== OWNER_ID) {
            return message.reply("❌ Staff only command.");
        }
        const hwid = args[0];
        if (!hwid) return message.reply("Usage: `?keyr <hwid>` (Note: Use HWID as there are no usernames)");

        try {
            const result = await activeKeyCollection.deleteOne({ hwid });
            if (result.deletedCount > 0) {
                return message.reply(`✅ Successfully removed active key for HWID: \`${hwid}\``);
            } else {
                return message.reply(`⚠️ No active key found for HWID: \`${hwid}\``);
            }
        } catch (e) {
            return message.reply("❌ Error removing key.");
        }
    }

    // ===== HELP COMMANDS =====

    if (cmd === "?help" || cmd === "?h") {
        const embed = new EmbedBuilder()
            .setTitle("📋 Goblox Bot Commands")
            .setColor("Blue")
            .setDescription("Here are all available commands:")
            .addFields(
                {
                    name: "**Vouch Commands**",
                    value: 
                        "`+vouch @user [description]` - Give a positive vouch\n" +
                        "`-vouch @user [description]` - Give a negative vouch\n" +
                        "`+p [@user]` - View vouch profile",
                    inline: false
                },
                {
                    name: "**Currency Commands**",
                    value:
                        "`?balance [@user]` - Check robux balance\n" +
                        "`?give @user <amount>` - Give robux to a user (Staff)\n" +
                        "`?set @user <amount>` - Set user's robux balance (Staff)\n" +
                        "`?take @user <amount>` - Take robux from a user (Staff)",
                    inline: false
                },
                {
                    name: "**Other Commands**",
                    value: 
                        "`?help` or `?h` - Show this help menu\n" +
                        "`?modhelp` or `?mp` - Show moderation commands",
                    inline: false
                }
            )
            .setFooter({ text: "Goblox Bot | Made with ❤️" })
            .setTimestamp();

        return message.reply({ embeds: [embed] });
    }

if (cmd === "?modhelp" || cmd === "?mp") {
    if (!(await isStaff(message.author.id, message.member)))
        return message.reply("Staff only command.");

    const embed = new EmbedBuilder()
        .setTitle("🛡️ Moderation Commands")
        .setColor("Red")
        .setDescription("Staff & Admin commands:")
        .addFields(
            {
                name: "**Staff Management** (Owner Only)",
                value:
                    "`?newstaff @user` - Add a user as staff (Owner only)\n" +
                    "`?removestaff @user` - Remove a user from staff (Owner only)\n" +
                    "`?staff` - List all staff members",
                inline: false
            },
            {
                name: "**Bypass System** (Staff/Permitted)",
                value:
                    "`?bypass <url>` or `?by <url>` - Bypass any link\n" +
                    "`?queue` - View API status\n" +
                    "`?stop` - Stop active bypass\n\n" +
                    "**Permission Commands (Staff Only):**\n" +
                    "`?perm bypass @user` - Give bypass perm to user\n" +
                    "`?perm by @user` - Same as above (shortcut)\n\n" +
                    "⚠️ Permitted users: **6 requests/minute limit**",
                inline: false
            },
            {
                name: "**Key System** (Staff Only)",
                value:
                    "`?keys` - View latest 10 generated keys\n" +
                    "`?keyd` - View key generation statistics\n" +
                    "`?key <hwid>` - View a user's keys\n" +
                    "`?keyr <hwid>` - Remove/expire a user's active key",
                inline: false
            },
            {
                name: "**Roblox Script Generator** (Staff Only)",
                value:
                    "`?ls <url>` or `?loadingstring <url>` - Generate obfuscated script with GitHub upload\n" +
                    "`?ls <number>` - Get loadstring by script number\n" +
                    "`?lsl` or `?loadingstringlist` - List all scripts in repository\n" +
                    "`?lsd <number>` - Delete script (Owner only)\n" +
                    "`?lsd all` - Delete ALL scripts with confirmation (Owner only)\n" +
                    "`?update <name/number>` - Update script with new UI\n" +
                    "`?update all` - Bulk update all scripts",
                inline: false
            },
            {
                name: "**Backup Commands** (Owner Only)",
                value:
                    "`?backup <name>` or `?b <name>` - Restore script from backup repo\n" +
                    "`?backup all` or `?b all` - Restore ALL matching scripts from backup\n" +
                    "`?backup initiate current` - Create backups from bot's messages in current channel",
                inline: false
            },
            {
                name: "**Repo Commands** (Owner Only)",
                value:
                    "`?repo git <token>` - Set GitHub token for repo commands (separate from main token)\n" +
                    "`?repo clear <reponame>` - Delete all files in repo except README.md\n" +
                    "`?repo update <reponame> <commitid>` - Clear repo & restore exact state from commit",
                inline: false
            },
            {
                name: "**Moderation Commands** (Staff Only)",
                value:
                    "`?ban @user [reason]` - Ban a user\n" +
                    "`?kick @user [reason]` - Kick a user\n" +
                    "`?timeout @user <time>` - Timeout a user (e.g., 10m or 1h)\n" +
                    "`?untimeout @user` - Remove timeout from a user\n" +
                    "`?warn @user [reason]` - Warn a user\n" +
                    "`?clear <1-1000>` - Delete messages from the channel",
                inline: false
            },
            {
                name: "**Giveaway Commands** (Staff Only)",
                value:
                    "`?creategiveaway <prize> <winners> [@host] [#channel] <timer>` - Create giveaway (attach image)\n" +
                    "`?reroll` - Reroll giveaway winners\n" +
                    "`?endgiveaway` - End active giveaway\n\n" +
                    "**Timer formats:** 10s, 5m, 1h, 1d",
                inline: false
            },
            {
                name: "**YouTube Script Commands** (Staff Only)",
                value:
                    "`?yt set <url>` - Auto scan 30 latest videos & track channel automatically every 1 hr\n" +
                    "`?yt <url> [quantity]` - Scan videos, output to current channel\n" +
                    "`?yt remove <url>` - Remove a YT channel and stop tracking it\n" +
                    "`?ytl` / `?youtubelist` / `?ytlist` - List all YouTube-sourced scripts\n                    `?ytsl` - List all currently tracked YouTube channels\n                    `?yts <number>` - View detailed info for a script from the `?ytl` list\n\n" +
                    "**Aliases:** `?youtube` works everywhere `?yt` does",
                inline: false
            },
            {
                name: "**Sairo Key System** (Staff Only)",
                value:
                    "`?setdevid @user` - Assign a DevId to a user (Owner only)\n" +
                    "`?sairo addstep \"Label\" \"URL\" \"Token\"` - Step add karo apne DevId ke liye\n" +
                    "`?sairo removestep \"Label\"` - Step remove karo\n" +
                    "`?sairo setblocking true/false` - Anti-bypass toggle karo\n" +
                    "`?sairo myid` - Apna DevId dekho\n" +
                    "`?sairo help` - Sairo commands list dekho",
                inline: false
            }
        )
        .setFooter({ text: "Goblox Bot | Moderation Panel" })
        .setTimestamp();

    return message.reply({ embeds: [embed] });
}

    // ===== LOADSTRING COMMAND =====

// ===== LOADSTRING COMMAND =====

// ===== LOADSTRING COMMAND =====

if (cmd === "?ls" || cmd === "?loadingstring") {
    if (!(await isStaff(message.author.id, message.member))) {
        return message.reply("❌ Staff only command.");
    }

    let input = args.join(" ");
    
    if (!input) {
        return message.reply("❌ Please provide a URL, loadstring, or script number!");
    }

input = input.replace(/`/g, "").trim();

let customName = null;
let customDevId = null;
const inputParts = input.split(" ");
const coreInput = [...inputParts];
const trailingExtras = [];

for (let i = 0; i < 2; i++) {
    const last = coreInput[coreInput.length - 1];
    if (last && !last.startsWith("http") && !last.startsWith("loadstring(")) {
        trailingExtras.unshift(last);
        coreInput.pop();
    } else break;
}

if (trailingExtras.length === 2) {
    customName  = trailingExtras[0].replace(/[^a-zA-Z0-9_\-\.]/g, "");
    customDevId = trailingExtras[1].replace(/[^a-zA-Z0-9_\-]/g, "");
} else if (trailingExtras.length === 1) {
    customName = trailingExtras[0].replace(/[^a-zA-Z0-9_\-\.]/g, "");
}

input = coreInput.join(" ").trim();

// Shortcut resolution for devid
if (customDevId && customDevId.length === 1 && /^[a-zA-Z0-9]$/.test(customDevId)) {
    const sc = await shortcutCollection.findOne({ key: customDevId });
    if (sc) customDevId = sc.value;
}
    // CHECK IF INPUT IS A NUMBER FIRST
    if (/^\d+$/.test(input.trim())) {
        const scriptNumber = parseInt(input);

        await message.reply("⏳ Fetching script...");

        const files = await listGitHubFiles();

        if (!files || files.length === 0) {
            return message.reply("📭 No scripts found!");
        }

        if (scriptNumber < 1 || scriptNumber > files.length) {
            return message.reply(`❌ Invalid number! Choose between 1 and ${files.length}.`);
        }

        const scriptName = files[scriptNumber - 1];
        const githubUrl = `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/${GITHUB_BRANCH}/${scriptName}`;
        const loadstringCode = `\`\`\`lua\nloadstring(game:HttpGet("${githubUrl}"))()\n\`\`\``;

        const embed = new EmbedBuilder()
            .setTitle("✅ Script Loadstring")
            .setColor("Green")
            .addFields(
                { name: "📝 Script Name", value: `\`${scriptName}\``, inline: false },
                { name: "🔢 Number", value: `\`${scriptNumber}\``, inline: true },
                { name: "🌐 GitHub URL", value: `\`${githubUrl}\``, inline: false }
            )
            .setTimestamp();

        await message.reply({ embeds: [embed] });
        await message.channel.send(loadstringCode);

        return;
    }

    // Process as URL/loadstring
    const rawUrl = extractRawUrl(input);
    
    if (!rawUrl) {
        return message.reply("❌ Invalid input!");
    }

    // ============================================
    // RECURSIVE BYPASS CHECK
    // ============================================
    
    let finalUrl = rawUrl;
    let bypassAttempts = 0;
    const maxBypassAttempts = 10;

    // Keep bypassing until we get a non-bypass URL
    while (needsBypass(finalUrl) && bypassAttempts < maxBypassAttempts) {
        bypassAttempts++;
        
        const initialMsg = await message.reply(`🔄 **Bypass Attempt ${bypassAttempts}**\nDetected bypass link! Processing...\n\`${finalUrl.substring(0, 100)}...\``);

        bypassInProgress = true;
        bypassStopRequested = false;

        const bypassResult = await recursiveBypassWithIzen(finalUrl, message);

        if (bypassResult.stopped) {
            await initialMsg.delete().catch(() => {});
            return message.channel.send(`🛑 **Bypass Stopped by User**`);
        }

        if (bypassResult.error) {
            bypassInProgress = false;
            await initialMsg.delete().catch(() => {});
            return message.channel.send(`❌ **Bypass Failed at attempt ${bypassAttempts}!**\n${bypassResult.message}`);
        }

        finalUrl = bypassResult.result;
        await initialMsg.delete().catch(() => {});
        
        // Check if result is a loadstring
        const loadstringMatch = finalUrl.match(/loadstring\(game:HttpGet\("([^"]+)"\)\)\(\)/);
        if (loadstringMatch) {
            finalUrl = loadstringMatch[1]; // Extract URL from loadstring
        }
        
        // If finalUrl still needs bypass, loop will continue
        if (needsBypass(finalUrl)) {
            await message.channel.send(`⚠️ **Result is another bypass link! (Attempt ${bypassAttempts}/${maxBypassAttempts})**\nContinuing...\n\`${finalUrl.substring(0, 100)}...\``).then(msg => {
                setTimeout(() => msg.delete().catch(() => {}), 3000);
            });
            await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
        }
    }

    // ============================================
    // MAX ATTEMPTS CHECK
    // ============================================
    
    if (bypassAttempts >= maxBypassAttempts) {
        return message.channel.send(`❌ **Maximum bypass attempts (${maxBypassAttempts}) reached!**\nLast URL: \`${finalUrl}\``);
    }

    // ============================================
    // FINAL URL PROCESSING
    // ============================================
    
    if (bypassAttempts > 0) {
        await message.channel.send(`✅ **Bypass Complete!** (${bypassAttempts} attempts)\nFinal URL obtained, now generating script...`);
    }

// Extract script name from final URL
    let scriptName;

if (customName && customName.length >= 2) {
        // Custom name diya hai user ne - exactly as typed
        scriptName = customName;
    
    } else {
        // Auto name URL se
        const urlParts = finalUrl.split('/');
        const lastPart = urlParts[urlParts.length - 1];
        scriptName = lastPart.split('?')[0].split('#')[0];
        
        if (!scriptName || scriptName.length < 3) {
            scriptName = `script_${Date.now()}.lua`;
        }
        
        if (!scriptName.endsWith('.lua') && !scriptName.endsWith('.txt')) {
            scriptName += '.lua';
        }
    }

    // Fetch original script
    let originalScript;
    try {
        const response = await axios.get(finalUrl, { timeout: 15000 });
        originalScript = response.data;
    } catch (error) {
        return message.channel.send(`❌ Failed to fetch script from final URL.\nURL: \`${finalUrl}\`\nError: ${error.message}`);
    }

    // Generate key system script
    const robloxScript = generateKeySystemScript(finalUrl, customDevId);

    await message.reply("⏳ Obfuscating script...");

    const obfuscatedScript = await obfuscateCode(robloxScript);

    if (!obfuscatedScript) {
        await message.reply("⚠️ Obfuscation failed. Uploading original...");
    }

    // Upload to GitHub
    const githubUrl = await createGitHubFile(scriptName, obfuscatedScript || robloxScript, GITHUB_REPO);
    
    if (!githubUrl) {
        return message.reply("❌ Failed to upload to GitHub.");
    }

    // Backup
    await createGitHubFile(scriptName, robloxScript, GITHUB_BACKUP_REPO);

    const loadstringCode = `\`\`\`lua\nloadstring(game:HttpGet("${githubUrl}"))()\n\`\`\``;

    const embed = new EmbedBuilder()
        .setTitle("✅ Roblox Script Generated!")
        .setColor("Green")
        .addFields(
            { name: "📝 Script Name", value: `\`${scriptName}\` ${customName ? "*(custom)*" : "*(auto)*"}`, inline: false },
            { name: "🔗 Original URL", value: `\`${rawUrl.substring(0, 100)}${rawUrl.length > 100 ? '...' : ''}\``, inline: false },
            { name: "🔄 Bypass Attempts", value: `\`${bypassAttempts}\``, inline: true },
            { name: "🟢 Status", value: obfuscatedScript ? "✅ Obfuscated" : "⚠️ Not obfuscated", inline: true },
            { name: "🌐 Final Script URL", value: `\`${finalUrl.substring(0, 100)}${finalUrl.length > 100 ? '...' : ''}\``, inline: false },
            { name: "📦 GitHub URL", value: `\`${githubUrl}\``, inline: false }
        )
        .setTimestamp();

    await message.reply({ embeds: [embed] });
    await message.channel.send(loadstringCode);
}
// ===== BULLY (TROLL VC DRAG) COMMAND =====
const activeBullySessions = new Map();

if (cmd === "?bully") {
    if (!(await isStaff(message.author.id, message.member)) && message.author.id !== OWNER_ID) {
        return message.reply("❌ Staff only.");
    }

    const target = message.mentions.members.first();
    const duration = parseInt(args[1]);

    if (!target || !duration || isNaN(duration) || duration < 1 || duration > 300) {
        return message.reply("❌ Usage: `?bully @user <seconds>` (max 300s)");
    }

    // Check if target is in a VC
    const originalVC = target.voice.channel;
    if (!originalVC) {
        return message.reply(`❌ **${target.user.username}** kisi VC mein nahi hai!`);
    }

    // Check if already being bullied
    if (activeBullySessions.has(target.id)) {
        return message.reply(`⚠️ **${target.user.username}** already bully session mein hai!`);
    }

    // Get all voice channels in guild
    const allVCs = message.guild.channels.cache.filter(
        ch => ch.type === 2 && ch.id !== originalVC.id // 2 = GuildVoice
    );

    if (allVCs.size === 0) {
        return message.reply("❌ Koi aur VC nahi hai server mein!");
    }

    const vcArray = [...allVCs.values()];

    await message.reply(`😈 **${target.user.username}** ko ${duration}s ke liye drag kar raha hoon...`);

    // Mark as active
    activeBullySessions.set(target.id, true);

    let elapsed = 0;
    const interval = setInterval(async () => {
        elapsed += 1.5;

        // Check if session was stopped or user left VC
        if (!activeBullySessions.has(target.id) || elapsed >= duration) {
            clearInterval(interval);
            activeBullySessions.delete(target.id);

            // Move back to original VC
            try {
                const freshMember = await message.guild.members.fetch(target.id);
                if (freshMember.voice.channel) {
                    await freshMember.voice.setChannel(originalVC);
                    message.channel.send(`✅ **${target.user.username}** wapas **${originalVC.name}** mein!`);
                }
            } catch (e) {
                console.error("Bully end move error:", e.message);
            }
            return;
        }

        // Move to random VC
        try {
            const freshMember = await message.guild.members.fetch(target.id);
            if (!freshMember.voice.channel) {
                // User left VC, stop session
                clearInterval(interval);
                activeBullySessions.delete(target.id);
                message.channel.send(`⚠️ **${target.user.username}** VC se nikal gaya, session stop!`);
                return;
            }

            const randomVC = vcArray[Math.floor(Math.random() * vcArray.length)];
            await freshMember.voice.setChannel(randomVC);
        } catch (e) {
            console.error("Bully move error:", e.message);
        }
    }, 1500); // har 1.5 sec pe move
}

// ===== BULLY STOP =====
if (cmd === "?bullystop") {
    if (!(await isStaff(message.author.id, message.member)) && message.author.id !== OWNER_ID) {
        return message.reply("❌ Staff only.");
    }

    const target = message.mentions.members.first();
    if (!target) return message.reply("❌ Kise stop karna hai? `?bullystop @user`");

    if (!activeBullySessions.has(target.id)) {
        return message.reply(`⚠️ **${target.user.username}** ka koi active bully session nahi hai.`);
    }

    activeBullySessions.delete(target.id); // interval khud cleanup karega
    return message.reply(`🛑 **${target.user.username}** ka bully session stop kar diya!`);
}
    // ===== NEW SCRIPT COMMAND =====
    if (cmd === "?ns") {
        if (!(await isStaff(message.author.id, message.member))) {
            return message.reply("❌ Staff only command.");
        }

        let input = args.join(" ").trim();

        // 1. List files if no input
        if (!input && message.attachments.size === 0) {
            await message.reply("⏳ Fetching scripts from directx...");

            const files = await listGitHubFiles(GITHUB_DIRECTX_REPO);

            if (!files || files.length === 0) {
                return message.reply("📭 No scripts found in directx repository!");
            }

            let scriptList = "**📋 Available Scripts in directx:**\n\n";
            files.forEach((file, index) => {
                scriptList += `**${index + 1}.** ${file}\n`;
            });

            scriptList += `\n💡 **Usage:** \`?ns <number>\``;

            const embed = new EmbedBuilder()
                .setTitle("🗂️ DirectX Script Library")
                .setDescription(scriptList)
                .setColor("Blue")
                .setFooter({ text: `Total Scripts: ${files.length}` })
                .setTimestamp();

            return message.reply({ embeds: [embed] });
        }

        // 2. Retrieve script by number
        if (/^\d+$/.test(input) && message.attachments.size === 0) {
            const scriptNumber = parseInt(input);

            await message.reply("⏳ Fetching script from directx...");

            const files = await listGitHubFiles(GITHUB_DIRECTX_REPO);

            if (!files || files.length === 0) {
                return message.reply("📭 No scripts found in directx repository!");
            }

            if (scriptNumber < 1 || scriptNumber > files.length) {
                return message.reply(`❌ Invalid number! Choose between 1 and ${files.length}.`);
            }

            const scriptName = files[scriptNumber - 1];
            const githubUrl = `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_DIRECTX_REPO}/${GITHUB_BRANCH}/${scriptName}`;
            const loadstringCode = `\`\`\`lua\nloadstring(game:HttpGet("${githubUrl}"))()\n\`\`\``;

            const embed = new EmbedBuilder()
                .setTitle("✅ Script Loadstring (DirectX)")
                .setColor("Green")
                .addFields(
                    { name: "📝 Script Name", value: `\`${scriptName}\``, inline: false },
                    { name: "🔢 Number", value: `\`${scriptNumber}\``, inline: true },
                    { name: "🌐 GitHub URL", value: `\`${githubUrl}\``, inline: false }
                )
                .setTimestamp();

            await message.reply({ embeds: [embed] });
            await message.channel.send(loadstringCode);

            return;
        }

        // 3. Upload script from attachment
        if (message.attachments.size > 0) {
            if (!input) {
                return message.reply("❌ Please provide a name for the script! Usage: `?ns <Name>` with a .txt file attached.");
            }

            const attachment = message.attachments.first();
            
            if (!attachment.name.endsWith('.txt') && !attachment.name.endsWith('.lua')) {
                return message.reply("❌ Please attach a `.txt` or `.lua` file!");
            }

            let scriptName = input;
            if (!scriptName.endsWith('.lua') && !scriptName.endsWith('.txt')) {
                scriptName += '.lua';
            }

            await message.reply("⏳ Downloading and processing script...");

            try {
                const response = await axios.get(attachment.url);
                const rawScriptContent = response.data;

                if (!rawScriptContent || rawScriptContent.trim() === "") {
                    return message.reply("❌ The attached file is empty!");
                }

                await message.channel.send("⏳ Obfuscating script...");

                const obfuscatedScript = await obfuscateCode(rawScriptContent);

                if (!obfuscatedScript) {
                    return message.reply("❌ Obfuscation failed. Script was not uploaded.");
                }

// Upload obfuscated to directx repo
                const githubUrl = await createGitHubFile(scriptName, obfuscatedScript, GITHUB_DIRECTX_REPO);
                
                if (!githubUrl) {
                    return message.reply("❌ Failed to upload obfuscated script to GitHub (directx repo).");
                }

                // Save raw to backops repo (same name, no prefix)
                const rawBackopUrl = await createGitHubFile(scriptName, rawScriptContent, GITHUB_BACKOPS_REPO);

                const loadstringCode = `\`\`\`lua\nloadstring(game:HttpGet("${githubUrl}"))()\n\`\`\``;

                const embed = new EmbedBuilder()
                    .setTitle("✅ Script Obfuscated & Uploaded (DirectX)!")
                    .setColor("Green")
                    .addFields(
                        { name: "📝 Script Name", value: `\`${scriptName}\``, inline: false },
                        { name: "🟢 Status", value: "✅ Obfuscated", inline: true },
                        { name: "📦 GitHub URL (Obfuscated - directx)", value: `\`${githubUrl}\``, inline: false },
                        { name: "📦 Backup URL (Raw - backops)", value: `\`${rawBackopUrl || 'Failed'}\``, inline: false }
                    )
                    .setTimestamp();

                await message.reply({ embeds: [embed] });
                await message.channel.send("**Obfuscated Loadstring:**\n" + loadstringCode);

            } catch (error) {
                console.error("Error processing attached script:", error);
                return message.reply(`❌ An error occurred while processing the script: ${error.message}`);
            }
            return;
        }
        
        return message.reply("❌ Invalid usage. Use `?ns` to list, `?ns <number>` to get a script, or `?ns <Name>` with an attached file to upload.");
    }
    if (cmd === "?upns") {
    if (!(await isStaff(message.author.id, message.member))) {
        return message.reply("❌ Staff only command.");
    }

    const scriptName = args[0];
    if (!scriptName) {
        return message.reply("❌ Usage: `?upns <name>` with a .txt file attached.");
    }

    if (message.attachments.size === 0) {
        return message.reply("❌ Please attach a `.txt` or `.lua` file with the new script content.");
    }

    const attachment = message.attachments.first();
    if (!attachment.name.endsWith('.txt') && !attachment.name.endsWith('.lua')) {
        return message.reply("❌ Only `.txt` or `.lua` files allowed.");
    }

    // Resolve full filename
    let fileName = scriptName;
    if (!fileName.endsWith('.lua') && !fileName.endsWith('.txt')) {
        fileName += '.lua';
    }

    await message.reply(`⏳ Fetching & processing \`${fileName}\`...`);

    let rawContent;
    try {
        const response = await axios.get(attachment.url);
        rawContent = response.data;
    } catch (e) {
        return message.reply(`❌ Failed to download attachment: ${e.message}`);
    }

    if (!rawContent || rawContent.trim() === "") {
        return message.reply("❌ Attached file is empty!");
    }

    await message.channel.send("⏳ Obfuscating...");
    const obfuscated = await obfuscateCode(rawContent);

    if (!obfuscated) {
        return message.reply("❌ Obfuscation failed. No changes made.");
    }

    // Check if file exists in directx
    const directxFiles = await listGitHubFiles(GITHUB_DIRECTX_REPO);
    const backopsFiles = await listGitHubFiles(GITHUB_BACKOPS_REPO);

    let directxOk, backopsOk;

    if (directxFiles && directxFiles.includes(fileName)) {
        directxOk = await updateGitHubFile(fileName, obfuscated, GITHUB_DIRECTX_REPO);
    } else {
        const url = await createGitHubFile(fileName, obfuscated, GITHUB_DIRECTX_REPO);
        directxOk = !!url;
    }

    if (backopsFiles && backopsFiles.includes(fileName)) {
        backopsOk = await updateGitHubFile(fileName, rawContent, GITHUB_BACKOPS_REPO);
    } else {
        const url = await createGitHubFile(fileName, rawContent, GITHUB_BACKOPS_REPO);
        backopsOk = !!url;
    }

    const githubUrl = `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_DIRECTX_REPO}/${GITHUB_BRANCH}/${fileName}`;
    const loadstringCode = `\`\`\`lua\nloadstring(game:HttpGet("${githubUrl}"))()\n\`\`\``;

    const embed = new EmbedBuilder()
        .setTitle("✅ Script Updated!")
        .setColor("Green")
        .addFields(
            { name: "📝 File", value: `\`${fileName}\``, inline: false },
            { name: "directx (Obfuscated)", value: directxOk ? "✅ Updated" : "❌ Failed", inline: true },
            { name: "backops (Raw)", value: backopsOk ? "✅ Updated" : "❌ Failed", inline: true },
            { name: "📦 GitHub URL", value: `\`${githubUrl}\``, inline: false }
        )
        .setTimestamp();

    await message.reply({ embeds: [embed] });
    await message.channel.send(loadstringCode);
}
    if (cmd === "?sh") {
        if (!(await isStaff(message.author.id, message.member)) && message.author.id !== OWNER_ID) {
            return message.reply("❌ Staff only.");
        }

        const key = args[0];
        const value = args[1];

        if (!key || !value) return message.reply("Usage: `?sh <key> <value>`\nExample: `?sh x xdroid`");

        if (key.length !== 1 || !/^[a-zA-Z0-9]$/.test(key)) {
            return message.reply("❌ Key must be a single alphanumeric character (a-z, 0-9).");
        }

        await shortcutCollection.updateOne(
            { key },
            { $set: { key, value, setBy: message.author.id, updatedAt: new Date() } },
            { upsert: true }
        );

        return message.reply(`✅ Shortcut set: \`${key}\` → \`${value}\``);
    }
    // ===== LIST LOADSTRING =====

    if (cmd === "?lsl" || cmd === "?loadingstringlist") {
        if (!(await isStaff(message.author.id, message.member))) {
            return message.reply("❌ Staff only command.");
        }

        await message.reply("⏳ Fetching scripts...");

        const files = await listGitHubFiles();

        if (!files || files.length === 0) {
            return message.reply("📭 No scripts found!");
        }

        let scriptList = "**📋 Available Scripts:**\n\n";
        files.forEach((file, index) => {
            scriptList += `**${index + 1}.** ${file}\n`;
        });

        scriptList += `\n💡 **Usage:** \`?ls <number>\``;

        const embed = new EmbedBuilder()
            .setTitle("🗂️ Script Library")
            .setDescription(scriptList)
            .setColor("Blue")
            .setFooter({ text: `Total Scripts: ${files.length}` })
            .setTimestamp();

        return message.reply({ embeds: [embed] });
    }

    // ===== DELETE LOADSTRING =====

    if (cmd === "?lsd" || cmd === "?loadingstringdelete") {
        if (message.author.id !== OWNER_ID) {
            return message.reply("❌ Only the bot owner can delete scripts.");
        }

        const input = args[0];

        if (!input) {
            return message.reply("❌ Please provide a script number or 'all'!");
        }

        if (input.toLowerCase() === "all") {
            const confirmButton = new ButtonBuilder()
                .setCustomId("confirm_delete_all")
                .setLabel("Confirm Delete All")
                .setStyle(ButtonStyle.Danger);

            const cancelButton = new ButtonBuilder()
                .setCustomId("cancel_delete_all")
                .setLabel("Cancel")
                .setStyle(ButtonStyle.Secondary);

            const row = new ActionRowBuilder().addComponents(confirmButton, cancelButton);

            return message.reply({
                content: "⚠️ **WARNING:** This will delete ALL scripts!",
                components: [row]
            });
        }

        if (!/^\d+$/.test(input)) {
            return message.reply("❌ Invalid input! Provide a number or 'all'.");
        }

        const scriptNumber = parseInt(input);
        const files = await listGitHubFiles();

        if (!files || files.length === 0) {
            return message.reply("📭 No scripts found!");
        }

        if (scriptNumber < 1 || scriptNumber > files.length) {
            return message.reply(`❌ Invalid number!`);
        }

        const scriptName = files[scriptNumber - 1];

        const confirmButton = new ButtonBuilder()
            .setCustomId(`confirm_delete_${scriptNumber}`)
            .setLabel("Confirm Delete")
            .setStyle(ButtonStyle.Danger);

        const cancelButton = new ButtonBuilder()
            .setCustomId(`cancel_delete_${scriptNumber}`)
            .setLabel("Cancel")
            .setStyle(ButtonStyle.Secondary);

        const row = new ActionRowBuilder().addComponents(confirmButton, cancelButton);

        return message.reply({
            content: `⚠️ Delete script: **${scriptName}**?`,
            components: [row]
        });
    }

    // ===== BACKUP COMMANDS =====

    if (cmd === "?backup" || cmd === "?b") {
        if (message.author.id !== OWNER_ID) {
            return message.reply("❌ Only the bot owner can use backup commands.");
        }

        const input = args.join(" ").trim();

        if (!input) {
            return message.reply("❌ Please provide a script name, 'all', or 'initiate current'!");
        }

        if (input.toLowerCase() === "initiate current") {
            await message.reply("⏳ Scanning current channel for bot messages...");

            try {
                let allMessages = [];
                let lastId;

                for (let i = 0; i < 5; i++) {
                    const options = { limit: 100 };
                    if (lastId) options.before = lastId;

                    const messages = await message.channel.messages.fetch(options);
                    if (messages.size === 0) break;

                    allMessages.push(...messages.values());
                    lastId = messages.last().id;
                }

                const botMessages = allMessages.filter(msg => msg.author.id === client.user.id);

                let processed = 0;
                let created = 0;
                let failed = 0;

                for (const msg of botMessages) {
                    if (msg.embeds && msg.embeds.length > 0) {
                        for (const embed of msg.embeds) {
                            const fields = embed.fields || [];
                            
                            const originalUrlField = fields.find(f => f.name === "🔗 Original URL");
                            
                            if (originalUrlField) {
                                const rawUrl = originalUrlField.value.replace(/`/g, '').trim();
                                
                                if (isValidGitHubUrl(rawUrl)) {
                                    processed++;
                                    
                                    const scriptName = extractScriptName(rawUrl);
                                    
                                    if (!scriptName) {
                                        failed++;
                                        continue;
                                    }

                                    const backupFiles = await listGitHubFiles(GITHUB_BACKUP_REPO);
                                    if (backupFiles && backupFiles.includes(scriptName)) {
                                        continue;
                                    }

                                    const robloxScript = `-- Backed up from ${rawUrl}\nloadstring(game:HttpGet("${rawUrl}"))()`;

                                    const backupUrl = await createGitHubFile(scriptName, robloxScript, GITHUB_BACKUP_REPO);
                                    
                                    if (backupUrl) {
                                        created++;
                                    } else {
                                        failed++;
                                    }
                                }
                            }
                        }
                    }
                }

                const resultEmbed = new EmbedBuilder()
                    .setTitle("📊 Backup Initiation Complete")
                    .setColor("Green")
                    .addFields(
                        { name: "Messages Scanned", value: `${allMessages.length}`, inline: true },
                        { name: "Bot Messages", value: `${botMessages.length}`, inline: true },
                        { name: "URLs Processed", value: `${processed}`, inline: true },
                        { name: "Backups Created", value: `${created}`, inline: true },
                        { name: "Failed", value: `${failed}`, inline: true }
                    )
                    .setTimestamp();

                return message.reply({ embeds: [resultEmbed] });

            } catch (error) {
                console.error("Backup initiate error:", error);
                return message.reply("❌ Failed to scan messages.");
            }
        }

        if (input.toLowerCase() === "all") {
            const confirmButton = new ButtonBuilder()
                .setCustomId("confirm_backup_all")
                .setLabel("Confirm Restore All")
                .setStyle(ButtonStyle.Success);

            const cancelButton = new ButtonBuilder()
                .setCustomId("cancel_backup_all")
                .setLabel("Cancel")
                .setStyle(ButtonStyle.Secondary);

            const row = new ActionRowBuilder().addComponents(confirmButton, cancelButton);

            return message.reply({
                content: "⚠️ **WARNING:** This will restore ALL matching scripts from backup repository!",
                components: [row]
            });
        }

        const fileName = input;

        await message.reply(`⏳ Restoring script: **${fileName}** from backup...`);

        const backupData = await getGitHubFileContent(fileName, GITHUB_BACKUP_REPO);

        if (!backupData) {
            return message.reply(`❌ Script **${fileName}** not found in backup repository!`);
        }

        const mainFiles = await listGitHubFiles(GITHUB_REPO);

        if (mainFiles && mainFiles.includes(fileName)) {
            const success = await updateGitHubFile(fileName, backupData.content, GITHUB_REPO);

            if (success) {
                const githubUrl = `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/${GITHUB_BRANCH}/${fileName}`;
                const loadstringCode = `loadstring(game:HttpGet("${githubUrl}"))()`;

                const embed = new EmbedBuilder()
                    .setTitle("✅ Script Restored from Backup!")
                    .setColor("Green")
                    .addFields(
                        { name: "📝 Script Name", value: `\`${fileName}\``, inline: false },
                        { name: "🔄 Action", value: "Updated existing script", inline: false },
                        { name: "🌐 GitHub URL", value: `\`${githubUrl}\``, inline: false }
                    )
                    .setTimestamp();

                await message.reply({ embeds: [embed] });
                await message.channel.send(loadstringCode);
            } else {
                return message.reply(`❌ Failed to update script!`);
            }
        } else {
            const githubUrl = await createGitHubFile(fileName, backupData.content, GITHUB_REPO);

            if (githubUrl) {
                const loadstringCode = `loadstring(game:HttpGet("${githubUrl}"))()`;

                const embed = new EmbedBuilder()
                    .setTitle("✅ Script Restored from Backup!")
                    .setColor("Green")
                    .addFields(
                        { name: "📝 Script Name", value: `\`${fileName}\``, inline: false },
                        { name: "🔄 Action", value: "Created new script", inline: false },
                        { name: "🌐 GitHub URL", value: `\`${githubUrl}\``, inline: false }
                    )
                    .setTimestamp();

                await message.reply({ embeds: [embed] });
                await message.channel.send(loadstringCode);
            } else {
                return message.reply(`❌ Failed to create script!`);
            }
        }
    }
// ===== REPO COMMANDS =====

async function repoApiRequest(method, url, data = null) {
    const token = REPO_GITHUB_TOKEN || GITHUB_TOKEN;
    const config = {
        method,
        url,
        headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json'
        }
    };
    if (data) config.data = data;
    return axios(config);
}
async function repoListFiles(repoName) {
    try {
        const res = await repoApiRequest('get', `https://api.github.com/repos/${REPO_OWNER}/${repoName}/contents/`);
        return res.data
            .filter(item => item.type === 'file' && !item.name.match(/^(README|LICENSE|\.)/i))
            .map(item => item.name);
    } catch (e) {
        console.error('repoListFiles error:', e.response?.data || e.message);
        return null;
    }
}

async function repoDeleteFile(fileName, repoName) {
    try {
        const getRes = await repoApiRequest('get', `https://api.github.com/repos/${REPO_OWNER}/${repoName}/contents/${fileName}`);
        const sha = getRes.data.sha;
        await repoApiRequest('delete', `https://api.github.com/repos/${REPO_OWNER}/${repoName}/contents/${fileName}`, {
            message: `Delete ${fileName}`,
            sha,
            branch: GITHUB_BRANCH
        });
        return true;
    } catch (e) {
        console.error('repoDeleteFile error:', e.response?.data || e.message);
        return false;
    }
}

async function repoCreateFile(filePath, content, repoName) {
    try {
        const res = await repoApiRequest('put', `https://api.github.com/repos/${REPO_OWNER}/${repoName}/contents/${filePath}`, {
            message: `Add ${filePath}`,
            content: Buffer.from(content).toString('base64'),
            branch: GITHUB_BRANCH
        });
        return `https://raw.githubusercontent.com/${REPO_OWNER}/${repoName}/${GITHUB_BRANCH}/${filePath}`;
    } catch (e) {
        console.error('repoCreateFile error:', e.response?.data || e.message);
        return null;
    }
}

if (cmd === "?repo") {
    if (message.author.id !== OWNER_ID) {
        return message.reply("❌ Owner only command.");
    }

    const subCmd = args[0]?.toLowerCase();

    // ?repo git <token>
    if (subCmd === "git") {
        const token = args[1];
        if (!token) return message.reply("Usage: `?repo git <token>`");

        REPO_GITHUB_TOKEN = token;

        // DB mein save karo taaki restart pe bhi rahe
        await logCollection.updateOne(
            { _id: "repoToken" },
            { $set: { token } },
            { upsert: true }
        );

        const masked = "*".repeat(Math.max(0, token.length - 4)) + token.slice(-4);
        
        // Message delete karo token security ke liye
        setTimeout(() => message.delete().catch(() => {}), 1000);
        
        return message.reply(`✅ Repo token set: \`${masked}\`\n🔒 Token saved to DB (restart safe).`);
    }

    const repoName = args[1];
    if (!repoName) {
        return message.reply(
            "**?repo Commands:**\n" +
            "`?repo git <token>` - Set GitHub token for repo commands\n" +
            "`?repo clear <reponame>` - Delete all files except README\n" +
            "`?repo update <reponame> <commitid>` - Restore repo to specific commit"
        );
    }

    // ?repo clear <reponame>
    if (subCmd === "clear") {
        const statusMsg = await message.reply(`⏳ Fetching files from **${repoName}**...`);

        const files = await repoListFiles(repoName);

        if (!files || files.length === 0) {
            return statusMsg.edit("📭 No files found (repo already clean).");
        }

        await statusMsg.edit(`🗑️ Deleting ${files.length} files from **${repoName}**...`);

        let deleted = 0, failed = 0;

        for (const file of files) {
            const ok = await repoDeleteFile(file, repoName);
            if (ok) deleted++;
            else failed++;
        }

        return statusMsg.edit(
            `✅ **Repo Cleared: \`${repoName}\`**\n` +
            `🟢 Deleted: ${deleted}\n` +
            (failed > 0 ? `🔴 Failed: ${failed}\n` : '') +
            `⚪ Skipped: README.md`
        );
    }

    // ?repo update <reponame> <commitid>
    if (subCmd === "update") {
        const commitId = args[2];
        if (!commitId) {
            return message.reply("Usage: `?repo update <reponame> <commitid>`");
        }

        const statusMsg = await message.reply(`⏳ Fetching commit \`${commitId}\` info from **${repoName}**...`);

        try {
            // 1. Commit info fetch karo
            const commitRes = await repoApiRequest(
                'get',
                `https://api.github.com/repos/${GITHUB_OWNER}/${repoName}/commits/${commitId}`
            );
            const treeSha = commitRes.data.commit.tree.sha;

            // 2. Full file tree us commit ka
            const treeRes = await repoApiRequest(
                'get',
                `https://api.github.com/repos/${GITHUB_OWNER}/${repoName}/git/trees/${treeSha}?recursive=1`
            );
            const treeFiles = treeRes.data.tree.filter(item => item.type === 'blob');

            await statusMsg.edit(`🗑️ Clearing current files in **${repoName}**...`);

            // 3. Current files delete karo (README chor ke)
            const currentFiles = await repoListFiles(repoName);
            if (currentFiles && currentFiles.length > 0) {
                for (const f of currentFiles) {
                    await repoDeleteFile(f, repoName);
                }
            }

            await statusMsg.edit(`📤 Uploading ${treeFiles.length} files from commit \`${commitId}\`...`);

            // 4. Commit ke files upload karo
            let uploaded = 0, failed = 0;

            for (const item of treeFiles) {
                if (item.path.toLowerCase() === "readme.md") continue;

                try {
                    const blobRes = await repoApiRequest(
                        'get',
                        `https://api.github.com/repos/${GITHUB_OWNER}/${repoName}/git/blobs/${item.sha}`
                    );

                    // Base64 content clean karke decode
                    const base64Clean = blobRes.data.content.replace(/\n/g, '');
                    const decoded = Buffer.from(base64Clean, 'base64').toString('utf-8');

                    const url = await repoCreateFile(item.path, decoded, repoName);
                    if (url) uploaded++;
                    else failed++;

                } catch (e) {
                    console.error(`Failed to upload ${item.path}:`, e.message);
                    failed++;
                }
            }

            const embed = new EmbedBuilder()
                .setTitle(`✅ Repo Updated: \`${repoName}\``)
                .setColor("Green")
                .addFields(
                    { name: "🔖 Commit", value: `\`${commitId}\``, inline: false },
                    { name: "🟢 Uploaded", value: `${uploaded}`, inline: true },
                    { name: "🔴 Failed", value: `${failed}`, inline: true },
                    { name: "⚪ Skipped", value: "README.md", inline: true }
                )
                .setTimestamp();

            return statusMsg.edit({ content: '', embeds: [embed] });

        } catch (error) {
            console.error("Repo update error:", error.response?.data || error.message);
            return statusMsg.edit(`❌ Failed: \`${error.response?.data?.message || error.message}\``);
        }
    }

    return message.reply("Unknown subcommand. Use `clear`, `update`, or `git`.");
}
    // ===== VOUCH COMMANDS =====

    if (cmd === "+vouch" || cmd === "-vouch") {
        let user = message.mentions.users.first();
        if (!user) return message.reply("Tag someone to vouch!");

        let cooldown = await checkCooldown(message.author.id);
        if (cooldown) {
            let m = Math.floor(cooldown / 60000);
            let s = Math.floor((cooldown % 60000) / 1000);
            return message.reply(`Wait ${m}m ${s}s before vouching again!`);
        }

        let description = args.slice(1).join(" ") || "No description provided.";
        let data = await getVouch(user.id);

        if (cmd === "+vouch") data.plus++;
        else data.minus++;

        data.history.push({
            type: cmd === "+vouch" ? "+" : "-",
            by: message.author.id,
            desc: description,
            date: new Date().toLocaleString()
        });

        await updateVouch(user.id, data);
        await setCooldown(message.author.id);

        const embed = new EmbedBuilder()
            .setTitle(cmd === "+vouch" ? "Vouch Added" : "Negative Vouch Added")
            .setColor(cmd === "+vouch" ? "Green" : "Red")
            .addFields(
                { name: "User", value: `<@${user.id}>` },
                { name: "Description", value: description },
                { name: "By", value: `<@${message.author.id}>` },
                { name: "Total", value: `+${data.plus} / -${data.minus}` }
            )
            .setFooter({ text: "Goblox Bot" });

        return message.reply({ embeds: [embed] });
    }

    if (cmd === "+p") {
        let user = message.mentions.users.first() || message.author;
        let data = await getVouch(user.id);
        if (!data.plus && !data.minus) return message.reply("No vouches yet.");

        const embed = new EmbedBuilder()
            .setTitle(`${user.username}'s Profile`)
            .setColor("Blue")
            .addFields(
                { name: "Positive", value: `${data.plus}`, inline: true },
                { name: "Negative", value: `${data.minus}`, inline: true }
            );

        return message.reply({ embeds: [embed] });
    }

    // ===== BALANCE COMMANDS =====

    if (cmd === "?balance" || cmd === "?bal") {
        let user = message.mentions.users.first() || message.author;
        let data = await getBalance(user.id);

        const embed = new EmbedBuilder()
            .setTitle(`💰 ${user.username}'s Balance`)
            .setDescription(`**Robux:** ${data.robux} R$`)
            .setColor("Green")
            .setThumbnail(user.displayAvatarURL())
            .setTimestamp();

        return message.reply({ embeds: [embed] });
    }

    if (cmd === "?give") {
        if (message.author.id !== OWNER_ID) {
            return message.reply("❌ Only the bot owner can give robux.");
        }

        let user = message.mentions.users.first();
        let amount = parseInt(args[1]);

        if (!user || !amount || amount <= 0)
            return message.reply("Usage: `?give @user <amount>`");

        await addBalance(user.id, amount);

        await sendLog(message.guild, "Robux Given", message.author, 
            `**User:** <@${user.id}>\n**Amount:** ${amount} R$\n**New Balance:** ${(await getBalance(user.id)).robux} R$`
        );

        setTimeout(() => message.delete().catch(() => {}), 2000);

        return message.reply(`✅ Given ${amount} Robux to <@${user.id}>`);
    }

    if (cmd === "?set") {
        if (message.author.id !== OWNER_ID) {
            return message.reply("❌ Only the bot owner can set robux balance.");
        }

        let user = message.mentions.users.first();
        let amount = parseInt(args[1]);

        if (!user || amount < 0)
            return message.reply("Usage: `?set @user <amount>`");

        await setBalance(user.id, amount);

        await sendLog(message.guild, "Robux Balance Set", message.author, 
            `**User:** <@${user.id}>\n**Amount:** ${amount} R$`
        );

        setTimeout(() => message.delete().catch(() => {}), 2000);

        return message.reply(`✅ Set <@${user.id}>'s balance to ${amount} Robux`);
    }

    if (cmd === "?take") {
        if (message.author.id !== OWNER_ID) {
            return message.reply("❌ Only the bot owner can take robux.");
        }

        let user = message.mentions.users.first();
        let amount = parseInt(args[1]);

        if (!user || !amount || amount <= 0)
            return message.reply("Usage: `?take @user <amount>`");

        await addBalance(user.id, -amount);

        await sendLog(message.guild, "Robux Taken", message.author, 
            `**User:** <@${user.id}>\n**Amount:** ${amount} R$\n**New Balance:** ${(await getBalance(user.id)).robux} R$`
        );

        setTimeout(() => message.delete().catch(() => {}), 2000);

        return message.reply(`✅ Taken ${amount} Robux from <@${user.id}>`);
    }

    // ===== GIVEAWAY COMMANDS =====

    if (cmd === "?creategiveaway") {
        if (!(await isStaff(message.author.id, message.member)))
            return message.reply("Staff only.");

        if (activeGiveaway) {
            return message.reply("❌ There's already an active giveaway!");
        }

        const prize = parseInt(args[0]);
        const winners = parseInt(args[1]);
        const host = message.mentions.users.first() || message.author;
        const channel = message.mentions.channels.first() || message.channel;
        const timer = args[args.length - 1];
        const image = message.attachments.first()?.url || null;

        if (!prize || !winners || !timer) {
            return message.reply("Usage: `?creategiveaway <prize> <winners> [@host] [#channel] <timer>`");
        }

        const duration = parseTime(timer);
        if (!duration) {
            return message.reply("Invalid timer! Use: 10s, 5m, 1h, or 1d");
        }

        const endTime = Date.now() + duration;

        const giveawayEmbed = new EmbedBuilder()
            .setTitle("🎉 GIVEAWAY 🎉")
            .setDescription(`**Prize:** ${prize} Robux\n**Winners:** ${winners}\n**Hosted by:** <@${host.id}>\n**Ends:** <t:${Math.floor(endTime / 1000)}:R>`)
            .setColor("Purple")
            .setFooter({ text: "Click button to join!" })
            .setTimestamp(endTime);

        if (image) giveawayEmbed.setImage(image);

        const button = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("join_giveaway")
                .setLabel("🎉 Join Giveaway")
                .setStyle(ButtonStyle.Primary)
        );

        const giveawayMsg = await channel.send({ embeds: [giveawayEmbed], components: [button] });

        activeGiveaway = {
            messageId: giveawayMsg.id,
            channelId: channel.id,
            guildId: message.guild.id,
            prize: prize,
            winners: winners,
            host: host.id,
            image: image || null,
            endTime: endTime,
            createdAt: Date.now(),
            participants: []
        };

        await giveawayCollection.insertOne(activeGiveaway);

        await sendLog(message.guild, "Giveaway Created", message.author,
            `**Prize:** ${prize} R$\n**Winners:** ${winners}\n**Channel:** <#${channel.id}>\n**Duration:** ${timer}\n**Host:** <@${host.id}>`
        );

        setTimeout(() => message.delete().catch(() => {}), 2000);

        message.reply(`✅ Giveaway created in <#${channel.id}>!`);

        const updateInterval = setInterval(async () => {
            if (!activeGiveaway || activeGiveaway.messageId !== giveawayMsg.id) {
                clearInterval(updateInterval);
                return;
            }
            await giveawayCollection.updateOne(
                { messageId: giveawayMsg.id },
                { $set: { participants: activeGiveaway.participants, lastUpdate: Date.now() } }
            );
        }, 3600000);

        setTimeout(async () => {
            clearInterval(updateInterval);
            await endGiveaway(channel, activeGiveaway);
        }, duration);
    }

    if (cmd === "?reroll") {
        if (!(await isStaff(message.author.id, message.member)))
            return message.reply("Staff only.");

        if (!activeGiveaway) {
            return message.reply("❌ No active giveaway!");
        }

        setTimeout(() => message.delete().catch(() => {}), 2000);

        await endGiveaway(message.channel, activeGiveaway, true);
    }

    if (cmd === "?endgiveaway") {
        if (!(await isStaff(message.author.id, message.member)))
            return message.reply("Staff only.");

        if (!activeGiveaway) {
            return message.reply("❌ No active giveaway!");
        }

        const channel = client.channels.cache.get(activeGiveaway.channelId);
        
        await sendLog(message.guild, "Giveaway Ended Early", message.author,
            `**Channel:** <#${activeGiveaway.channelId}>\n**Participants:** ${activeGiveaway.participants.length}`
        );

        setTimeout(() => message.delete().catch(() => {}), 2000);

        await endGiveaway(channel, activeGiveaway);
        message.reply("✅ Giveaway ended!");
    }

    // ===== STAFF MANAGEMENT =====

    if (cmd === "?newstaff") {
        if (message.author.id !== OWNER_ID) {
            return message.reply("❌ Owner only.");
        }

        let user = message.mentions.users.first();
        if (!user) return message.reply("Mention a user.");

        await addStaff(user.id);

        const member = message.guild.members.cache.get(user.id);
        if (member) {
            try {
                await member.roles.add(STAFF_ROLE_ID);
            } catch (error) {
                console.error("Failed to assign role:", error);
            }
        }

        await sendLog(message.guild, "Staff Added", message.author,
            `**User:** ${user.tag} (${user.id})\n**Role Assigned:** <@&${STAFF_ROLE_ID}>`
        );

        setTimeout(() => message.delete().catch(() => {}), 2000);

        return message.reply(`✅ ${user.tag} added as staff.`);
    }

    if (cmd === "?removestaff") {
        if (message.author.id !== OWNER_ID) {
            return message.reply("❌ Owner only.");
        }

        let user = message.mentions.users.first();
        if (!user) return message.reply("Mention a user.");

        await removeStaff(user.id);

        const member = message.guild.members.cache.get(user.id);
        if (member) {
            try {
                await member.roles.remove(STAFF_ROLE_ID);
            } catch (error) {
                console.error("Failed to remove role:", error);
            }
        }

        await sendLog(message.guild, "Staff Removed", message.author,
            `**User:** ${user.tag} (${user.id})`
        );

        setTimeout(() => message.delete().catch(() => {}), 2000);

        return message.reply(`❌ ${user.tag} removed from staff.`);
    }

    if (cmd === "?staff") {
        const staff = await staffCollection.find().toArray();
        if (!staff.length) return message.reply("No staff found.");

        return message.reply("👑 **Staff List**\n" + staff.map(s => `<@${s.userId}>`).join("\n"));
    }

    // ===== LOG CHANNEL =====

    if (cmd === "?setlogs") {
        if (message.author.id !== OWNER_ID) {
            return message.reply("❌ Owner only.");
        }

        const channel = message.mentions.channels.first() || message.channel;

        await setLogChannel(message.guild.id, channel.id);

        return message.reply(`✅ Log channel set to <#${channel.id}>`);
    }

    // ===== MODERATION =====

    if (["?ban", "?kick", "?timeout", "?untimeout", "?warn", "?clear"].includes(cmd)) {
        if (!(await isStaff(message.author.id, message.member)))
            return message.reply("Staff only.");
        
        setTimeout(() => message.delete().catch(() => {}), 2000);
    }

    if (cmd === "?ban") {
        let m = message.mentions.members.first();
        if (!m) return message.reply("Mention user.");
        await m.ban({ reason: args.slice(1).join(" ") || "No reason" });
        
        await sendLog(message.guild, "User Banned", message.author,
            `**User:** ${m.user.tag} (${m.id})\n**Reason:** ${args.slice(1).join(" ") || "No reason"}`
        );
        
        return message.reply(`🔨 Banned ${m.user.tag}`);
    }

    if (cmd === "?kick") {
        let m = message.mentions.members.first();
        if (!m) return message.reply("Mention user.");
        await m.kick(args.slice(1).join(" ") || "No reason");
        
        await sendLog(message.guild, "User Kicked", message.author,
            `**User:** ${m.user.tag} (${m.id})\n**Reason:** ${args.slice(1).join(" ") || "No reason"}`
        );
        
        return message.reply(`👢 Kicked ${m.user.tag}`);
    }

    if (cmd === "?timeout") {
        let m = message.mentions.members.first();
        let t = args[1];
        if (!m || !t) return message.reply("?timeout @user 10m");

        let ms = t.endsWith("m") ? parseInt(t) * 60000 : t.endsWith("h") ? parseInt(t) * 3600000 : null;
        if (!ms) return message.reply("Use 10m or 1h");

        await m.timeout(ms);
        
        await sendLog(message.guild, "User Timed Out", message.author,
            `**User:** ${m.user.tag} (${m.id})\n**Duration:** ${args[1]}`
        );
        
        return message.reply(`⏱ Timed out ${m.user.tag}`);
    }

    if (cmd === "?untimeout") {
        let m = message.mentions.members.first();
        if (!m) return message.reply("Mention user.");
        await m.timeout(null);
        
        await sendLog(message.guild, "Timeout Removed", message.author,
            `**User:** ${m.user.tag} (${m.id})`
        );
        
        return message.reply(`🔓 Timeout removed`);
    }

    if (cmd === "?warn") {
        let user = message.mentions.users.first();
        if (!user) return message.reply("Mention user.");

        await warnCollection.insertOne({
            userId: user.id,
            by: message.author.id,
            reason: args.slice(1).join(" ") || "No reason",
            date: new Date()
        });

        await sendLog(message.guild, "User Warned", message.author,
            `**User:** ${user.tag} (${user.id})\n**Reason:** ${args.slice(1).join(" ") || "No reason"}`
        );

        return message.reply(`⚠ Warned ${user.tag}`);
    }

    if (cmd === "?clear") {
        let amount = parseInt(args[0]);
        
        if (!amount || amount < 1 || amount > 1000) {
            return message.reply("Provide a number between 1 and 1000.");
        }

        try {
            await message.delete();
            const fetched = await message.channel.messages.fetch({ limit: amount });
            await message.channel.bulkDelete(fetched, true);

            const reply = await message.channel.send(`🗑️ Cleared ${fetched.size} messages.`);
            setTimeout(() => reply.delete().catch(() => {}), 3000);
        } catch (error) {
            console.error("Clear error:", error);
            return message.channel.send("Failed to clear messages.");
        }
    }
});

// ===== YOUTUBE SCRIPT COMMANDS =====

// ---- Helper: extract YouTube channel ID or handle from a URL ----
function parseYouTubeChannelUrl(url) {
    // Accepts: /channel/UCxxx  /c/name  /@handle  /user/name
    const m = url.match(/youtube\.com\/(?:channel\/|c\/|@|user\/)([^\/?&\s]+)/i);
    return m ? m[1] : null;
}

// ---- Helper: clean a video title into a CamelCase script name ----
// Strips everything inside brackets/emojis, cuts at "Script", CamelCases rest
function parseTitle(title) {
    let scriptNamePart = title.split(/Script\s*-?/i)[0] || title;
    let featuresPart = "";
    
    const scriptIdx = title.search(/Script/i);
    if (scriptIdx !== -1) {
        featuresPart = title.substring(scriptIdx + 6).replace(/^[ \-–\|]+/, '').trim();
    }
    
    // Clean script name: remove emojis, keep only alphanumeric and underscore
    let scriptName = scriptNamePart.replace(/\[.*?\]/g, '').replace(/[\u{1F300}-\u{1FFFF}]/gu, '').replace(/[^\x00-\x7F]/g, '').replace(/[^a-zA-Z0-9_]/g, '');

    return { scriptName: scriptName || null, features: featuresPart };
}

// ---- Helper: fetch YouTube channel's latest 30 video IDs via YouTube Data API v3 ----
async function fetchYouTubeVideoIds(channelInput) {
    if (!YOUTUBE_API_KEY) {
        console.error("YOUTUBE_API_KEY is not set.");
        return [];
    }

    try {
        let channelId = channelInput;
        
        // If not a direct UC... ID, resolve it
        if (!channelId.startsWith('UC')) {
            let handle = channelInput.replace(/^@/, '');
            
            const searchRes = await axios.get(`https://www.googleapis.com/youtube/v3/search`, {
                params: {
                    part: 'snippet',
                    type: 'channel',
                    q: handle,
                    key: YOUTUBE_API_KEY
                }
            });
            
            if (searchRes.data.items && searchRes.data.items.length > 0) {
                channelId = searchRes.data.items[0].snippet.channelId;
            } else {
                return [];
            }
        }

        // Get the 'uploads' playlist ID
        const channelRes = await axios.get(`https://www.googleapis.com/youtube/v3/channels`, {
            params: {
                part: 'contentDetails',
                id: channelId,
                key: YOUTUBE_API_KEY
            }
        });

        if (!channelRes.data.items || channelRes.data.items.length === 0) return [];
        
        const uploadsPlaylistId = channelRes.data.items[0].contentDetails.relatedPlaylists.uploads;

        // Fetch latest 30 videos
        const playlistRes = await axios.get(`https://www.googleapis.com/youtube/v3/playlistItems`, {
            params: {
                part: 'snippet',
                playlistId: uploadsPlaylistId,
                maxResults: 30,
                key: YOUTUBE_API_KEY
            }
        });

        if (!playlistRes.data.items) return [];

        return playlistRes.data.items.map(item => ({
            id: item.snippet.resourceId.videoId,
            title: item.snippet.title,
            channelId: channelId
        }));
    } catch (error) {
        console.error('fetchYouTubeVideoIds API error:', error.response?.data || error.message);
        return [];
    }
}

// ---- Helper: extract bypass-eligible links from text ----
function extractBypassLinks(text) {
    const urlRegex = /https?:\/\/[^\s"'<>]+/g;
    const found = text.match(urlRegex) || [];
    return found.filter(url => needsBypass(url));
}

// ---- Helper: fetch YouTube video description via API ----
async function fetchVideoLinksAndTitle(videoId) {
    if (!YOUTUBE_API_KEY) {
        return { title: '', links: [], videoUrl: `https://www.youtube.com/watch?v=${videoId}` };
    }

    try {
        const res = await axios.get(`https://www.googleapis.com/youtube/v3/videos`, {
            params: {
                part: 'snippet',
                id: videoId,
                key: YOUTUBE_API_KEY
            }
        });

        if (!res.data.items || res.data.items.length === 0) {
            return { title: '', links: [], videoUrl: `https://www.youtube.com/watch?v=${videoId}` };
        }

        const snippet = res.data.items[0].snippet;
        const title = snippet.title;
        const description = snippet.description;
        const channelId = snippet.channelId;

        // Fetch comments to extract links from owner's comment
        let commentText = "";
        try {
            const commentsRes = await axios.get(`https://www.googleapis.com/youtube/v3/commentThreads`, {
                params: {
                    part: 'snippet',
                    videoId: videoId,
                    order: 'relevance',
                    key: YOUTUBE_API_KEY
                }
            });
            
            if (commentsRes.data && commentsRes.data.items) {
                const ownerComments = commentsRes.data.items.filter(item => 
                    item.snippet.topLevelComment.snippet.authorChannelId && 
                    item.snippet.topLevelComment.snippet.authorChannelId.value === channelId
                );
                
                ownerComments.forEach(item => {
                    commentText += "\n" + item.snippet.topLevelComment.snippet.textOriginal;
                });
            }
        } catch (err) {
            console.error(`Error fetching comments for ${videoId}:`, err.response?.data || err.message);
        }

        const combinedText = description + "\n" + commentText;
        const descLinks = extractBypassLinks(combinedText);
        const allLinks = [...new Set(descLinks)];

        const robloxIdMatch = combinedText.match(/roblox\.com\/games\/(\d+)/i);
        const robloxId = robloxIdMatch ? robloxIdMatch[1] : null;

        return { title, links: allLinks, videoUrl: `https://www.youtube.com/watch?v=${videoId}`, robloxId, description: combinedText };
    } catch (e) {
        console.error(`fetchVideoLinksAndTitle API error for ${videoId}:`, e.response?.data || e.message);
        return { title: '', links: [], videoUrl: `https://www.youtube.com/watch?v=${videoId}` };
    }
}

async function processSingleVideo(videoId, message, targetChannelId, isAutoMode = false, channelHandle = null) {
    // Record as processed to avoid duplicates/retries even if it skips/fails
    await ytProcessedCollection.updateOne(
        { videoId },
        { $set: { videoId, processedAt: new Date() } },
        { upsert: true }
    );

    const { title, links, videoUrl, robloxId, description } = await fetchVideoLinksAndTitle(videoId);
    const finalTitle = title;
    
    if (!/Script/i.test(finalTitle)) {
        if (!isAutoMode) await message.channel.send(`⚠️ No 'Script' in title for \`${finalTitle}\``);
        return { success: false, skipped: true };
    }
    
    if (!links || !links.length) {
        if (!isAutoMode) await message.channel.send(`⚠️ No bypass links found for \`${finalTitle}\``);
        return { success: false, skipped: true };
    }

    const { scriptName, features } = parseTitle(finalTitle);
    if (!scriptName) {
        if (!isAutoMode) await message.channel.send(`⚠️ Failed to parse script name from \`${finalTitle}\``);
        return { success: false, skipped: true };
    }

    const fileName = scriptName + '.lua';
    
    const existing = await ytCollection.findOne({ scriptName });
    if (existing) {
        if (!isAutoMode) await message.channel.send(`⏭️ \`${scriptName}\` already exists.`);
        return { success: true, skipped: true, scriptName };
    }

    let statusMsg = await message.channel.send(`⚙️ Processing: \`${finalTitle}\`...`);
    
    const bypassLink = links[0];
    await statusMsg.edit(`🔄 Bypassing link for \`${scriptName}\`...`);
    
    bypassInProgress = true;
    bypassStopRequested = false;
    const bypassResult = await recursiveBypassWithIzen(bypassLink, message, 0, 10, { userId: message.author.id, limited: false }); 
    bypassInProgress = false;

    if (bypassResult.error || bypassResult.stopped) {
        let err = bypassResult.message || 'stopped';
        await statusMsg.edit(`❌ Bypass failed for \`${scriptName}\`: ${err}`);
        return { success: false, failed: true, reason: err, scriptName };
    }

    const finalUrl = bypassResult.result;
    let scriptUrlToFetch = finalUrl;
    const loadstringMatch = finalUrl.match(/loadstring\(game:HttpGet\("([^"]+)"\)\)\(\)/);
    if (loadstringMatch) {
         scriptUrlToFetch = loadstringMatch[1];
    }
    
    let originalScript;
    try {
        const response = await axios.get(scriptUrlToFetch, { timeout: 15000 });
        originalScript = response.data;
    } catch (error) {
        // Fallback: If bypassed link doesn't directly point to script content, we might wrap the bypassed link string itself
        // But usually, it points to a raw script or another loadstring.
    }

    const finalScript = generateKeySystemScript(scriptUrlToFetch);

    await statusMsg.edit(`⏳ Obfuscating \`${scriptName}\`...`);
    const obfuscatedScript = await obfuscateCode(finalScript);

    const githubUrl = await createGitHubFile(fileName, obfuscatedScript || finalScript, GITHUB_REPO);
    await createGitHubFile(fileName, finalScript, GITHUB_BACKUP_REPO);

    if (!githubUrl) {
         await statusMsg.edit(`❌ GitHub upload failed for \`${scriptName}\``);
         return { success: false, failed: true, scriptName, reason: "GitHub failed" };
    }

    await ytCollection.insertOne({
         scriptName,
         fileName,
         videoUrl,
         videoTitle: finalTitle,
         channelHandle: channelHandle || null,
         originalLink: bypassLink,
         githubUrl,
         robloxId: robloxId || '',
         features: features || '',
         obfuscated: !!obfuscatedScript,
         addedAt: new Date()
    });
    
    await statusMsg.delete().catch(()=>{});

    const outputText = `loadstring(game:HttpGet("${githubUrl}"))()
${features || "N/A"}
${robloxId || "N/A"}`;
    
    if (targetChannelId) {
        const targetCh = message.client.channels.cache.get(targetChannelId);
        if (targetCh) {
            await targetCh.send(outputText);
        }
    } else {
        await message.channel.send(outputText);
    }

    return { success: true, scriptName, skipped: false, githubUrl, videoUrl };
}

async function scanYouTubeChannel(channelUrl, message, targetChannelId, quantity = 30) {
    let channelHandle = parseYouTubeChannelUrl(channelUrl);
    if (!channelHandle) {
        const atMatch = channelUrl.match(/@([^\/?&\s]+)/);
        if (atMatch) channelHandle = atMatch[1];
    }
    if (!channelHandle) return { success: false, reason: 'Could not parse YouTube channel URL.' };

    await message.channel.send(`🔍 Fetching latest videos from \`${channelHandle}\`...`);

    const videos = await fetchYouTubeVideoIds(channelHandle);
    if (!videos.length) return { success: false, reason: 'Could not fetch videos. Check the channel URL and make sure it is a public channel.' };

    const videosToProcess = videos.slice(0, quantity);
    await message.channel.send(`📹 Found **${videos.length}** videos. Processing top ${videosToProcess.length}...`);

    const results = [];
    
    for (const video of videosToProcess) {
        const res = await processSingleVideo(video.id, message, targetChannelId, true, channelHandle);
        if (res.scriptName) {
            results.push(res);
        }
        await new Promise(r => setTimeout(r, 2000));
    }

    return { success: true, results };
}

// ===== YT / YOUTUBE COMMAND HANDLER =====

client.on("messageCreate", async (ytMsg) => {
    if (ytMsg.author.bot) return;

    const rawArgs = ytMsg.content.trim().split(/ +/g);
    const rawCmd = rawArgs.shift()?.toLowerCase();

    const isYtCmd = rawCmd === '?yt' || rawCmd === '?youtube';
    const isYtListCmd = ['?ytl', '?youtubel', '?youtubelist', '?ytlist'].includes(rawCmd);
    const isYtslCmd = ['?ytsl'].includes(rawCmd);
    const isYtsCmd = ['?yts'].includes(rawCmd);

    if (!isYtCmd && !isYtListCmd && !isYtslCmd && !isYtsCmd) return;

    // Staff check for all yt commands
    if (!(await isStaff(ytMsg.author.id, ytMsg.member)) && ytMsg.author.id !== OWNER_ID) {
        return ytMsg.reply('❌ Staff only command.');
    }

    const TARGET_CHANNEL_ID = '1460943448017207479';

    // ===== ?ytl =====
    if (isYtListCmd) {
        if (ytMsg.channel.id !== TARGET_CHANNEL_ID) {
            return ytMsg.reply(`❌ Please use this command in <#${TARGET_CHANNEL_ID}>`);
        }
        const allScripts = await ytCollection.find({}).sort({ addedAt: 1 }).toArray();
        if (!allScripts.length) return ytMsg.reply('📭 No YouTube scripts saved yet.');

        let listContent = '**📋 YouTube Scripts Library:**\n\n';
        allScripts.forEach(s => {
            listContent += `**Name:** \`${s.scriptName}\`\n**Video:** ${s.videoUrl}\n**Loadstring:** \`loadstring(game:HttpGet("${s.githubUrl}"))()\`\n\n`;
        });
        
        const chunks = listContent.match(/[\s\S]{1,1900}/g) || [];
        for (let chunk of chunks) {
            await ytMsg.channel.send(chunk);
        }
        return;
    }

    
    // ===== ?ytsl =====
    if (isYtslCmd) {
        const tracked = await ytTrackedCollection.find({}).toArray();
        if (!tracked.length) return ytMsg.reply('📭 No tracked YouTube channels yet.');

        let listContent = '**📡 Tracked YouTube Channels:**\n\n';
        tracked.forEach((t, i) => {
            listContent += `**${i+1}.** \`${t.channelHandle}\` (\n${t.channelUrl}\n)\n`;
        });
        
        const chunks = listContent.match(/[\s\S]{1,1900}/g) || [];
        for (let chunk of chunks) {
            await ytMsg.channel.send(chunk);
        }
        return;
    }

    // ===== ?yts <number> =====
    if (isYtsCmd) {
        let scriptIndex = parseInt(rawArgs[0]);
        if (isNaN(scriptIndex)) return ytMsg.reply('❌ Usage: `?yts <number>`');
        
        const allScripts = await ytCollection.find({}).sort({ addedAt: 1 }).toArray();
        if (scriptIndex < 1 || scriptIndex > allScripts.length) return ytMsg.reply(`❌ Invalid number. Choose between 1 and ${allScripts.length}`);
        
        const script = allScripts[scriptIndex - 1];
        
        const embed = new EmbedBuilder()
            .setTitle("✅ Found YouTube Script!")
            .setColor("Green")
            .addFields(
                { name: "📝 Script Name", value: `\`${script.scriptName}\``, inline: false },
                { name: "🎬 Video Url", value: `${script.videoUrl}`, inline: false },
                { name: "🌐 GitHub URL", value: `\`${script.githubUrl}\``, inline: false },
                { name: "⚙️ Features", value: script.features || "N/A", inline: true },
                { name: "🎮 Roblox ID", value: script.robloxId || "N/A", inline: true }
            )
            .setTimestamp();
            
        await ytMsg.channel.send({ embeds: [embed] });
        await ytMsg.channel.send(`\`\`\`lua\nloadstring(game:HttpGet("${script.githubUrl}"))()\n\`\`\``);
        return;
    }

    const subArg = rawArgs[0]?.toLowerCase();

    // ===== ?yt set <url> =====
    if (subArg === 'set') {
        const urlToFetch = rawArgs[1];
        let qtyToTrack = parseInt(rawArgs[2]) || 30; // User can specify qty

        if (!urlToFetch || (!urlToFetch.includes('youtube.com') && !urlToFetch.includes('youtu.be'))) {
            return ytMsg.reply('❌ Usage: `?yt set <youtube_url> [qty]`\nExample: `?yt set https://www.youtube.com/@ChannelName 10`');
        }

        const videoMatch = urlToFetch.match(/v=([^&]+)/) || urlToFetch.match(/youtu.be/([^?]+)/);
        if (videoMatch) {
             const videoId = videoMatch[1];
             await ytMsg.reply(`⏳ Processing single video \`${videoId}\`... outputting to <#${TARGET_CHANNEL_ID}>`);
             await processSingleVideo(videoId, ytMsg, TARGET_CHANNEL_ID);
             return;
        } else {
             let channelHandle = parseYouTubeChannelUrl(urlToFetch);
             if (!channelHandle) {
                 const atMatch = urlToFetch.match(/@([^\/?&\s]+)/);
                 if (atMatch) channelHandle = atMatch[1];
             }

             if (channelHandle) {
                 await ytTrackedCollection.updateOne(
                     { channelHandle },
                     { $set: { channelHandle, channelUrl: urlToFetch, qty: qtyToTrack, addedBy: ytMsg.author.id, addedAt: new Date() } },
                     { upsert: true }
                 );
                 await ytMsg.reply(`⏳ Tracking & scanning channel \`${channelHandle}\` (Top ${qtyToTrack} videos)... outputting to <#${TARGET_CHANNEL_ID}>\n(Auto-check enabled: every 1 hour)`);
             } else {
                 await ytMsg.reply(`⏳ Scanning channel \`${urlToFetch}\` (Top ${qtyToTrack} videos)... outputting to <#${TARGET_CHANNEL_ID}>`);
             }
             const res = await scanYouTubeChannel(urlToFetch, ytMsg, TARGET_CHANNEL_ID, qtyToTrack);
             if (!res.success) {
                  return ytMsg.channel.send(`❌ Scan failed: ${res.reason}`);
             }
             await ytMsg.reply(`✅ Finished scanning channel.`);
             return;
        }
    }

    // ===== ?yt remove <url> =====
    if (subArg === 'remove') {
        

        const channelUrl = rawArgs[1];
        if (!channelUrl) return ytMsg.reply('❌ Usage: `?yt remove <youtube_channel_url>`');

        let channelHandle = parseYouTubeChannelUrl(channelUrl);
        if (!channelHandle) {
             const atMatch = channelUrl.match(/@([^\/?&\s]+)/);
             if (atMatch) channelHandle = atMatch[1];
        }

        if (channelHandle) {
             await ytMsg.reply(`⏳ Removing channel \`${channelHandle}\` scripts and tracking from DB...`);
             await ytTrackedCollection.deleteOne({ channelHandle: channelHandle });
             const res = await ytCollection.deleteMany({ channelHandle: channelHandle });
             return ytMsg.reply(`✅ Removed ${res.deletedCount} scripts from channel \`${channelHandle}\` and stopped tracking.`);
        }
        
        const removedScript = await ytCollection.deleteOne({ scriptName: channelUrl });
        if (removedScript.deletedCount) {
             return ytMsg.reply(`✅ Removed script \`${channelUrl}\`.`);
        }
        
        return ytMsg.reply('⚠️ Check URL. Neither Channel nor Script found.');
    }

    // ===== ?yt <url> <quantity> =====
    const urlToFetch = rawArgs[0];
    const qtyRaw = rawArgs[1];
    let qty = 30;
    if (qtyRaw && !isNaN(parseInt(qtyRaw))) {
       qty = parseInt(qtyRaw);
    }
    
    if (!urlToFetch || (!urlToFetch.includes('youtube.com') && !urlToFetch.includes('youtu.be'))) {
        return ytMsg.reply('❌ Usage:\n`?yt set <url>` — Auto scan, output to designated channel\n`?yt <url> <quantity>` — Scan, output to this channel\n`?yt remove <url>` — Remove channel\n`?ytl` — List all stored loadstrings');
    }

    const videoMatch = urlToFetch.match(/v=([^&]+)/) || urlToFetch.match(/youtu\.be\/([^?]+)/);
    if (videoMatch) {
         const videoId = videoMatch[1];
         await ytMsg.reply(`⏳ Processing single video \`${videoId}\` in current channel...`);
         await processSingleVideo(videoId, ytMsg, null);
         return;
    } else {
         await ytMsg.reply(`⏳ Scanning channel \`${urlToFetch}\` for top ${qty} videos in current channel...`);
         const res = await scanYouTubeChannel(urlToFetch, ytMsg, null, qty);
         if (!res.success) {
              return ytMsg.channel.send(`❌ Scan failed: ${res.reason}`);
         }
         await ytMsg.channel.send(`✅ Finished custom channel scan.`);
         return;
    }
});

// Connect to database and login
connectDB().then(() => {
    client.login(process.env.DISCORD_TOKEN);
}).catch(err => {
    console.error("Failed to start bot:", err);
    process.exit(1);
});
