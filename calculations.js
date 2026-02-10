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
    'RODILLAS': 0.4 // High assistance
};

// Parse reps string/number to object
function parseReps(reps) {
    if (typeof reps === 'number') return { value: reps, modifier: '' };
    const match = reps.toString().match(/^(\d+)([A-Z]?)$/);
    if (match) return { value: parseInt(match[1]), modifier: match[2] };
    return { value: 0, modifier: '' };
}

// Get HTML badge for assistance
function getAssistanceBadge(gomaCode, rodillas) {
    if (rodillas === 'Y') {
        return `<span class="goma-badge rodillas-badge" title="Rodillas">🦵</span>`;
    }
    if (!gomaCode || !GOMA_COLORS[gomaCode]) return '';
    const goma = GOMA_COLORS[gomaCode];
    return `<span class="goma-badge" style="background-color: ${goma.color};" title="Goma ${goma.name}">${goma.emoji}</span>`;
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
