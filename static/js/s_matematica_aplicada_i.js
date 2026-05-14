// --- VARIABLES DE CONTROL DE ESTADO ---
let totalPreguntas = 4;
let aciertos = 0;
let preguntasRespondidas = 0;
let teoriaGlobal = []; // Almacena el JSON de teoría para acceder a las justificaciones

// --- INICIO DEL TEST ---
async function iniciarTest() {
    try {
        const [resT, resP] = await Promise.all([
            fetch('../static/json/j_matematica_aplicada_i_teoria.json').then(r => r.json()),
            fetch('../static/json/j_matematica_aplicada_i_practica.json').then(r => r.json())
        ]);

        teoriaGlobal = resT;

        // Seleccionamos 2 de teoría y 2 de práctica al azar
        const seleccionTeoria = resT.sort(() => 0.5 - Math.random()).slice(0, 2);
        const seleccionPractica = resP.sort(() => 0.5 - Math.random()).slice(0, 2);

        renderizarTodo(seleccionTeoria, seleccionPractica);
    } catch (e) {
        console.error("Error cargando datos", e);
    }
}

// --- RENDERIZADO PRINCIPAL ---
function renderizarTodo(teoria, practica) {
    const container = document.getElementById('quiz-container');
    container.innerHTML = "";

    // 1. Renderizar Teoría
    teoria.forEach((q) => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <span class="section-title">Teoría</span>
            <h3>${q.pregunta}</h3>
            <div class="opciones-grid">
                ${q.opciones.map((opt, idx) => `
                    <button class="quiz-opt" 
                        onclick="evaluarTeoria(this, ${idx === q.correcta}, ${q.id})">
                        ${opt}
                    </button>
                `).join('')}
            </div>
        `;
        container.appendChild(card);
    });

    // 2. Renderizar Práctica (Ejercicios paso a paso)
    practica.forEach((ej, ejIdx) => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <span class="section-title">Práctica</span>
            <h3>${ej.enunciado}</h3>
            <div id="ej-${ejIdx}-pasos">
                ${ej.pasos.map((p, pIdx) => `
                    <div id="ej-${ejIdx}-paso-${pIdx}" class="paso ${pIdx === 0 ? 'paso-activo' : ''}">
                        <p><strong>Paso ${pIdx + 1}:</strong> ${p.instruccion}</p>
                        <div class="opciones-grid">
                            ${p.opciones.map((opt, oIdx) => `
                                <button class="quiz-opt" 
                                    onclick="evaluarPaso(this, ${oIdx === p.correcta}, ${ejIdx}, ${pIdx}, ${ej.pasos.length}, ${p.correcta})">
                                    ${opt}
                                </button>
                            `).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        container.appendChild(card);
    });

    renderizarFormulas(container);
}

// --- EVALUACIÓN DE TEORÍA ---
function evaluarTeoria(btn, esCorrecto, idPregunta) {
    const parent = btn.parentElement;
    const card = parent.parentElement;
    const botones = parent.querySelectorAll('button');
    
    botones.forEach(b => b.disabled = true);

    const infoPregunta = teoriaGlobal.find(q => q.id === idPregunta);
    const feedbackDiv = document.createElement('div');
    feedbackDiv.style.marginTop = '15px';
    feedbackDiv.style.padding = '12px';
    feedbackDiv.style.borderRadius = '8px';

    if (esCorrecto) {
        btn.classList.add('correct');
        feedbackDiv.style.backgroundColor = '#d1fae5';
        feedbackDiv.style.color = '#065f46';
        feedbackDiv.innerHTML = `<strong>¡Correcto!</strong>`;
        aciertos++;
    } else {
        btn.classList.add('incorrect');
        
        // Resaltar la respuesta correcta
        const indiceCorrecto = infoPregunta.correcta;
        botones[indiceCorrecto].style.border = '2px solid #10b981';
        botones[indiceCorrecto].style.backgroundColor = '#f0fdf4';

        feedbackDiv.style.backgroundColor = '#fef2f2';
        feedbackDiv.style.color = '#991b1b';
        feedbackDiv.innerHTML = `
            <strong>Incorrecto.</strong> La respuesta correcta era: 
            <br><em>${infoPregunta.opciones[indiceCorrecto]}</em>
            <p style="margin-top: 8px; font-size: 0.9em; border-top: 1px solid rgba(0,0,0,0.1); padding-top: 8px;">
                <strong>Explicación:</strong> ${infoPregunta.justificacion || 'Sin justificación disponible.'}
            </p>
        `;
    }
    
    card.appendChild(feedbackDiv);
    renderizarFormulas(feedbackDiv);

    preguntasRespondidas++;
    revisarFinalizacion();
}

// --- EVALUACIÓN DE PASOS PRÁCTICOS ---
function evaluarPaso(btn, esCorrecto, ejIdx, pasoIdx, totalPasos, indiceCorrecto) {
    const pasoDiv = document.getElementById(`ej-${ejIdx}-paso-${pasoIdx}`);
    const botones = pasoDiv.querySelectorAll('button');

    botones.forEach(b => b.disabled = true);

    if (esCorrecto) {
        btn.classList.add('correct');
    } else {
        btn.classList.add('incorrect');
        // Resaltar la opción correcta del paso
        botones[indiceCorrecto].style.border = '2px solid #10b981';
        botones[indiceCorrecto].style.backgroundColor = '#f0fdf4';
    }

    // Progresión al siguiente paso
    if (pasoIdx < totalPasos - 1) {
        setTimeout(() => {
            const siguientePaso = document.getElementById(`ej-${ejIdx}-paso-${pasoIdx + 1}`);
            siguientePaso.classList.add('paso-activo');
            renderizarFormulas(siguientePaso);
            siguientePaso.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 600);
    } else {
        // Fin del ejercicio: verificar si hubo errores en algún paso
        const contenedorEjercicios = pasoDiv.parentElement;
        if (!contenedorEjercicios.querySelector('.incorrect')) {
            aciertos++; 
        }
        preguntasRespondidas++;
        revisarFinalizacion();
    }
}

// --- UTILIDADES ---
function renderizarFormulas(elemento) {
    if (window.renderMathInElement) {
        renderMathInElement(elemento, {
            delimiters: [
                {left: '$$', right: '$$', display: true},
                {left: '$', right: '$', display: false},
                {left: '\\(', right: '\\)', display: false},
                {left: '\\[', right: '\\]', display: true}
            ],
            throwOnError: false
        });
    }
}

function revisarFinalizacion() {
    if (preguntasRespondidas >= totalPreguntas) {
        const btnFinish = document.getElementById('btn-finish');
        if(btnFinish) btnFinish.classList.remove('hidden');
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }
}

function calcularNotaFinal() {
    const nota = (aciertos / totalPreguntas) * 10;
    const resultsCard = document.getElementById('results-card');
    const scoreDiv = document.getElementById('final-score');
    const scoreText = document.getElementById('score-text');

    document.getElementById('btn-finish').classList.add('hidden');
    resultsCard.style.display = 'block';
    scoreDiv.innerText = nota.toFixed(1);
    
    if (nota >= 7) {
        scoreText.innerText = "¡Excelente trabajo! Has demostrado un gran dominio.";
    } else if (nota >= 4) {
        scoreText.innerText = "Aprobado. Te recomendamos repasar los conceptos donde tuviste dudas.";
    } else {
        scoreText.innerText = "No alcanzaste el mínimo. Repasa la teoría y vuelve a intentarlo.";
    }
}

window.onload = iniciarTest;