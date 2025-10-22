// CONFIG
const CONFIG = {
    owner: 'jbelzarena',
    repo: 'calistenia-toma-marcas',
    filePath: 'data.json',
    branch: 'main',
    obfuscatedToken: 'RElrZWQzM01oVm13UWdzZ1R4QnZKZ0pzSkc3RmZJdVJHU0NGX3BoZw=='
};

// STATE
let data = null;
let isUnlocked = false;

// LABELS
const GOMA_LABELS = {
    A: 'Amarilla', R: 'Roja', N: 'Negra', M: 'Morada', V: 'Verde',
    VRo: 'Verde-Roja', VN: 'Verde-Negra', RN: 'Roja-Negra', MR: 'Morada-Roja'
};

// ===== TOKEN OBFUSCATION =====
function obfuscateToken(token) { return btoa(token.split('').reverse().join('')); }
function deobfuscateToken(obfuscated) { return atob(obfuscated).split('').reverse().join(''); }

// ===== BASIC UNLOCK UI =====
function checkUnlocked() {
    if (sessionStorage.getItem('edit_unlocked') === 'true') unlockUI();
}
function unlockEditing() {
    const pwd = document.getElementById('unlock-password').value;
    if (pwd === 'ValenciaCalisteniaAdmin') {
        sessionStorage.setItem('edit_unlocked', 'true'); unlockUI();
        alert('Edición desbloqueada!');
    } else alert('Contraseña incorrecta');
}
function unlockUI() {
    isUnlocked = true;
    document.getElementById('unlock-section').style.display = 'none';
    document.getElementById('admin-content').style.display = 'block';
    document.getElementById('save-buttons').style.display = 'flex';
}

// ====== TAB UI ======
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', function () {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
        this.classList.add('active');
        document.getElementById(this.dataset.tab + '-tab').classList.remove('hidden');
    });
});

// ===== DATA LOADING =====
async function loadData() {
    try {
        const response = await fetch('data.json');
        data = await response.json();
        displaySessions();
        populateNewSessionForm();
        document.getElementById('json-editor').value = JSON.stringify(data, null, 2);
    } catch (error) {
        console.error('Error loading data:', error);
        alert('Error cargando los datos');
    }
}

// ==== SUGGESTIONS FOR CATEGORIES/TYPES ====
function getUnique(listFn) {
    if (!data || !data.sessions) return [];
    const set = new Set();
    data.sessions.forEach(listFn(set));
    return Array.from(set).sort();
}
function getUniqueCategories() { return getUnique(set => s => set.add(s.category)); }
function getUniqueActivityTypes() { return getUnique(set => s => set.add(s.activity_type)); }
function getUniqueExercises() {
    if (!data || !data.sessions) return [];
    const set = new Set();
    data.sessions.forEach(s => s.exercises.forEach(e => set.add(e.exercise)));
    return Array.from(set).sort();
}
function getUniquePersons() {
    if (!data || !data.sessions) return [];
    const set = new Set();
    data.sessions.forEach(session => session.exercises.forEach(ex =>
        ex.results.forEach(res => set.add(res.person))));
    return Array.from(set).sort();
}

// ==== FILL SUGGESTIONS ====
function populateNewSessionForm() {
    const categories = getUniqueCategories();
    const activityTypes = getUniqueActivityTypes();
    const catList = document.getElementById('category-list');
    catList.innerHTML = categories.map(c => `<option value="${c}">`).join('');
    const atList = document.getElementById('activity-type-list');
    atList.innerHTML = activityTypes.map(t => `<option value="${t}">`).join('');
}

// ====== SESSION DISPLAY ======
function displaySessions() {
    const sessionsList = document.getElementById('sessions-list');
    sessionsList.innerHTML = '';
    const categories = getUniqueCategories();
    const activityTypes = getUniqueActivityTypes();
    const exercisesList = getUniqueExercises();

    const sortedSessions = [...data.sessions].sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.time || '00:00'}`);
        const dateB = new Date(`${b.date}T${b.time || '00:00'}`);
        return dateB - dateA;
    });

    sortedSessions.forEach((session, idx) => {
        const card = document.createElement('div');
        card.className = 'session-card';

        const typeDatalistId = `type-list-session-${idx}`;
        const categoryDatalistId = `category-list-session-${idx}`;

        // Summary (keep short)
        card.innerHTML = `
            <div class="session-header" onclick="toggleSessionDetails(this)">
             <button class="expand-btn" aria-label="Expandir">▼</button>
                <strong>Sesión ${idx + 1}</strong> ·
                <span>${session.date}</span> · 
                <span>${session.time}</span> · 
                <span>${session.activity_type}</span> · 
                <span>${session.category}</span>
               
            </div>
            <div class="session-details" style="display:none;">
                <div class="session-meta-row">
                    <div class="meta-field"><strong>Fecha:</strong> 
                        <input type="date" class="editable-field" value="${session.date}" data-edit="date" data-idx="${idx}">
                    </div>
                    <div class="meta-field"><strong>Hora:</strong> 
                        <input type="time" class="editable-field" value="${session.time}" data-edit="time" data-idx="${idx}">
                    </div>
                </div>
                <div class="session-meta-row">
                    <div class="meta-field"><strong>Tipo:</strong>
                        <input type="text" class="editable-field" value="${session.activity_type}" data-edit="activity_type" data-idx="${idx}" list="${typeDatalistId}">
                        <datalist id="${typeDatalistId}">
                            ${activityTypes.map(t => `<option value="${t}">`).join('')}
                        </datalist>
                    </div>
                    <div class="meta-field"><strong>Categoría:</strong>
                        <input type="text" class="editable-field" value="${session.category}" data-edit="category" data-idx="${idx}" list="${categoryDatalistId}">
                        <datalist id="${categoryDatalistId}">
                            ${categories.map(c => `<option value="${c}">`).join('')}
                        </datalist>
                    </div>
                </div>
                <div class="session-exercises">
                    <strong>Ejercicios:</strong>
                    <button type="button" class="btn-secondary btn-sm" onclick="showAddExercisePopup(${idx})">+ Agregar Ejercicio</button>
                    <div class="exercises-list">
                        ${session.exercises.map((exercise, eIdx) => {
            const exerciseDatalistId = `exercise-list-${idx}-${eIdx}`;
            return `
                                <div class="exercise-item">
                                    <input type="text" class="editable-field" value="${exercise.exercise}" data-edit="exercise-name" data-idx="${idx}" data-eidx="${eIdx}" list="${exerciseDatalistId}">
                                    <datalist id="${exerciseDatalistId}">
                                        ${exercisesList.map(ex => `<option value="${ex}">`).join('')}
                                    </datalist>
                                    <div class="exercise-actions">
                                        <button type="button" class="btn-secondary btn-sm" onclick="editExercise(${idx}, ${eIdx})" title="Editar Resultados">✏️ Editar Resultados</button>
                                        <button type="button" class="btn-remove btn-sm" onclick="removeExercise(${idx}, ${eIdx})" title="Eliminar Ejercicio">🗑️ Eliminar</button>
                                    </div>
                                </div>
                            `;
        }).join('')}
                    </div>
                </div>
                <div class="card-btns">
                    <button type="button" class="btn-remove" onclick="removeSession(${idx})">Eliminar esta sesión</button>
                    <button type="button" class="btn-success" onclick="saveSessionEdits(${idx})">✅ Guardar cambios de esta sesión</button>
                </div>
            </div>
        `;
        sessionsList.appendChild(card);
    });
}

// Expand/collapse details
function toggleSessionDetails(headerElem) {
    const details = headerElem.nextElementSibling;
    const expandBtn = headerElem.querySelector('.expand-btn');
    if (!details) return;
    if (details.style.display === 'none' || details.style.display === '') {
        details.style.display = 'block';
        if (expandBtn) expandBtn.textContent = '▲';
    } else {
        details.style.display = 'none';
        if (expandBtn) expandBtn.textContent = '▼';
    }
}
// ==== INLINE EDIT EVENTS ====
document.addEventListener('input', function (e) {
    if (e.target.classList.contains('editable-field')) {
        const idx = +e.target.dataset.idx;
        const editKey = e.target.dataset.edit;
        if (["date", "time", "activity_type", "category"].includes(editKey))
            data.sessions[idx][editKey] = e.target.textContent.trim();
        if (editKey === "exercise-name")
            data.sessions[idx].exercises[+e.target.dataset.eidx].exercise = e.target.textContent.trim();
    }
});

// ==== ADD / REMOVE EXERCISES & SESSIONS =====
function removeExercise(sessionIdx, exerciseIdx) {
    if (!confirm("¿Seguro que quieres quitar este ejercicio?")) return;
    data.sessions[sessionIdx].exercises.splice(exerciseIdx, 1);
    displaySessions();
    document.getElementById('json-editor').value = JSON.stringify(data, null, 2);
}
function showAddExercisePopup(sessionIdx) {
    let popup = document.getElementById('add-exercise-popup');
    if (!popup) {
        popup = document.createElement('div');
        popup.id = "add-exercise-popup";
        popup.className = 'modal';
        document.body.appendChild(popup);
    }
    popup.innerHTML = `
        <h3>Agregar Ejercicio</h3>
        <label>Nombre:</label>
        <input type="text" id="new-exercise-name">
        <br/>
        <button class="btn-primary" onclick="addExerciseToSession(${sessionIdx})">Agregar</button>
        <button class="btn-secondary" onclick="closePopup()">Cerrar</button>
    `;
    popup.classList.remove('hidden');
}
function addExerciseToSession(sessionIdx) {
    const name = document.getElementById('new-exercise-name').value.trim();
    if (name) {
        data.sessions[sessionIdx].exercises.push({ exercise: name, results: [] });
        closePopup();
        displaySessions();
        document.getElementById('json-editor').value = JSON.stringify(data, null, 2);
    }
}
function removeSession(idx) {
    if (!confirm("¿Seguro que quieres eliminar esta sesión?")) return;
    data.sessions.splice(idx, 1);
    displaySessions();
    document.getElementById('json-editor').value = JSON.stringify(data, null, 2);
}
function saveSessionEdits(idx) {
    document.getElementById('json-editor').value = JSON.stringify(data, null, 2);
    alert('Cambios guardados para esta sesión');
}

function closePopup() {
    const popups = document.querySelectorAll('.modal');
    popups.forEach(popup => popup.remove());
}

// ===== EDIT/ADD RESULTS (POPUP) =====
function editExercise(sessionIdx, exerciseIdx) {
    const session = data.sessions[sessionIdx];
    const exercise = session.exercises[exerciseIdx];
    let popup = document.getElementById('edit-results-popup');
    if (!popup) {
        popup = document.createElement('div');
        popup.id = 'edit-results-popup';
        popup.className = "modal";
        document.body.appendChild(popup);
    }
    popup.innerHTML = `<h3>Editar resultados para "${exercise.exercise}"</h3>
        <div id="result-rows"></div>
        <div >
          <button class="btn-secondary btn-sm" onclick="addPopupResultRow()">+ Añadir Resultado</button>
          <button class="btn-success btn-sm" onclick="savePopupResults(${sessionIdx}, ${exerciseIdx})">Guardar</button>
          <button class="btn-secondary btn-sm" onclick="closePopup()">Cerrar</button>
        </div>`;
    showResultRows(exercise.results);
    popup.classList.remove('hidden');
}
function showResultRows(results) {
    const rows = document.getElementById('result-rows');
    rows.innerHTML = '';
    const people = getUniquePersons();
    results.forEach((res, idx) => {
        const datalistId = `person-names-list-modal-${Math.random().toString(36).slice(2, 8)}-${idx}`;

        const gomaOptions = Object.entries(GOMA_LABELS).map(
            ([code, label]) => `<option value="${code}"${res.goma === code ? ' selected' : ''}>${label}</option>`
        ).join('');
        const rowDiv = document.createElement('div');
        rowDiv.className = 'result-row';
        rowDiv.dataset.residx = idx;
        rowDiv.innerHTML = `
            <input type="text" class="person-name" value="${res.person || ''}" list="${datalistId}" placeholder="Nombre" required>
            <datalist id="${datalistId}">
                ${people.map(name => `<option value="${name}">`).join('')}
            </datalist>
            <input type="text" class="person-reps" value="${res.reps || ''}" placeholder="Reps" required>
            <select class="person-goma">
                <option value="">Goma</option>
                ${gomaOptions}
            </select>
            <button type="button" class="btn-remove btn-sm" title="Eliminar" onclick="this.parentElement.remove()">🗑️</button>
        `;
        rows.appendChild(rowDiv);
    });
}
function addPopupResultRow() {
    const rows = document.getElementById('result-rows');
    const gomaOptions = Object.entries(GOMA_LABELS).map(
        ([code, label]) => `<option value="${code}">${label}</option>`
    ).join('');
    const entryDiv = document.createElement('div');
    entryDiv.className = 'result-row';
    entryDiv.innerHTML = `
        <input type="text" class="person-name" placeholder="Nombre" required>
        <input type="text" class="person-reps" placeholder="Reps" required>
        <select class="person-goma">
            <option value="">Goma</option>
            ${gomaOptions}
        </select>
        <button type="button" class="btn-remove btn-sm" title="Eliminar" onclick="this.parentElement.remove()">🗑️</button>
    `;
    rows.appendChild(entryDiv);
}
function savePopupResults(sessionIdx, exerciseIdx) {
    const rows = document.getElementById('result-rows').children;
    let newResults = [];
    for (let r of rows) {
        const person = r.querySelector('.person-name').value.trim();
        const reps = r.querySelector('.person-reps').value.trim();
        const goma = r.querySelector('.person-goma').value.trim();
        if (person && reps) {
            let result = { person, reps };
            if (goma) result.goma = goma;
            newResults.push(result);
        }
    }
    data.sessions[sessionIdx].exercises[exerciseIdx].results = newResults;
    closePopup();
    displaySessions();
    document.getElementById('json-editor').value = JSON.stringify(data, null, 2);
}

// ==== ADD EXERCISE BLOCK IN "NUEVA SESIÓN" ====
function addExerciseForm() {
    const container = document.getElementById('exercises-container');
    const exercises = getUniqueExercises();
    // Create a unique datalist id for every new exercise form
    const datalistId = `exercise-names-list-${Math.random().toString(36).substr(2, 8)}`;
    const exerciseDiv = document.createElement('div');
    exerciseDiv.className = 'exercise-form';
    exerciseDiv.innerHTML = `
        <div class="form-group">
            <label>Nombre del Ejercicio:</label>
            <input type="text" class="exercise-name" list="${datalistId}" required>
            <datalist id="${datalistId}">
                ${exercises.map(ex => `<option value="${ex}">`).join('')}
            </datalist>
        </div>
        <div class="results-section">
            <label>Resultados:</label>
            <div class="results-list"></div>
            <button type="button" class="btn-secondary btn-sm" onclick="addResultEntry(this)">+ Agregar Resultado</button>
        </div>
        <button type="button" class="btn-remove btn-sm" onclick="this.parentElement.remove()">Eliminar Ejercicio</button>
    `;
    container.appendChild(exerciseDiv);
}
function addResultEntry(button) {
    const resultsList = button.parentElement.querySelector('.results-list');
    const people = getUniquePersons();
    // Create a unique datalist id for the person field
    const datalistId = `person-names-list-${Math.random().toString(36).substr(2, 8)}`;
    const gomaOptions = Object.entries(GOMA_LABELS).map(
        ([code, label]) => `<option value="${code}">${label}</option>`
    ).join('');
    const entryDiv = document.createElement('div');
    entryDiv.className = 'result-row';
    entryDiv.innerHTML = `
        <input type="text" class="person-name" list="${datalistId}" placeholder="Nombre" required>
        <datalist id="${datalistId}">
            ${people.map(name => `<option value="${name}">`).join('')}
        </datalist>
        <input type="text" class="person-reps" placeholder="Reps (ej: 15 o 12V)" required>
        <select class="person-goma">
            <option value="">Goma</option>
            ${gomaOptions}
        </select>
        <button type="button" class="btn-remove btn-sm" title="Eliminar resultado" onclick="this.parentElement.remove()">🗑️</button>
    `;
    resultsList.appendChild(entryDiv);
}

// ==== HANDLE NUEVA SESIÓN FORM ====
document.getElementById('new-session-form').addEventListener('submit', function (e) {
    e.preventDefault();
    const newSession = {
        date: document.getElementById('session-date').value,
        time: document.getElementById('session-time').value,
        activity_type: document.getElementById('activity-type').value,
        category: document.getElementById('category').value,
        exercises: []
    };
    const exerciseForms = document.querySelectorAll('.exercise-form');
    exerciseForms.forEach(form => {
        const exercise = {
            exercise: form.querySelector('.exercise-name').value,
            results: []
        };
        const resultEntries = form.querySelectorAll('.result-row');
        resultEntries.forEach(entry => {
            const person = entry.querySelector('.person-name').value;
            const repsValue = entry.querySelector('.person-reps').value;
            const goma = entry.querySelector('.person-goma').value;
            const reps = repsValue;
            const resultObj = { person, reps };
            if (goma) resultObj.goma = goma;
            exercise.results.push(resultObj);
        });
        newSession.exercises.push(exercise);
    });
    data.sessions.push(newSession);
    saveData();
    alert('Sesión agregada correctamente!');
    this.reset();
    document.getElementById('exercises-container').innerHTML = '';
});

// ==== JSON EDIT/SAVE ==== 
function saveJSON() {
    try {
        const jsonText = document.getElementById('json-editor').value;
        data = JSON.parse(jsonText);
        saveData();
        alert('JSON guardado correctamente!');
    } catch (error) {
        alert('Error: JSON inválido. Por favor verifica el formato.');
        console.error(error);
    }
}

// ==== GITHUB SAVE + DOWNLOAD ====
async function saveData() {
    if (!isUnlocked) {
        alert('Debes desbloquear la edición primero!');
        return;
    }
    const saveBtn = document.getElementById('save-to-github');
    const originalText = saveBtn.textContent;
    saveBtn.textContent = 'Guardando...';
    saveBtn.disabled = true;

    try {
        const token = deobfuscateToken(CONFIG.obfuscatedToken);
        const jsonStr = JSON.stringify(data, null, 2);
        document.getElementById('json-editor').value = jsonStr;
        displaySessions();

        // GitHub API Save
        const getResponse = await fetch(
            `https://api.github.com/repos/${CONFIG.owner}/${CONFIG.repo}/contents/${CONFIG.filePath}?ref=${CONFIG.branch}`,
            { headers: { 'Authorization': `token ${token}`, 'Accept': 'application/vnd.github.v3+json' } }
        );
        if (!getResponse.ok) throw new Error(`Error obteniendo archivo: ${getResponse.status}`);
        const fileData = await getResponse.json();
        const sha = fileData.sha;

        const updateResponse = await fetch(
            `https://api.github.com/repos/${CONFIG.owner}/${CONFIG.repo}/contents/${CONFIG.filePath}`,
            {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: `Update data.json - ${new Date().toISOString()}`,
                    content: btoa(unescape(encodeURIComponent(jsonStr))),
                    sha: sha,
                    branch: CONFIG.branch
                })
            }
        );
        if (!updateResponse.ok) {
            const errorData = await updateResponse.json();
            throw new Error(`Error guardando: ${errorData.message}`);
        }
        alert('✅ Datos guardados en GitHub! Los cambios se verán en unos segundos.');
        setTimeout(() => { location.reload(); }, 3000);
    } catch (error) {
        console.error('Error:', error);
        alert('❌ Error guardando en GitHub: ' + error.message);
    } finally {
        saveBtn.textContent = originalText;
        saveBtn.disabled = false;
    }
}
function downloadJSON() {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'data.json';
    a.click();
}

document.addEventListener('input', function (e) {
    if (e.target.classList.contains('editable-field')) {
        const idx = +e.target.dataset.idx;
        const editKey = e.target.dataset.edit;
        if (["date", "time", "activity_type", "category"].includes(editKey))
            data.sessions[idx][editKey] = e.target.value.trim();
        if (editKey === "exercise-name")
            data.sessions[idx].exercises[+e.target.dataset.eidx].exercise = e.target.value.trim();
    }
});

// ==== DOM READY ====
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    checkUnlocked();
});
