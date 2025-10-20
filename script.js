let data = null;
let currentExerciseIndex = 0;
let currentSessionIndex = 0;
let viewMode = 'single'; // 'single', 'all', 'range'
let dateRange = { start: null, end: null };

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
    const sessions = getFilteredSessions();
    const currentSession = sessions[currentSessionIndex] || sessions[0];

    container.innerHTML = `
        <header>
            <div class="logo-container">
                <img src="logo.jpg" alt="Calistenia Valencia Logo" class="logo" onerror="this.style.display='none'">
            </div>
            <h1><span class="brand-calistenia">CALISTENIA</span><br><span class="brand-valencia">VALENCIA</span></h1>
            <p class="subtitle">${currentSession ? `${currentSession.activity_type} - ${currentSession.category}` : ''}</p>
            <div class="session-info">
                ${currentSession ? `
                <span class="info-item">📅 ${formatDate(currentSession.date)}</span>
                <span class="info-item">🕐 ${currentSession.time}</span>
                ${data.location ? `<span class="info-item">📍 ${data.location}</span>` : ''}` : ''}
            </div>
        </header>

        <div class="filter-section">
            <div class="filter-group">
                <label for="category-filter">Categoría:</label>
                <select id="category-filter" class="filter-select">
                    <option value="">Todas</option>
                    ${[...new Set(data.sessions.map(s => s.category))].map(cat => `<option value="${cat}">${cat}</option>`).join('')}
                </select>
            </div>

            <div class="filter-group">
                <label for="exercise-filter">Ejercicio:</label>
                <select id="exercise-filter" class="filter-select">
                    <option value="">Todos</option>
                </select>
            </div>

            <div class="filter-group">
                <label for="session-filter">Sesión:</label>
                <select id="session-filter" class="filter-select">
                    <option value="">Todas</option>
                </select>
            </div>

            <div class="filter-group">
                <label>Ver:</label>
                <select id="view-mode" class="filter-select">
                    <option value="single">Sesión Individual</option>
                    <option value="all">Todas las Sesiones</option>
                    <option value="range">Rango de Fechas</option>
                </select>
            </div>

            <div id="date-range-container" class="date-range-container hidden">
                <input type="date" id="start-date" class="date-input">
                <span>hasta</span>
                <input type="date" id="end-date" class="date-input">
                <button id="apply-range" class="btn-apply">Aplicar</button>
            </div>
        </div>

        <div class="exercise-selector"></div>

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
    `;

    setupEventListeners();
    populateExerciseFilter();
    populateSessionFilter();
    updateExerciseButtons();
    displayExercise(currentExerciseIndex);
}

function setupEventListeners() {
    document.getElementById('view-mode').addEventListener('change', handleViewModeChange);
    const applyBtn = document.getElementById('apply-range');
    if (applyBtn) applyBtn.addEventListener('click', handleDateRangeApply);

    const categoryFilter = document.getElementById('category-filter');
    const exerciseFilter = document.getElementById('exercise-filter');
    const sessionFilter = document.getElementById('session-filter');

    categoryFilter.addEventListener('change', () => {
        populateExerciseFilter(categoryFilter.value);
        populateSessionFilter(categoryFilter.value, exerciseFilter.value);
        updateExerciseButtons();
        displayExercise(currentExerciseIndex);
    });

    exerciseFilter.addEventListener('change', () => {
        populateSessionFilter(categoryFilter.value, exerciseFilter.value);
        updateExerciseButtons();
        displayExercise(currentExerciseIndex);
    });

    sessionFilter.addEventListener('change', () => {
        currentSessionIndex = sessionFilter.value !== '' ? parseInt(sessionFilter.value) : 0;
        updateExerciseButtons();
        displayExercise(currentExerciseIndex);
    });
}

function handleViewModeChange() {
    viewMode = this.value;
    const dateRangeContainer = document.getElementById('date-range-container');

    if (viewMode === 'range') dateRangeContainer.classList.remove('hidden');
    else dateRangeContainer.classList.add('hidden');

    displayExercise(currentExerciseIndex);
}

function handleDateRangeApply() {
    dateRange.start = document.getElementById('start-date').value;
    dateRange.end = document.getElementById('end-date').value;
    displayExercise(currentExerciseIndex);
}

function populateExerciseFilter(selectedCategory = '') {
    const exerciseFilter = document.getElementById('exercise-filter');
    const exercisesSet = new Set();

    data.sessions.forEach(session => {
        if (!selectedCategory || session.category === selectedCategory) {
            session.exercises.forEach(ex => exercisesSet.add(ex.exercise));
        }
    });

    exerciseFilter.innerHTML = `
        <option value="">Todos</option>
        ${[...exercisesSet].map(ex => `<option value="${ex}">${ex}</option>`).join('')}
    `;
}
function populateSessionFilter(selectedCategory = '', selectedExercise = '') {
    const sessionFilter = document.getElementById('session-filter');

    const filteredSessions = data.sessions.filter(s => {
        if (selectedCategory && s.category !== selectedCategory) return false;
        if (selectedExercise && !s.exercises.some(ex => ex.exercise === selectedExercise)) return false;
        return true;
    });

    sessionFilter.innerHTML = `
        <option value="">Todas</option>
        ${filteredSessions.map((s, i) => `<option value="${i}">${formatDate(s.date)} - ${s.time}</option>`).join('')}
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
    const category = document.getElementById('category-filter')?.value || '';
    const exercise = document.getElementById('exercise-filter')?.value || '';
    const sessionIndex = document.getElementById('session-filter')?.value || '';

    let sessions = data.sessions;

    // Only filter by range
    if (viewMode === 'range' && dateRange.start && dateRange.end) {
        const start = new Date(dateRange.start);
        const end = new Date(dateRange.end);
        sessions = sessions.filter(s => {
            const d = new Date(s.date);
            return d >= start && d <= end;
        });
    }

    // Filter by category
    if (category) sessions = sessions.filter(s => s.category === category);

    // Filter by session dropdown
    if (sessionIndex !== '') sessions = [data.sessions[parseInt(sessionIndex)]];

    // Filter by exercise if selected
    if (exercise) {
        sessions = sessions.filter(s => s.exercises.some(ex => ex.exercise === exercise));
    }

    return sessions;
}

function getExerciseName(index) {
    const sessions = getFilteredSessions();
    if (!sessions.length) return '';
    const exercises = sessions[0].exercises.map(ex => ex.exercise);
    return exercises[index] || '';
}

function aggregateResults(exerciseIndex) {
    const filteredSessions = getFilteredSessions();
    const selectedExercise = document.getElementById('exercise-filter')?.value || getExerciseName(exerciseIndex);
    const aggregated = {};

    filteredSessions.forEach(session => {
        const exercise = session.exercises.find(ex => ex.exercise === selectedExercise);
        if (!exercise) return;

        exercise.results.forEach(result => {
            const parsed = parseReps(result.reps);
            if (!aggregated[result.person]) aggregated[result.person] = { total: 0, count: 0, max: 0, sessions: [], person: result.person };
            aggregated[result.person].total += parsed.value;
            aggregated[result.person].count += 1;
            aggregated[result.person].max = Math.max(aggregated[result.person].max, parsed.value);
            aggregated[result.person].sessions.push({ date: session.date, reps: result.reps, parsed });
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

function displayPodium(results) {
    const sorted = sortResults(results);
    const podiumPlaces = document.querySelectorAll('.podium-place');
    const positions = [1, 0, 2];

    positions.forEach((index, i) => {
        const place = podiumPlaces[i];
        if (sorted[index]) {
            const result = sorted[index];
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
        }
    });
}

function displayLeaderboard(results) {
    const sorted = sortResults(results);
    const leaderboardList = document.querySelector('.leaderboard-list');
    leaderboardList.innerHTML = '';

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
let currentExerciseName = ''; // track by name

function updateExerciseButtons() {
    const exerciseSelector = document.querySelector('.exercise-selector');
    exerciseSelector.innerHTML = '';

    const sessions = getFilteredSessions();
    const exercisesSet = new Set();
    sessions.forEach(s => s.exercises.forEach(ex => exercisesSet.add(ex.exercise)));

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
}
function displayExercise(exerciseName) {
    if (!exerciseName && currentExerciseName) exerciseName = currentExerciseName;
    currentExerciseName = exerciseName;

    const results = aggregateResultsByName(exerciseName);
    displayPodium(results);
    displayLeaderboard(results);
    updateExerciseButtons();
}

function aggregateResultsByName(exerciseName) {
    const filteredSessions = getFilteredSessions();
    const selectedExercise = exerciseName || currentExerciseName;
    const aggregated = {};

    filteredSessions.forEach(session => {
        session.exercises
            .filter(ex => ex.exercise === selectedExercise)
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

function openUserProfile(personName) {
    window.location.href = `user.html?name=${encodeURIComponent(personName)}`;
}

document.addEventListener('DOMContentLoaded', loadData);
