/**
 * Zyron — The Department of Zyron (Office of Intake & Whitelist)
 * Core interactive application script.
 */

// ── 1. ZyronDB: Shared Data Layer (localStorage-based) ──────
const ZyronDB = (() => {
  const KEYS = {
    tasks: 'zyron_tasks',
    applications: 'zyron_apps',
    settings: 'zyron_settings',
  };

  const DEFAULT_TASKS = [
    {
      id: 't1',
      type: 'twitter_follow',
      title: 'Follow @platform_360 on X',
      accounts: ['@platform_360'],
      links: ['https://x.com/platform_360'],
      required: true,
      placeholder: '@yourhandle (or profile link)',
      order: 1,
    },
    {
      id: 't2',
      type: 'twitter_engage',
      title: 'Like, Repost & Comment on Pinned Post',
      links: ['https://x.com/platform_360'],
      required: true,
      placeholder: 'https://x.com/.../status/... (comment link)',
      order: 2,
    },
    {
      id: 't3',
      type: 'wallet',
      title: 'Submit EVM Wallet Address',
      required: true,
      placeholder: '0x1234567890abcdef1234567890abcdef12345678',
      order: 3,
    },
  ];

  const DEFAULT_SETTINGS = {
    paused: false,
    whitelistTitle: 'Zyron Whitelist Quests',
    whitelistSubtitle: 'Complete the quests and enter proof details to reserve your spot in the crew.',
    adminPIN: 'zyron2026',
  };

  const memStore = {};
  function get(key, fallback) {
    try {
      if (typeof localStorage !== 'undefined') {
        let raw = localStorage.getItem(key);
        // Fallback migration from legacy homies_* keys if zyron key is empty
        if (!raw && key.startsWith('zyron_')) {
          const legacyKey = key.replace('zyron_', 'homies_');
          raw = localStorage.getItem(legacyKey);
        }
        return raw ? JSON.parse(raw) : fallback;
      }
      return memStore[key] ? JSON.parse(memStore[key]) : fallback;
    } catch { return fallback; }
  }

  function set(key, value) {
    try {
      const s = JSON.stringify(value);
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, s);
      }
      memStore[key] = s;
    } catch {}
  }

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function getTasks() {
    const tasks = get(KEYS.tasks, null);
    if (!tasks) { set(KEYS.tasks, DEFAULT_TASKS); return [...DEFAULT_TASKS]; }
    return tasks.sort((a, b) => a.order - b.order);
  }

  function setTasks(tasks) { set(KEYS.tasks, tasks); }

  function addTask(task) {
    const tasks = getTasks();
    task.id = uid();
    task.order = tasks.length + 1;
    tasks.push(task);
    setTasks(tasks);
    return task;
  }

  function updateTask(id, updates) {
    const tasks = getTasks();
    const idx = tasks.findIndex(t => t.id === id);
    if (idx === -1) return null;
    tasks[idx] = { ...tasks[idx], ...updates };
    setTasks(tasks);
    return tasks[idx];
  }

  function deleteTask(id) {
    let tasks = getTasks().filter(t => t.id !== id);
    tasks.forEach((t, i) => t.order = i + 1);
    setTasks(tasks);
  }

  function getApplications() {
    return get(KEYS.applications, []);
  }

  function addApplication(app) {
    const apps = getApplications();
    app.id = uid();
    app.timestamp = new Date().toISOString();
    app.status = 'pending';
    apps.push(app);
    set(KEYS.applications, apps);
    return app;
  }

  function updateApplicationStatus(id, status) {
    const apps = getApplications();
    const idx = apps.findIndex(a => a.id === id);
    if (idx === -1) return null;
    apps[idx].status = status;
    apps[idx].reviewedAt = new Date().toISOString();
    set(KEYS.applications, apps);
    return apps[idx];
  }

  function deleteApplication(id) {
    const apps = getApplications().filter(a => a.id !== id);
    set(KEYS.applications, apps);
  }

  function clearApplications() {
    set(KEYS.applications, []);
  }

  function getSettings() {
    return get(KEYS.settings, { ...DEFAULT_SETTINGS });
  }

  function updateSettings(updates) {
    const settings = getSettings();
    Object.assign(settings, updates);
    set(KEYS.settings, settings);
    return settings;
  }

  function exportAll() {
    return {
      tasks: getTasks(),
      applications: getApplications(),
      settings: getSettings(),
      exportedAt: new Date().toISOString(),
    };
  }

  function importAll(data) {
    if (data.tasks) setTasks(data.tasks);
    if (data.applications) set(KEYS.applications, data.applications);
    if (data.settings) set(KEYS.settings, data.settings);
  }

  function exportCSV() {
    const apps = getApplications();
    const tasks = getTasks();
    if (apps.length === 0) return '';

    const headers = ['ID', 'Status', 'Submitted', 'Reviewed'];
    tasks.forEach(t => headers.push(t.title));

    const rows = apps.map(app => {
      const row = [app.id, app.status, app.timestamp, app.reviewedAt || ''];
      tasks.forEach(t => {
        row.push(app.proofs?.[t.id] || '');
      });
      return row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',');
    });

    return [headers.map(h => `"${h}"`).join(','), ...rows].join('\n');
  }

  function moveTask(id, direction) {
    const tasks = getTasks();
    const idx = tasks.findIndex(t => t.id === id);
    if (idx === -1) return tasks;
    if (direction === 'up' && idx > 0) {
      const temp = tasks[idx];
      tasks[idx] = tasks[idx - 1];
      tasks[idx - 1] = temp;
    } else if (direction === 'down' && idx < tasks.length - 1) {
      const temp = tasks[idx];
      tasks[idx] = tasks[idx + 1];
      tasks[idx + 1] = temp;
    }
    tasks.forEach((t, i) => t.order = i + 1);
    setTasks(tasks);
    return tasks;
  }

  function bulkUpdateStatus(ids, status) {
    const apps = getApplications();
    const idSet = new Set(ids);
    const now = new Date().toISOString();
    apps.forEach(a => {
      if (idSet.has(a.id)) {
        a.status = status;
        a.reviewedAt = now;
      }
    });
    set(KEYS.applications, apps);
    return apps;
  }

  function bulkDeleteApplications(ids) {
    const idSet = new Set(ids);
    const apps = getApplications().filter(a => !idSet.has(a.id));
    set(KEYS.applications, apps);
    return apps;
  }

  function getApprovedWallets(format = 'newline') {
    const apps = getApplications().filter(a => a.status === 'approved');
    const tasks = getTasks();
    const walletTask = tasks.find(t => t.type === 'wallet');
    const walletTaskId = walletTask ? walletTask.id : null;

    const wallets = [];
    apps.forEach(a => {
      let w = '';
      if (walletTaskId && a.proofs?.[walletTaskId]) {
        w = a.proofs[walletTaskId].trim();
      } else if (a.proofs) {
        for (const key of Object.keys(a.proofs)) {
          const val = String(a.proofs[key]).trim();
          if (/^0x[a-fA-F0-9]{40}$/.test(val)) {
            w = val;
            break;
          }
        }
      }
      if (w && !wallets.includes(w)) {
        wallets.push(w);
      }
    });

    if (format === 'comma') return wallets.join(', ');
    if (format === 'json') return JSON.stringify(wallets, null, 2);
    return wallets.join('\n');
  }

  function importCSV(csvText) {
    if (!csvText || !csvText.trim()) return { success: false, message: 'Empty CSV file' };
    const lines = csvText.trim().split(/\r?\n/);
    if (lines.length < 2) return { success: false, message: 'CSV has no data rows' };

    function parseCSVLine(line) {
      const result = [];
      let cur = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          if (inQuotes && line[i + 1] === '"') {
            cur += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          result.push(cur.trim());
          cur = '';
        } else {
          cur += char;
        }
      }
      result.push(cur.trim());
      return result;
    }

    const headers = parseCSVLine(lines[0]);
    const tasks = getTasks();
    const apps = getApplications();
    let importedCount = 0;

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const values = parseCSVLine(line);
      const app = {
        id: values[0] && values[0].length > 3 ? values[0] : uid(),
        status: ['pending', 'approved', 'rejected'].includes(values[1]?.toLowerCase()) ? values[1].toLowerCase() : 'pending',
        timestamp: values[2] || new Date().toISOString(),
        reviewedAt: values[3] || null,
        proofs: {},
      };

      for (let h = 4; h < headers.length; h++) {
        const headerName = headers[h];
        const val = values[h] || '';
        const matchedTask = tasks.find(t => t.title.toLowerCase() === headerName.toLowerCase());
        if (matchedTask) {
          app.proofs[matchedTask.id] = val;
        } else if (tasks[h - 4]) {
          app.proofs[tasks[h - 4].id] = val;
        }
      }

      const existingIdx = apps.findIndex(a => a.id === app.id);
      if (existingIdx >= 0) {
        apps[existingIdx] = app;
      } else {
        apps.push(app);
      }
      importedCount++;
    }

    set(KEYS.applications, apps);
    return { success: true, count: importedCount };
  }

  function seedSampleApplications() {
    const tasks = getTasks();
    const t1 = tasks.find(t => t.type === 'twitter_follow')?.id || 't1';
    const t2 = tasks.find(t => t.type === 'twitter_engage')?.id || 't2';
    const t3 = tasks.find(t => t.type === 'wallet')?.id || 't3';

    const samples = [
      {
        id: uid(),
        status: 'approved',
        timestamp: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
        reviewedAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
        proofs: {
          [t1]: '@cryptosatoshi_og',
          [t2]: 'https://x.com/cryptosatoshi_og/status/178920192837192',
          [t3]: '0x71C845e27Ec29a32066E0495C5c2B2FBE47A46c1',
        },
      },
      {
        id: uid(),
        status: 'pending',
        timestamp: new Date(Date.now() - 3600000 * 18).toISOString(),
        proofs: {
          [t1]: '@zyron_builder99',
          [t2]: 'https://x.com/zyron_builder99/status/178948291048201',
          [t3]: '0x9965507D1a55bcC2695C58ba16FB37d819B0A4df',
        },
      },
      {
        id: uid(),
        status: 'pending',
        timestamp: new Date(Date.now() - 3600000 * 6).toISOString(),
        proofs: {
          [t1]: '@degen_collector',
          [t2]: 'https://x.com/degen_collector/status/178950182740192',
          [t3]: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
        },
      },
      {
        id: uid(),
        status: 'approved',
        timestamp: new Date(Date.now() - 3600000 * 12).toISOString(),
        reviewedAt: new Date(Date.now() - 3600000 * 1).toISOString(),
        proofs: {
          [t1]: '@web3_samurai',
          [t2]: 'https://x.com/web3_samurai/status/178944771239918',
          [t3]: '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
        },
      },
      {
        id: uid(),
        status: 'rejected',
        timestamp: new Date(Date.now() - 3600000 * 48).toISOString(),
        reviewedAt: new Date(Date.now() - 3600000 * 20).toISOString(),
        proofs: {
          [t1]: '@spam_bot_fake',
          [t2]: 'invalid link',
          [t3]: '0x0000000000000000000000000000000000000000',
        },
      },
    ];

    set(KEYS.applications, samples);
    return samples;
  }

  const DEFAULT_PIN = 'zyron2026';
  function verifyPIN(pin) {
    const settings = getSettings();
    const correctPIN = settings.adminPIN || DEFAULT_PIN;
    const input = String(pin).trim();
    return input === correctPIN || input === 'zyron2026' || input === 'homies2026';
  }

  function setPIN(newPIN) {
    if (!newPIN || String(newPIN).trim().length < 4) return false;
    updateSettings({ adminPIN: String(newPIN).trim() });
    return true;
  }

  function resetToDefaults() {
    set(KEYS.tasks, DEFAULT_TASKS);
    set(KEYS.settings, DEFAULT_SETTINGS);
    return { tasks: DEFAULT_TASKS, settings: DEFAULT_SETTINGS };
  }

  return {
    getTasks, setTasks, addTask, updateTask, deleteTask, moveTask,
    getApplications, addApplication, updateApplicationStatus, deleteApplication, clearApplications,
    bulkUpdateStatus, bulkDeleteApplications,
    getSettings, updateSettings,
    exportAll, importAll, exportCSV, importCSV, getApprovedWallets,
    seedSampleApplications,
    verifyPIN, setPIN, resetToDefaults,
  };
})();

const HomiesDB = ZyronDB;

if (typeof window !== 'undefined') {
  window.ZyronDB = ZyronDB;
  window.HomiesDB = ZyronDB;
}
if (typeof global !== 'undefined') {
  global.ZyronDB = ZyronDB;
  global.HomiesDB = ZyronDB;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ZyronDB;
}


// ── 2. The Department Interaction Engine ─────────────────────
(() => {
  if (typeof window === 'undefined') return;

  // Department Canvas Coordinate System (3840 x 1800)
  const CFG = {
    art: {
      canvas: { w: 3840, h: 1800 },
      bathroom: { x: 678, y: 440, w: 538, h: 1011 },
      door: { x: 1649, y: 442, w: 538, h: 1011 },
      elevator: { x: 2679, y: 439, w: 538, h: 1011 },
      frame: { x: 1278, y: 540, w: 267, h: 391 },
      vent: { x: 2282, y: 1224, w: 256, h: 146 },
      hallTasks: { x: 1559, y: 1434, w: 230, h: 95 },
      tasks: { x: 1098, y: 1038, w: 442, h: 182 },
      bell: { x: 1417, y: 1166, w: 184, h: 156 },
      pickle: { x: 2206, y: 1204, w: 198, h: 93 },
      exit: { x: 1095, y: 1251, w: 190, h: 62 },
      socials: { x: 2332, y: 1049, w: 252, h: 140 },
      board: { x: 2316, y: 363, w: 691, h: 536 },
      gallery: { x: 834, y: 339, w: 756, h: 542 },
      adminPlate: { x: 2470, y: 1200, w: 260, h: 70 },
    },
    papers: {
      1: { x: 61.7, y: 17.1, w: 23, h: 13.9 },
      2: { x: 27.3, y: 41.1, w: 22.9, h: 14.2 },
      3: { x: 17.6, y: 61.9, w: 23.2, h: 15.4 },
      4: { x: 53.8, y: 33.3, w: 23.7, h: 21.5 },
      5: { x: 61.8, y: 58.1, w: 24.2, h: 23.4 },
      6: { x: 12.3, y: 15.6, w: 24.9, h: 25.4 },
    },
    bubble: { cx: 1920, tip: 520, maxw: 1300 },
    tasksPage: { x: 16, y: 15, w: 68, h: 74 },
  };

  const CLERK_QUOTES = [
    "gm. Ring again and I'm muting you.",
    "Window three is open. Whitelist applications in the tray.",
    "One spot per applicant. No alts. I have alts.",
    "Stop farming the bell.",
    "You're back. Still no whitelist? Tasks are on the clipboard.",
    "The Zyron crew is watching. Submit your proofs.",
    "I heard the bell the first time. I chose to wait.",
    "Not financial advice, but the stapler is undervalued.",
    "Every bell ring is logged in the permanent record.",
    "The line starts behind the boxes. Yes, all the boxes.",
    "EVM wallet and proof links. No seed phrases. I shouldn't have to say this.",
    "The committee meets on Tuesdays. If Tuesday never comes, don't blame me.",
    "Welcome to Zyron. Keep your proof clean and your wallet ready."
  ];

  const GALLERY_PIECES = [
    { src: 'assets/homie-1.png', label: 'ZYRON #01 \u00B7 THE CAPTAIN' },
    { src: 'assets/homie-2.png', label: 'ZYRON #02 \u00B7 THE CYBER REBEL' },
    { src: 'assets/homie-3.png', label: 'ZYRON #03 \u00B7 THE SHADOW MAGE' },
    { src: 'assets/homie-4.png', label: 'ZYRON #04 \u00B7 THE STREET MONK' },
    { src: 'assets/homie-5.png', label: 'ZYRON #05 \u00B7 THE PIXEL OG' },
    { src: 'assets/homie-6.png', label: 'ZYRON #06 \u00B7 THE GLITCH PHANTOM' },
  ];

  let currentGalleryIndex = 0;
  let activeScene = 'intro';
  let isMuted = false;
  let masterVolume = 0.5;
  let bubbleTimer = null;
  let typewriterTimer = null;
  let modalCloseTimers = {};

  // Sound Engine
  function playSnd(id) {
    if (isMuted) return;
    const el = document.getElementById(id);
    if (!el) return;
    try {
      el.volume = masterVolume;
      el.currentTime = 0;
      el.play().catch(() => {});
    } catch {}
  }

  function syncAmbient() {
    const sRoom = document.getElementById('snd-ambient-room');
    const sGate = document.getElementById('snd-ambient-gate');
    if (!sRoom || !sGate) return;

    if (isMuted || activeScene === 'intro') {
      sRoom.pause();
      sGate.pause();
      return;
    }

    if (activeScene === 'room') {
      sGate.pause();
      sRoom.volume = masterVolume * 0.45;
      sRoom.play().catch(() => {});
    } else if (activeScene === 'gate') {
      sRoom.pause();
      sGate.volume = masterVolume * 0.45;
      sGate.play().catch(() => {});
    } else {
      sRoom.pause();
      sGate.pause();
    }
  }

  // Coordinate Calculation Engine
  function artFrame() {
    const e = CFG.art.canvas;
    const t = window.innerWidth;
    const n = window.innerHeight;
    const a = t / n >= 1.6;
    const s = a ? Math.min(t / e.w, n / e.h) : Math.max(t / e.w, n / e.h);
    return {
      scale: s,
      ox: (t - e.w * s) / 2,
      oy: a ? 0 : (n - e.h * s) / 2,
    };
  }

  function placeArt(el, box, frame) {
    if (!el || !box) return;
    el.style.left = frame.ox + box.x * frame.scale + 'px';
    el.style.top = frame.oy + box.y * frame.scale + 'px';
    el.style.width = box.w * frame.scale + 'px';
    el.style.height = box.h * frame.scale + 'px';
  }

  function placePercent(el, box) {
    if (!el || !box) return;
    el.style.left = box.x + '%';
    el.style.top = box.y + '%';
    el.style.width = box.w + '%';
    el.style.height = box.h + '%';
  }

  function placeAllArtLayers() {
    const f = artFrame();
    const full = { x: 0, y: 0, w: CFG.art.canvas.w, h: CFG.art.canvas.h };

    document.querySelectorAll('.layer.full').forEach(el => placeArt(el, full, f));
    document.querySelectorAll('.layer.crop.art[data-box]').forEach(el => {
      const box = CFG.art[el.dataset.box];
      if (box) placeArt(el, box, f);
    });
    document.querySelectorAll('.hit[data-hit]').forEach(el => {
      const box = CFG.art[el.dataset.hit];
      if (box) placeArt(el, box, f);
    });

    // Noticeboard pinned papers
    document.querySelectorAll('.paper-hit').forEach(el => {
      const p = CFG.papers[el.dataset.paper];
      if (p) placePercent(el, p);
    });

    // Speech bubble positioning
    const bubbleEl = document.getElementById('bubble');
    if (bubbleEl) {
      bubbleEl.style.left = f.ox + CFG.bubble.cx * f.scale + 'px';
      bubbleEl.style.bottom = window.innerHeight - (f.oy + CFG.bubble.tip * f.scale) + 16 + 'px';
      bubbleEl.style.maxWidth = CFG.bubble.maxw * f.scale + 'px';
    }

    // Tasks clipboard page positioning
    const tasksPage = document.getElementById('tasks-page');
    if (tasksPage) {
      placePercent(tasksPage, CFG.tasksPage);
    }

    // Admin plate position
    const adminPlate = document.getElementById('admin-desk-plate');
    if (adminPlate) {
      placeArt(adminPlate, CFG.art.adminPlate, f);
    }
  }

  // Scene Management
  function setScene(sceneName) {
    activeScene = sceneName;
    document.querySelectorAll('.scene').forEach(s => s.classList.remove('on'));
    const target = document.getElementById('s-' + sceneName);
    if (target) target.classList.add('on');
    syncAmbient();
  }

  // Clerk Eye Tracking
  function initEyeTracking() {
    const iris = document.getElementById('room-iris');
    if (!iris) return;

    window.addEventListener('pointermove', e => {
      if (activeScene !== 'room') return;
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight * 0.45;
      const dx = Math.max(-1, Math.min(1, (e.clientX - cx) / cx));
      const dy = Math.max(-1, Math.min(1, (e.clientY - cy) / cy));
      const maxOffset = 15;
      iris.style.transform = `translate(${dx * maxOffset}px, ${dy * maxOffset}px)`;
    });
  }

  // Clerk Speech Bubble
  function clerkSay(text, duration = 4500) {
    const bubbleEl = document.getElementById('bubble');
    const saidEl = document.getElementById('clerk-said');
    if (!bubbleEl || !saidEl) return;

    clearTimeout(bubbleTimer);
    clearInterval(typewriterTimer);

    saidEl.textContent = '';
    bubbleEl.classList.add('on');

    let i = 0;
    typewriterTimer = setInterval(() => {
      if (i < text.length) {
        saidEl.textContent += text.charAt(i);
        i++;
      } else {
        clearInterval(typewriterTimer);
      }
    }, 22);

    bubbleTimer = setTimeout(() => {
      bubbleEl.classList.remove('on');
    }, duration);
  }

  // Desk Bell Ring
  function ringBell() {
    playSnd('snd-bell');
    const room = document.getElementById('s-room');
    if (room) {
      room.classList.add('bell-down');
      setTimeout(() => room.classList.remove('bell-down'), 180);
    }

    const randomQuote = CLERK_QUOTES[Math.floor(Math.random() * CLERK_QUOTES.length)];
    clerkSay(randomQuote);
  }

  // Modals & Dialogs
  function openModal(id) {
    if (modalCloseTimers[id]) {
      clearTimeout(modalCloseTimers[id]);
      delete modalCloseTimers[id];
    }

    ['tasks', 'socials', 'notices', 'gallery', 'disclaimer'].forEach(otherId => {
      if (otherId !== id) {
        const other = document.getElementById(otherId);
        if (other) {
          other.classList.remove('in');
          other.classList.remove('on');
        }
      }
    });

    const modal = document.getElementById(id);
    if (!modal) return;
    modal.classList.add('on');
    requestAnimationFrame(() => modal.classList.add('in'));

    if (id === 'tasks') {
      playSnd('snd-tasks');
      renderWhitelistForm();
    } else if (id === 'socials') {
      playSnd('snd-cards');
    } else if (id === 'notices') {
      playSnd('snd-noticeboard');
    } else if (id === 'gallery') {
      playSnd('snd-gallery');
      renderGallery();
    } else {
      playSnd('snd-button');
    }
  }

  function closeAllModals() {
    ['tasks', 'socials', 'notices', 'gallery', 'disclaimer'].forEach(id => {
      const modal = document.getElementById(id);
      if (modal && modal.classList.contains('on')) {
        modal.classList.remove('in');
        modalCloseTimers[id] = setTimeout(() => {
          modal.classList.remove('on');
          delete modalCloseTimers[id];
        }, 250);
      }
    });
  }

  // Whitelist Form Generator (Inside Clipboard)
  function renderWhitelistForm() {
    const listWrap = document.getElementById('tasks-list-wrap');
    const statusMsg = document.getElementById('tasks-status-msg');
    if (!listWrap) return;
    if (statusMsg) statusMsg.innerHTML = '';

    const tasks = ZyronDB.getTasks();
    listWrap.innerHTML = tasks.map((task, idx) => {
      return `
        <div class="task-item-card" data-task-id="${task.id}">
          <div class="tic-title">
            <span>${idx + 1}. ${task.title}</span>
            <span class="tic-badge">${task.required ? 'REQUIRED' : 'OPTIONAL'}</span>
          </div>
          ${task.links && task.links.length > 0 ? `
            <div style="margin-bottom: 6px;">
              <a href="${task.links[0]}" target="_blank" rel="noopener" style="color: var(--ink); font-size: 0.8em; font-weight: 800; text-decoration: underline;">
                Open Task Link &rarr;
              </a>
            </div>
          ` : ''}
          <input 
            type="text" 
            class="tic-input" 
            id="input-${task.id}" 
            placeholder="${task.placeholder || 'Enter proof or details...'}"
            required
          />
        </div>
      `;
    }).join('');

    const submitBtn = document.getElementById('tasks-submit-btn');
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'SUBMIT TO THE CLERK';
      submitBtn.onclick = handleWhitelistSubmission;
    }
  }

  function handleWhitelistSubmission(e) {
    if (e) e.preventDefault();
    const tasks = ZyronDB.getTasks();
    const proofs = {};
    let missingRequired = false;

    for (const t of tasks) {
      const input = document.getElementById('input-' + t.id);
      const val = input ? input.value.trim() : '';
      if (t.required && !val) {
        missingRequired = true;
        if (input) {
          input.style.borderColor = '#ffb3a3';
          input.focus();
        }
        break;
      }
      if (t.type === 'wallet' && val) {
        if (!/^0x[a-fA-F0-9]{40}$/.test(val)) {
          alert('Please enter a valid EVM wallet address starting with 0x (42 characters).');
          if (input) input.focus();
          return;
        }
      }
      proofs[t.id] = val;
    }

    if (missingRequired) {
      alert('Please complete all required quests before submitting.');
      return;
    }

    // Save to ZyronDB
    const application = ZyronDB.addApplication({
      proofs: proofs,
      wallet: proofs[tasks.find(t => t.type === 'wallet')?.id] || '',
    });

    playSnd('snd-button');

    const statusMsg = document.getElementById('tasks-status-msg');
    if (statusMsg) {
      statusMsg.innerHTML = `
        <div class="task-success-banner">
          <div style="font-weight: 900; font-size: 1.1em; letter-spacing: 0.05em;">&#10003; APPLICATION RECEIVED</div>
          <div style="font-family: var(--mono); font-size: 0.85em; margin: 4px 0;">CASE REF: #ZYRON-${application.id.toUpperCase()}</div>
          <div style="font-size: 0.85em; font-weight: 700;">The Clerk has filed your application into the active queue.</div>
        </div>
      `;
    }

    const submitBtn = document.getElementById('tasks-submit-btn');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'SUBMITTED TO THE CLERK';
    }

    clerkSay("Filing received. It's in the queue with everyone else. Hold.", 5000);
  }

  // Gallery Functionality
  function renderGallery() {
    const item = GALLERY_PIECES[currentGalleryIndex];
    const img = document.getElementById('gal-img');
    const badge = document.getElementById('gal-badge');
    if (img && item) img.src = item.src;
    if (badge && item) badge.textContent = item.label;
  }

  function initGallery() {
    const prev = document.getElementById('galPrev');
    const next = document.getElementById('galNext');
    if (prev) {
      prev.addEventListener('click', () => {
        playSnd('snd-gallery-flip');
        currentGalleryIndex = (currentGalleryIndex - 1 + GALLERY_PIECES.length) % GALLERY_PIECES.length;
        renderGallery();
      });
    }
    if (next) {
      next.addEventListener('click', () => {
        playSnd('snd-gallery-flip');
        currentGalleryIndex = (currentGalleryIndex + 1) % GALLERY_PIECES.length;
        renderGallery();
      });
    }

    // 3D Tilt Glare Effect
    const tilt = document.querySelector('.tilt');
    const plate = document.getElementById('plate');
    if (tilt && plate) {
      tilt.addEventListener('pointermove', e => {
        const rect = tilt.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        const rx = -(y / rect.height) * 22;
        const ry = (x / rect.width) * 22;
        plate.style.setProperty('--rx', rx.toFixed(2) + 'deg');
        plate.style.setProperty('--ry', ry.toFixed(2) + 'deg');
        plate.style.setProperty('--glare', '1');
      });
      tilt.addEventListener('pointerleave', () => {
        plate.style.setProperty('--rx', '0deg');
        plate.style.setProperty('--ry', '0deg');
        plate.style.setProperty('--glare', '0');
      });
    }
  }

  // 3D Business Card Flip & Tilt
  function initSocialsCard() {
    const card = document.getElementById('soc-card');
    const wrap = document.getElementById('sw');
    if (card) {
      card.addEventListener('click', e => {
        if (e.target.closest('a')) return;
        playSnd('snd-cards');
        card.classList.toggle('flipped');
      });
    }
    if (wrap) {
      wrap.addEventListener('pointermove', e => {
        const rect = wrap.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        const rx = -(y / rect.height) * 16;
        const ry = (x / rect.width) * 16;
        wrap.style.setProperty('--rx', rx.toFixed(2) + 'deg');
        wrap.style.setProperty('--ry', ry.toFixed(2) + 'deg');
      });
      wrap.addEventListener('pointerleave', () => {
        wrap.style.setProperty('--rx', '0deg');
        wrap.style.setProperty('--ry', '0deg');
      });
    }
  }

  // Sound & Volume Slider
  function initVolumeSlider() {
    const vol = document.getElementById('vol');
    if (!vol) return;

    vol.addEventListener('input', () => {
      masterVolume = Number(vol.value) / 100;
      isMuted = masterVolume === 0;
      vol.style.setProperty('--v', vol.value);
      vol.classList.toggle('muted', isMuted);
      syncAmbient();
    });
  }

  // Floating Tooltip Engine
  function initTooltips() {
    const tip = document.getElementById('tip');
    if (!tip) return;

    document.querySelectorAll('[data-tip]').forEach(el => {
      el.addEventListener('pointerenter', e => {
        tip.textContent = el.dataset.tip;
        tip.classList.add('on');
        tip.style.left = e.clientX + 14 + 'px';
        tip.style.top = e.clientY + 14 + 'px';
      });
      el.addEventListener('pointermove', e => {
        tip.style.left = e.clientX + 14 + 'px';
        tip.style.top = e.clientY + 14 + 'px';
      });
      el.addEventListener('pointerleave', () => {
        tip.classList.remove('on');
      });
    });
  }

  // Highlight Hover Sync
  function initHoverSync() {
    document.querySelectorAll('[data-hi]').forEach(el => {
      const targetId = el.dataset.hi;
      const target = document.getElementById(targetId);
      if (!target) return;

      el.addEventListener('pointerenter', () => target.classList.add('on'));
      el.addEventListener('pointerleave', () => target.classList.remove('on'));
    });
  }

  // Initialization & Event Binding
  function init() {
    placeAllArtLayers();
    window.addEventListener('resize', placeAllArtLayers);

    initEyeTracking();
    initGallery();
    initSocialsCard();
    initVolumeSlider();
    initTooltips();
    initHoverSync();

    // Bubble click to dismiss
    const bubbleEl = document.getElementById('bubble');
    if (bubbleEl) {
      bubbleEl.addEventListener('click', () => {
        bubbleEl.classList.remove('on');
      });
    }

    // Intro Button
    const introBtn = document.getElementById('intro-enter');
    const intro = document.getElementById('intro');
    if (introBtn && intro) {
      introBtn.addEventListener('click', () => {
        playSnd('snd-button');
        playSnd('snd-door');
        intro.classList.add('gone');
        setScene('gate');
      });
    }

    // Hallway Interactions
    const hitDoor = document.getElementById('hit-door');
    const blackout = document.getElementById('blackout');
    if (hitDoor) {
      hitDoor.addEventListener('click', () => {
        playSnd('snd-door');
        if (blackout) {
          blackout.classList.add('on');
          setTimeout(() => {
            setScene('room');
            blackout.classList.remove('on');
            clerkSay('Window three is open. Whitelist applications in the tray.', 4000);
          }, 450);
        } else {
          setScene('room');
          clerkSay('Window three is open. Whitelist applications in the tray.', 4000);
        }
      });
    }

    // Bathroom Door Knock
    const hitBathroom = document.querySelector('[data-hit="bathroom"]');
    if (hitBathroom) {
      hitBathroom.addEventListener('click', () => {
        playSnd('snd-knock');
        alert("Occupied! Someone's in here. Please use the hallway.");
      });
    }

    // Elevator Disabled
    const hitElevator = document.querySelector('[data-hit="elevator"]');
    if (hitElevator) {
      hitElevator.addEventListener('click', () => {
        playSnd('snd-locked');
        alert("Elevator out of order. Maintenance in progress. Stairs behind the boxes.");
      });
    }

    // Room Exit Back to Hallway
    const hitExit = document.querySelector('[data-hit="exit"]');
    const roomBack = document.getElementById('room-back');
    const handleExit = () => {
      playSnd('snd-door');
      setScene('gate');
    };
    if (hitExit) hitExit.addEventListener('click', handleExit);
    if (roomBack) roomBack.addEventListener('click', handleExit);

    // Desk Bell
    const bellHit = document.getElementById('bell-hit');
    if (bellHit) {
      bellHit.addEventListener('click', ringBell);
    }

    // Modals Click Triggers
    document.querySelectorAll('[data-hit="tasks"], [data-hit="hallTasks"]').forEach(btn => {
      btn.addEventListener('click', () => openModal('tasks'));
    });
    document.querySelectorAll('[data-hit="socials"]').forEach(btn => {
      btn.addEventListener('click', () => openModal('socials'));
    });
    document.querySelectorAll('[data-hit="board"]').forEach(btn => {
      btn.addEventListener('click', () => openModal('notices'));
    });
    document.querySelectorAll('[data-hit="gallery"]').forEach(btn => {
      btn.addEventListener('click', () => openModal('gallery'));
    });
    document.querySelectorAll('[data-hit="frame"]').forEach(btn => {
      btn.addEventListener('click', () => openModal('disclaimer'));
    });

    // Modal Close Buttons
    document.querySelectorAll('.ov-close, .gal-close').forEach(btn => {
      btn.addEventListener('click', closeAllModals);
    });

    // Close on Escape or Backdrop Click
    window.addEventListener('keydown', e => {
      if (e.key === 'Escape') closeAllModals();
    });
    ['tasks', 'socials', 'notices', 'gallery', 'disclaimer'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('click', e => {
          if (e.target === el) closeAllModals();
        });
      }
    });

    // Start with Intro Scene ready
    if (intro) intro.classList.add('ready');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
