const CONFIG = {
    owner: 'jbelzarena',
    repo: 'calistenia-toma-marcas',
    filePath: 'data.json',
    branch: 'main',
    obfuscatedToken: 'RElrZWQzM01oVm13UWdzZ1R4QnZKZ0pzSkc3RmZJdVJHU0NGX3BoZw=='
};

let data = null;
let isUnlocked = false;

// --- Helpers to extract unique options ---
function getUniqueCategories() {
    if (!data || !data.sessions) return [];
    const set = new Set();
    data.sessions.forEach(s => set.add(s.category));
    return Array.from(set).sort();
}
function getUniqueActivityTypes() {
    if (!data || !data.sessions) return [];
    const set = new Set();
    data.sessions.forEach(s => set.add(s.activity_type));
    return Array.from(set).sort();
}
function getUniqueExercises() {
    if (!data || !data.sessions) return [];
    const set = new Set();
    data.sessions.forEach(s =>
        s.exercises.forEach(e => set.add(e.exercise)));
    return Array.from(set).sort();
}
function getUniquePersons() {
    if (!data || !data.sessions) return [];
    const set = new Set();
    data.sessions.forEach(session =>
        session.exercises.forEach(ex =>
            ex.results.forEach(res =>
                set.add(res.person)))
    );
    return Array.from(set).sort();
}
function getUsedGomas() {
    if (!data || !data.sessions) return [];
    const set = new Set();
    data.sessions.forEach(session =>
        session.exercises.forEach(ex =>
            ex.results.forEach(res => {
                if (res.goma) set.add(res.goma);
            }))
    );
    return Array.from(set);
}
const GOMA_LABELS = { A: 'Amarilla', R: 'Roja', N: 'Negra', M: 'Morada', V: 'Verde' };

// --- Simple obfuscation (reverse + base64) ---
function obfuscateToken(token) {
    return btoa(token.split('').reverse().join(''));
}
function deobfuscateToken(obfuscated) {
    return atob(obfuscated).split('').reverse().join('');
}

// --- Unlocking ---
function checkUnlocked() {
    const unlocked = sessionStorage.getItem('edit_unlocked');
    if (unlocked === 'true') {
        isUnlocked = true;
        document.getElementById('unlock-section').style.display = 'none';
        document.getElementById('admin-content').style.display = 'block';
        document.getElementById('save-buttons').style.display = 'flex';
    }
}
function unlockEditing() {
    const password = document.getElementById('unlock-password').value;
    if (password === 'ValenciaCalisteniaAdmin') {
        isUnlocked = true;
        sessionStorage.setItem('edit_unlocked', 'true');
        document.getElementById('unlock-section').style.display = 'none';
        document.getElementById('admin-content').style.display = 'block';
        document.getElementById('save-buttons').style.display = 'flex';
        alert('Edición desbloqueada!');
    } else {
        alert('Contraseña incorrecta');
    }
}

async function loadData() {
    try {
        const response = await fetch('data.json');
        data = await response.json();
        displaySessions();
        document.getElementById('json-editor').value = JSON.stringify(data, null, 2);
    } catch (error) {
        console.error('Error loading data:', error);
        alert('Error cargando los datos');
    }
}

function populateNewSessionFormDatalists() {
    const categoryList = document.getElementById('category-list');
    const activityTypeList = document.getElementById('activity-type-list');
    categoryList.innerHTML = getUniqueCategories().map(c => `<option value="${c}">`).join('');
    activityTypeList.innerHTML = getUniqueActivityTypes().map(t => `<option value="${t}">`).join('');
}
// --- Display sessions list and allow remove ---
function displaySessions() {
    const sessionsList = document.getElementById('sessions-list');
    sessionsList.innerHTML = '';
    data.sessions.forEach((session, idx) => {
        const card = document.createElement('div');
        card.className = 'session-card';
        card.innerHTML = `
            <h4>Sesión ${idx + 1}</h4>
            <p><strong>Fecha:</strong> ${session.date}</p>
            <p><strong>Hora:</strong> ${session.time}</p>
            <p><strong>Tipo:</strong> ${session.activity_type}</p>
            <p><strong>Categoría:</strong> ${session.category}</p>
            <div class="session-exercises">
                <strong>Ejercicios:</strong> ${session.exercises.map(e => e.exercise).join(', ')}
            </div>
            <button type="button" class="btn-remove" onclick="removeSession(${idx})">Eliminar esta sesión</button>
        `;
        sessionsList.appendChild(card);
    });
}
function removeSession(idx) {
    if (!confirm("¿Seguro que quieres eliminar esta sesión?")) return;
    data.sessions.splice(idx, 1);
    displaySessions();
    document.getElementById('json-editor').value = JSON.stringify(data, null, 2);
}

// --- Add exercise block with value suggestions ---
function addExerciseForm() {
    const container = document.getElementById('exercises-container');
    const exerciseDiv = document.createElement('div');
    const exercises = getUniqueExercises();
    exerciseDiv.className = 'exercise-form';
    exerciseDiv.innerHTML = `
        <h5>Ejercicio</h5>
        <div class="form-group">
            <label>Nombre del Ejercicio:</label>
            <input type="text" class="exercise-name" list="exercise-names-list" required>
            <datalist id="exercise-names-list">
                ${exercises.map(ex => `<option value="${ex}">`).join('')}
            </datalist>
        </div>
        <div class="results-container">
            <label>Resultados:</label>
            <div class="results-list"></div>
            <button type="button" class="btn-secondary" onclick="addResultEntry(this)">+ Agregar Resultado</button>
        </div>
        <button type="button" class="btn-secondary" onclick="this.parentElement.remove()">Eliminar Ejercicio</button>
    `;
    container.appendChild(exerciseDiv);
}

// --- Add result entry with repeated/suggested values ---
function addResultEntry(button) {
    const resultsList = button.previousElementSibling;
    const people = getUniquePersons();
    const gomas = getUsedGomas();

    const entryDiv = document.createElement('div');
    entryDiv.className = 'result-entry';
    entryDiv.innerHTML = `
        <input type="text" class="person-name" list="person-names-list" placeholder="Nombre" required>
        <datalist id="person-names-list">
            ${people.map(name => `<option value="${name}">`).join('')}
        </datalist>
         <div class="result-row">
        <input type="text" placeholder="Reps (ej: 15 o 12V)" class="person-reps" required>
        <select class="person-goma" style="width: 70px;">
            <option value="">Goma</option>
            ${["A", "R", "N", "M", "V"].map(code =>
        `<option value="${code}"${gomas.includes(code) ? ' selected' : ''}>${GOMA_LABELS[code]}</option>`).join('')}
        </select>
        <button type="button" class="btn-remove" onclick="this.parentElement.remove()">X</button>
        </div>
    `;
    resultsList.appendChild(entryDiv);
}

// --- Add session form with suggestions ---
function populateNewSessionForm() {
    const categories = getUniqueCategories();
    const activityTypes = getUniqueActivityTypes();
    document.getElementById('category').innerHTML =
        `<option value="">Selecciona</option>${categories.map(c =>
            `<option value="${c}">${c}</option>`).join('')}`;
    document.getElementById('activity-type').innerHTML =
        `<option value="">Selecciona</option>${activityTypes.map(t =>
            `<option value="${t}">${t}</option>`).join('')}`;
}

// --- New session submission with goma support ---
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
        const resultEntries = form.querySelectorAll('.result-entry');
        resultEntries.forEach(entry => {
            const person = entry.querySelector('.person-name').value;
            const repsValue = entry.querySelector('.person-reps').value;
            const goma = entry.querySelector('.person-goma').value;
            const reps = isNaN(repsValue) ? repsValue : parseInt(repsValue);
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
    populateNewSessionForm();
    populateNewSessionFormDatalists();
});

// --- Saving and Download ---
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
            {
                headers: {
                    'Authorization': `token ${token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            }
        );
        if (!getResponse.ok) {
            throw new Error(`Error obteniendo archivo: ${getResponse.status}`);
        }
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

// --- Tab switching ---
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', function () {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
        this.classList.add('active');
        const tabId = this.dataset.tab + '-tab';
        document.getElementById(tabId).classList.remove('hidden');
    });
});

// --- On load ---
document.addEventListener('DOMContentLoaded', () => {
    loadData().then(populateNewSessionFormDatalists);
    checkUnlocked();
    populateNewSessionForm();
});
