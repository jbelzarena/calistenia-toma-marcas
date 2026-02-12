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
    'fondos tríceps (sbd)': 'Empuje'
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
