const switcherTrack = document.querySelector('.switcher-track');
const switcherThumb = document.querySelector('.switcher-thumb');
const body = document.body;
const downloadButton = document.querySelector('.download-button');
const downloadInput = document.querySelector('.download-input');
const consoleLog = document.getElementById('consoleLog');
const previewContainer = document.getElementById('previewContainer');
const cards = document.querySelectorAll('.card');

let currentTheme = 0;
let selectedService = null;

function rollAnimation() {
    switcherThumb.classList.add('rolling');
    setTimeout(() => { switcherThumb.classList.remove('rolling'); }, 500);
}

switcherTrack.addEventListener('click', function(e) {
    const rect = switcherTrack.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;
    
    if (x < width / 3) {
        currentTheme = 0;
        switcherThumb.style.left = '0px';
        body.classList.remove('light-theme', 'dark-theme');
    } else if (x < (width * 2 / 3)) {
        currentTheme = 1;
        switcherThumb.style.left = (width / 2 - 13) + 'px';
        body.classList.add('light-theme');
        body.classList.remove('dark-theme');
    } else {
        currentTheme = 2;
        switcherThumb.style.left = (width - 26) + 'px';
        body.classList.add('dark-theme');
        body.classList.remove('light-theme');
    }
    rollAnimation();
});

switcherThumb.style.left = '0px';

cards.forEach(card => {
    card.addEventListener('click', function() {
        cards.forEach(c => c.classList.remove('active'));
        this.classList.add('active');
        selectedService = this.dataset.service;
        addLog(`Layanan dipilih: ${this.querySelector('.card-title').textContent}`, 'info');
    });
});

function getCurrentTime() {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    const s = String(now.getSeconds()).padStart(2, '0');
    return `[${h}:${m}:${s}]`;
}

function addLog(message, type = '') {
    const placeholder = consoleLog.querySelector('.console-placeholder');
    if (placeholder) placeholder.remove();
    const logEntry = document.createElement('div');
    logEntry.className = 'console-log-entry';
    if (type) logEntry.classList.add(`console-log-${type}`);
    logEntry.innerHTML = `<span class="console-log-time">${getCurrentTime()}:</span> ${message}`;
    consoleLog.appendChild(logEntry);
    consoleLog.scrollTop = consoleLog.scrollHeight;
}

function showPreview(videoUrl, audioUrl) {
    previewContainer.innerHTML = '';
    
    if (videoUrl) {
        const videoDiv = document.createElement('div');
        videoDiv.className = 'preview-video';
        videoDiv.innerHTML = `<video controls autoplay playsinline style="width:100%; max-height:280px; border-radius:8px; background:#000;"><source src="${videoUrl}" type="video/mp4"></video>`;
        previewContainer.appendChild(videoDiv);
    }
    
    if (audioUrl) {
        const audioDiv = document.createElement('div');
        audioDiv.className = 'preview-audio';
        audioDiv.innerHTML = `<div class="preview-audio-label">🎵 Audio Preview</div><audio controls autoplay style="width:100%;"><source src="${audioUrl}" type="audio/mpeg"></audio>`;
        previewContainer.appendChild(audioDiv);
    }
    
    if (!videoUrl && !audioUrl) {
        previewContainer.innerHTML = `<div class="preview-placeholder"><i class="fa-solid fa-play"></i><span>Preview akan muncul di sini</span></div>`;
    }
}

function detectService(url) {
    const u = url.toLowerCase();
    if (u.includes('youtube.com') || u.includes('youtu.be')) return 'youtube';
    if (u.includes('instagram.com')) return 'igdl';
    if (u.includes('facebook.com') || u.includes('fb.com') || u.includes('fb.watch')) return 'fbdl';
    if (u.includes('tiktok.com')) return 'tiktok';
    return null;
}

function findValueByKey(obj, targetKey) {
    if (!obj || typeof obj !== 'object') return null;
    if (Array.isArray(obj)) {
        for (const item of obj) { const found = findValueByKey(item, targetKey); if (found) return found; }
        return null;
    }
    for (const key in obj) {
        if (key === targetKey) {
            const val = obj[key];
            if (typeof val === 'string' && val.startsWith('http') && val.length > 20) return val;
            if (Array.isArray(val) && val.length > 0 && typeof val[0] === 'string' && val[0].startsWith('http')) return val[0];
        }
        if (typeof obj[key] === 'object' && obj[key] !== null) {
            const found = findValueByKey(obj[key], targetKey);
            if (found) return found;
        }
    }
    return null;
}

function extractAllLinks(data) {
    if (!data) return [];
    const links = []; const seen = new Set();
    const search = (obj, d = 0) => {
        if (!obj || typeof obj !== 'object' || d > 20) return;
        if (typeof obj === 'string') { if ((obj.startsWith('http://') || obj.startsWith('https://')) && obj.length > 20 && !seen.has(obj)) { seen.add(obj); links.push(obj); } return; }
        if (Array.isArray(obj)) { obj.forEach(i => search(i, d + 1)); return; }
        for (const k of Object.keys(obj)) {
            const v = obj[k];
            if (typeof v === 'string' && (v.startsWith('http://') || v.startsWith('https://')) && v.length > 20 && !seen.has(v)) { seen.add(v); links.push(v); }
            if (typeof v === 'object' && v !== null) search(v, d + 1);
        }
    };
    search(data);
    return links;
}

function isImageLink(url) {
    if (!url) return false;
    const u = url.toLowerCase();
    return ['.jpg','.jpeg','.png','.gif','.webp','.bmp','.svg','.ico'].some(e => u.includes(e)) || ['image','photo','picture','thumbnail','thumb','cover','preview','poster'].some(p => u.includes(p));
}

function isAudioLink(url) {
    if (!url) return false;
    const u = url.toLowerCase();
    return ['.mp3','.m4a','.aac','.wav','.ogg','.flac'].some(e => u.includes(e)) || ['music','audio','ies-music.tiktokcdn','music.tiktokcdn','aceimg'].some(p => u.includes(p));
}

function isTiktokVideoLink(url) {
    if (!url || isImageLink(url)) return false;
    const u = url.toLowerCase();
    return ['v16m.tiktokcdn','v16.tiktokcdn','p16.tiktokcdn','p19.tiktokcdn','p16-common-sign.tiktokcdn-us.com','p16-sign.tiktokcdn-us.com','p19-sign.tiktokcdn-us.com','tiktokcdn-us.com','tiktokcdn.com'].some(p => u.includes(p)) && !['ies-music.tiktokcdn','music.tiktokcdn'].some(a => u.includes(a));
}

function isTiktokAudioLink(url) {
    if (!url) return false;
    return ['ies-music.tiktokcdn','music.tiktokcdn','music-ies.tiktokcdn'].some(p => url.toLowerCase().includes(p));
}

async function processDownload(url) {
    const detected = detectService(url);
    if (!detected && !selectedService) { addLog('Error: Tidak dapat mendeteksi link.', 'error'); return; }
    const service = selectedService || detected;

    // YTDL = YouTube (gabungan MP4 + MP3)
    if (detected === 'youtube' || service === 'ytdl') {
        addLog('Link YouTube terdeteksi.', 'info');
        addLog('Mengambil Video & Audio...', 'info');
        let videoLink = null, audioLink = null;

        addLog('Fetching video (MP4)...', 'info');
        try {
            const r = await fetch(`https://api-faa.my.id/faa/ytmp4?url=${encodeURIComponent(url)}`);
            const d = await r.json();
            if (d.status === 'success' || d.status === true) {
                videoLink = findValueByKey(d, 'download_url');
                if (videoLink) addLog('Link Video: <span class="console-log-link">' + videoLink + '</span>', 'success');
                else addLog('Key "download_url" tidak ditemukan.', 'error');
            } else addLog('Error MP4: ' + (d.message || d.msg || 'Gagal'), 'error');
        } catch(e) { addLog('Error YTMP4: ' + e.message, 'error'); }

        addLog('Fetching audio (MP3)...', 'info');
        try {
            const r = await fetch(`https://api-faa.my.id/faa/ytmp3?url=${encodeURIComponent(url)}`);
            const d = await r.json();
            if (d.status === 'success' || d.status === true) {
                audioLink = findValueByKey(d, 'mp3');
                if (audioLink) addLog('Link Audio: <span class="console-log-link">' + audioLink + '</span>', 'success');
                else addLog('Key "mp3" tidak ditemukan.', 'error');
            } else addLog('Error MP3: ' + (d.message || d.msg || 'Gagal'), 'error');
        } catch(e) { addLog('Error YTMP3: ' + e.message, 'error'); }

        showPreview(videoLink, audioLink);
        addLog('Proses YouTube selesai!', 'success');
        return;
    }

    const configs = {
        igdl: { url: 'https://api-faa.my.id/faa/igdl', key: 'url', name: 'Instagram' },
        fbdl: { url: 'https://api-faa.my.id/faa/fbdownload', key: 'video_hd', name: 'Facebook' },
        tiktok: { url: 'https://api-faa.my.id/faa/tiktok', key: 'selected', name: 'TikTok' }
    };

    const cfg = configs[service];
    if (!cfg) { addLog('Error: Layanan tidak valid.', 'error'); return; }

    addLog(`Memulai download ${cfg.name}...`, 'info');
    try {
        const r = await fetch(`${cfg.url}?url=${encodeURIComponent(url)}`);
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const d = await r.json();
        addLog('Server terhubung.', 'success');

        if (d.status === 'success' || d.status === true) {
            if (service === 'tiktok') {
                const all = extractAllLinks(d);
                let vid = findValueByKey(d, 'selected') || findValueByKey(d, 'video');
                let aud = findValueByKey(d, 'music') || findValueByKey(d, 'audio');
                if (!vid) vid = all.find(l => isTiktokVideoLink(l)) || all.filter(l => !isImageLink(l) && !isAudioLink(l))[0] || null;
                if (!aud) aud = all.find(l => isTiktokAudioLink(l)) || null;
                if (vid) addLog('Link Video: <span class="console-log-link">' + vid + '</span>', 'success');
                if (aud) addLog('Link Audio: <span class="console-log-link">' + aud + '</span>', 'success');
                showPreview(vid, aud);
            } else if (service === 'fbdl') {
                let vid = findValueByKey(d, 'video_hd');
                if (vid && !isImageLink(vid)) {
                    addLog('Link Video FB: <span class="console-log-link">' + vid + '</span>', 'success');
                } else {
                    const all = extractAllLinks(d);
                    vid = all.filter(l => !isImageLink(l) && !isAudioLink(l))[0] || null;
                    if (vid) addLog('Link Video FB: <span class="console-log-link">' + vid + '</span>', 'success');
                    else addLog('Error: Key "video_hd" tidak ditemukan.', 'error');
                }
                showPreview(vid, null);
            } else {
                let link = findValueByKey(d, cfg.key);
                if (link && !isImageLink(link)) {
                    addLog(`Link Hasil (${cfg.key}): <span class="console-log-link">${link}</span>`, 'success');
                } else {
                    const all = extractAllLinks(d);
                    link = all.filter(l => !isImageLink(l))[0] || null;
                    if (link) addLog('Link Hasil: <span class="console-log-link">' + link + '</span>', 'success');
                    else addLog(`Error: Key "${cfg.key}" tidak ditemukan.`, 'error');
                }
                showPreview(link, null);
            }
            addLog('Download selesai!', 'success');
        } else {
            addLog('Error: ' + (d.message || d.msg || 'Gagal.'), 'error');
        }
    } catch(e) { addLog('Error: ' + e.message, 'error'); }
}

downloadButton.addEventListener('click', () => {
    const link = downloadInput.value.trim();
    if (!link) { addLog('Error: Link kosong!', 'error'); return; }
    processDownload(link);
});

downloadInput.addEventListener('keypress', e => {
    if (e.key === 'Enter') {
        const link = downloadInput.value.trim();
        if (!link) { addLog('Error: Link kosong!', 'error'); return; }
        processDownload(link);
    }
});