let data = null;
let userName = '';
let selectedExercises = [];


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
function getGomaBadge(gomaCode) {
    if (!gomaCode || !GOMA_COLORS[gomaCode]) return '';
    const goma = GOMA_COLORS[gomaCode];
    return `<span class="goma-badge" style="background-color:${goma.color}" title="Goma ${goma.name}">${goma.emoji}</span>`;
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
        showError();
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

function parseReps(reps) {
    if (typeof reps === 'number') {
        return { value: reps, modifier: '' };
    }
    const match = reps.toString().match(/^(\d+)([A-Z]?)$/);
    if (match) {
        return { value: parseInt(match[1]), modifier: match[2] };
    }
    return { value: 0, modifier: '' };
}

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
                    goma: userResult.goma || null
                });

                if (!userData.exercises[exercise.exercise]) {
                    userData.exercises[exercise.exercise] = {
                        name: exercise.exercise,
                        history: [],
                        max: 0,
                        min: Infinity,
                        total: 0,
                        count: 0
                    };
                }

                const exerciseData = userData.exercises[exercise.exercise];
                exerciseData.history.push({
                    date: session.date,
                    reps: parsed.value,
                    modifier: parsed.modifier,
                    raw: userResult.reps,
                    goma: userResult.goma || null
                });
                // Then, after calculating .max and .min, also store which goma was used.
                if (parsed.value > exerciseData.max) {
                    exerciseData.maxGoma = userResult.goma || null;
                }
                if (parsed.value < exerciseData.min) {
                    exerciseData.minGoma = userResult.goma || null;
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

function getChartData() {
    const userData = getUserData();
    const exerciseNames = selectedExercises.length > 0
        ? selectedExercises
        : Object.keys(userData.exercises).slice(0, 3);

    const dateMap = new Map();

    exerciseNames.forEach(exerciseName => {
        const exercise = userData.exercises[exerciseName];
        if (exercise) {
            exercise.history.forEach(entry => {
                if (!dateMap.has(entry.date)) {
                    dateMap.set(entry.date, { date: entry.date });
                }
                dateMap.get(entry.date)[exerciseName] = entry.reps;
            });
        }
    });

    return Array.from(dateMap.values()).sort((a, b) =>
        new Date(a.date) - new Date(b.date)
    );
}

function renderChart() {
    const chartData = getChartData();
    const userData = getUserData();
    const exerciseNames = selectedExercises.length > 0
        ? selectedExercises
        : Object.keys(userData.exercises).slice(0, 3);

    const canvas = document.getElementById('progressChart');
    const ctx = canvas.getContext('2d');

    // Set canvas size - responsive
    const container = canvas.parentElement;
    const isMobile = window.innerWidth <= 480;
    const isTablet = window.innerWidth <= 768;

    // Use device pixel ratio for sharp rendering
    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();

    canvas.width = rect.width * dpr;
    canvas.height = (isMobile ? 250 : isTablet ? 300 : 400) * dpr;
    canvas.style.width = rect.width + 'px';
    canvas.style.height = (isMobile ? 250 : isTablet ? 300 : 400) + 'px';

    ctx.scale(dpr, dpr);

    const padding = isMobile
        ? { top: 30, right: 15, bottom: 50, left: 45 }
        : isTablet
            ? { top: 35, right: 25, bottom: 55, left: 50 }
            : { top: 40, right: 40, bottom: 60, left: 60 };
    const chartWidth = canvas.width - padding.left - padding.right;
    const chartHeight = canvas.height - padding.top - padding.bottom;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (chartData.length === 0) return;

    // Find max value
    const allValues = chartData.flatMap(d =>
        exerciseNames.map(ex => d[ex]).filter(v => v !== undefined)
    );
    const maxValue = Math.max(...allValues);
    const minValue = Math.min(...allValues);
    const range = maxValue - minValue || 1;

    // Colors for lines
    const colors = ['#1abc9c', '#3498db', '#e74c3c', '#f39c12', '#9b59b6', '#1abc9c'];

    // Draw grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
        const y = padding.top + (chartHeight / 5) * i;
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(padding.left + chartWidth, y);
        ctx.stroke();

        // Y-axis labels
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.font = '12px Arial';
        ctx.textAlign = 'right';
        const value = Math.round(maxValue - (range / 5) * i);
        ctx.fillText(value, padding.left - 10, y + 4);
    }

    // Draw X-axis labels
    const xStep = chartWidth / (chartData.length - 1 || 1);
    chartData.forEach((point, index) => {
        const x = padding.left + xStep * index;
        const date = new Date(point.date);
        const label = `${date.getDate()}/${date.getMonth() + 1}`;

        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.font = '11px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(label, x, canvas.height - padding.bottom + 20);
    });

    // Draw lines for each exercise
    exerciseNames.forEach((exerciseName, exIndex) => {
        ctx.strokeStyle = colors[exIndex % colors.length];
        ctx.fillStyle = colors[exIndex % colors.length];
        ctx.lineWidth = 3;

        const points = [];
        chartData.forEach((point, index) => {
            if (point[exerciseName] !== undefined) {
                const x = padding.left + xStep * index;
                const normalizedValue = (point[exerciseName] - minValue) / range;
                const y = padding.top + chartHeight - (normalizedValue * chartHeight);
                points.push({ x, y, value: point[exerciseName], date: point.date });
            }
        });

        if (points.length > 0) {
            // Draw line
            ctx.beginPath();
            ctx.moveTo(points[0].x, points[0].y);
            for (let i = 1; i < points.length; i++) {
                ctx.lineTo(points[i].x, points[i].y);
            }
            ctx.stroke();

            // Draw points
            points.forEach(p => {
                ctx.beginPath();
                ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
                ctx.fill();
            });
        }
    });

    // Draw legend
    let legendX = padding.left;
    const legendY = 20;
    exerciseNames.forEach((exerciseName, index) => {
        ctx.fillStyle = colors[index % colors.length];
        ctx.fillRect(legendX, legendY - 8, 15, 15);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.font = '13px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(exerciseName, legendX + 20, legendY + 4);

        legendX += ctx.measureText(exerciseName).width + 40;
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
        </header>

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
        const progressPercent = Math.round((exercise.average / exercise.max) * 100);
        return `
                        <div class="exercise-card">
                            <h3>${exercise.name}</h3>
                            <div class="exercise-stats">
                        <div class="stat-row">
                                <span>Máximo:</span>
                                <span class="stat-highlight">
                                    ${exercise.maxGoma ? getGomaBadge(exercise.maxGoma) : ''}
                                    <span class="score-number">${exercise.max} reps</span>
                                </span>
                            </div>
            
                        <div class="stat-row">
                            <span>Promedio:</span>
                            <span>
                                ${exercise.averageGoma ? getGomaBadge(exercise.averageGoma) : ''}
                                <span class="score-number">${exercise.average} reps</span>
                            </span>
                        </div>
                        <div class="stat-row">
                            <span>Mínimo:</span>
                            <span>
                                ${exercise.minGoma ? getGomaBadge(exercise.minGoma) : ''}
                                <span class="score-number">${exercise.min} reps</span>
                            </span>
                        </div>
                                <div class="stat-row">
                                    <span>Sesiones:</span>
                                    <span>${exercise.count}</span>
                                </div>
                            </div>
                            <div class="progress-bar-container">
                                <div class="progress-bar-label">
                                    <span>Progreso</span>
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
    ${exercise.goma ? getGomaBadge(exercise.goma) : ''} 
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