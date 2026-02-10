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
    // STRENGTH (Assuming Pull-ups/Dips context usually)
    // We check max reps across ANY exercise for simplicity or specific ones if needed.
    // Here we check if *any* exercise has max >= X
    {
        id: 'strength_15',
        title: 'Fuerte',
        description: 'Realizar 15 repeticiones en un ejercicio',
        icon: '💪',
        condition: (data) => Math.max(...Object.values(data.exercises).map(e => e.max)) >= 15,
        tier: 'bronze'
    },
    {
        id: 'strength_25',
        title: 'Bestia',
        description: 'Realizar 25 repeticiones en un ejercicio',
        icon: '🦍',
        condition: (data) => Math.max(...Object.values(data.exercises).map(e => e.max)) >= 25,
        tier: 'silver'
    },
    {
        id: 'strength_40',
        title: 'Leyenda',
        description: 'Realizar 40 repeticiones en un ejercicio',
        icon: '⚡',
        condition: (data) => Math.max(...Object.values(data.exercises).map(e => e.max)) >= 40,
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
        userName = urlParams.get('name');

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
            const userResult = exercise.results.find(r => r.person === userName);
            if (userResult) {
                const parsed = parseReps(userResult.reps);
                sessionData.exercises.push({
                    name: exercise.exercise,
                    reps: parsed.value,
                    modifier: parsed.modifier,
                    raw: userResult.reps,
                    goma: userResult.goma || null,
                    rodillas: userResult.rodillas || null
                });

                if (!userData.exercises[exercise.exercise]) {
                    userData.exercises[exercise.exercise] = {
                        name: exercise.exercise,
                        history: [],
                        max: 0,
                        min: Infinity,
                        total: 0,
                        count: 0,
                        maxGoma: null,
                        maxRodillas: null
                    };
                }

                const exerciseData = userData.exercises[exercise.exercise];
                exerciseData.history.push({
                    date: session.date,
                    reps: parsed.value,
                    modifier: parsed.modifier,
                    raw: userResult.reps,
                    goma: userResult.goma || null,
                    rodillas: userResult.rodillas || null
                });
                // Then, after calculating .max and .min, also store which goma was used.
                if (parsed.value > exerciseData.max) {
                    exerciseData.maxGoma = userResult.goma || null;
                    exerciseData.maxRodillas = userResult.rodillas || null;
                } else if (parsed.value === exerciseData.max) {
                    // Tie-breaker: Less assistance is better
                    const currentLevel = getAssistanceLevel(exerciseData.maxGoma, exerciseData.maxRodillas);
                    const newLevel = getAssistanceLevel(userResult.goma, userResult.rodillas);
                    if (newLevel < currentLevel) {
                        exerciseData.maxGoma = userResult.goma || null;
                        exerciseData.maxRodillas = userResult.rodillas || null;
                    }
                }

                if (parsed.value < exerciseData.min) {
                    exerciseData.minGoma = userResult.goma || null;
                    exerciseData.minRodillas = userResult.rodillas || null;
                }
                exerciseData.max = Math.max(exerciseData.max, parsed.value);
                exerciseData.min = Math.min(exerciseData.min, parsed.value);
                exerciseData.total += parsed.value;
                exerciseData.count += 1;
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

function displayUserProfile() {
    const userData = getUserData();
    const container = document.getElementById('user-container');
    const exerciseList = Object.keys(userData.exercises);
    const maxMark = Math.max(...Object.values(userData.exercises).map(ex => ex.max));

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
                    <div class="stat-value">${exerciseList.length}</div>
                    <div class="stat-label">Ejercicios</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${userData.totalReps}</div>
                    <div class="stat-label">Total Reps</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${maxMark}</div>
                    <div class="stat-label">Mejor Marca</div>
                </div>
            </div>
                <div class="stat-card">
                    <div class="stat-value">${maxMark}</div>
                    <div class="stat-label">Mejor Marca</div>
                </div>
            </div>
        </header>

        <!-- Achievements Section -->
        <div class="achievements-section">
            <h2>🏆 Logros Desbloqueados</h2>
            <div class="achievements-grid">
                ${getAchievements(userData).map(achievement => `
                    <div class="achievement-card ${achievement.tier}">
                        <div class="achievement-icon">${achievement.icon}</div>
                        <div class="achievement-info">
                            <h3>${achievement.title}</h3>
                            <p>${achievement.description}</p>
                        </div>
                    </div>
                `).join('')}
                ${getAchievements(userData).length === 0 ? '<p style="text-align:center; width:100%; opacity:0.6;">Aún no has desbloqueado logros. ¡Sigue entrenando!</p>' : ''}
            </div>
        </div>

        <!-- Progress Chart Section -->
        <div class="chart-section">
            <h2>Evolución de Ejercicios</h2>
            <p class="chart-subtitle">Selecciona los ejercicios para comparar tu progreso</p>
            
            <div class="exercise-filters">
                ${exerciseList.map(exerciseName => `
                    <button 
                        class="exercise-filter-btn ${selectedExercises.includes(exerciseName) ? 'active' : ''}" 
                        data-exercise="${exerciseName}"
                        onclick="toggleExercise('${exerciseName}')"
                    >
                        ${exerciseName}
                    </button>
                `).join('')}
            </div>

            <div class="chart-container">
                <canvas id="progressChart"></canvas>
            </div>
        </div>

        <!-- Exercise Stats Grid -->
        <div class="exercises-section">
            <h2>Estadísticas por Ejercicio</h2>
            <div class="exercises-grid">
                ${Object.values(userData.exercises).map(exercise => {
        const exerciseName = exercise.name; // Assuming exercise object has a 'name' property
        const bestReps = Math.max(...exercise.history.map(h => h.reps));
        const maxRecord = exercise.history.find(h => h.reps === bestReps);
        const maxDate = maxRecord ? new Date(maxRecord.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) : '';

        const firstReps = exercise.history[0].reps;
        const lastReps = exercise.history[exercise.history.length - 1].reps;
        const progress = lastReps - firstReps;
        const progressClass = progress >= 0 ? 'text-success' : 'text-danger';
        const progressSign = progress >= 0 ? '+' : '';

        const progressPercent = bestReps > 0 ? Math.round((lastReps / bestReps) * 100) : 0;

        return `
                    <div class="exercise-card">
                        <h3>${exerciseName}</h3>
                        <div class="exercise-stats">
                            <div class="stat-row">
                                <span>Máximo:</span>
                                <span class="stat-highlight">
                                    ${getAssistanceBadge(exercise.maxGoma, exercise.maxRodillas)}
                                    ${bestReps} reps <small style="font-size: 0.7em; opacity: 0.7">(${maxDate})</small>
                                </span>
                            </div>
                            <div class="stat-row">
                                <span>Última sesión:</span>
                                <span>
                                    ${exercise.history[exercise.history.length - 1].goma ? getAssistanceBadge(exercise.history[exercise.history.length - 1].goma, exercise.history[exercise.history.length - 1].rodillas) : (exercise.history[exercise.history.length - 1].rodillas ? getAssistanceBadge(null, 'Y') : '')}
                                    ${lastReps} reps
                                </span>
                            </div>
                            <div class="stat-row">
                                <span>Progreso:</span>
                                <span style="color: ${progress >= 0 ? '#2ecc71' : '#e74c3c'}">${progressSign}${progress} reps</span>
                            </div>
                            <div class="stat-row">
                                <span>Total sesiones:</span>
                                <span>${exercise.history.length}</span>
                            </div>
                            <div class="stat-row">
                                <span>Promedio:</span>
                                <span>
                                    <span class="score-number">${exercise.average} reps</span>
                                </span>
                            </div>
                            <div class="stat-row">
                                <span>Mínimo:</span>
                                <span>
                                    ${getAssistanceBadge(exercise.minGoma, exercise.minRodillas)}
                                    <span class="score-number">${exercise.min} reps</span>
                                </span>
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

        <!-- Session History -->
        <div class="session-history">
            <h2>Historial de Sesiones</h2>
            ${userData.sessions.slice().reverse().map((session, index) => `
                <div class="session-card-user">
                    <div class="session-header">
                        <div>
                            <h3>${new Date(session.date).toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    })}</h3>
                            <span class="session-time">${session.time} • ${session.category}</span>
                        </div>
                        <div class="session-badge">
                            <div class="badge-number">${session.exercises.length}</div>
                            <div class="badge-label">ejercicios</div>
                        </div>
                    </div>
                    <div class="session-exercises">
                        ${session.exercises.map(exercise => `
                            <div class="exercise-result">
                                <span class="exercise-name">${exercise.name}</span>
                                <span class="exercise-reps">
    ${getAssistanceBadge(exercise.goma, exercise.rodillas)} 
    <span class="score-number" style="min-width:36px;text-align:right;">
        ${exercise.reps}${exercise.modifier ? ' ' + exercise.modifier : ''} reps
    </span>
</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `).join('')}
        </div>
    `;

    // Render chart after DOM is ready
    setTimeout(renderChart, 100);

    // Re-render chart on window resize
    window.addEventListener('resize', renderChart);
}

document.addEventListener('DOMContentLoaded', loadData);