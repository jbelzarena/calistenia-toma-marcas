const CONFIG = {

    owner: 'jbelzarena',
    repo: 'calistenia-toma-marcas',
    filePath: 'data.json',
    branch: 'main',
    obfuscatedToken: 'RElrZWQzM01oVm13UWdzZ1R4QnZKZ0pzSkc3RmZJdVJHU0NGX3BoZw=='
};

let data = null;
let isUnlocked = false;

// Simple obfuscation (reverse + base64)
function obfuscateToken(token) {
    return btoa(token.split('').reverse().join(''));
}

function deobfuscateToken(obfuscated) {
    return atob(obfuscated).split('').reverse().join('');
}

// Check if editing is unlocked
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
    // Simple password check - you can change 'admin' to whatever you want
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

function displaySessions() {
    const sessionsList = document.getElementById('sessions-list');
    sessionsList.innerHTML = '';

    data.sessions.forEach((session, index) => {
        const card = document.createElement('div');
        card.className = 'session-card';
        card.innerHTML = `
            <h4>Sesión ${index + 1}</h4>
            <p><strong>Fecha:</strong> ${session.date}</p>
            <p><strong>Hora:</strong> ${session.time}</p>
            <p><strong>Tipo:</strong> ${session.activity_type}</p>
            <p><strong>Categoría:</strong> ${session.category}</p>
            <div class="session-exercises">
                <strong>Ejercicios:</strong> ${session.exercises.map(e => e.exercise).join(', ')}
            </div>
        `;
        sessionsList.appendChild(card);
    });
}

function addExerciseForm() {
    const container = document.getElementById('exercises-container');
    const exerciseDiv = document.createElement('div');
    exerciseDiv.className = 'exercise-form';
    exerciseDiv.innerHTML = `
        <h5>Ejercicio</h5>
        <div class="form-group">
            <label>Nombre del Ejercicio:</label>
            <input type="text" class="exercise-name" required>
        </div>
        <div class="results-container">
            <label>Resultados:</label>
            <div class="results-list"></div>
            <button type="button" class="btn-secondary" onclick="addResultEntry(this)">+ Agregar Resultado</button>
        </div>
        <button type="button" class="btn-remove" onclick="this.parentElement.remove()">Eliminar Ejercicio</button>
    `;
    container.appendChild(exerciseDiv);
}

function addResultEntry(button) {
    const resultsList = button.previousElementSibling;
    const entryDiv = document.createElement('div');
    entryDiv.className = 'result-entry';
    entryDiv.innerHTML = `
        <input type="text" placeholder="Nombre" class="person-name" required>
        <input type="text" placeholder="Reps (ej: 15 o 12V)" class="person-reps" required>
        <button type="button" class="btn-remove" onclick="this.parentElement.remove()">X</button>
    `;
    resultsList.appendChild(entryDiv);
}

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
            const reps = isNaN(repsValue) ? repsValue : parseInt(repsValue);
            exercise.results.push({ person, reps });
        });

        newSession.exercises.push(exercise);
    });

    data.sessions.push(newSession);
    saveData();
    alert('Sesión agregada correctamente!');
    this.reset();
    document.getElementById('exercises-container').innerHTML = '';
});

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

        // Update local display
        document.getElementById('json-editor').value = jsonStr;
        displaySessions();

        // Get current file SHA (required for updating)
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

        // Commit the update
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

        // Reload page after a delay to show updated data
        setTimeout(() => {
            location.reload();
        }, 3000);

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

// Tab switching
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', function () {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));

        this.classList.add('active');
        const tabId = this.dataset.tab + '-tab';
        document.getElementById(tabId).classList.remove('hidden');
    });
});

document.addEventListener('DOMContentLoaded', () => {
    loadData();
    checkUnlocked();
});