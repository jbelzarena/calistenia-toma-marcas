let data = null;
let currentExerciseName = '';
let viewMode = 'single';
let dateRange = { start: null, end: null };
let showGlobalLeaderboard = false;
let showImprovementRanking = false;

// GOMA_COLORS and GOMA_PENALTY move to calculations.js

let currentExerciseData = null; // Store current leaderboard data
let currentExerciseId = null;
let currentSortMode = 'reps'; // 'reps' or 'name'


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
        
        <div class="search-container">
            <div class="search-wrapper">
                <span class="search-icon">🔍</span>
                <input type="text" id="search-input" placeholder="Buscar atleta por nombre..." autocomplete="off">
            </div>
            <div id="search-results" class="search-results hidden"></div>
        </div>

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
                </select>
            </div>

            <div class="filter-group">
                <label for="time-filter">Hora Clase:</label>
                <select id="time-filter" class="filter-select" disabled>
                    <option value="">Todas las horas</option>
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

        <div id="global-filter" class="filter-section hidden" style="margin-top: 0; padding-top: 0; display: flex; gap: 10px; flex-wrap: wrap;">     
            
            <div class="filter-group">
                <br>      
                <button id="global-leaderboard-btn" class="exercise-btn" disabled>
                    🏆 Clasificación Global
                </button>
            </div>

            <div class="filter-group">
                <br>      
                <button id="improvement-ranking-btn" class="exercise-btn" disabled>
                    📈 Ranking de Mejora (%)
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
                    <div class="sort-controls">
                        <span>Ordenar por:</span>
                        <button class="sort-btn active" data-sort="reps">Reps</button>
                        <button class="sort-btn" data-sort="name">Nombre</button>
                    </div>
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
    setupSearch();
    setupSortControls(); // Initialize sort controls
    showWelcomeMessage();
}

function setupSortControls() {
    const buttons = document.querySelectorAll('.sort-btn');
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update active state
            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Update sort mode
            currentSortMode = btn.dataset.sort;

            // Re-render if we have data
            if (currentExerciseData) {
                displayLeaderboard(currentExerciseData);
            }
        });
    });
}

function setupEventListeners() {
    const categoryFilter = document.getElementById('category-filter');
    const exerciseFilter = document.getElementById('exercise-filter');
    const timeFilter = document.getElementById('time-filter');
    const sessionFilter = document.getElementById('session-filter');
    const globalBtn = document.getElementById('global-leaderboard-btn');
    const applyBtn = document.getElementById('apply-range');

    categoryFilter.addEventListener('change', () => {
        const category = categoryFilter.value;

        if (!category) {
            showWelcomeMessage();

            exerciseFilter.disabled = true;
            timeFilter.disabled = true;
            sessionFilter.disabled = true;
            globalBtn.disabled = true;
            document.getElementById('improvement-ranking-btn').disabled = true;
            return;
        }

        exerciseFilter.disabled = false;
        timeFilter.disabled = false;
        sessionFilter.disabled = false;
        globalBtn.disabled = false;
        document.getElementById('improvement-ranking-btn').disabled = false;

        populateExerciseFilter(category);
        populateTimeFilter(category);
        populateSessionFilter(category, exerciseFilter.value, timeFilter.value);

        showGlobalLeaderboard = false;
        updateView();
    });

    exerciseFilter.addEventListener('change', () => {
        const category = categoryFilter.value;
        populateSessionFilter(category, exerciseFilter.value, timeFilter.value);
        showGlobalLeaderboard = false;
        updateView();
    });

    timeFilter.addEventListener('change', () => {
        const category = categoryFilter.value;
        populateSessionFilter(category, exerciseFilter.value, timeFilter.value);
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
        showImprovementRanking = false;

        globalBtn.textContent = showGlobalLeaderboard ? 'Ver Ejercicios Individuales' : '🏆 Clasificación Global';
        globalBtn.classList.toggle('active', showGlobalLeaderboard);

        const impBtn = document.getElementById('improvement-ranking-btn');
        impBtn.textContent = '📈 Ranking de Mejora (%)';
        impBtn.classList.remove('active');

        updateView();
    });

    const impBtn = document.getElementById('improvement-ranking-btn');
    impBtn.addEventListener('click', () => {
        showImprovementRanking = !showImprovementRanking;
        showGlobalLeaderboard = false;

        impBtn.textContent = showImprovementRanking ? 'Ver Ejercicios Individuales' : '📈 Ranking de Mejora (%)';
        impBtn.classList.toggle('active', showImprovementRanking);

        globalBtn.textContent = '🏆 Clasificación Global';
        globalBtn.classList.remove('active');

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
    } else if (showImprovementRanking) {
        document.getElementById('exercise-view').classList.add('hidden');
        document.getElementById('global-view').classList.remove('hidden');
        if (exerciseSelector) exerciseSelector.classList.add('hidden');
        displayImprovementRanking();
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
            sessions.forEach(s => s.exercises.forEach(ex => exercisesSet.add(normalizeExerciseName(ex.exercise))));
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
    // Get unique exercise names
    const exercisesSet = new Set();
    data.sessions.forEach(session => {
        if (session.category === selectedCategory) { // Keep category filter
            session.exercises.forEach(ex => {
                const normalized = normalizeExerciseName(ex.exercise);
                exercisesSet.add(normalized);
                // Also update the exercise name in the data object for consistency
                ex.exercise = normalized;
            });
        }
    });

    exerciseFilter.innerHTML = `
        <option value="">Todos los ejercicios</option>
        ${[...exercisesSet].map(ex => `<option value="${ex}">${ex}</option>`).join('')}
    `;
}

function populateTimeFilter(selectedCategory) {
    const timeFilter = document.getElementById('time-filter');
    const times = new Set();

    data.sessions.forEach(session => {
        if (session.category === selectedCategory) {
            times.add(session.time);
        }
    });

    // Sort times
    const sortedTimes = [...times].sort();

    timeFilter.innerHTML = `
        <option value="">Todas las horas</option>
        ${sortedTimes.map(t => `<option value="${t}">${t}</option>`).join('')}
    `;
}

function populateSessionFilter(selectedCategory, selectedExercise = '', selectedTime = '') {
    const sessionFilter = document.getElementById('session-filter');

    const filteredSessions = data.sessions.filter(s => {
        if (s.category !== selectedCategory) return false;
        if (selectedTime && s.time !== selectedTime) return false;
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

// parseReps and getGomaBadge moved to calculations.js

function getFilteredSessions() {
    const category = document.getElementById('category-filter').value;
    const exercise = document.getElementById('exercise-filter').value;
    const time = document.getElementById('time-filter').value;
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

    if (time) {
        sessions = sessions.filter(s => s.time === time);
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
    const targetExercise = normalizeExerciseName(exerciseName);

    filteredSessions.forEach(session => {
        session.exercises.forEach(exercise => {
            if (normalizeExerciseName(exercise.exercise) === targetExercise) {
                exercise.results.forEach(result => {
                    const personName = normalizePersonName(result.person);
                    const parsed = parseReps(result.reps);

                    if (!aggregated[personName]) {
                        aggregated[personName] = {
                            person: personName,
                            total: 0,
                            count: 0,
                            max: 0,
                            sessions: [],
                            maxGoma: null,
                            maxRodillas: null
                        };
                    }

                    const personData = aggregated[personName];
                    personData.total += parsed.value;
                    personData.count += 1;

                    // Update max
                    if (parsed.value > personData.max) {
                        personData.max = parsed.value;
                        personData.maxGoma = result.goma || null;
                        personData.maxRodillas = result.rodillas || null;
                    } else if (parsed.value === personData.max) {
                        const currentLevel = getAssistanceLevel(personData.maxGoma, personData.maxRodillas);
                        const newLevel = getAssistanceLevel(result.goma, result.rodillas);
                        if (newLevel < currentLevel) {
                            personData.maxGoma = result.goma || null;
                            personData.maxRodillas = result.rodillas || null;
                        }
                    }

                    personData.sessions.push({
                        date: session.date,
                        reps: result.reps,
                        parsed,
                        goma: result.goma || null,
                        rodillas: result.rodillas || null
                    });
                });
            }
        });
    });

    return Object.values(aggregated).map(person => ({
        person: person.person,
        reps: viewMode === 'single' ? person.max : Math.round(person.total / person.count),
        max: person.max,
        average: Math.round(person.total / person.count),
        sessions: person.sessions,
        goma: viewMode === 'single' ? person.maxGoma : null,
        rodillas: viewMode === 'single' ? person.maxRodillas : null
    }));
}

function sortResults(results) {
    return [...results].sort((a, b) => b.reps - a.reps);
}

function displayExercise(exerciseName) {
    currentExerciseName = normalizeExerciseName(exerciseName);
    const results = aggregateResultsByName(currentExerciseName);
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
                const assistanceBadge = getAssistanceBadge(result.goma, result.rodillas);
                place.querySelector('.reps').innerHTML = `${assistanceBadge} ${parsed.value} reps${parsed.modifier ? ' ' + parsed.modifier : ''} `;
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
    // Store current data for re-sorting
    currentExerciseData = results;

    let sorted = [...results];

    if (currentSortMode === 'reps') {
        sorted.sort((a, b) => b.reps - a.reps);
    } else if (currentSortMode === 'name') {
        sorted.sort((a, b) => a.person.localeCompare(b.person));
    }

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
            const assistanceBadge = getAssistanceBadge(result.goma, result.rodillas);
            item.innerHTML = `<div class="rank">${rankEmoji}</div>
                <div class="name">${result.person}</div>
                <div class="profile-link">👉 Ver perfil</div>
                <div class="score" style="display: flex; align-items: center; justify-content: flex-end;">
                    ${assistanceBadge ? `<span class="goma-badge-container">${assistanceBadge}</span>` : ""}
                    <span class="score-number" style="min-width: 40px; text-align: right;">${parsed.value}<span class="modifier">${parsed.modifier}</span></span>
                </div>`;
        } else {
            item.innerHTML = `<div class="rank">${rankEmoji}</div>
                <div class="name">${result.person}</div>
                <div class="profile-link">👉 Ver perfil</div>
                <div class="score-multi" style="text-align: right;">
                    <div>${result.average} <span class="label">promedio</span></div>
                    <div class="max-score">${result.max} <span class="label">máx</span></div>
                </div>`;
        }
        leaderboardList.appendChild(item);
    });
}

function setupSearch() {
    const searchInput = document.getElementById('search-input');
    const searchResults = document.getElementById('search-results');

    if (!searchInput || !searchResults) return;

    // Get all unique names
    const allNames = new Set();
    data.sessions.forEach(session => {
        session.exercises.forEach(ex => {
            ex.results.forEach(r => allNames.add(normalizePersonName(r.person)));
        });
    });
    const namesList = [...allNames].sort();

    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        searchResults.innerHTML = '';

        if (query.length < 2) {
            searchResults.classList.add('hidden');
            return;
        }

        const matches = namesList.filter(name =>
            name.toLowerCase().includes(query)
        );

        if (matches.length > 0) {
            searchResults.classList.remove('hidden');
            matches.forEach(name => {
                const div = document.createElement('div');
                div.className = 'search-result-item';
                div.innerHTML = `
                    <span class="search-match-name">${name}</span>
                    <span class="search-match-icon">👤</span>
                `;
                div.onclick = () => openUserProfile(name);
                searchResults.appendChild(div);
            });
        } else {
            searchResults.classList.add('hidden');
        }
    });

    // Close search when clicking outside
    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
            searchResults.classList.add('hidden');
        }
    });
}

function displayGlobalLeaderboard() {
    const category = document.getElementById('category-filter').value;
    const globalCategory = document.getElementById('global-category');
    const globalDescription = document.querySelector('.global-description');

    if (globalCategory) globalCategory.textContent = category;

    if (globalDescription) {
        globalDescription.innerHTML = `
            <b>Resumen:</b> Cada semana se cuenta solo tu mejor marca en cada ejercicio. Si usas goma de asistencia, tu resultado tiene penalización según el nivel de ayuda. Sumas puntos y medallas (🥇🥈🥉) por quedar en el top 3. <br>
            <span style="color:#7ac242;font-weight:bold;">¡Mejora tus marcas y usa menos goma para avanzar más!</span>
            <button class="details-toggle"
                onclick="document.getElementById('global-details').classList.toggle('hidden');
                        this.textContent = this.textContent === '¿Cómo funciona?' ? 'Ocultar detalle' : '¿Cómo funciona?';"
                style="margin-left:20px;">¿Cómo funciona?</button>
        `;
    }

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
            let exerciseName = normalizeExerciseName(exerciseObj.exercise);
            exerciseObj.results.forEach(result => {
                let week = getISOWeek(session.date);
                let personName = normalizePersonName(result.person);
                if (!weeklyExerciseData[exerciseName]) weeklyExerciseData[exerciseName] = {};
                if (!weeklyExerciseData[exerciseName][week]) weeklyExerciseData[exerciseName][week] = {};
                let reps = parseInt(result.reps) || 0;
                if (!weeklyExerciseData[exerciseName][week][personName] || weeklyExerciseData[exerciseName][week][personName] < reps) {
                    weeklyExerciseData[exerciseName][week][personName] = reps;
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


function displayImprovementRanking() {
    const category = document.getElementById('category-filter').value;
    const globalCategory = document.getElementById('global-category');
    const globalDetails = document.getElementById('global-details');
    const globalDescription = document.querySelector('.global-description');

    if (globalCategory) globalCategory.textContent = `Progreso en ${category}`;
    if (globalDetails) globalDetails.classList.add('hidden');

    // Update description for improvement ranking
    if (globalDescription) {
        globalDescription.innerHTML = `
            <b>Resumen:</b> Este ranking premia a los atletas que más han mejorado proporcionalmente en <b>${category}</b>.
            <br>Comparamos tu primera marca registrada con la última, aplicando penalización por ayuda (gomas/rodillas) para que sea justo para todos.
            <br><span style="color:#1abc9c;font-weight:bold;">¡La constancia y el esfuerzo propio son la clave!</span>
        `;
    }

    const filteredSessions = getFilteredSessions();
    const personsSet = new Set();
    filteredSessions.forEach(s => s.exercises.forEach(ex => {
        ex.results.forEach(r => personsSet.add(normalizePersonName(r.person)));
    }));

    const improvements = Array.from(personsSet).map(person => {
        const improvement = calculateUserImprovement(filteredSessions, person);
        return { person, improvement };
    }).filter(u => u.improvement > 0);

    improvements.sort((a, b) => b.improvement - a.improvement);

    const leaderboardList = document.getElementById('global-leaderboard-list');
    leaderboardList.innerHTML = '';

    if (improvements.length === 0) {
        leaderboardList.innerHTML = `
            <div style="text-align: center; padding: 40px; color: rgba(255, 255, 255, 0.6);">
                <p style="font-size: 1.2em;">No hay datos de mejora suficientes</p>
                <p>Se necesitan al menos 2 sesiones de un ejercicio para calcular el progreso</p>
            </div>
        `;
        return;
    }

    improvements.forEach((result, index) => {
        const item = document.createElement('div');
        item.className = 'leaderboard-item clickable';
        item.style.animationDelay = `${index * 0.05}s`;
        item.onclick = () => openUserProfile(result.person);

        const rankEmoji = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1;

        item.innerHTML = `
            <div class="rank">${rankEmoji}</div>
            <div class="name">${result.person}</div>
            <div class="score" style="text-align: right; color: #2ecc71; font-weight: bold;">
                +${result.improvement.toFixed(1)}%
            </div>
            <div class="profile-link">👉 Ver perfil</div>
        `;
        leaderboardList.appendChild(item);
    });
}

function openUserProfile(personName) {
    window.location.href = `user.html?name=${encodeURIComponent(personName)}`;
}

document.addEventListener('DOMContentLoaded', loadData);
