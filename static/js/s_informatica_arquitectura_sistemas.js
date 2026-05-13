async function cargarQuiz() {
    try {
        const respuesta = await fetch('../static/json/j_informatica_arquitectura_sistemas.json');
        if (!respuesta.ok) {
            throw new Error(`Error HTTP: ${respuesta.status} - No se encontró el archivo`);
        }
        const datos = await respuesta.json();

        // 1. Mezclar todas las preguntas (Fisher-Yates Shuffle)
        const mezcladas = datos.sort(() => 0.5 - Math.random());
        
        // 2. Tomar las primeras 10
        const seleccion = mezcladas.slice(0, 10);
        
        const wrapper = document.getElementById('preguntas-wrapper');
        
        seleccion.forEach((p, index) => {
            const div = document.createElement('div');
            div.className = 'pregunta-block';
            div.innerHTML = `
                <p><strong>${index + 1}. ${p.pregunta}</strong></p>
                <div class="opciones-list">
                    ${p.opciones.map((opt, i) => `
                        <div class="opcion-item">
                            <label>
                                <input type="radio" name="p${index}" value="${i}">
                                ${opt}
                            </label>
                        </div>
                    `).join('')}
                </div>
                <div id="feedback-${index}" class="correcta-info" style="display:none">
                    Respuesta correcta: ${p.opciones[p.correcta]}
                </div>
            `;
            wrapper.appendChild(div);
        });

        // Evento de corrección
        document.getElementById('btn-finalizar').addEventListener('click', () => {
            let nota = 0;
            
            seleccion.forEach((p, index) => {
                const seleccionado = document.querySelector(`input[name="p${index}"]:checked`);
                const feedback = document.getElementById(`feedback-${index}`);
                
                // Mostrar respuesta correcta siempre al finalizar
                feedback.style.display = 'block';

                if (seleccionado && parseInt(seleccionado.value) === p.correcta) {
                    nota++;
                    feedback.style.color = "#27ae60"; // Verde si acertó
                    feedback.innerText = "¡Correcto!";
                } else {
                    feedback.style.color = "#c0392b"; // Rojo si erró
                    feedback.innerHTML = `Incorrecto. La respuesta era: ${p.opciones[p.correcta]}`;
                }
            });

            // Mostrar Nota final
            document.getElementById('nota').innerText = nota;
            document.getElementById('resultado').style.display = 'block';
            document.getElementById('btn-finalizar').style.display = 'none';
            window.scrollTo(0, document.body.scrollHeight);
        });

    } catch (error) {
        console.error("Detalle del error:", error);
        document.getElementById('preguntas-wrapper').innerHTML = "Error al cargar las preguntas. Revisa la consola.";
    }
}

cargarQuiz();

async function mostrarCuriosidad() {
    const pCuriosidad = document.getElementById('texto-curiosidad');
    
    try {
        const respuesta = await fetch('../static/json/j_sabias_fisica_aplicada.json');
        const datos = await respuesta.json();
        
        const fraseAleatoria = datos[Math.floor(Math.random() * datos.length)].info;
        
        pCuriosidad.innerText = fraseAleatoria;
        pCuriosidad.style.display = 'block';
        
    } catch (error) {
        console.error("Error cargando curiosidades:", error);
    }
}

document.getElementById('btn-curiosidad').addEventListener('click', mostrarCuriosidad);
