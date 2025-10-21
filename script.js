let data = null;
let currentExerciseName = '';
let viewMode = 'single';
let dateRange = { start: null, end: null };
let showGlobalLeaderboard = false;

async function loadData() {
    try {
        const response = await fetch('data.json');
        if (!response.ok) throw new Error('Failed to load data');
        data = await response.json();
        initializeApp();
    } catch (error) {
        console.error('Error loading data:', error);
        showError();
    }
}

function showError() {
    const container = document.getElementById('main-container');
    container.innerHTML = `
        <div class="error-screen">
            <h2>Error cargando los datos</h2>
            <p>Por favor, verifica que el archivo data.json existe y recarga la página.</p>
            <button onclick="location.reload()" class="btn-reload">Reintentar</button>
        </div>
    `;
}

function initializeApp() {
    const container = document.getElementById('main-container');

    container.innerHTML = `
       <header>
    <div class="header-flex">
        <div class="logo-container">
            <img src="logo.jpg" alt="Calistenia Valencia Logo" class="logo">
        </div>
        <div class="brand-title">
            <h1>
                <span class="brand-calistenia">CALISTENIA</span><br>
                <span class="brand-valencia">VALENCIA</span>
            </h1>
        </div>
    </div>
</header>

        <div class="filter-section ">
            <div class="filter-group">
                <label for="category-filter">Categoría:</label>
                <select id="category-filter" class="filter-select">
                    <option value="">Selecciona una categoría</option>
                    ${[...new Set(data.sessions.map(s => s.category))].map(cat => `<option value="${cat}">${cat}</option>`).join('')}
                </select>
            </div>

            <div class="filter-group">
                <label for="exercise-filter">Ejercicio:</label>
                <select id="exercise-filter" class="filter-select" disabled>
                    <option value="">Todos los ejercicios</option>
                </select>
            </div>

            <div class="filter-group">
                <label for="session-filter">Sesión:</label>
                <select id="session-filter" class="filter-select" disabled>
                    <option value="">Todas las sesiones</option>
                    <option value="range">Rango de fechas</option>
                </select>
            </div>
        </div>


            <div id="date-range-container" class="filter-section date-range-container hidden"  style="margin-top: 10px;">
   
            <div style="margin-top: 10; padding-top: 0;">
                <input type="date" id="start-date" class="date-input">
                <span>hasta</span>
                <input type="date" id="end-date" class="date-input">
                <button id="apply-range" class="btn-apply">Aplicar</button>
                </div>
            </div>


        <div id="global-filter" class="filter-section hidden" style="margin-top: 0; padding-top: 0;">     
            
            <div class="filter-group">
                <br>      
                <button id="global-leaderboard-btn" class="exercise-btn" disabled>
                    Ver Clasificación Global
                </button>
            </div>
        </div>

        <div id="welcome-message" class="welcome-message">
            <h2>👋 Bienvenido</h2>
            <p>Selecciona una categoría para comenzar a ver los rankings</p>
        </div>

        <div id="content-container" class="hidden">
            <div class="exercise-selector"></div>

            <div id="exercise-view">
                <div class="podium-container">
                    <div class="podium-wrapper">
                        <div class="podium-place second">
                            <div class="medal">🥈</div>
                            <div class="person-name"></div>
                            <div class="reps"></div>
                            <div class="podium-base base-silver">2</div>
                        </div>
                        <div class="podium-place first">
                            <div class="medal">🥇</div>
                            <div class="person-name"></div>
                            <div class="reps"></div>
                            <div class="podium-base base-gold">1</div>
                        </div>
                        <div class="podium-place third">
                            <div class="medal">🥉</div>
                            <div class="person-name"></div>
                            <div class="reps"></div>
                            <div class="podium-base base-bronze">3</div>
                        </div>
                    </div>
                </div>

                <div class="leaderboard">
                    <h2>Ranking Completo</h2>
                    <div class="leaderboard-list"></div>
                </div>
            </div>

            <div id="global-view" class="hidden">
                <div class="global-header">
                    <h2>🏆 Clasificación Global - <span id="global-category"></span></h2>
                    <p class="global-description">Sistema de puntos ponderado + conteo de medallas por ejercicio</p>
                </div>
                <div class="leaderboard">
                    <div class="leaderboard-list" id="global-leaderboard-list"></div>
                </div>
            </div>
        </div>
    `;

    setupEventListeners();
    showWelcomeMessage();
}

function setupEventListeners() {
    const categoryFilter = document.getElementById('category-filter');
    const exerciseFilter = document.getElementById('exercise-filter');
    const sessionFilter = document.getElementById('session-filter');
    const globalBtn = document.getElementById('global-leaderboard-btn');
    const applyBtn = document.getElementById('apply-range');

    categoryFilter.addEventListener('change', () => {
        const category = categoryFilter.value;

        if (!category) {
            showWelcomeMessage();

            exerciseFilter.disabled = true;
            sessionFilter.disabled = true;
            globalBtn.disabled = true;
            return;
        }

        exerciseFilter.disabled = false;
        sessionFilter.disabled = false;
        globalBtn.disabled = false;

        populateExerciseFilter(category);
        populateSessionFilter(category, exerciseFilter.value);

        showGlobalLeaderboard = false;
        updateView();
    });

    exerciseFilter.addEventListener('change', () => {
        const category = categoryFilter.value;
        populateSessionFilter(category, exerciseFilter.value);
        showGlobalLeaderboard = false;
        updateView();
    });

    sessionFilter.addEventListener('change', () => {
        const value = sessionFilter.value;
        const dateRangeContainer = document.getElementById('date-range-container');
        const globalFilter = document.getElementById('global-filter');

        if (value === 'range') {
            dateRangeContainer.classList.remove('hidden');
            globalFilter.classList.add('hidden'); // Hide global filter until we have valid dates
            viewMode = 'range';
            // Hide ranking/content until dates are selected
            document.getElementById('date-range-container').classList.remove('hidden');
            document.getElementById('content-container').classList.add('hidden');
            document.getElementById('global-view').classList.add('hidden');
        } else {
            dateRangeContainer.classList.add('hidden');
            viewMode = value === '' ? 'all' : 'single';
            showGlobalLeaderboard = false;
            updateView();
        }
    });
    if (applyBtn) {
        applyBtn.addEventListener('click', () => {
            dateRange.start = document.getElementById('start-date').value;
            dateRange.end = document.getElementById('end-date').value;
            const globalFilter = document.getElementById('global-filter');

            if (dateRange.start && dateRange.end) {
                showGlobalLeaderboard = false;
                globalFilter.classList.remove('hidden');
                updateView();
            }
        });
    }

    globalBtn.addEventListener('click', () => {
        showGlobalLeaderboard = !showGlobalLeaderboard;
        globalBtn.textContent = showGlobalLeaderboard ? 'Ver Ejercicios Individuales' : 'Ver Clasificación Global';
        globalBtn.classList.toggle('active', showGlobalLeaderboard);
        updateView();
    });
}

function showWelcomeMessage() {
    document.getElementById('welcome-message').classList.remove('hidden');
    document.getElementById('content-container').classList.add('hidden');
    document.getElementById('global-filter').classList.add('hidden');
}

function hideWelcomeMessage() {
    document.getElementById('welcome-message').classList.add('hidden');
    document.getElementById('content-container').classList.remove('hidden');
    document.getElementById('global-filter').classList.remove('hidden');
}

function updateView() {
    const category = document.getElementById('category-filter').value;

    if (!category) {
        showWelcomeMessage();
        return;
    }

    hideWelcomeMessage();

    const exerciseSelector = document.querySelector('.exercise-selector');

    // If in range mode and dates not selected, only show range input, hide rankings
    if (viewMode === 'range' && (!dateRange.start || !dateRange.end)) {
        document.getElementById('exercise-view').classList.add('hidden');
        document.getElementById('global-view').classList.add('hidden');
        if (exerciseSelector) exerciseSelector.classList.add('hidden');
        return;
    }

    if (showGlobalLeaderboard) {
        document.getElementById('exercise-view').classList.add('hidden');
        document.getElementById('global-view').classList.remove('hidden');
        if (exerciseSelector) exerciseSelector.classList.add('hidden');
        displayGlobalLeaderboard();
    } else {
        document.getElementById('exercise-view').classList.remove('hidden');
        document.getElementById('global-view').classList.add('hidden');
        if (exerciseSelector) exerciseSelector.classList.remove('hidden');
        updateExerciseButtons();

        if (currentExerciseName) {
            displayExercise(currentExerciseName);
        } else {
            const sessions = getFilteredSessions();
            const exercisesSet = new Set();
            sessions.forEach(s => s.exercises.forEach(ex => exercisesSet.add(ex.exercise)));
            const firstExercise = [...exercisesSet][0];
            if (firstExercise) {
                currentExerciseName = firstExercise;
                displayExercise(firstExercise);
            }
        }
    }
}

function populateExerciseFilter(selectedCategory) {
    const exerciseFilter = document.getElementById('exercise-filter');
    const exercisesSet = new Set();

    data.sessions.forEach(session => {
        if (session.category === selectedCategory) {
            session.exercises.forEach(ex => exercisesSet.add(ex.exercise));
        }
    });

    exerciseFilter.innerHTML = `
        <option value="">Todos los ejercicios</option>
        ${[...exercisesSet].map(ex => `<option value="${ex}">${ex}</option>`).join('')}
    `;
}

function populateSessionFilter(selectedCategory, selectedExercise = '') {
    const sessionFilter = document.getElementById('session-filter');

    const filteredSessions = data.sessions.filter(s => {
        if (s.category !== selectedCategory) return false;
        if (selectedExercise && !s.exercises.some(ex => ex.exercise === selectedExercise)) return false;
        return true;
    });

    sessionFilter.innerHTML = `
        <option value="">Todas las sesiones</option>
        ${filteredSessions.map((s, i) => {
        const originalIndex = data.sessions.indexOf(s);
        return `<option value="${originalIndex}">${formatDate(s.date)} - ${s.time}</option>`;
    }).join('')}
        <option value="range">Rango de fechas</option>
    `;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
}

function parseReps(reps) {
    if (typeof reps === 'number') return { value: reps, modifier: '' };
    const match = reps.toString().match(/^(\d+)([A-Z]?)$/);
    if (match) return { value: parseInt(match[1]), modifier: match[2] };
    return { value: 0, modifier: '' };
}

function getFilteredSessions() {
    const category = document.getElementById('category-filter').value;
    const exercise = document.getElementById('exercise-filter').value;
    const sessionValue = document.getElementById('session-filter').value;

    if (!category) return [];

    let sessions = data.sessions.filter(s => s.category === category);

    // Filter by specific session
    if (sessionValue && sessionValue !== 'range') {
        const sessionIndex = parseInt(sessionValue);
        sessions = [data.sessions[sessionIndex]];
    }

    // Filter by date range
    if (viewMode === 'range' && dateRange.start && dateRange.end) {
        const start = new Date(dateRange.start);
        const end = new Date(dateRange.end);
        sessions = sessions.filter(s => {
            const d = new Date(s.date);
            return d >= start && d <= end;
        });
    }

    // Filter by exercise
    if (exercise) {
        sessions = sessions.filter(s => s.exercises.some(ex => ex.exercise === exercise));
    }

    return sessions;
}

function updateExerciseButtons() {
    const exerciseSelector = document.querySelector('.exercise-selector');
    const exerciseFilter = document.getElementById('exercise-filter').value;

    exerciseSelector.innerHTML = '';

    const sessions = getFilteredSessions();
    const exercisesSet = new Set();

    sessions.forEach(s => {
        s.exercises.forEach(ex => {
            if (!exerciseFilter || ex.exercise === exerciseFilter) {
                exercisesSet.add(ex.exercise);
            }
        });
    });

    [...exercisesSet].forEach(exerciseName => {
        const btn = document.createElement('button');
        btn.className = 'exercise-btn' + (exerciseName === currentExerciseName ? ' active' : '');
        btn.textContent = exerciseName;
        btn.addEventListener('click', () => {
            currentExerciseName = exerciseName;
            displayExercise(exerciseName);
            document.querySelectorAll('.exercise-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
        exerciseSelector.appendChild(btn);
    });

    // Auto-select first exercise if current is not available
    if (!exercisesSet.has(currentExerciseName) && exercisesSet.size > 0) {
        currentExerciseName = [...exercisesSet][0];
    }
}

function aggregateResultsByName(exerciseName) {
    const filteredSessions = getFilteredSessions();
    const aggregated = {};

    filteredSessions.forEach(session => {
        session.exercises
            .filter(ex => ex.exercise === exerciseName)
            .forEach(exercise => {
                exercise.results.forEach(result => {
                    const parsed = parseReps(result.reps);
                    if (!aggregated[result.person]) {
                        aggregated[result.person] = { person: result.person, total: 0, count: 0, max: 0, sessions: [] };
                    }
                    aggregated[result.person].total += parsed.value;
                    aggregated[result.person].count += 1;
                    aggregated[result.person].max = Math.max(aggregated[result.person].max, parsed.value);
                    aggregated[result.person].sessions.push({ date: session.date, reps: result.reps, parsed });
                });
            });
    });

    return Object.values(aggregated).map(person => ({
        person: person.person,
        reps: viewMode === 'single' ? person.max : Math.round(person.total / person.count),
        max: person.max,
        average: Math.round(person.total / person.count),
        sessions: person.sessions
    }));
}

function sortResults(results) {
    return [...results].sort((a, b) => b.reps - a.reps);
}

function displayExercise(exerciseName) {
    currentExerciseName = exerciseName;
    const results = aggregateResultsByName(exerciseName);
    displayPodium(results);
    displayLeaderboard(results);
}

function displayPodium(results) {
    const sorted = sortResults(results);
    const podiumPlaces = document.querySelectorAll('.podium-place');
    const positions = [1, 0, 2];

    positions.forEach((index, i) => {
        const place = podiumPlaces[i];

        if (sorted[index]) {
            const result = sorted[index];
            place.style.display = '';
            place.querySelector('.person-name').textContent = result.person;

            if (viewMode === 'single') {
                const parsed = parseReps(result.reps);
                place.querySelector('.reps').textContent = `${parsed.value} reps${parsed.modifier ? ' ' + parsed.modifier : ''}`;
            } else {
                place.querySelector('.reps').innerHTML = `
                    <div>${result.average} reps <span style="font-size: 0.6em; opacity: 0.8;">(promedio)</span></div>
                    <div style="font-size: 0.7em; opacity: 0.8;">Máx: ${result.max}</div>
                `;
            }

            place.style.animation = 'none';
            setTimeout(() => place.style.animation = `slideUp 0.8s ease ${i * 0.2}s both`, 10);
        } else {
            place.style.display = 'none';
        }
    });
}

function displayLeaderboard(results) {
    const sorted = sortResults(results);
    const leaderboardList = document.querySelector('#exercise-view .leaderboard-list');

    if (!leaderboardList) return;

    leaderboardList.innerHTML = '';

    if (sorted.length === 0) {
        leaderboardList.innerHTML = `
            <div style="text-align: center; padding: 40px; color: rgba(255, 255, 255, 0.6);">
                <p style="font-size: 1.2em;">No hay resultados para mostrar</p>
                <p>Ajusta los filtros para ver datos</p>
            </div>
        `;
        return;
    }

    sorted.forEach((result, index) => {
        const item = document.createElement('div');
        item.className = 'leaderboard-item clickable';
        item.style.animationDelay = `${index * 0.05}s`;
        item.onclick = () => openUserProfile(result.person);

        const rankEmoji = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1;

        if (viewMode === 'single') {
            const parsed = parseReps(result.reps);
            item.innerHTML = `<div class="rank">${rankEmoji}</div>
                              <div class="name">${result.person}</div>
                              <div class="score">${parsed.value}<span class="modifier">${parsed.modifier}</span></div>`;
        } else {
            item.innerHTML = `<div class="rank">${rankEmoji}</div>
                              <div class="name">${result.person}</div>
                              <div class="score-multi">
                                  <div>${result.average} <span class="label">promedio</span></div>
                                  <div class="max-score">${result.max} <span class="label">máx</span></div>
                              </div>`;
        }
        leaderboardList.appendChild(item);
    });
}

function calculateGlobalPoints() {
    const sessions = getFilteredSessions();
    const exercisesSet = new Set();
    const globalScores = {};

    // Get all exercises
    sessions.forEach(s => s.exercises.forEach(ex => exercisesSet.add(ex.exercise)));

    // Calculate points for each exercise
    [...exercisesSet].forEach(exerciseName => {
        const results = aggregateResultsByName(exerciseName);
        const sorted = sortResults(results);
        const totalParticipants = sorted.length;

        sorted.forEach((result, index) => {
            // More dynamic point system based on total participants
            // 1st place gets 100% of max points, decreasing proportionally
            const maxPoints = 100;
            const pointsPercentage = 1 - (index / totalParticipants);
            const points = Math.round(maxPoints * pointsPercentage * pointsPercentage); // Squared for steeper curve

            if (!globalScores[result.person]) {
                globalScores[result.person] = { person: result.person, totalPoints: 0, exercises: {}, medals: { gold: 0, silver: 0, bronze: 0 } };
            }

            globalScores[result.person].totalPoints += points;
            globalScores[result.person].exercises[exerciseName] = {
                position: index + 1,
                points: points,
                reps: result.reps
            };

            // Count medals
            if (index === 0) globalScores[result.person].medals.gold++;
            else if (index === 1) globalScores[result.person].medals.silver++;
            else if (index === 2) globalScores[result.person].medals.bronze++;
        });
    });

    return Object.values(globalScores).sort((a, b) => b.totalPoints - a.totalPoints);
}

function displayGlobalLeaderboard() {
    const category = document.getElementById('category-filter').value;
    document.getElementById('global-category').textContent = category;

    const globalScores = calculateGlobalPoints();
    const leaderboardList = document.getElementById('global-leaderboard-list');
    leaderboardList.innerHTML = '';

    if (globalScores.length === 0) {
        leaderboardList.innerHTML = `
            <div style="text-align: center; padding: 40px; color: rgba(255, 255, 255, 0.6);">
                <p style="font-size: 1.2em;">No hay resultados para mostrar</p>
            </div>
        `;
        return;
    }

    globalScores.forEach((score, index) => {
        const item = document.createElement('div');
        item.className = 'leaderboard-item global-item clickable';
        item.style.animationDelay = `${index * 0.05}s`;
        item.onclick = () => openUserProfile(score.person);

        const rankEmoji = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1;
        const exerciseCount = Object.keys(score.exercises).length;

        // Build medals display
        let medalsHTML = '';
        if (score.medals.gold > 0) medalsHTML += `<span style="margin-right: 8px;">🥇×${score.medals.gold}</span>`;
        if (score.medals.silver > 0) medalsHTML += `<span style="margin-right: 8px;">🥈×${score.medals.silver}</span>`;
        if (score.medals.bronze > 0) medalsHTML += `<span>🥉×${score.medals.bronze}</span>`;

        item.innerHTML = `
            <div class="rank">${rankEmoji}</div>
            <div class="name">
                ${score.person}
                ${medalsHTML ? `<div style="font-size: 0.75em; margin-top: 4px; opacity: 0.9;">${medalsHTML}</div>` : ''}
            </div>
            <div class="score-multi">
                <div class="global-points">${score.totalPoints} pts</div>
                <div class="exercise-count">${exerciseCount} ejercicio${exerciseCount !== 1 ? 's' : ''}</div>
            </div>
        `;

        leaderboardList.appendChild(item);
    });
}

function openUserProfile(personName) {
    window.location.href = `user.html?name=${encodeURIComponent(personName)}`;
}

document.addEventListener('DOMContentLoaded', loadData);