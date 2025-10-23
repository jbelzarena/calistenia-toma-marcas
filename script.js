let data = null;
let currentExerciseName = '';
let viewMode = 'single';
let dateRange = { start: null, end: null };
let showGlobalLeaderboard = false;

// Resistance band color mapping
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
    'VN': 0.5     // Most supportive, biggest penalty
};


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
            <img src="logo.png" alt="Calistenia Valencia Logo" class="logo">
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
    <p class="global-description">
      <b>Resumen:</b> Cada semana se cuenta solo tu mejor marca en cada ejercicio. Si usas goma de asistencia, tu resultado tiene penalización según el nivel de ayuda. Sumas puntos y medallas (🥇🥈🥉) por quedar en el top 3. <br>
      <span style="color:#7ac242;font-weight:bold;">¡Mejora tus marcas y usa menos goma para avanzar más!</span>
      <button class="details-toggle"
         onclick="document.getElementById('global-details').classList.toggle('hidden');
                  this.textContent = this.textContent === '¿Cómo funciona?' ? 'Ocultar detalle' : '¿Cómo funciona?';"
         style="margin-left:20px;">¿Cómo funciona?</button>
    </p>
    <div id="global-details" class="global-details hidden" style="margin-top:10px; background:rgba(255,255,255,0.10); border-radius:6px; padding:14px;">
      <ul style="margin-top:0;">
        <li><b>Cada ejercicio es un mini ranking semanal:</b> de todas tus participaciones esa semana en ese ejercicio, solo tu mejor marca cuenta para puntos.</li>
        <li><b>Penalización por goma:</b> si usas goma para ayudarte, la puntuación de ese resultado baja según la cantidad/color de asistencia. Cuanta más ayuda, menos puntos.
          <br>
          <b>Penalizaciones de menor a mayor:</b>
          🟡 Amarilla <b>&lt;</b> 🔴 Roja <b>&lt;</b> ⚫ Negra <b>&lt;</b> 🟣 Morada <b>&lt;</b> 🟢 Verde
        </li>
        <li><b>Puntos:</b> Cada semana, los resultados (ya con penalización) se ordenan y se reparten puntos:
          <ul>
            <li>El mejor resultado en el grupo semanal obtiene <b>100 puntos</b>.</li>
            <li>Los siguientes reciben menos puntos, según su posición y número de participantes.</li>
          </ul>
        </li>
        <li><b>Medallas:</b> Si quedas entre los <b>3 primeros</b> en cualquier ejercicio/semana, recibes una medalla virtual junto a tu nombre:
          🥇 para el primero, 🥈 segundo, 🥉 tercero.
        </li>
        <li><b>Ranking final:</b> Suma todos tus puntos y medallas acumulados cada semana y ejercicio.
          <br>
          Entre más participes, mejores tus marcas y reduzcas la asistencia, más alto estarás en la clasificación global.
        </li>
      </ul>
    </div>
  </div>
</div>
                <div class="leaderboard">
                    <div class="leaderboard-list" id="global-leaderboard-list"></div>
                </div>
            </div>
        </div>
    `;
    // Hide or show expandable details
    if (!window.detailsToggleCssInjected) {
        const style = document.createElement('style');
        style.innerHTML = '.global-details.hidden { display:none; } .details-toggle{background:transparent;color:#2391ff;border:1px solid #2391ff;border-radius:6px;font-weight:bold;cursor:pointer;padding:2px 10px;font-size:1em;}';
        document.head.appendChild(style);
        window.detailsToggleCssInjected = true;
    }
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
            globalFilter.classList.add('hidden');
            viewMode = 'range';
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

// NEW: Format goma badge HTML
function getGomaBadge(gomaCode) {
    if (!gomaCode || !GOMA_COLORS[gomaCode]) return '';
    const goma = GOMA_COLORS[gomaCode];
    return `<span class="goma-badge" style="background-color: ${goma.color};" title="Goma ${goma.name}">${goma.emoji}</span>`;
}

function getFilteredSessions() {
    const category = document.getElementById('category-filter').value;
    const exercise = document.getElementById('exercise-filter').value;
    const sessionValue = document.getElementById('session-filter').value;

    if (!category) return [];

    let sessions = data.sessions.filter(s => s.category === category);

    if (sessionValue && sessionValue !== 'range') {
        const sessionIndex = parseInt(sessionValue);
        sessions = [data.sessions[sessionIndex]];
    }

    if (viewMode === 'range' && dateRange.start && dateRange.end) {
        const start = new Date(dateRange.start);
        const end = new Date(dateRange.end);
        sessions = sessions.filter(s => {
            const d = new Date(s.date);
            return d >= start && d <= end;
        });
    }

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

    if (!exercisesSet.has(currentExerciseName) && exercisesSet.size > 0) {
        currentExerciseName = [...exercisesSet][0];
    }
}

// UPDATED: Aggregate results now includes goma information
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
                        aggregated[result.person] = {
                            person: result.person,
                            total: 0,
                            count: 0,
                            max: 0,
                            sessions: [],
                            goma: result.goma || null // Store goma info
                        };
                    }
                    aggregated[result.person].total += parsed.value;
                    aggregated[result.person].count += 1;

                    // Update max and goma for the max rep
                    if (parsed.value > aggregated[result.person].max) {
                        aggregated[result.person].max = parsed.value;
                        aggregated[result.person].maxGoma = result.goma || null;
                    }

                    aggregated[result.person].sessions.push({
                        date: session.date,
                        reps: result.reps,
                        parsed,
                        goma: result.goma || null
                    });
                });
            });
    });

    return Object.values(aggregated).map(person => ({
        person: person.person,
        reps: viewMode === 'single' ? person.max : Math.round(person.total / person.count),
        max: person.max,
        average: Math.round(person.total / person.count),
        sessions: person.sessions,
        goma: viewMode === 'single' ? person.maxGoma : null // Show goma for max rep in single view
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

// UPDATED: Display podium with goma badges
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
                const gomaBadge = getGomaBadge(result.goma);
                place.querySelector('.reps').innerHTML = `${gomaBadge} ${parsed.value} reps${parsed.modifier ? ' ' + parsed.modifier : ''} `;
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
            const gomaBadge = getGomaBadge(result.goma);
            item.innerHTML = `<div class="rank">${rankEmoji}</div>
                <div class="name">${result.person}</div>
                <div class="score" style="display: flex; align-items: center; justify-content: flex-end;">
                    ${gomaBadge ? `<span class="goma-badge-container">${gomaBadge}</span>` : ""}
                    <span class="score-number" style="min-width: 40px; text-align: right;">${parsed.value}<span class="modifier">${parsed.modifier}</span></span>
                </div>`;
        } else {
            item.innerHTML = `<div class="rank">${rankEmoji}</div>
                <div class="name">${result.person}</div>
                <div class="score-multi" style="text-align: right;">
                    <div>${result.average} <span class="label">promedio</span></div>
                    <div class="max-score">${result.max} <span class="label">máx</span></div>
                </div>`;
        }
        leaderboardList.appendChild(item);
    });
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

function getISOWeek(dateStr) {
    const date = new Date(dateStr);
    const temp = new Date(date.getTime());
    temp.setHours(0, 0, 0, 0);
    // Thursday in current week decides the year
    temp.setDate(temp.getDate() + 3 - ((temp.getDay() + 6) % 7));
    // January 4 is always in week 1
    const week1 = new Date(temp.getFullYear(), 0, 4);
    // Adjust to Thursday in week 1 and count number of weeks from week1 to temp
    return temp.getFullYear() + '-W' +
        String(1 + Math.round(((temp.getTime() - week1.getTime()) / 86400000
            - 3 + ((week1.getDay() + 6) % 7)) / 7)).padStart(2, '0');
}

function calculateGlobalPoints() {
    const sessions = getFilteredSessions();
    const exercisesSet = new Set();
    const globalScores = {};

    // Gather all exercises
    sessions.forEach(s => s.exercises.forEach(ex => exercisesSet.add(ex.exercise)));

    // Map: exercise -> week -> user -> best reps
    let weeklyExerciseData = {};
    sessions.forEach(session => {
        session.exercises.forEach(exerciseObj => {
            let exerciseName = exerciseObj.exercise;
            exerciseObj.results.forEach(result => {
                let week = getISOWeek(session.date);
                if (!weeklyExerciseData[exerciseName]) weeklyExerciseData[exerciseName] = {};
                if (!weeklyExerciseData[exerciseName][week]) weeklyExerciseData[exerciseName][week] = {};
                let reps = parseInt(result.reps) || 0;
                if (!weeklyExerciseData[exerciseName][week][result.person] || weeklyExerciseData[exerciseName][week][result.person] < reps) {
                    weeklyExerciseData[exerciseName][week][result.person] = reps;
                }
            });
        });
    });

    // Now, for each exercise, for each week: rank users & assign points
    Object.keys(weeklyExerciseData).forEach(exerciseName => {
        Object.keys(weeklyExerciseData[exerciseName]).forEach(week => {
            let userReps = weeklyExerciseData[exerciseName][week];
            let usersArr = Object.entries(userReps)
                .map(([person, reps]) => ({ person, reps }));
            usersArr.sort((a, b) => b.reps - a.reps); // best to worst
            let totalParticipants = usersArr.length;

            usersArr.forEach((entry, index) => {
                // Example: linear points out of 100, depending on their rank.
                const points = Math.round(100 * (totalParticipants - index - 1) / (totalParticipants - 1 || 1));
                if (!globalScores[entry.person]) {
                    globalScores[entry.person] = {
                        person: entry.person,
                        totalPoints: 0,
                        exercises: {},
                        medals: { gold: 0, silver: 0, bronze: 0 }
                    };
                }
                globalScores[entry.person].totalPoints += points;
                // Optional: record by exercise/week (for later display)
                if (!globalScores[entry.person].exercises[exerciseName]) globalScores[entry.person].exercises[exerciseName] = 0;
                globalScores[entry.person].exercises[exerciseName] += points;

                // Medals
                if (index === 0) globalScores[entry.person].medals.gold++;
                else if (index === 1) globalScores[entry.person].medals.silver++;
                else if (index === 2) globalScores[entry.person].medals.bronze++;
            });
        });
    });

    // Final leaderboard order by points
    return Object.values(globalScores).sort((a, b) => b.totalPoints - a.totalPoints);
}


function openUserProfile(personName) {
    window.location.href = `user.html?name=${encodeURIComponent(personName)}`;
}

document.addEventListener('DOMContentLoaded', loadData);
