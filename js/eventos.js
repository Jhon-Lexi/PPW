// ============================================================
// MÓDULO DE EVENTOS
// ============================================================

/**
 * Carga los eventos desde Supabase y los renderiza
 * @param {string} containerId - ID del contenedor HTML
 */
async function cargarEventos(containerId = 'eventos-container') {
  const container = document.getElementById(containerId);
  if (!container) return;

  // Mostrar spinner
  container.innerHTML = '<div class="spinner" role="status"><span class="sr-only">Cargando eventos...</span></div>';

  try {
    const { data: eventos, error } = await supabase
      .from('eventos')
      .select('*')
      .order('fecha', { ascending: true });

    if (error) throw error;

    if (!eventos || eventos.length === 0) {
      container.innerHTML = `
        <div class="text-center" style="padding: var(--spacing-xl) 0;">
          <p style="color: var(--text-muted); font-size: var(--font-size-lg);">
            No hay eventos próximos. ¡Vuelve pronto!
          </p>
        </div>
      `;
      return;
    }

    let html = '<div class="grid">';
    
    eventos.forEach(evento => {
      const fecha = new Date(evento.fecha).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      html += `
        <article class="card">
          <img src="${evento.imagen_url || 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400'}" 
               alt="${evento.titulo}" 
               class="card__image"
               loading="lazy">
          <div class="card__body">
            <h3 class="card__title">${evento.titulo}</h3>
            <p class="card__text">
              <strong>📅 ${fecha}</strong>
              ${evento.hora ? `| 🕐 ${evento.hora}` : ''}
            </p>
            <p class="card__text">${evento.descripcion}</p>
            ${evento.lugar ? `<p class="card__text">📍 ${evento.lugar}</p>` : ''}
          </div>
        </article>
      `;
    });

    html += '</div>';
    container.innerHTML = html;

  } catch (error) {
    console.error('Error cargando eventos:', error.message);
    container.innerHTML = `
      <div class="alert alert-error" role="alert">
        Error al cargar los eventos. Intenta de nuevo más tarde.
      </div>
    `;
  }
}
