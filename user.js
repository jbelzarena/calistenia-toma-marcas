let data = null;
let userName = '';

async function loadData() {
    try {
        // Get user name from URL
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
        totalSessions: 0
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
                    raw: userResult.reps
                });

                // Aggregate by exercise
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
                    raw: userResult.reps
                });
                exerciseData.max = Math.max(exerciseData.max, parsed.value);
                exerciseData.min = Math.min(exerciseData.min, parsed.value);
                exerciseData.total += parsed.value;
                exerciseData.count += 1;
            }
        });

        if (sessionData.exercises.length > 0) {
            userData.sessions.push(sessionData);
            userData.totalSessions += 1;
        }
    });

    // Calculate averages
    Object.values(userData.exercises).forEach(exercise => {
        exercise.average = Math.round(exercise.total / exercise.count);
    });

    return userData;
}

function displayUserProfile() {
    const userData = getUserData();
    const container = document.getElementById('user-container');

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
                    <div class="stat-value">${Object.keys(userData.exercises).length}</div>
                    <div class="stat-label">Ejercicios</div>
                </div>
            </div>
        </header>

        <div class="exercises-grid">
            ${Object.values(userData.exercises).map(exercise => `
                <div class="exercise-card">
                    <h3>${exercise.name}</h3>
                    <div class="exercise-stats">
                        <div class="stat-row">
                            <span>Máximo:</span>
                            <span class="stat-highlight">${exercise.max} reps</span>
                        </div>
                        <div class="stat-row">
                            <span>Promedio:</span>
                            <span>${exercise.average} reps</span>
                        </div>
                        <div class="stat-row">
                            <span>Mínimo:</span>
                            <span>${exercise.min} reps</span>
                        </div>
                    </div>
                    <div class="history-chart">
                        ${renderMiniChart(exercise.history)}
                    </div>
                </div>
            `).join('')}
        </div>

        <div class="session-history">
            <h2>Historial de Sesiones</h2>
            ${userData.sessions.map(session => `
                <div class="session-card-user">
                    <div class="session-header">
                        <h3>${new Date(session.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</h3>
                        <span class="session-time">${session.time}</span>
                    </div>
                    <div class="session-exercises">
                        ${session.exercises.map(exercise => `
                            <div class="exercise-result">
                                <span class="exercise-name">${exercise.name}</span>
                                <span class="exercise-reps">${exercise.reps} reps${exercise.modifier ? ' ' + exercise.modifier : ''}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function renderMiniChart(history) {
    if (history.length === 0) return '';

    const values = history.map(h => h.reps);
    const max = Math.max(...values);
    const min = Math.min(...values);
    const range = max - min || 1;

    return `
        <div class="mini-chart">
            ${values.map((value, index) => {
        const height = ((value - min) / range) * 80 + 20;
        return `<div class="chart-bar" style="height: ${height}%" title="${value} reps - ${new Date(history[index].date).toLocaleDateString('es-ES')}"></div>`;
    }).join('')}
        </div>
    `;
}

document.addEventListener('DOMContentLoaded', loadData);