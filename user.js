let data = null;
let userName = '';
let selectedExercises = [];


// GOMA_COLORS and getGomaBadge moved to calculations.js



const ACHIEVEMENTS = [
    // CONSTANCY
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
    // STRENGTH (Clean - No assistance)
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
    // ASSISTED STRENGTH
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
    // PURITY (No elastic bands)
    {
        id: 'purist',
        title: 'Purista',
        description: 'Entrenar sin gomas elástica en una sesión completa',
        icon: '🛡️',
        condition: (data) => {
            // Check if there is at least one session where all exercises have NO goma AND NO rodillas
            return data.sessions.some(session =>
                session.exercises.every(ex => !ex.goma && !ex.rodillas)
            );
        },
        tier: 'gold'
    }
];

function getAchievements(userData) {
    return ACHIEVEMENTS.filter(achievement => achievement.condition(userData));
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
        if (!response.ok) {
            throw new Error('Failed to load data');
        }
        data = await response.json();
        displayUserProfile();
    } catch (error) {
        console.error('Error loading data:', error);
        const container = document.getElementById('user-container');
        container.innerHTML = `
            <div class="error-screen">
                <h2>Error cargando los datos</h2>
                <p>No se pudo cargar el archivo de datos.</p>
                <p style="font-size: 0.8em; color: #e74c3c;">${error.message}</p>
                <a href="index.html" class="btn-reload">Volver al inicio</a>
            </div>
        `;
    }
}

function showError() {
    const container = document.getElementById('user-container');
    container.innerHTML = `
        <div class="error-screen">
            <h2>Error cargando los datos</h2>
            <p>Por favor, verifica que el archivo data.json existe.</p>
            <a href="index.html" class="btn-reload">Volver al inicio</a>
        </div>
    `;
}

// parseReps moved to calculations.js

function getUserData() {
    const userData = {
        name: userName,
        sessions: [],
        exercises: {},
        totalSessions: 0,
        totalReps: 0
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
                    raw: userResult.reps,
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
                    modifier: parsed.modifier,
                    raw: userResult.reps,
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
                } else if (parsed.value === exerciseData.max) {
                    const currentLevel = getAssistanceLevel(exerciseData.maxGoma, exerciseData.maxRodillas);
                    const newLevel = getAssistanceLevel(userResult.goma, userResult.rodillas);
                    if (newLevel < currentLevel) {
                        exerciseData.maxGoma = userResult.goma || null;
                        exerciseData.maxRodillas = userResult.rodillas || null;
                        exerciseData.maxDate = session.date;
                    }
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

    Object.values(userData.exercises).forEach(exercise => {
        exercise.average = Math.round(exercise.total / exercise.count);
    });

    return userData;
}

function toggleExercise(exerciseName) {
    const index = selectedExercises.indexOf(exerciseName);
    if (index > -1) {
        selectedExercises.splice(index, 1);
    } else {
        selectedExercises.push(exerciseName);
    }
    renderChart();
    updateFilterButtons();
}

function updateFilterButtons() {
    const buttons = document.querySelectorAll('.exercise-filter-btn');
    buttons.forEach(btn => {
        const exerciseName = btn.dataset.exercise;
        if (selectedExercises.includes(exerciseName)) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

let chartInstance = null;

function renderChart() {
    const userData = getUserData();
    // Default to ALL exercises if none selected
    if (selectedExercises.length === 0 && userData && userData.exercises) {
        selectedExercises = Object.keys(userData.exercises);
    }

    const canvas = document.getElementById('progressChart');
    const ctx = canvas.getContext('2d');

    // Define exerciseNames for use in loop
    const exerciseNames = selectedExercises;

    // Prepare datasets
    const allDates = new Set();
    const exerciseDataMap = {};

    exerciseNames.forEach(name => {
        const exercise = userData.exercises[name];
        if (exercise) {
            exercise.history.forEach(entry => allDates.add(entry.date));
            exerciseDataMap[name] = new Map(exercise.history.map(h => [h.date, h.reps]));
        }
    });

    const sortedDates = Array.from(allDates).sort((a, b) => new Date(a) - new Date(b));

    // Chart colors
    const colors = [
        '#1abc9c', '#3498db', '#e74c3c', '#f39c12', '#9b59b6',
        '#2ecc71', '#e67e22', '#16a085', '#2980b9', '#8e44ad'
    ];

    const datasets = exerciseNames.map((name, index) => {
        const data = sortedDates.map(date => {
            const val = exerciseDataMap[name]?.get(date);
            return val !== undefined ? val : null;
        });

        const color = colors[index % colors.length];

        return {
            label: name,
            data: data,
            borderColor: color,
            backgroundColor: color,
            borderWidth: 3,
            pointBackgroundColor: '#0a1628',
            pointBorderColor: color,
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6,
            tension: 0.3, // Smooth lines
            spanGaps: true
        };
    });

    // Destroy previous chart if exists
    if (chartInstance) {
        chartInstance.destroy();
    }

    // Register the plugin if available
    if (typeof ChartDataLabels !== 'undefined') {
        Chart.register(ChartDataLabels);
    }

    // configure Chart
    chartInstance = new Chart(ctx, {
        type: 'line',
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
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                datalabels: {
                    color: 'white',
                    align: 'top',
                    offset: 4,
                    font: {
                        weight: 'bold',
                        size: 11
                    },
                    formatter: function (value) {
                        return value;
                    },
                    display: function (context) {
                        // Only show if not null
                        return context.dataset.data[context.dataIndex] !== null;
                    }
                },
                legend: {
                    labels: {
                        color: 'rgba(255, 255, 255, 0.8)',
                        font: { size: 12, family: "'Segoe UI', sans-serif" },
                        usePointStyle: true,
                        boxWidth: 8
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(10, 22, 40, 0.9)',
                    titleColor: '#1abc9c',
                    bodyColor: '#fff',
                    borderColor: 'rgba(26, 188, 156, 0.3)',
                    borderWidth: 1,
                    padding: 10,
                    displayColors: true,
                    callbacks: {
                        title: (items) => {
                            const index = items[0].dataIndex;
                            const dateStr = sortedDates[index];
                            const date = new Date(dateStr);
                            return date.toLocaleDateString('es-ES', {
                                day: 'numeric', month: 'long', year: 'numeric'
                            });
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)',
                        borderColor: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.6)',
                        font: { size: 11 }
                    }
                },
                y: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)',
                        borderColor: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.6)',
                        font: { size: 11 }
                    },
                    beginAtZero: true
                }
            }
        }
    });
}

function getNextChallenges(userData) {
    const challenges = [];

    // 1. Constancy
    const constancyLevels = [
        { goal: 1, id: 'constancy_1', title: 'Primeros Pasos' },
        { goal: 5, id: 'constancy_5', title: 'Constancia' },
        { goal: 10, id: 'constancy_10', title: 'Veterano' }
    ];
    const nextConstancy = constancyLevels.find(l => userData.totalSessions < l.goal);
    if (nextConstancy) {
        challenges.push({
            category: 'Constancia',
            icon: '🔥',
            current: userData.totalSessions,
            goal: nextConstancy.goal,
            title: nextConstancy.title,
            unit: 'sesiones'
        });
    }

    // 2. Strength (Clean)
    const strengthLevels = [
        { goal: 15, id: 'strength_15', title: 'Fuerte' },
        { goal: 25, id: 'strength_25', title: 'Bestia' },
        { goal: 40, id: 'strength_40', title: 'Leyenda' }
    ];
    const maxCleanReps = Math.max(0, ...Object.values(userData.exercises).map(e =>
        Math.max(0, ...e.history.filter(h => !h.goma && !h.rodillas).map(h => h.reps))
    ));
    const nextStrength = strengthLevels.find(l => maxCleanReps < l.goal);
    if (nextStrength) {
        challenges.push({
            category: 'Fuerza Limpia',
            icon: '💪',
            current: maxCleanReps,
            goal: nextStrength.goal,
            title: nextStrength.title,
            unit: 'reps'
        });
    }

    // 3. Assisted
    const assistedLevels = [
        { goal: 15, id: 'assisted_15', title: 'Impulso' },
        { goal: 25, id: 'assisted_25', title: 'Propulsión' },
        { goal: 40, id: 'assisted_40', title: 'Gravedad Zero' }
    ];
    const maxAssistedReps = Math.max(0, ...Object.values(userData.exercises).map(e =>
        Math.max(0, ...e.history.filter(h => h.goma || h.rodillas).map(h => h.reps))
    ));
    const nextAssisted = assistedLevels.find(l => maxAssistedReps < l.goal);
    if (nextAssisted) {
        challenges.push({
            category: 'Fuerza Asistida',
            icon: '🚀',
            current: maxAssistedReps,
            goal: nextAssisted.goal,
            title: nextAssisted.title,
            unit: 'reps'
        });
    }

    return challenges;
}

function displayUserProfile() {
    const userData = getUserData();
    const container = document.getElementById('user-container');
    const achievements = getAchievements(userData);
    const challenges = getNextChallenges(userData);
    const exerciseList = Object.keys(userData.exercises);

    // Initialize selected exercises with first 3
    if (selectedExercises.length === 0) {
        selectedExercises = exerciseList.slice(0, 3);
    }
    container.innerHTML = `
        <header>
            <div class="logo-container">
                <img src="logo.jpg" alt="Calistenia Valencia Logo" class="logo" onerror="this.style.display='none'">
            </div>
            <a href="index.html" class="back-link">← Volver al ranking</a>
            <div class="user-header">
                <div class="user-avatar">${userName.charAt(0).toUpperCase()}</div>
                <h1 class="user-name">${userName}</h1>
            </div>
            <div class="user-stats">
                <div class="stat-card">
                    <div class="stat-value">${userData.totalSessions}</div>
                    <div class="stat-label">Sesiones</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${userData.totalReps}</div>
                    <div class="stat-label">Repeticiones</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${achievements.length}</div>
                    <div class="stat-label">Logros</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${exerciseList.length}</div>
                    <div class="stat-label">Ejercicios</div>
                </div>
            </div>
        </header>

        <div class="achievements-section">
            <h2>Logros Desbloqueados</h2>
            <div class="achievements-grid">
                ${achievements.length > 0 ? achievements.map(achievement => `
                    <div class="achievement-card ${achievement.tier}">
                        <div class="achievement-icon">${achievement.icon}</div>
                        <div class="achievement-info">
                            <h3>${achievement.title}</h3>
                            <p>${achievement.description}</p>
                        </div>
                    </div>
                `).join('') : '<p class="no-achievements">¡Empieza a entrenar para desbloquear logros!</p>'}
            </div>

            <!-- NEW: Next Challenges Section -->
            ${challenges.length > 0 ? `
                <h2 style="margin-top: 50px; color: #1abc9c;">Próximos Retos</h2>
                <div class="achievements-grid challenges-grid-new">
                    ${challenges.map(challenge => {
        const progress = Math.min(100, Math.round((challenge.current / challenge.goal) * 100));
        return `
                            <div class="achievement-card challenge-card-new">
                                <div class="achievement-icon challenge-icon-new">${challenge.icon}</div>
                                <div class="achievement-info" style="flex: 1;">
                                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 5px;">
                                        <h3 style="margin: 0; font-size: 1.1em;">${challenge.title}</h3>
                                        <span style="font-size: 0.8em; color: rgba(255,255,255,0.6);">${challenge.category}</span>
                                    </div>
                                    <div class="challenge-progress-info" style="display: flex; justify-content: space-between; font-size: 0.9em; margin: 10px 0 5px;">
                                        <span>${challenge.current} / ${challenge.goal} ${challenge.unit}</span>
                                        <span style="color: #1abc9c; font-weight: bold;">${progress}%</span>
                                    </div>
                                    <div class="challenge-progress-bar" style="height: 6px; background: rgba(0,0,0,0.3); border-radius: 3px; overflow: hidden;">
                                        <div class="challenge-progress-fill" style="width: ${progress}%; height: 100%; background: linear-gradient(90deg, #1abc9c 0%, #16a085 100%); transition: width 1s ease-out;"></div>
                                    </div>
                                </div>
                            </div>
                        `;
    }).join('')}
                </div>
            ` : ''}
        </div>

        <div class="chart-section card">
            <h2>Progresión en el Tiempo</h2>
            <p class="chart-subtitle">Selecciona ejercicios para comparar tu progreso</p>
            <div class="exercise-filters">
                ${exerciseList.sort().map(ex => `
                    <button class="exercise-filter-btn ${selectedExercises.includes(ex) ? 'active' : ''}" 
                            onclick="toggleExercise('${ex}')"
                            data-exercise="${ex}">
                        ${ex}
                    </button>
                `).join('')}
            </div>
            <div class="chart-container">
                <canvas id="progressChart"></canvas>
            </div>
        </div>

        <div class="chart-section card">
            <h2>Equilibrio del Atleta</h2>
            <p class="chart-subtitle">Tu balance entre Empuje y Tracción</p>
            <div class="radar-container" style="height: 350px;">
                <canvas id="radarChart"></canvas>
            </div>
        </div>

        <div class="exercises-section">
            <h2>Estadísticas por Ejercicio</h2>
            <div class="exercises-grid">
                ${Object.values(userData.exercises).sort((a, b) => b.max - a.max).map(exercise => {
        const firstSession = exercise.history[0].reps;
        const lastSession = exercise.history[exercise.history.length - 1].reps;
        const progress = lastSession - firstSession;
        const progressClass = progress > 0 ? 'positive' : progress < 0 ? 'negative' : 'neutral';
        const progressText = progress > 0 ? `+${progress}` : progress;
        const progressPercent = exercise.max > 0 ? Math.round((lastSession / exercise.max) * 100) : 0;

        return `
                        <div class="exercise-card">
                            <h3>${exercise.name}</h3>
                            <div class="exercise-stats">
                                <div class="stat-row">
                                    <span>Máximo:</span>
                                    <span class="stat-highlight">
                                        ${getAssistanceBadge(exercise.maxGoma, exercise.maxRodillas)}
                                        ${exercise.max} reps
                                        ${exercise.maxDate ? `<small style="opacity:0.7; font-weight:normal;">(${new Date(exercise.maxDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })})</small>` : ''}
                                    </span>
                                </div>
                                <div class="stat-row">
                                    <span>Progreso:</span>
                                    <span class="exercise-progress ${progressClass}">${progressText} reps</span>
                                </div>
                                <div class="stat-row">
                                    <span>Sesiones:</span>
                                    <span>${exercise.history.length}</span>
                                </div>
                                <div class="stat-row">
                                    <span>Promedio:</span>
                                    <span>${exercise.average} reps</span>
                                </div>
                            </div>

                            <div class="progress-bar-container">
                                <div class="progress-bar-label">
                                    <span>Intensidad (vs Máx)</span>
                                    <span>${progressPercent}%</span>
                                </div>
                                <div class="progress-bar">
                                    <div class="progress-bar-fill" style="width: ${progressPercent}%"></div>
                                </div>
                            </div>
                        </div>
                    `;
    }).join('')}
            </div>
        </div>

        <div class="session-history">
            <h2>Historial Completo</h2>
            ${userData.sessions.slice().sort((a, b) => new Date(b.date) - new Date(a.date)).map(session => `
                <div class="session-card-user">
                    <div class="session-header">
                        <h3>${new Date(session.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</h3>
                        <span class="session-time">${session.time}</span>
                    </div>
                    <div class="session-exercises">
                        ${session.exercises.map(ex => `
                            <div class="exercise-result">
                                <span class="exercise-name">${ex.name}</span>
                                <span class="exercise-reps">
                                    ${getAssistanceBadge(ex.goma, ex.rodillas)}
                                    ${ex.reps}${ex.modifier ? ' ' + ex.modifier : ''}
                                </span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `).join('')}
        </div>
    `;

    // Render charts after DOM is ready
    setTimeout(() => {
        renderChart();
        renderRadarChart(userData);
    }, 100);

    // Re-render charts on window resize
    window.addEventListener('resize', () => {
        renderChart();
        renderRadarChart(userData);
    });
}

function renderRadarChart(userData) {
    const ctx = document.getElementById('radarChart').getContext('2d');

    // Define all exercises to show in the radar chart (fixed order)
    const exerciseList = Object.keys(EXERCISE_CATEGORIES);

    const labels = exerciseList.map(name => {
        const category = EXERCISE_CATEGORIES[name];
        return [`${category}:`, name]; // Two lines label
    });

    const dataValues = exerciseList.map(name => {
        const exercise = userData.exercises[name];
        return exercise ? exercise.max : 0;
    });

    if (window.radarInstance) window.radarInstance.destroy();

    window.radarInstance = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Máximo por Ejercicio',
                data: dataValues,
                fill: true,
                backgroundColor: 'rgba(26, 188, 156, 0.2)',
                borderColor: '#1abc9c',
                pointBackgroundColor: '#1abc9c',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: '#1abc9c'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                r: {
                    angleLines: { color: 'rgba(255, 255, 255, 0.1)' },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    pointLabels: { color: 'rgba(255, 255, 255, 0.8)', font: { size: 14 } },
                    ticks: { display: false, backdropColor: 'transparent' },
                    suggestedMin: 0
                }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
}

document.addEventListener('DOMContentLoaded', loadData);