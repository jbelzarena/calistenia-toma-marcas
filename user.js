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

        data = await fetchData();
        buildPhotoIndex(data);
        applyTheme(getTheme());
        // Subscribe once to sync status updates so the badge keeps in sync.
        if (!window._syncBound) {
            window._syncBound = true;
            onGoalsSyncStatus(updateSyncBadge);
        }
        displayUserProfile();
        // Pull latest goals.json in the background, merge, and refresh once.
        pullAndMergeGoals(userName).then(() => displayUserProfile()).catch(() => { });
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
                        maxRodillas: null,
                        minGoma: null,
                        minRodillas: null
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
                    exerciseData.minGoma = userResult.goma || null;
                    exerciseData.minRodillas = userResult.rodillas || null;
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
    const personalRecords = getPersonalRecords(rawUserData);
    const cleanEquiv = getCleanEquivHistory(rawUserData);
    const attendance = getAttendanceData(rawUserData);
    const cohort = getCohortPercentiles(data.sessions, rawUserData.name);
    const goals = getGoals(rawUserData.name);
    const breakdown = calculateUserImprovementBreakdown(data.sessions, rawUserData.name);

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
            <div class="profile-actions">
                <a href="index.html" class="back-link" aria-label="Volver al ranking">← Volver al ranking</a>
                <div class="profile-actions-right">
                    <button type="button" class="icon-btn" id="theme-toggle" title="Cambiar tema" aria-label="Cambiar tema" onclick="toggleThemeAndRefresh()">${getTheme() === 'light' ? '☽' : '☀'}</button>
                    <button type="button" class="icon-btn" id="share-btn" title="Compartir tarjeta" aria-label="Compartir tarjeta" onclick="shareProfileCard()">📷 Compartir</button>
                </div>
            </div>
            <div class="user-header">
                ${getAvatarHTML(userName, 'user-avatar')}
                <h1 class="user-name">${userName}</h1>
                ${getBirthdayBanner(rawUserData)}
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

        ${renderPRsSection(personalRecords)}

        <div class="chart-section card">
            <h2>Progresión en el Tiempo</h2>
            <p class="chart-subtitle">Resumen de avance por ejercicio (reps brutas)</p>
            <div class="chart-container" style="height: 350px;"><canvas id="progressChart"></canvas></div>
        </div>

        <div class="chart-section card">
            <h2>Equivalencia Limpia</h2>
            <p class="chart-subtitle">Reps normalizadas según goma usada — progreso real al margen de la asistencia</p>
            <div class="chart-container" style="height: 320px;"><canvas id="cleanEquivChart"></canvas></div>
            ${renderImprovementBreakdown(breakdown)}
        </div>

        <div class="chart-section card">
            <h2>Equilibrio del Atleta</h2>
            <p class="chart-subtitle">Comparativa de máximos obtenidos</p>
            <div class="radar-container" style="height: 350px;"><canvas id="radarChart"></canvas></div>
        </div>

        ${renderAttendanceSection(attendance)}

        <div class="exercises-section">
            <h2>Estadísticas por Ejercicio</h2>
            <div class="exercises-grid">
                ${filteredExercises.sort((a, b) => b.max - a.max).map(ex => {
        const first = ex.history[0].reps;
        const last = ex.history[ex.history.length - 1].reps;
        const diff = last - first;
        const progressClass = diff > 0 ? 'positive' : diff < 0 ? 'negative' : 'neutral';
        const cohortInfo = cohort.exercises[ex.name];
        const tip = getExerciseTip(ex.name);
        return `
                        <div class="exercise-card">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
                                <h3>${ex.name}</h3>
                                <span style="font-size: 0.8em; opacity: 0.6;">${EXERCISE_CATEGORIES[ex.name.toLowerCase()] || ''}</span>
                            </div>
                            ${renderCohortBadge(cohortInfo, cohort.primaryTime)}
                            <div class="exercise-stats">
                                <div class="stat-row">
                                    <span>Récord</span>
                                    <span class="stat-highlight">
                                        ${ex.max} ${getAssistanceBadge(ex.maxGoma, ex.maxRodillas)}
                                    </span>
                                </div>
                                <div class="stat-row">
                                    <span>Mínimo Hist.</span>
                                    <span>
                                        ${ex.min !== Infinity ? ex.min : 0} ${getAssistanceBadge(ex.minGoma, ex.minRodillas)}
                                    </span>
                                </div>
                                <div class="stat-row"><span>Promedio</span><span>${ex.average}</span></div>
                                <div class="stat-row"><span>Total Reps</span><span>${ex.total}</span></div>
                                <div class="stat-row"><span>Progreso</span><span class="${progressClass}">${diff > 0 ? '+' : ''}${diff} reps</span></div>
                            </div>
                            ${renderGomaRoadmap(ex)}
                            <div class="mini-chart">
                                ${ex.history.slice(-10).map(h => `<div class="chart-bar" style="height: ${(h.reps / ex.max) * 100}%" title="${h.date}: ${h.reps} reps ${h.goma || h.rodillas === 'Y' ? '(' + (h.rodillas === 'Y' ? 'Rodillas' : 'Goma ' + h.goma) + ')' : ''}"></div>`).join('')}
                            </div>
                            ${tip ? `<details class="exercise-tip"><summary>💡 Técnica y consejos</summary>${renderExerciseTip(tip)}</details>` : ''}
                        </div>
                    `;
    }).join('')}
            </div>
        </div>

        ${renderGoalsSection(rawUserData, goals, cohort)}

        <div class="session-history">
            <h2>Historial de Sesiones</h2>
            <div class="session-history-container">
                ${filteredSessions.slice().reverse().map(s => `
                    <details class="session-card-user session-collapsible">
                        <summary class="session-header-user">
                            <p class="session-date-user">${new Date(s.date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                            <span class="session-category-user">${s.category}</span>
                            <span class="session-time-user" style="opacity:0.6;font-size:0.85em;">${s.time || ''}</span>
                        </summary>
                        <div class="session-exercises-list">
                            ${s.exercises.map(ex => `
                                <div class="history-exercise-item">
                                    <span>${ex.name}</span>
                                    <span class="history-exercise-reps">
                                        ${ex.reps} ${getAssistanceBadge(ex.goma, ex.rodillas)}
                                    </span>
                                </div>
                            `).join('')}
                        </div>
                    </details>
                `).join('')}
            </div>
        </div>
    `;

    setTimeout(() => {
        renderChart(rawUserData, filteredExerciseNames);
        renderRadarChart(rawUserData, filteredExerciseNames);
        renderCleanEquivChart(rawUserData, cleanEquiv, filteredExerciseNames);
    }, 100);
}

let chartInstance = null;

// Returns axis/grid/legend/datalabel colors that match the active theme.
function getChartTheme() {
    const isLight = getTheme() === 'light';
    return {
        text: isLight ? '#1a2940' : '#ffffff',
        textMuted: isLight ? 'rgba(10, 22, 40, 0.65)' : 'rgba(255, 255, 255, 0.6)',
        grid: isLight ? 'rgba(10, 22, 40, 0.08)' : 'rgba(255, 255, 255, 0.05)',
        gridStrong: isLight ? 'rgba(10, 22, 40, 0.12)' : 'rgba(255, 255, 255, 0.1)',
        point: isLight ? '#1a2940' : '#ffffff',
        labelBgFallback: isLight ? '#1a2940' : '#0a1628',
        labelText: '#ffffff'
    };
}

// Apply Chart.js global defaults so any unspecified field inherits theme colors.
function applyChartDefaults() {
    if (typeof Chart === 'undefined') return;
    const theme = getChartTheme();
    Chart.defaults.color = theme.text;
    Chart.defaults.borderColor = theme.grid;
    if (Chart.defaults.scale) {
        Chart.defaults.scale.grid = Chart.defaults.scale.grid || {};
        Chart.defaults.scale.grid.color = theme.grid;
        Chart.defaults.scale.ticks = Chart.defaults.scale.ticks || {};
        Chart.defaults.scale.ticks.color = theme.textMuted;
    }
    if (Chart.defaults.plugins && Chart.defaults.plugins.legend) {
        Chart.defaults.plugins.legend.labels = Chart.defaults.plugins.legend.labels || {};
        Chart.defaults.plugins.legend.labels.color = theme.text;
    }
}

function renderChart(userData, exerciseNames) {
    if (!userData || !exerciseNames || exerciseNames.length === 0) {
        if (chartInstance) chartInstance.destroy();
        return;
    }

    applyChartDefaults();
    const ctx = document.getElementById('progressChart').getContext('2d');
    const theme = getChartTheme();
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
        pointBackgroundColor: theme.point,
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
                    grid: { color: theme.grid },
                    ticks: { color: theme.textMuted }
                },
                x: {
                    grid: { color: theme.grid },
                    ticks: { color: theme.textMuted }
                }
            },
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: theme.text, padding: 20, usePointStyle: true }
                },
                datalabels: {
                    display: (context) => context.dataset.data[context.dataIndex] !== null,
                    color: theme.labelText,
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
                            const name = context.dataset.label;
                            const h = userData.exercises[name].history.find(entry => entry.date === date);
                            let assistance = '';
                            if (h) {
                                if (h.rodillas === 'Y') assistance = ' (Rodillas)';
                                else if (h.goma) assistance = ` (Goma ${h.goma})`;
                            }
                            return `${name}: ${context.raw} reps${assistance} (${date})`;
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
    applyChartDefaults();
    const theme = getChartTheme();
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
                    grid: { color: theme.gridStrong },
                    angleLines: { color: theme.gridStrong },
                    pointLabels: { color: theme.text, font: { size: 12 } },
                    ticks: { display: false, count: 5 }
                }
            },
            plugins: { legend: { display: false } }
        }
    });
}

// ====================================================================
// New profile sections (PRs, clean-equiv chart, attendance, cohort, tips,
// goma roadmap, goals, share, theme, birthday).
// ====================================================================

function renderPRsSection(records) {
    if (!records || records.length === 0) return '';
    const PR_RECENT_DAYS = 14;
    const cards = records.map(r => {
        const cleanText = r.cleanPR
            ? `<span class=\"pr-badge clean\" title=\"Sin asistencia\">${r.cleanPR.reps} limpio</span>`
            : '';
        const assistedText = r.assistedPR
            ? `<span class=\"pr-badge assisted\">${r.assistedPR.reps} ${getAssistanceBadge(r.assistedPR.goma, r.assistedPR.rodillas)}</span>`
            : '';
        const fresh = r.daysSincePR != null && r.daysSincePR <= PR_RECENT_DAYS
            ? '<span class="pr-fresh">🆕 nuevo PR</span>' : '';
        const since = r.daysSincePR != null ? `<span class="pr-meta">hace ${r.daysSincePR} d.</span>` : '';
        return `
            <div class="pr-card">
                <div class="pr-card-head">
                    <h3>${r.exercise}</h3>
                    ${fresh}
                </div>
                <div class="pr-card-body">${cleanText}${assistedText}</div>
                <div class="pr-card-foot">${since}</div>
            </div>`;
    }).join('');

    return `
        <section class="prs-section">
            <h2>🏅 Mis récords</h2>
            <p class="section-subtitle">Tu mejor marca limpia y tu mejor marca asistida en cada ejercicio.</p>
            <div class="prs-grid">${cards}</div>
        </section>`;
}

function renderImprovementBreakdown(breakdown) {
    if (!breakdown) return '';
    const cleanPct = breakdown.cleanEquivPct.toFixed(1);
    const drop = breakdown.avgAssistDrop.toFixed(1);
    const cleanCls = breakdown.cleanEquivPct >= 0 ? 'positive' : 'negative';
    return `
        <div class="improvement-breakdown">
            <div class="breakdown-item">
                <span class="breakdown-label">Mejora limpia (reps normalizadas)</span>
                <span class="${cleanCls}">${breakdown.cleanEquivPct >= 0 ? '+' : ''}${cleanPct}%</span>
            </div>
            <div class="breakdown-item">
                <span class="breakdown-label">Bajada media de goma</span>
                <span class="${breakdown.avgAssistDrop > 0 ? 'positive' : 'neutral'}">${breakdown.avgAssistDrop > 0 ? '↓' : ''} ${drop} niveles</span>
            </div>
        </div>`;
}

function renderAttendanceSection(att) {
    if (!att || att.totalDays === 0) {
        return `<section class="attendance-section card">
            <h2>📅 Mi asistencia</h2>
            <p class="empty-state">Aún no hay sesiones registradas. ¡Tu primera huella aparecerá aquí!</p>
        </section>`;
    }
    const heatmap = att.calendar.map(week => `
        <div class="heatmap-col">
            ${week.map(day => `<div class="heatmap-cell level-${Math.min(day.count, 3)}" title="${day.date}: ${day.count} sesi${day.count === 1 ? 'ón' : 'ones'}"></div>`).join('')}
        </div>`).join('');
    return `
        <section class="attendance-section card">
            <h2>📅 Mi asistencia</h2>
            <div class="attendance-stats">
                <div class="att-stat"><div class="att-value">${att.current}</div><div class="att-label">Racha actual (sem)</div></div>
                <div class="att-stat"><div class="att-value">${att.longest}</div><div class="att-label">Racha máxima (sem)</div></div>
                <div class="att-stat"><div class="att-value">${att.totalDays}</div><div class="att-label">Días totales</div></div>
            </div>
            <p class="section-subtitle">Últimas 12 semanas</p>
            <div class="heatmap">${heatmap}</div>
        </section>`;
}

function renderCohortBadge(info, primaryTime) {
    if (!info || info.cohortSize <= 1) return '';
    const tone = info.percentile >= 75 ? 'top' : info.percentile >= 50 ? 'mid' : 'work';
    return `<div class="cohort-badge ${tone}" title="Comparado con compañeros del horario ${primaryTime}">
        Top ${100 - info.percentile + 1}% en clase ${primaryTime || ''} · ${info.cohortSize} atletas
    </div>`;
}

function renderGomaRoadmap(ex) {
    const currentLevel = getAssistanceLevel(ex.maxGoma, ex.maxRodillas);
    const ladder = GOMA_LADDER;
    const userIdx = (() => {
        if (!ex.maxGoma) return ladder.length - 1; // clean
        return ladder.indexOf(ex.maxGoma);
    })();
    const safeIdx = userIdx === -1 ? 0 : userIdx;
    const steps = ladder.map((code, i) => {
        const isCurrent = i === safeIdx;
        const isPast = i < safeIdx;
        const label = code === '' ? 'Limpio' : (GOMA_COLORS[code]?.emoji || code);
        return `<span class="roadmap-step ${isCurrent ? 'current' : isPast ? 'past' : ''}" title="${code === '' ? 'Sin goma' : GOMA_COLORS[code]?.name || code}">${label}</span>`;
    }).join('<span class="roadmap-arrow">›</span>');
    return `<div class="goma-roadmap"><span class="roadmap-label">Ruta de goma:</span>${steps}</div>`;
}

function renderExerciseTip(tip) {
    const cues = (tip.cues || []).map(c => `<li>${c}</li>`).join('');
    const video = tip.videoId
        ? `<div class="exercise-video"><iframe loading="lazy" src="https://www.youtube.com/embed/${tip.videoId}" title="Demostración" allowfullscreen></iframe></div>`
        : '';
    return `
        <div class="tip-body">
            <ul class="tip-cues">${cues}</ul>
            ${tip.common ? `<p class="tip-common"><strong>Error común:</strong> ${tip.common}</p>` : ''}
            ${video}
        </div>`;
}

function renderGoalsSection(userData, goals, cohort) {
    const exerciseOptions = Object.keys(userData.exercises)
        .map(name => `<option value="${name}">${name}</option>`).join('');
    const cards = goals.length === 0
        ? '<p class="empty-state">Aún no tienes objetivos. ¡Define el primero abajo!</p>'
        : goals.map(g => {
            const evalRes = evaluateGoal(g, userData);
            const pct = Math.round(evalRes.progress);
            const tag = g.type === 'clean' ? '🛡️ Sin goma' : '💪 Cualquier asistencia';
            const cohortInfo = cohort && cohort.exercises[g.exercise];
            const cohortLine = cohortInfo
                ? `<div class="goal-cohort">Mejor del grupo (${cohort.primaryTime}): <strong>${Math.round(cohortInfo.cohortMax)}</strong> reps · estás en el top ${100 - cohortInfo.percentile + 1}%</div>`
                : '';
            return `
                <div class="goal-card ${evalRes.achieved ? 'achieved' : ''}">
                    <div class="goal-head">
                        <h3>${g.exercise}</h3>
                        <button type="button" class="goal-remove" aria-label="Eliminar objetivo" onclick="removeGoalAndRefresh('${g.id}')">✕</button>
                    </div>
                    <p class="goal-target">Meta: <strong>${g.target} reps</strong> · ${tag}</p>
                    <div class="challenge-progress-bar">
                        <div class="challenge-progress-fill" style="width: ${pct}%;"></div>
                    </div>
                    <div class="goal-meta"><span>${evalRes.current} / ${g.target}</span><span>${pct}%</span></div>
                    ${cohortLine}
                    ${evalRes.achieved ? '<div class="goal-celebrate">🎉 ¡Conseguido!</div>' : ''}
                </div>`;
        }).join('');

    return `
        <section class="goals-section">
            <h2>🎯 Mis objetivos</h2>
            <p class="section-subtitle">
                Tus metas se guardan en este navegador y se sincronizan en segundo plano con
                <code>goals.json</code> para que estén disponibles en todos tus dispositivos.
            </p>
            <div class="goals-toolbar">
                <span id="goals-sync-status" class="sync-badge sync-idle" aria-live="polite">⏳ Comprobando sincronización…</span>
                <button type="button" class="btn-secondary" onclick="forceGoalsSync()" aria-label="Sincronizar ahora">🔄 Sincronizar</button>
                <button type="button" class="btn-secondary" onclick="exportGoals()" aria-label="Exportar objetivos">⬇️ Exportar</button>
                <button type="button" class="btn-secondary" onclick="document.getElementById('goal-import-file').click()" aria-label="Importar objetivos">⬆️ Importar</button>
                <input type="file" id="goal-import-file" accept="application/json" style="display:none" onchange="importGoals(event)">
            </div>
            <div class="goals-grid">${cards}</div>
            <form class="goal-form" onsubmit="event.preventDefault(); addGoalFromForm();">
                <select id="goal-exercise" required aria-label="Ejercicio">
                    <option value="">Ejercicio…</option>
                    ${exerciseOptions}
                </select>
                <input type="number" id="goal-target" min="1" placeholder="Reps objetivo" required aria-label="Reps objetivo">
                <select id="goal-type" aria-label="Tipo de objetivo">
                    <option value="clean">Sin goma (limpio)</option>
                    <option value="any">Cualquier asistencia</option>
                </select>
                <button type="submit" class="btn-apply">Añadir</button>
            </form>
        </section>`;
}

function getBirthdayBanner(userData) {
    if (!userData.sessions || userData.sessions.length === 0) return '';
    const sorted = [...userData.sessions].sort((a, b) => new Date(a.date) - new Date(b.date));
    const first = new Date(sorted[0].date);
    const today = new Date();
    if (first.getMonth() === today.getMonth() && first.getDate() === today.getDate()) {
        const years = today.getFullYear() - first.getFullYear();
        if (years >= 1) {
            return `<div class="birthday-banner">🎂 Hoy hace ${years} año${years > 1 ? 's' : ''} desde tu primera sesión. ¡Gracias por seguir!</div>`;
        }
    }
    return '';
}

let cleanEquivInstance = null;
function renderCleanEquivChart(userData, cleanEquiv, exerciseNames) {
    const ctx = document.getElementById('cleanEquivChart');
    if (!ctx || !exerciseNames || exerciseNames.length === 0) {
        if (cleanEquivInstance) cleanEquivInstance.destroy();
        return;
    }
    const allDates = new Set();
    exerciseNames.forEach(name => {
        (cleanEquiv[name] || []).forEach(p => allDates.add(p.date));
    });
    const sortedDates = [...allDates].sort((a, b) => new Date(a) - new Date(b));
    const colors = ['#1abc9c', '#3498db', '#e74c3c', '#f39c12', '#9b59b6', '#2ecc71', '#e67e22'];
    const datasets = exerciseNames.slice(0, 7).map((name, i) => ({
        label: name,
        data: sortedDates.map(d => {
            const p = (cleanEquiv[name] || []).find(e => e.date === d);
            return p ? Math.round(p.value * 10) / 10 : null;
        }),
        borderColor: colors[i % colors.length],
        backgroundColor: colors[i % colors.length] + '33',
        borderWidth: 2,
        tension: 0.3,
        spanGaps: true,
        pointRadius: 3
    }));

    if (cleanEquivInstance) cleanEquivInstance.destroy();
    applyChartDefaults();
    const theme = getChartTheme();
    cleanEquivInstance = new Chart(ctx.getContext('2d'), {
        type: 'line',
        data: {
            labels: sortedDates.map(d => {
                const date = new Date(d);
                return `${date.getDate()}/${date.getMonth() + 1}`;
            }),
            datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true, grid: { color: theme.grid }, ticks: { color: theme.textMuted } },
                x: { grid: { color: theme.grid }, ticks: { color: theme.textMuted } }
            },
            plugins: {
                legend: { position: 'bottom', labels: { color: theme.text, usePointStyle: true } },
                datalabels: { display: false }
            }
        }
    });
}

function toggleThemeAndRefresh() {
    toggleTheme();
    displayUserProfile();
}

async function shareProfileCard() {
    const btn = document.getElementById('share-btn');
    if (btn) { btn.disabled = true; btn.textContent = '⏳ Generando…'; }
    try {
        const userData = getUserData();
        const achievements = getAchievements(userData);
        const dataUrl = await generateProfileCardImage(userData, achievements);
        const blob = await (await fetch(dataUrl)).blob();
        const file = new File([blob], `${userData.name}-calistenia.png`, { type: 'image/png' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            try {
                await navigator.share({ files: [file], title: 'Mi tarjeta — Calistenia Valencia' });
            } catch (e) { /* user cancelled */ }
        } else {
            const a = document.createElement('a');
            a.href = dataUrl;
            a.download = file.name;
            document.body.appendChild(a);
            a.click();
            a.remove();
        }
    } catch (e) {
        console.error(e);
        alert('No se pudo generar la tarjeta.');
    } finally {
        if (btn) { btn.disabled = false; btn.textContent = '📷 Compartir'; }
    }
}

function addGoalFromForm() {
    const exercise = document.getElementById('goal-exercise').value;
    const target = parseInt(document.getElementById('goal-target').value, 10);
    const type = document.getElementById('goal-type').value;
    if (!exercise || !target || target <= 0) return;
    addGoal(userName, { exercise, target, type });
    displayUserProfile();
}

function removeGoalAndRefresh(id) {
    removeGoal(userName, id);
    displayUserProfile();
}

function exportGoals() {
    const goals = getGoals(userName);
    if (goals.length === 0) {
        alert('No tienes objetivos guardados todavía.');
        return;
    }
    const payload = {
        type: 'calistenia-valencia-goals',
        version: 1,
        user: userName,
        exportedAt: new Date().toISOString(),
        goals
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `objetivos-${userName.toLowerCase().replace(/\s+/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}

function importGoals(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const payload = JSON.parse(e.target.result);
            if (payload.type !== 'calistenia-valencia-goals' || !Array.isArray(payload.goals)) {
                throw new Error('Archivo no válido.');
            }
            const replace = confirm('¿Reemplazar los objetivos actuales? (Cancelar = añadir a los existentes)');
            const merged = replace
                ? payload.goals
                : [...getGoals(userName), ...payload.goals];
            // Re-id imported goals to avoid collisions
            const safe = merged.map((g, i) => ({ ...g, id: g.id || (Date.now().toString(36) + i) }));
            saveGoals(userName, safe);
            displayUserProfile();
        } catch (err) {
            alert('No se pudo importar: ' + err.message);
        } finally {
            event.target.value = '';
        }
    };
    reader.readAsText(file);
}

function forceGoalsSync() {
    syncGoalsNow(userName).then(() => displayUserProfile()).catch(() => { });
}

function updateSyncBadge(status) {
    const el = document.getElementById('goals-sync-status');
    if (!el) return;
    el.classList.remove('sync-idle', 'sync-syncing', 'sync-ok', 'sync-error');
    if (status.state === 'syncing') {
        el.classList.add('sync-syncing');
        el.textContent = '🔄 Sincronizando…';
    } else if (status.state === 'ok') {
        el.classList.add('sync-ok');
        const t = status.at ? new Date(status.at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : '';
        el.textContent = `✅ Sincronizado${t ? ' a las ' + t : ''}`;
    } else if (status.state === 'error') {
        el.classList.add('sync-error');
        el.textContent = '⚠️ Sin sincronizar (cambios guardados localmente)';
        el.title = status.message || '';
    }
}

document.addEventListener('DOMContentLoaded', loadData);
