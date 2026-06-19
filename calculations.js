// Shared Constants & Calculations

const GOMA_COLORS = {
    'A': { name: 'Amarilla', color: '#FFD700', emoji: '🟡' },
    'R': { name: 'Roja', color: '#FF0000', emoji: '🔴' },
    'N': { name: 'Negra', color: '#000000', emoji: '⚫' },
    'RN': { name: 'Roja-Negra', color: 'linear-gradient(135deg, #FF0000 50%, #000000 50%)', emoji: '🔴⚫' },
    'M': { name: 'Morada', color: '#800080', emoji: '🟣' },
    'MR': { name: 'Morada-Roja', color: 'linear-gradient(135deg, #800080 50%, #FF0000 50%)', emoji: '🟣🔴' },
    'V': { name: 'Verde', color: '#00FF00', emoji: '🟢' },
    'VRo': { name: 'Verde-Roja', color: 'linear-gradient(135deg, #00FF00 50%, #FF0000 50%)', emoji: '🟢🔴' },
    'VN': { name: 'Verde-Negra', color: 'linear-gradient(135deg, #00FF00 50%, #000000 50%)', emoji: '🟢⚫' }
};

const GOMA_PENALTY = {
    '': 1,        // No goma, no penalty
    'A': 0.95,
    'R': 0.92,
    'N': 0.90,
    'RN': 0.86,
    'M': 0.82,
    'MR': 0.76,
    'V': 0.7,
    'VRo': 0.6,
    'VN': 0.5,
    'RODILLAS': 0.5 // 30 rodillas = 15 clean
};

const EXERCISE_CATEGORIES = {
    'dominada prona': 'Tracción',
    'dominada supino': 'Tracción',
    'remo australiano': 'Tracción',
    'remo neutro': 'Tracción',
    'flexiones diamante': 'Empuje',
    'flexiones militares': 'Empuje',
    'fondos': 'Empuje',
    'fondos triceps (sbd)': 'Empuje'
};

function stripDiacritics(text) {
    return (text || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
}

// Parse reps string/number to object
function parseReps(reps) {
    if (typeof reps === 'number') return { value: reps, modifier: '' };
    const match = reps.toString().match(/^(\d+)([A-Z]?)$/);
    if (match) return { value: parseInt(match[1]), modifier: match[2] };
    return { value: 0, modifier: '' };
}

// Get HTML badge for assistance
function getAssistanceBadge(gomaCode, rodillas) {
    let badgesHtml = '';

    if (rodillas === 'Y') {
        badgesHtml += `<span class="goma-badge rodillas-badge" title="Rodillas">🦵</span>`;
    }

    if (gomaCode) {
        // Split combo gomas into individual badges for side-by-side display
        const partToCodes = {
            'RN': ['R', 'N'],
            'MR': ['M', 'R'],
            'VRo': ['V', 'R'],
            'VN': ['V', 'N']
        };

        const codes = partToCodes[gomaCode] || [gomaCode];
        codes.forEach(code => {
            const goma = GOMA_COLORS[code];
            if (goma) {
                badgesHtml += `<span class="goma-badge" style="background-color: ${goma.color};" title="Goma ${goma.name}">${goma.emoji}</span>`;
            }
        });
    }

    return badgesHtml ? `<span class="assistance-container">${badgesHtml}</span>` : '';
}

// Get numeric assistance level (Lower is better/harder)
// 0 = None
// 1-9 = Gomas (Amarilla to Verde-Negra)
// 10 = Rodillas
function getAssistanceLevel(gomaCode, rodillas) {
    if (rodillas === 'Y') return 100;
    if (!gomaCode) return 0;

    // Order from least assistance to most assistance
    const levels = ['A', 'R', 'N', 'RN', 'M', 'MR', 'V', 'VRo', 'VN'];
    const idx = levels.indexOf(gomaCode);
    return idx === -1 ? 0 : idx + 1;
}

// Helper to describe improvement
function getImprovementText(oldReps, oldGoma, oldRodillas, newReps, newGoma, newRodillas) {
    const repDiff = newReps - oldReps;
    const oldLevel = getAssistanceLevel(oldGoma, oldRodillas);
    const newLevel = getAssistanceLevel(newGoma, newRodillas);

    // Level decreased (Good! Less assistance)
    if (newLevel < oldLevel) {
        return { text: 'Mayor dificultad', class: 'improvement' };
    }
    // Level increased (Bad! More assistance)
    if (newLevel > oldLevel) {
        return { text: 'Menor dificultad', class: 'decline' };
    }

    // Same level, check reps
    if (repDiff > 0) return { text: `+${repDiff} reps`, class: 'improvement' };
    if (repDiff < 0) return { text: `${repDiff} reps`, class: 'decline' };

    return { text: '=', class: 'neutral' };
}

// Normalize exercise names to Sentence case
function normalizeExerciseName(name) {
    if (!name) return '';
    const trimmed = stripDiacritics(name.trim());
    // Special handling for acronyms like SBD
    if (trimmed.includes('(SBD)')) return trimmed;

    // Capitalize first letter, lowercase rest
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
}

// Normalize person names (Trim and Title Case)
function normalizePersonName(name) {
    if (!name) return '';
    const noAccents = stripDiacritics(name.trim());

    return noAccents
        .toLowerCase()
        .split(/\s+/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

// Index of normalized person name -> url_photo (latest occurrence wins)
let PHOTO_INDEX = {};

function buildPhotoIndex(data) {
    const idx = {};
    if (data && Array.isArray(data.sessions)) {
        data.sessions.forEach(session => {
            (session.exercises || []).forEach(ex => {
                (ex.results || []).forEach(r => {
                    if (r && r.url_photo) {
                        idx[normalizePersonName(r.person)] = r.url_photo;
                    }
                });
            });
        });
    }
    PHOTO_INDEX = idx;
    return idx;
}

function getPhotoUrl(name) {
    return PHOTO_INDEX[normalizePersonName(name)] || null;
}

// Render an avatar element. When a photo is available it overlays the initial fallback.
function getAvatarHTML(name, className = 'list-avatar') {
    const url = getPhotoUrl(name);
    const initial = (name || '?').trim().charAt(0).toUpperCase() || '?';
    const imgTag = url
        ? `<img src="${url}" alt="" loading="lazy" onerror="this.remove()">`
        : '';
    return `<div class="${className}"><span class="avatar-fallback">${initial}</span>${imgTag}</div>`;
}

// Calculate normalized reps based on assistance
function getNormalizedReps(reps, gomaCode, rodillas) {
    const parsed = parseReps(reps);
    let penalty = 1;
    if (rodillas === 'Y') {
        penalty = GOMA_PENALTY['RODILLAS'];
    } else if (gomaCode && GOMA_PENALTY[gomaCode]) {
        penalty = GOMA_PENALTY[gomaCode];
    }
    return parsed.value * penalty;
}

// Calculate improvement percentage for a user
function calculateUserImprovement(userSessions, userName) {
    const exerciseHistory = {};

    userSessions.forEach(session => {
        session.exercises.forEach(ex => {
            const exName = normalizeExerciseName(ex.exercise);
            const userResult = ex.results.find(r => normalizePersonName(r.person) === userName);

            if (userResult) {
                if (!exerciseHistory[exName]) exerciseHistory[exName] = [];
                exerciseHistory[exName].push({
                    date: session.date,
                    normalized: getNormalizedReps(userResult.reps, userResult.goma, userResult.rodillas)
                });
            }
        });
    });

    let totalImprovement = 0;
    let exerciseCount = 0;

    Object.entries(exerciseHistory).forEach(([name, history]) => {
        if (history.length < 2) return;

        // Sort by date to get earliest and latest
        history.sort((a, b) => new Date(a.date) - new Date(b.date));

        const first = history[0].normalized;
        const last = history[history.length - 1].normalized;

        if (first > 0) {
            const imp = (last / first) - 1;
            totalImprovement += imp;
            exerciseCount++;
        }
    });

    return exerciseCount > 0 ? (totalImprovement / exerciseCount) * 100 : 0;
}

// =====================================================================
// Enhancements (PRs, clean-equiv, streaks, percentile, goals, tips, etc.)
// =====================================================================

// Goma progression ladder (most assistance -> none). Used in roadmap UI.
const GOMA_LADDER = ['VN', 'VRo', 'V', 'MR', 'M', 'RN', 'N', 'R', 'A', ''];

// Static exercise tips. Keys are normalized exercise names (lowercase).
const EXERCISE_TIPS = {
    'dominada prona': {
        cues: [
            'Pulgares por encima de la barra y agarre activo desde el primer rep.',
            'Inicia con escápulas: hombros abajo y atrás antes de tirar.',
            'Sube con el pecho hacia la barra, no con la barbilla.'
        ],
        common: 'Balanceo y kipping involuntario por falta de tensión en core.',
        videoId: 'eGo4IYlbE5g'
    },
    'dominada supino': {
        cues: [
            'Codos pegados al cuerpo durante toda la subida.',
            'Mantén el pecho alto y aprieta el glúteo para evitar arquear.',
            'Bajada controlada hasta extensión completa.'
        ],
        common: 'Acortar el rango por arriba; debes rozar la barra con el pecho.',
        videoId: 'brhRXlOhsAM'
    },
    'remo australiano': {
        cues: [
            'Cuerpo recto: línea hombros-cadera-talones.',
            'Tira llevando el esternón hacia la barra.',
            'Aprieta omóplatos al final del movimiento.'
        ],
        common: 'Cadera caída; rompe la línea recta y reduce eficacia.',
        videoId: 'KqRJsP8j-2k'
    },
    'remo neutro': {
        cues: [
            'Codos cerca del torso, no abiertos.',
            'Fija escápulas antes de cada repetición.',
            'Mantén la cabeza neutra mirando al suelo.'
        ],
        common: 'Encoger los hombros hacia las orejas en vez de bajarlos.',
        videoId: 'KqRJsP8j-2k'
    },
    'flexiones diamante': {
        cues: [
            'Pulgares e índices formando un diamante bajo el esternón.',
            'Codos pegados al cuerpo durante la bajada.',
            'Cuerpo en plancha rígida; nada de cadera caída.'
        ],
        common: 'Abrir los codos hacia los lados pierde el énfasis en tríceps.',
        videoId: 'J0DnG1_S92I'
    },
    'flexiones militares': {
        cues: [
            'Manos a la altura de los hombros, cuerpo totalmente alineado.',
            'Codos a 45° aprox., no totalmente pegados ni abiertos.',
            'Bajada hasta rozar el suelo con el pecho.'
        ],
        common: 'No completar el rango; el pecho debe llegar al suelo.',
        videoId: 'IODxDxX7oi4'
    },
    'fondos': {
        cues: [
            'Hombros abajo y atrás durante todo el ejercicio.',
            'Inclínate ligeramente hacia delante para implicar pectoral.',
            'Bajada hasta que el hombro quede por debajo del codo.'
        ],
        common: 'Subir el cuello/hombros y perder la posición escapular.',
        videoId: '2z8JmcrW-As'
    },
    'fondos triceps (sbd)': {
        cues: [
            'Cuerpo vertical y codos apuntando atrás durante toda la repetición.',
            'Bajada controlada sin perder la verticalidad.',
            'Bloqueo final firme arriba sin encoger hombros.'
        ],
        common: 'Inclinarse hacia delante convierte el ejercicio en pectoral.',
        videoId: '6kALZikXxLc'
    }
};

function getExerciseTip(exerciseName) {
    const key = stripDiacritics((exerciseName || '').toLowerCase().trim());
    return EXERCISE_TIPS[key] || null;
}

// Personal records per exercise. Returns: clean PR, assisted PR, last PR date,
// days since PR, whether the PR was achieved in the latest session.
function getPersonalRecords(userData) {
    const todayStr = new Date().toISOString().slice(0, 10);
    const result = [];

    Object.values(userData.exercises).forEach(ex => {
        let cleanPR = null; // {reps, date}
        let assistedPR = null; // {reps, date, goma, rodillas}
        ex.history.forEach(h => {
            const isClean = !h.goma && h.rodillas !== 'Y';
            if (isClean) {
                if (!cleanPR || h.reps > cleanPR.reps ||
                    (h.reps === cleanPR.reps && h.date > cleanPR.date)) {
                    cleanPR = { reps: h.reps, date: h.date };
                }
            } else {
                const candidateLevel = getAssistanceLevel(h.goma, h.rodillas);
                const currentLevel = assistedPR ? getAssistanceLevel(assistedPR.goma, assistedPR.rodillas) : 999;
                // "Better" assisted PR = lower assistance level OR same level but more reps
                if (!assistedPR ||
                    candidateLevel < currentLevel ||
                    (candidateLevel === currentLevel && h.reps > assistedPR.reps)) {
                    assistedPR = {
                        reps: h.reps, date: h.date,
                        goma: h.goma || null, rodillas: h.rodillas || null
                    };
                }
            }
        });

        const sortedHistory = [...ex.history].sort((a, b) => new Date(a.date) - new Date(b.date));
        const lastEntry = sortedHistory[sortedHistory.length - 1];
        const isLatest = (cleanPR && lastEntry.date === cleanPR.date && !lastEntry.goma && lastEntry.rodillas !== 'Y') ||
            (assistedPR && lastEntry.date === assistedPR.date);

        const referenceDate = (cleanPR && cleanPR.date) || (assistedPR && assistedPR.date);
        const daysSince = referenceDate
            ? Math.floor((new Date(todayStr) - new Date(referenceDate)) / (1000 * 60 * 60 * 24))
            : null;

        result.push({
            exercise: ex.name,
            cleanPR,
            assistedPR,
            daysSincePR: daysSince,
            isLatestSessionPR: isLatest
        });
    });

    return result.sort((a, b) => {
        const aBest = (a.cleanPR && a.cleanPR.reps) || (a.assistedPR && a.assistedPR.reps) || 0;
        const bBest = (b.cleanPR && b.cleanPR.reps) || (b.assistedPR && b.assistedPR.reps) || 0;
        return bBest - aBest;
    });
}

// Per-exercise clean-equivalent progression (date -> normalized reps).
function getCleanEquivHistory(userData) {
    const out = {};
    Object.values(userData.exercises).forEach(ex => {
        out[ex.name] = ex.history
            .map(h => ({
                date: h.date,
                value: getNormalizedReps(h.reps, h.goma, h.rodillas),
                raw: h.reps,
                goma: h.goma, rodillas: h.rodillas
            }))
            .sort((a, b) => new Date(a.date) - new Date(b.date));
    });
    return out;
}

// Attendance: streaks and a 12-week heatmap of session counts.
function getAttendanceData(userData) {
    const sessionDates = [...new Set(userData.sessions.map(s => s.date))]
        .sort((a, b) => new Date(a) - new Date(b));
    if (sessionDates.length === 0) {
        return { current: 0, longest: 0, totalDays: 0, calendar: [], firstDate: null };
    }

    // Streaks based on weekly attendance (≥1 session in a calendar week = on)
    const weekKey = (d) => {
        const date = new Date(d);
        const day = date.getUTCDay() || 7; // Mon=1..Sun=7
        date.setUTCDate(date.getUTCDate() + 4 - day);
        const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
        const weekNum = Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
        return date.getUTCFullYear() + '-W' + String(weekNum).padStart(2, '0');
    };

    const weeksWithSession = new Set(sessionDates.map(weekKey));
    const sortedWeeks = [...weeksWithSession].sort();
    let longest = 0, run = 0, prev = null;
    const advanceWeek = (w) => {
        const [y, wk] = w.split('-W');
        let year = parseInt(y), num = parseInt(wk) + 1;
        return year + '-W' + String(num).padStart(2, '0');
    };
    sortedWeeks.forEach(w => {
        if (prev && advanceWeek(prev) === w) run++;
        else run = 1;
        if (run > longest) longest = run;
        prev = w;
    });

    // Current streak = consecutive recent weeks ending in either current week or prior
    const today = new Date();
    const currentWeek = weekKey(today.toISOString().slice(0, 10));
    let current = 0;
    let cursor = currentWeek;
    if (!weeksWithSession.has(cursor)) {
        const [y, wk] = cursor.split('-W');
        cursor = parseInt(y) + '-W' + String(parseInt(wk) - 1).padStart(2, '0');
    }
    while (weeksWithSession.has(cursor)) {
        current++;
        const [y, wk] = cursor.split('-W');
        const num = parseInt(wk) - 1;
        cursor = num <= 0 ? null : parseInt(y) + '-W' + String(num).padStart(2, '0');
        if (!cursor) break;
    }

    // Build 12-week heatmap (most recent at right). Rows = weekday (Mon..Sun).
    const counts = {};
    sessionDates.forEach(d => { counts[d] = (counts[d] || 0) + 1; });
    const cal = [];
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const startDay = start.getDay() || 7; // Mon=1..Sun=7
    start.setDate(start.getDate() - (startDay - 1) - 7 * 11); // 12 weeks back, monday
    for (let w = 0; w < 12; w++) {
        const week = [];
        for (let d = 0; d < 7; d++) {
            const cell = new Date(start);
            cell.setDate(start.getDate() + w * 7 + d);
            const key = cell.toISOString().slice(0, 10);
            week.push({ date: key, count: counts[key] || 0 });
        }
        cal.push(week);
    }

    return {
        current,
        longest,
        totalDays: sessionDates.length,
        calendar: cal,
        firstDate: sessionDates[0]
    };
}

// Cohort percentile: among athletes who attend the same primary time slot,
// what is the user's percentile in clean-equivalent reps for each exercise?
function getCohortPercentiles(allSessions, userName) {
    // Determine user's primary time slot (most frequent)
    const timeCounts = {};
    allSessions.forEach(s => {
        const wasThere = s.exercises.some(ex =>
            ex.results.some(r => normalizePersonName(r.person) === userName));
        if (wasThere) timeCounts[s.time] = (timeCounts[s.time] || 0) + 1;
    });
    const primaryTime = Object.entries(timeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
    if (!primaryTime) return { primaryTime: null, exercises: {} };

    // For each exercise: max clean-equiv per athlete in that time slot
    const cohortMaxes = {};
    allSessions.filter(s => s.time === primaryTime).forEach(s => {
        s.exercises.forEach(ex => {
            const exName = normalizeExerciseName(ex.exercise);
            if (!cohortMaxes[exName]) cohortMaxes[exName] = {};
            ex.results.forEach(r => {
                const p = normalizePersonName(r.person);
                const v = getNormalizedReps(r.reps, r.goma, r.rodillas);
                if (!cohortMaxes[exName][p] || cohortMaxes[exName][p] < v) {
                    cohortMaxes[exName][p] = v;
                }
            });
        });
    });

    const out = {};
    Object.entries(cohortMaxes).forEach(([exName, peopleMap]) => {
        const userValue = peopleMap[userName];
        if (userValue == null) return;
        const all = Object.values(peopleMap);
        const better = all.filter(v => v > userValue).length;
        const total = all.length;
        const percentile = total <= 1 ? 100 : Math.round(100 * (1 - better / total));
        out[exName] = {
            percentile,
            cohortSize: total,
            userValue: Math.round(userValue * 10) / 10,
            cohortMax: Math.max(...all)
        };
    });

    return { primaryTime, exercises: out };
}

// Disambiguated improvement: rep-based vs assistance-drop-based.
function calculateUserImprovementBreakdown(userSessions, userName) {
    const exerciseHistory = {};
    userSessions.forEach(session => {
        session.exercises.forEach(ex => {
            const exName = normalizeExerciseName(ex.exercise);
            const userResult = ex.results.find(r => normalizePersonName(r.person) === userName);
            if (userResult) {
                if (!exerciseHistory[exName]) exerciseHistory[exName] = [];
                exerciseHistory[exName].push({
                    date: session.date,
                    reps: parseReps(userResult.reps).value,
                    normalized: getNormalizedReps(userResult.reps, userResult.goma, userResult.rodillas),
                    level: getAssistanceLevel(userResult.goma, userResult.rodillas)
                });
            }
        });
    });

    let cleanGain = 0, cleanCount = 0, assistDrop = 0, assistCount = 0;
    Object.values(exerciseHistory).forEach(history => {
        if (history.length < 2) return;
        history.sort((a, b) => new Date(a.date) - new Date(b.date));
        const first = history[0], last = history[history.length - 1];
        if (first.normalized > 0) {
            cleanGain += (last.normalized / first.normalized) - 1;
            cleanCount++;
        }
        if (first.level !== last.level) {
            assistDrop += (first.level - last.level); // positive when reduced
            assistCount++;
        }
    });

    const cleanEquivPct = cleanCount > 0 ? (cleanGain / cleanCount) * 100 : 0;
    const avgAssistDrop = assistCount > 0 ? assistDrop / assistCount : 0;
    return { cleanEquivPct, avgAssistDrop, exercises: exerciseHistory };
}

// Goal storage (per user, in localStorage with optional GitHub sync to goals.json).
//
// Storage model:
//   - Local cache: localStorage["cv_goals:<name>"] = [goal, ...]
//   - Remote file: goals.json = { version: 1, users: { "<name>": [goal,...] } }
//   - Each goal has updatedAt; merges keep the newest version per id.
//   - Tombstones (deletedAt) propagate deletions during the merge.
//
// Sync trust model: the same obfuscated GitHub token used by admin.js is
// reused here; that token is already public on the static site, so we are
// not lowering the trust bar.
const GOALS_STORAGE_KEY = (name) => `cv_goals:${normalizePersonName(name)}`;
const GOALS_REMOTE_CACHE_KEY = 'cv_goals_remote_v1';

const SYNC_CONFIG = {
    owner: 'jbelzarena',
    repo: 'calistenia-toma-marcas',
    filePath: 'goals.json',
    branch: 'main',
    obfuscatedToken: 'RElrZWQzM01oVm13UWdzZ1R4QnZKZ0pzSkc3RmZJdVJHU0NGX3BoZw=='
};

function _syncToken() {
    try { return atob(SYNC_CONFIG.obfuscatedToken).split('').reverse().join(''); }
    catch (e) { return null; }
}

function _nowISO() { return new Date().toISOString(); }

function getGoals(userName) {
    try {
        const goals = JSON.parse(localStorage.getItem(GOALS_STORAGE_KEY(userName)) || '[]');
        // Hide tombstones from the UI
        return goals.filter(g => !g.deletedAt);
    } catch (e) {
        return [];
    }
}

function _getRawGoals(userName) {
    try {
        return JSON.parse(localStorage.getItem(GOALS_STORAGE_KEY(userName)) || '[]');
    } catch (e) {
        return [];
    }
}

function saveGoals(userName, goals) {
    localStorage.setItem(GOALS_STORAGE_KEY(userName), JSON.stringify(goals));
    scheduleGoalsSync(userName);
}

function addGoal(userName, goal) {
    const goals = _getRawGoals(userName);
    goals.push({
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        createdAt: new Date().toISOString().slice(0, 10),
        updatedAt: _nowISO(),
        ...goal
    });
    saveGoals(userName, goals);
    return goals.filter(g => !g.deletedAt);
}

function removeGoal(userName, id) {
    const goals = _getRawGoals(userName).map(g =>
        g.id === id ? { ...g, deletedAt: _nowISO(), updatedAt: _nowISO() } : g);
    saveGoals(userName, goals);
    return goals.filter(g => !g.deletedAt);
}

function evaluateGoal(goal, userData) {
    const ex = userData.exercises[goal.exercise];
    if (!ex) return { current: 0, progress: 0, achieved: false };
    let current = 0;
    if (goal.type === 'clean') {
        const cleans = ex.history.filter(h => !h.goma && h.rodillas !== 'Y').map(h => h.reps);
        current = cleans.length ? Math.max(...cleans) : 0;
    } else {
        current = ex.max || 0;
    }
    const progress = goal.target > 0 ? Math.min(100, (current / goal.target) * 100) : 0;
    return { current, progress, achieved: current >= goal.target };
}

// ---------- Goals sync (background, debounced) ----------

let _syncTimer = null;
let _syncInFlight = false;
let _syncQueuedUser = null;

const SYNC_LISTENERS = new Set();
function onGoalsSyncStatus(cb) {
    SYNC_LISTENERS.add(cb);
    return () => SYNC_LISTENERS.delete(cb);
}
function _emitSync(status) {
    SYNC_LISTENERS.forEach(cb => { try { cb(status); } catch (e) { } });
}

function scheduleGoalsSync(userName) {
    _syncQueuedUser = userName;
    if (_syncTimer) clearTimeout(_syncTimer);
    _syncTimer = setTimeout(() => syncGoalsNow(userName).catch(() => { }), 1500);
}

async function fetchRemoteGoals() {
    try {
        const r = await fetch(`goals.json?_=${Date.now()}`, { cache: 'no-store' });
        if (!r.ok) throw new Error('remote-miss');
        const json = await r.json();
        localStorage.setItem(GOALS_REMOTE_CACHE_KEY, JSON.stringify({ at: _nowISO(), data: json }));
        return json;
    } catch (e) {
        try {
            const cached = JSON.parse(localStorage.getItem(GOALS_REMOTE_CACHE_KEY) || 'null');
            if (cached && cached.data) return cached.data;
        } catch (_) { }
        return { version: 1, users: {} };
    }
}

function _mergeUserGoals(localList, remoteList) {
    const byId = new Map();
    [...(remoteList || []), ...(localList || [])].forEach(g => {
        if (!g || !g.id) return;
        const prev = byId.get(g.id);
        if (!prev) { byId.set(g.id, g); return; }
        const prevTs = prev.updatedAt || prev.createdAt || '';
        const curTs = g.updatedAt || g.createdAt || '';
        if (curTs > prevTs) byId.set(g.id, g);
    });
    return Array.from(byId.values());
}

async function pullAndMergeGoals(userName) {
    const remote = await fetchRemoteGoals();
    const remoteUserGoals = (remote.users && remote.users[userName]) || [];
    const localGoals = _getRawGoals(userName);
    const merged = _mergeUserGoals(localGoals, remoteUserGoals);
    localStorage.setItem(GOALS_STORAGE_KEY(userName), JSON.stringify(merged));
    return merged.filter(g => !g.deletedAt);
}

async function syncGoalsNow(userName) {
    if (_syncInFlight) {
        _syncQueuedUser = userName;
        return;
    }
    _syncInFlight = true;
    _emitSync({ state: 'syncing' });
    try {
        const token = _syncToken();
        if (!token) throw new Error('No token');

        // 1. Get current remote file (sha + content)
        const getRes = await fetch(
            `https://api.github.com/repos/${SYNC_CONFIG.owner}/${SYNC_CONFIG.repo}/contents/${SYNC_CONFIG.filePath}?ref=${SYNC_CONFIG.branch}`,
            { headers: { Authorization: `token ${token}`, Accept: 'application/vnd.github.v3+json' } }
        );

        let sha = null;
        let remote = { version: 1, users: {} };
        if (getRes.ok) {
            const fileData = await getRes.json();
            sha = fileData.sha;
            try {
                remote = JSON.parse(decodeURIComponent(escape(atob(fileData.content.replace(/\s/g, '')))));
                if (!remote.users) remote.users = {};
            } catch (_) { remote = { version: 1, users: {} }; }
        } else if (getRes.status !== 404) {
            throw new Error(`GET goals.json: ${getRes.status}`);
        }

        // 2. Merge user's local goals into remote
        const localGoals = _getRawGoals(userName);
        const remoteUserGoals = remote.users[userName] || [];
        const merged = _mergeUserGoals(localGoals, remoteUserGoals);
        remote.users[userName] = merged;
        // Keep local in sync with merged result
        localStorage.setItem(GOALS_STORAGE_KEY(userName), JSON.stringify(merged));

        // 3. Push back
        const newContent = btoa(unescape(encodeURIComponent(JSON.stringify(remote, null, 2))));
        const putRes = await fetch(
            `https://api.github.com/repos/${SYNC_CONFIG.owner}/${SYNC_CONFIG.repo}/contents/${SYNC_CONFIG.filePath}`,
            {
                method: 'PUT',
                headers: {
                    Authorization: `token ${token}`,
                    Accept: 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: `Update goals.json - ${userName} - ${_nowISO()}`,
                    content: newContent,
                    branch: SYNC_CONFIG.branch,
                    ...(sha ? { sha } : {})
                })
            }
        );
        if (!putRes.ok) {
            const err = await putRes.json().catch(() => ({}));
            throw new Error(err.message || `PUT failed: ${putRes.status}`);
        }
        localStorage.setItem(GOALS_REMOTE_CACHE_KEY, JSON.stringify({ at: _nowISO(), data: remote }));
        _emitSync({ state: 'ok', at: _nowISO() });
    } catch (e) {
        _emitSync({ state: 'error', message: e.message || String(e) });
    } finally {
        _syncInFlight = false;
        if (_syncQueuedUser && _syncQueuedUser !== userName) {
            const next = _syncQueuedUser;
            _syncQueuedUser = null;
            setTimeout(() => syncGoalsNow(next).catch(() => { }), 500);
        }
    }
}

// Theme handling (light / dark; default = dark to keep current look).
const THEME_KEY = 'cv_theme';
function getTheme() {
    return localStorage.getItem(THEME_KEY) || 'dark';
}
function applyTheme(theme) {
    document.body.classList.toggle('theme-light', theme === 'light');
    localStorage.setItem(THEME_KEY, theme);
}
function toggleTheme() {
    applyTheme(getTheme() === 'light' ? 'dark' : 'light');
}

// Generate a shareable PNG card for an athlete (returns dataURL).
async function generateProfileCardImage(userData, achievements) {
    const W = 1080, H = 1080;
    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, '#0a1628');
    grad.addColorStop(1, '#1a2940');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Accent ring
    ctx.strokeStyle = '#1abc9c';
    ctx.lineWidth = 6;
    ctx.strokeRect(40, 40, W - 80, H - 80);

    // Brand
    ctx.fillStyle = '#1abc9c';
    ctx.font = 'bold 54px Segoe UI, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('CALISTENIA VALENCIA', W / 2, 130);

    // Avatar (circle)
    const avatarSize = 220;
    const avatarX = W / 2 - avatarSize / 2;
    const avatarY = 180;
    const drawCircle = (img) => {
        ctx.save();
        ctx.beginPath();
        ctx.arc(W / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        if (img) {
            ctx.drawImage(img, avatarX, avatarY, avatarSize, avatarSize);
        } else {
            ctx.fillStyle = '#16a085';
            ctx.fillRect(avatarX, avatarY, avatarSize, avatarSize);
            ctx.fillStyle = '#0a1628';
            ctx.font = 'bold 130px Segoe UI, sans-serif';
            ctx.textBaseline = 'middle';
            ctx.fillText((userData.name || '?').charAt(0).toUpperCase(),
                W / 2, avatarY + avatarSize / 2);
            ctx.textBaseline = 'alphabetic';
        }
        ctx.restore();
        ctx.beginPath();
        ctx.arc(W / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
        ctx.lineWidth = 8;
        ctx.strokeStyle = '#1abc9c';
        ctx.stroke();
    };

    const photoUrl = getPhotoUrl(userData.name);
    await new Promise((resolve) => {
        if (!photoUrl) { drawCircle(null); resolve(); return; }
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => { drawCircle(img); resolve(); };
        img.onerror = () => { drawCircle(null); resolve(); };
        img.src = photoUrl;
    });

    // Name
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 64px Segoe UI, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(userData.name, W / 2, avatarY + avatarSize + 80);

    // Top stats row
    const statsY = avatarY + avatarSize + 140;
    const stats = [
        { label: 'Sesiones', value: userData.totalSessions },
        { label: 'Total reps', value: userData.totalReps },
        { label: 'Récord máx.', value: userData.maxRecord }
    ];
    stats.forEach((s, i) => {
        const x = (W / (stats.length + 1)) * (i + 1);
        ctx.fillStyle = '#1abc9c';
        ctx.font = 'bold 72px Segoe UI, sans-serif';
        ctx.fillText(String(s.value), x, statsY + 60);
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.font = '28px Segoe UI, sans-serif';
        ctx.fillText(s.label, x, statsY + 110);
    });

    // Top PRs
    const prs = getPersonalRecords(userData).slice(0, 3);
    let py = statsY + 200;
    ctx.fillStyle = '#f1c40f';
    ctx.font = 'bold 38px Segoe UI, sans-serif';
    ctx.fillText('Mejores marcas', W / 2, py);
    py += 60;
    ctx.font = '34px Segoe UI, sans-serif';
    prs.forEach(pr => {
        const reps = (pr.cleanPR && pr.cleanPR.reps) || (pr.assistedPR && pr.assistedPR.reps) || 0;
        const tag = pr.cleanPR ? 'limpio' : (pr.assistedPR ? `goma ${pr.assistedPR.goma || 'rodillas'}` : '');
        ctx.fillStyle = '#ffffff';
        ctx.fillText(`${pr.exercise} — ${reps} reps`, W / 2, py);
        if (tag) {
            ctx.fillStyle = 'rgba(255,255,255,0.5)';
            ctx.font = '24px Segoe UI, sans-serif';
            ctx.fillText(`(${tag})`, W / 2, py + 30);
            ctx.font = '34px Segoe UI, sans-serif';
        }
        py += 70;
    });

    // Achievements count footer
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = '28px Segoe UI, sans-serif';
    ctx.fillText(`${(achievements || []).length} logros desbloqueados`, W / 2, H - 90);
    ctx.fillStyle = '#1abc9c';
    ctx.font = 'bold 26px Segoe UI, sans-serif';
    ctx.fillText('calisteniavalencia.com', W / 2, H - 50);

    return canvas.toDataURL('image/png');
}

// Cache-busted fetch helper for data.json so admin updates show up.
async function fetchData() {
    const response = await fetch('data.json', { cache: 'no-store' });
    if (!response.ok) throw new Error('Failed to load data');
    return response.json();
}
