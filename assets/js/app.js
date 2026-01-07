/* Archivo: assets/js/app.js */

const form = document.getElementById("contact-form");

async function handleSubmit(event) {
    // Previene la recarga por defecto del navegador
    event.preventDefault();
    
    const status = document.getElementById("form-status");
    const btn = document.getElementById("submit-btn");
    
    // Validación de existencia de elementos
    if (!form || !status || !btn) {
        console.error("Error: Elementos del DOM no encontrados.");
        return;
    }

    const data = new FormData(event.target);

    // Indicador visual de carga
    btn.disabled = true;
    btn.innerHTML = "Procesando solicitud...";

    try {
        const response = await fetch(event.target.action, {
            method: form.method,
            body: data,
            headers: {
                'Accept': 'application/json'
            }
        });

        if (response.ok) {
            // Éxito en el envío
            status.style.display = "block";
            status.style.color = "#4CAF50"; 
            status.innerHTML = "Solicitud enviada correctamente. El equipo se pondrá en contacto.";
            form.reset();
            
            // Restablecer botón
            setTimeout(() => {
                btn.disabled = false;
                btn.innerHTML = "Enviar Mensaje Seguro";
                status.style.display = "none";
            }, 4000);

        } else {
            // Manejo de errores del servidor
            const data = await response.json();
            if (Object.hasOwn(data, 'errors')) {
                status.innerHTML = data["errors"].map(error => error["message"]).join(", ");
            } else {
                status.innerHTML = "Error al procesar la solicitud.";
            }
            throw new Error('Error en la respuesta del servidor');
        }

    } catch (error) {
        // Manejo de errores de red
        status.innerHTML = "Error de conexión. Intente nuevamente.";
        status.style.color = "#D32F2F";
        status.style.display = "block";
        
        btn.disabled = false;
        btn.innerHTML = "Reintentar";
    }
}

if (form) {
    form.addEventListener("submit", handleSubmit);
}