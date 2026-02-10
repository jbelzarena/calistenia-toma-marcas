let data = null;
let userName = '';
let selectedExercises = [];
let currentChartCategory = 'Todos';

// Register ChartDataLabels plugin globally
if (typeof ChartDataLabels !== 'undefined') {
    Chart.register(ChartDataLabels);
}

const ACHIEVEMENTS = [
    {
        id: 'constancy_1',
        title: 'Primeros Pasos',
        description: 'Completar 1 sesión de entrenamiento',
        icon: '🌱',
        condition: (data) => data.totalSessions >= 1,
        tier: 'bronze'
    },
    {
        id: 'constancy_5',
        title: 'Constancia',
        description: 'Completar 5 sesiones de entrenamiento',
        icon: '🔥',
        condition: (data) => data.totalSessions >= 5,
        tier: 'silver'
    },
    {
        id: 'constancy_10',
        title: 'Veterano',
        description: 'Completar 10 sesiones de entrenamiento',
        icon: '👑',
        condition: (data) => data.totalSessions >= 10,
        tier: 'gold'
    },
    {
        id: 'strength_15',
        title: 'Fuerte',
        description: 'Realizar 15 repeticiones sin asistencia',
        icon: '💪',
        condition: (data) => Object.values(data.exercises).some(e => e.history.some(h => h.reps >= 15 && !h.goma && !h.rodillas)),
        tier: 'bronze'
    },
    {
        id: 'strength_25',
        title: 'Bestia',
        description: 'Realizar 25 repeticiones sin asistencia',
        icon: '🦍',
        condition: (data) => Object.values(data.exercises).some(e => e.history.some(h => h.reps >= 25 && !h.goma && !h.rodillas)),
        tier: 'silver'
    },
    {
        id: 'strength_40',
        title: 'Leyenda',
        description: 'Realizar 40 repeticiones sin asistencia',
        icon: '⚡',
        condition: (data) => Object.values(data.exercises).some(e => e.history.some(h => h.reps >= 40 && !h.goma && !h.rodillas)),
        tier: 'gold'
    },
    {
        id: 'strength_60',
        title: 'Titán',
        description: 'Realizar 60 repeticiones sin asistencia',
        icon: '🔱',
        condition: (data) => Object.values(data.exercises).some(e => e.history.some(h => h.reps >= 60 && !h.goma && !h.rodillas)),
        tier: 'platinum'
    },
    {
        id: 'strength_80',
        title: 'Inmortal',
        description: 'Realizar 80 repeticiones sin asistencia',
        icon: '🌌',
        condition: (data) => Object.values(data.exercises).some(e => e.history.some(h => h.reps >= 80 && !h.goma && !h.rodillas)),
        tier: 'platinum'
    },
    {
        id: 'strength_100',
        title: 'Semidiós',
        description: 'Realizar 100 repeticiones sin asistencia',
        icon: '🪐',
        condition: (data) => Object.values(data.exercises).some(e => e.history.some(h => h.reps >= 100 && !h.goma && !h.rodillas)),
        tier: 'diamond'
    },
    {
        id: 'strength_150',
        title: 'Vanguardia',
        description: 'Realizar 150 repeticiones sin asistencia',
        icon: '💠',
        condition: (data) => Object.values(data.exercises).some(e => e.history.some(h => h.reps >= 150 && !h.goma && !h.rodillas)),
        tier: 'diamond'
    },
    {
        id: 'strength_200',
        title: 'SALVA mode',
        description: 'Realizar 200 repeticiones sin asistencia',
        icon: '💎',
        condition: (data) => Object.values(data.exercises).some(e => e.history.some(h => h.reps >= 200 && !h.goma && !h.rodillas)),
        tier: 'salva-mode'
    },
    {
        id: 'assisted_15',
        title: 'Impulso',
        description: 'Realizar 15 repeticiones con asistencia',
        icon: '🦘',
        condition: (data) => Object.values(data.exercises).some(e => e.history.some(h => h.reps >= 15 && (h.goma || h.rodillas))),
        tier: 'bronze'
    },
    {
        id: 'assisted_25',
        title: 'Propulsión',
        description: 'Realizar 25 repeticiones con asistencia',
        icon: '🚀',
        condition: (data) => Object.values(data.exercises).some(e => e.history.some(h => h.reps >= 25 && (h.goma || h.rodillas))),
        tier: 'silver'
    },
    {
        id: 'assisted_40',
        title: 'Gravedad Zero',
        description: 'Realizar 40 repeticiones con asistencia',
        icon: '👩‍🚀',
        condition: (data) => Object.values(data.exercises).some(e => e.history.some(h => h.reps >= 40 && (h.goma || h.rodillas))),
        tier: 'gold'
    },
    {
        id: 'purist',
        title: 'Purista',
        description: 'Entrenar sin gomas elástica en una sesión completa',
        icon: '🛡️',
        condition: (data) => data.sessions.some(session => session.exercises.every(ex => !ex.goma && !ex.rodillas)),
        tier: 'gold'
    }
];

function getAchievements(userData) {
    return ACHIEVEMENTS.filter(achievement => achievement.condition(userData));
}

function getNextChallenges(userData) {
    const challenges = [];
    const unlocked = getAchievements(userData).map(a => a.id);

    // Constancia
    const sessionLevels = [
        { id: 'constancy_1', goal: 1 },
        { id: 'constancy_5', goal: 5 },
        { id: 'constancy_10', goal: 10 }
    ];
    const nextSession = sessionLevels.find(l => !unlocked.includes(l.id));
    if (nextSession) {
        challenges.push({
            title: 'Hábito y Constancia',
            subtitle: `Siguiente: ${nextSession.goal} sesiones`,
            progress: (userData.totalSessions / nextSession.goal) * 100,
            current: userData.totalSessions,
            goal: nextSession.goal,
            icon: '📅'
        });
    }

    // Fuerza (Máximo clean)
    const strengthLevels = [
        { id: 'strength_15', goal: 15 },
        { id: 'strength_25', goal: 25 },
        { id: 'strength_40', goal: 40 },
        { id: 'strength_60', goal: 60 },
        { id: 'strength_80', goal: 80 },
        { id: 'strength_100', goal: 100 },
        { id: 'strength_150', goal: 150 },
        { id: 'strength_200', goal: 200 }
    ];
    const nextStrength = strengthLevels.find(l => !unlocked.includes(l.id));
    const maxClean = Math.max(...Object.values(userData.exercises).map(e => {
        const cleanHistory = e.history.filter(h => !h.goma && !h.rodillas);
        return cleanHistory.length > 0 ? Math.max(...cleanHistory.map(h => h.reps)) : 0;
    }), 0);

    if (nextStrength) {
        challenges.push({
            title: 'Fuerza Pura',
            subtitle: `Siguiente: ${nextStrength.goal} reps sin asistencia`,
            progress: (maxClean / nextStrength.goal) * 100,
            current: maxClean,
            goal: nextStrength.goal,
            icon: '💪'
        });
    }

    // Fuerza Asistida (solo si no es purista)
    const isCleanAthlete = Object.values(userData.exercises).every(e =>
        e.history.every(h => !h.goma && !h.rodillas)
    );

    if (!isCleanAthlete) {
        const assistedLevels = [
            { id: 'assisted_15', goal: 15 },
            { id: 'assisted_25', goal: 25 },
            { id: 'assisted_40', goal: 40 }
        ];
        const nextAssisted = assistedLevels.find(l => !unlocked.includes(l.id));
        const maxAssisted = Math.max(...Object.values(userData.exercises).map(e => e.max), 0);
        if (nextAssisted) {
            challenges.push({
                title: 'Fuerza Asistida',
                subtitle: `Siguiente: ${nextAssisted.goal} reps con asistencia`,
                progress: (maxAssisted / nextAssisted.goal) * 100,
                current: maxAssisted,
                goal: nextAssisted.goal,
                icon: '🚀'
            });
        }
    }

    return challenges;
}

async function loadData() {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        userName = normalizePersonName(urlParams.get('name'));

        if (!userName) {
            window.location.href = 'index.html';
            return;
        }

        const response = await fetch('data.json');
        if (!response.ok) throw new Error('Failed to load data');
        data = await response.json();
        displayUserProfile();
    } catch (error) {
        console.error('Error loading data:', error);
        document.getElementById('user-container').innerHTML = `<div class="error-screen"><h2>Error</h2><p>${error.message}</p></div>`;
    }
}

function getUserData() {
    const userData = {
        name: userName,
        sessions: [],
        exercises: {},
        totalSessions: 0,
        totalReps: 0,
        maxRecord: 0,
        minRecord: Infinity
    };

    data.sessions.forEach(session => {
        const sessionData = {
            date: session.date,
            time: session.time,
            category: session.category,
            exercises: []
        };

        session.exercises.forEach(exercise => {
            const normalizedExerciseName = normalizeExerciseName(exercise.exercise);
            const userResult = exercise.results.find(r => normalizePersonName(r.person) === userName);

            if (userResult) {
                const parsed = parseReps(userResult.reps);
                sessionData.exercises.push({
                    name: normalizedExerciseName,
                    reps: parsed.value,
                    modifier: parsed.modifier,
                    goma: userResult.goma || null,
                    rodillas: userResult.rodillas || null
                });

                if (!userData.exercises[normalizedExerciseName]) {
                    userData.exercises[normalizedExerciseName] = {
                        name: normalizedExerciseName,
                        history: [],
                        max: 0,
                        min: Infinity,
                        total: 0,
                        count: 0,
                        maxGoma: null,
                        maxRodillas: null
                    };
                }

                const exerciseData = userData.exercises[normalizedExerciseName];
                exerciseData.history.push({
                    date: session.date,
                    reps: parsed.value,
                    goma: userResult.goma || null,
                    rodillas: userResult.rodillas || null
                });

                exerciseData.total += parsed.value;
                exerciseData.count += 1;

                if (parsed.value > exerciseData.max) {
                    exerciseData.max = parsed.value;
                    exerciseData.maxGoma = userResult.goma || null;
                    exerciseData.maxRodillas = userResult.rodillas || null;
                    exerciseData.maxDate = session.date;
                }

                if (parsed.value < exerciseData.min) {
                    exerciseData.min = parsed.value;
                }

                userData.totalReps += parsed.value;
            }
        });

        if (sessionData.exercises.length > 0) {
            userData.sessions.push(sessionData);
            userData.totalSessions += 1;
        }
    });

    const maxes = Object.values(userData.exercises).map(e => e.max);
    if (maxes.length > 0) {
        userData.maxRecord = Math.max(...maxes);
        userData.minRecord = Math.min(...maxes);
    } else {
        userData.minRecord = 0;
    }

    Object.values(userData.exercises).forEach(exercise => {
        exercise.average = Math.round(exercise.total / exercise.count);
    });

    return userData;
}

function filterChartByCategory(category) {
    currentChartCategory = category;
    displayUserProfile();
}

function displayUserProfile() {
    const rawUserData = getUserData();
    const achievements = getAchievements(rawUserData);
    const challenges = getNextChallenges(rawUserData);

    const filteredExercises = Object.values(rawUserData.exercises).filter(e =>
        currentChartCategory === 'Todos' ||
        EXERCISE_CATEGORIES[e.name.toLowerCase()] === currentChartCategory
    );

    const filteredExerciseNames = filteredExercises.map(e => e.name);
    const filteredSessions = rawUserData.sessions.map(s => ({
        ...s,
        exercises: s.exercises.filter(ex => filteredExerciseNames.includes(ex.name))
    })).filter(s => s.exercises.length > 0);

    const container = document.getElementById('user-container');
    container.innerHTML = `
        <header>
            <div class="logo-container"><img src="logo.jpg" alt="Logo" class="logo" onerror="this.style.display='none'"></div>
            <a href="index.html" class="back-link">← Volver al ranking</a>
            <div class="user-header">
                <div class="user-avatar">${userName.charAt(0).toUpperCase()}</div>
                <h1 class="user-name">${userName}</h1>
            </div>
            <div class="user-stats">
                <div class="stat-card"><div class="stat-value">${rawUserData.totalSessions}</div><div class="stat-label">Sesiones</div></div>
                <div class="stat-card"><div class="stat-value">${rawUserData.totalReps}</div><div class="stat-label">Total Reps</div></div>
                <div class="stat-card"><div class="stat-value">${rawUserData.maxRecord}</div><div class="stat-label">Récord Máx</div></div>
                <div class="stat-card"><div class="stat-value">${rawUserData.minRecord !== Infinity ? rawUserData.minRecord : 0}</div><div class="stat-label">Récord Mín</div></div>
            </div>
        </header>

        <div class="category-filters-container" style="margin: 30px 0; text-align: center;">
            <div class="category-filters">
                <button class="category-filter-btn ${currentChartCategory === 'Todos' ? 'active' : ''}" onclick="filterChartByCategory('Todos')">Todos</button>
                <button class="category-filter-btn ${currentChartCategory === 'Empuje' ? 'active' : ''}" onclick="filterChartByCategory('Empuje')">Empuje</button>
                <button class="category-filter-btn ${currentChartCategory === 'Tracción' ? 'active' : ''}" onclick="filterChartByCategory('Tracción')">Tracción</button>
            </div>
        </div>

        <div class="achievements-section">
            <h2>Logros Desbloqueados</h2>
            <div class="achievements-grid">
                ${achievements.map(a => `<div class="achievement-card ${a.tier}"><div class="achievement-icon">${a.icon}</div><div class="achievement-info"><h3>${a.title}</h3><p>${a.description}</p></div></div>`).join('')}
            </div>
        </div>

        <div class="next-challenges-section" style="margin: 40px 0;">
            <h2 style="color: #1abc9c; text-align: center; margin-bottom: 25px;">Próximos Retos</h2>
            <div class="challenges-grid-new" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;">
                ${challenges.map(c => `
                    <div class="challenge-card-new" style="background: rgba(26, 188, 156, 0.05); border: 2px solid rgba(26, 188, 156, 0.2); border-radius: 12px; padding: 20px; display: flex; align-items: center; gap: 20px;">
                        <div class="challenge-icon-new" style="background: rgba(26, 188, 156, 0.2); width: 50px; height: 50px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.8em;">${c.icon}</div>
                        <div style="flex: 1;">
                            <h3 style="margin: 0; color: #fff; font-size: 1.1em;">${c.title}</h3>
                            <p style="margin: 3px 0 10px 0; font-size: 0.85em; color: rgba(255, 255, 255, 0.7);">${c.subtitle}</p>
                            <div class="challenge-progress-bar" style="height: 8px; background: rgba(0,0,0,0.3); border-radius: 4px; overflow: hidden; position: relative;">
                                <div class="challenge-progress-fill" style="width: ${Math.min(c.progress, 100)}%; height: 100%; background: linear-gradient(90deg, #1abc9c, #16a085); border-radius: 4px; box-shadow: 0 0 10px rgba(26, 188, 156, 0.4);"></div>
                            </div>
                            <div style="display: flex; justify-content: space-between; margin-top: 8px; font-size: 0.8em; font-weight: bold; color: #1abc9c;">
                                <span>${c.current}</span>
                                <span>${c.goal}</span>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>

        <div class="chart-section card">
            <h2>Progresión en el Tiempo</h2>
            <p class="chart-subtitle">Resumen de avance por ejercicio</p>
            <div class="chart-container" style="height: 350px;"><canvas id="progressChart"></canvas></div>
        </div>

        <div class="chart-section card">
            <h2>Equilibrio del Atleta</h2>
            <p class="chart-subtitle">Comparativa de máximos obtenidos</p>
            <div class="radar-container" style="height: 350px;"><canvas id="radarChart"></canvas></div>
        </div>

        <div class="exercises-section">
            <h2>Estadísticas por Ejercicio</h2>
            <div class="exercises-grid">
                ${filteredExercises.sort((a, b) => b.max - a.max).map(ex => {
        const first = ex.history[0].reps;
        const last = ex.history[ex.history.length - 1].reps;
        const diff = last - first;
        const progressClass = diff > 0 ? 'positive' : diff < 0 ? 'negative' : 'neutral';
        return `
                        <div class="exercise-card">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
                                <h3>${ex.name}</h3>
                                <span style="font-size: 0.8em; opacity: 0.6;">${EXERCISE_CATEGORIES[ex.name.toLowerCase()] || ''}</span>
                            </div>
                            <div class="exercise-stats">
                                <div class="stat-row"><span>Récord</span><span class="stat-highlight">${ex.max}</span></div>
                                <div class="stat-row"><span>Mínimo Hist.</span><span>${ex.min !== Infinity ? ex.min : 0}</span></div>
                                <div class="stat-row"><span>Promedio</span><span>${ex.average}</span></div>
                                <div class="stat-row"><span>Total Reps</span><span>${ex.total}</span></div>
                                <div class="stat-row"><span>Progreso</span><span class="${progressClass}">${diff > 0 ? '+' : ''}${diff} reps</span></div>
                            </div>
                            <div class="mini-chart">
                                ${ex.history.slice(-10).map(h => `<div class="chart-bar" style="height: ${(h.reps / ex.max) * 100}%" title="${h.date}: ${h.reps}"></div>`).join('')}
                            </div>
                        </div>
                    `;
    }).join('')}
            </div>
        </div>

        <div class="session-history">
            <h2>Historial de Sesiones</h2>
            <div class="session-history-container">
                ${filteredSessions.slice().reverse().map(s => `
                    <div class="session-card-user">
                        <div class="session-header-user">
                            <p class="session-date-user">${new Date(s.date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                            <span class="session-category-user">${s.category}</span>
                        </div>
                        <div class="session-exercises-list">
                            ${s.exercises.map(ex => `
                                <div class="history-exercise-item">
                                    <span>${ex.name}</span>
                                    <span class="history-exercise-reps">${ex.reps}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;

    setTimeout(() => {
        renderChart(rawUserData, filteredExerciseNames);
        renderRadarChart(rawUserData, filteredExerciseNames);
    }, 100);
}

let chartInstance = null;
function renderChart(userData, exerciseNames) {
    if (!userData || !exerciseNames || exerciseNames.length === 0) {
        if (chartInstance) chartInstance.destroy();
        return;
    }

    const ctx = document.getElementById('progressChart').getContext('2d');
    const allDates = new Set();
    exerciseNames.forEach(name => {
        userData.exercises[name].history.forEach(h => allDates.add(h.date));
    });
    const sortedDates = Array.from(allDates).sort((a, b) => new Date(a) - new Date(b));

    const colors = ['#1abc9c', '#3498db', '#e74c3c', '#f39c12', '#9b59b6', '#2ecc71', '#e67e22'];
    const datasets = exerciseNames.slice(0, 7).map((name, i) => ({
        label: name,
        data: sortedDates.map(d => {
            const h = userData.exercises[name].history.find(entry => entry.date === d);
            return h ? h.reps : null;
        }),
        borderColor: colors[i % colors.length],
        backgroundColor: colors[i % colors.length],
        pointBackgroundColor: 'white',
        borderWidth: 2,
        tension: 0.3,
        spanGaps: true
    }));

    if (chartInstance) chartInstance.destroy();

    chartInstance = new Chart(ctx, {
        type: 'line',
        plugins: [ChartDataLabels],
        data: {
            labels: sortedDates.map(d => {
                const date = new Date(d);
                return `${date.getDate()}/${date.getMonth() + 1}`;
            }),
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(255,255,255,0.05)' },
                    ticks: { color: 'rgba(255,255,255,0.6)' }
                },
                x: {
                    grid: { color: 'rgba(255,255,255,0.05)' },
                    ticks: { color: 'rgba(255,255,255,0.6)' }
                }
            },
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: 'white', padding: 20, usePointStyle: true }
                },
                datalabels: {
                    display: (context) => context.dataset.data[context.dataIndex] !== null,
                    color: '#fff',
                    backgroundColor: (ctx) => ctx.dataset.borderColor,
                    borderRadius: 4,
                    font: { weight: 'bold', size: 10 },
                    padding: 4,
                    formatter: (value, context) => {
                        const date = sortedDates[context.dataIndex];
                        const d = new Date(date);
                        const shortDate = `${d.getDate()}/${d.getMonth() + 1}`;
                        return `${value}\n(${shortDate})`;
                    },
                    align: 'top',
                    offset: 8,
                    textAlign: 'center',
                    anchor: 'end',
                    opacity: 1,
                    clip: false
                },
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            const date = sortedDates[context.dataIndex];
                            return `${context.dataset.label}: ${context.raw} reps (${date})`;
                        }
                    }
                }
            }
        }
    });
}

function renderRadarChart(userData, exerciseNames) {
    if (!userData || !exerciseNames || exerciseNames.length === 0) {
        if (window.radarInstance) window.radarInstance.destroy();
        return;
    }
    const ctx = document.getElementById('radarChart').getContext('2d');
    const labels = exerciseNames.map(name => name);
    const dataValues = exerciseNames.map(name => userData.exercises[name].max);

    if (window.radarInstance) window.radarInstance.destroy();
    window.radarInstance = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Máximo',
                data: dataValues,
                backgroundColor: 'rgba(26, 188, 156, 0.2)',
                borderColor: '#1abc9c',
                borderWidth: 2,
                pointBackgroundColor: '#1abc9c'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                r: {
                    grid: { color: 'rgba(255,255,255,0.1)' },
                    angleLines: { color: 'rgba(255,255,255,0.1)' },
                    pointLabels: { color: 'white', font: { size: 12 } },
                    ticks: { display: false, count: 5 }
                }
            },
            plugins: { legend: { display: false } }
        }
    });
}

document.addEventListener('DOMContentLoaded', loadData);