// API URLs
const API_BASE = '/api';

// Funciones de utilidad
async function fetchAPI(endpoint, options = {}) {
    const response = await fetch(`${API_BASE}${endpoint}`, {
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        },
        ...options
    });
    
    if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
    }
    
    return await response.json();
}

// Gestionar tabs
document.querySelectorAll('.tab-button').forEach(button => {
    button.addEventListener('click', function() {
        const tabName = this.getAttribute('data-tab');
        
        // Desactivar todos los tabs
        document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        
        // Activar el tab seleccionado
        this.classList.add('active');
        document.getElementById(tabName).classList.add('active');
    });
});

// Cargar estadísticas
async function loadStats() {
    try {
        const stats = await fetchAPI('/stats');
        
        const statsDiv = document.getElementById('stats');
        statsDiv.innerHTML = `
            <div class="stat">
                <div class="stat-value">${stats.total_webhooks}</div>
                <div class="stat-label">Webhooks Totales</div>
            </div>
            <div class="stat">
                <div class="stat-value">${stats.active_webhooks}</div>
                <div class="stat-label">Activos</div>
            </div>
            <div class="stat">
                <div class="stat-value">${stats.total_events}</div>
                <div class="stat-label">Eventos</div>
            </div>
        `;
    } catch (error) {
        console.error('Error cargando estadísticas:', error);
    }
}

// Cargar webhooks
async function loadWebhooks() {
    try {
        const webhooks = await fetchAPI('/webhooks');
        const listDiv = document.getElementById('webhooks-list');
        
        if (webhooks.length === 0) {
            listDiv.innerHTML = '<p>No hay webhooks creados aún. ¡Crea uno!</p>';
            return;
        }
        
        listDiv.innerHTML = webhooks.map(webhook => `
            <div class="webhook-item">
                <h4>${webhook.name}</h4>
                <div class="webhook-info">
                    <strong>URL:</strong> <code>${webhook.url}</code>
                </div>
                <div class="webhook-info">
                    <strong>Estado:</strong>
                    <span class="webhook-status ${webhook.active ? 'active' : 'inactive'}">
                        ${webhook.active ? '✓ Activo' : '✗ Inactivo'}
                    </span>
                </div>
                <div class="webhook-info">
                    <strong>Eventos:</strong>
                    <div class="webhook-events">
                        ${webhook.events.split(',').map(e => `<span class="event-tag">${e.trim()}</span>`).join('')}
                    </div>
                </div>
                <div class="webhook-info">
                    <strong>Creado:</strong> ${new Date(webhook.created_at).toLocaleString('es-ES')}
                </div>
                ${webhook.last_triggered ? `
                    <div class="webhook-info">
                        <strong>Último disparo:</strong> ${new Date(webhook.last_triggered).toLocaleString('es-ES')}
                    </div>
                ` : ''}
                <div class="webhook-actions">
                    <button class="btn btn-warning" onclick="triggerWebhook('${webhook.id}')">
                        ⚡ Disparar
                    </button>
                    <button class="btn btn-warning" onclick="toggleWebhook('${webhook.id}')">
                        ${webhook.active ? '🔒 Desactivar' : '🔓 Activar'}
                    </button>
                    <button class="btn btn-danger" onclick="deleteWebhook('${webhook.id}')">
                        🗑️ Eliminar
                    </button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error cargando webhooks:', error);
        document.getElementById('webhooks-list').innerHTML = '<p>Error al cargar webhooks</p>';
    }
}

// Cargar logs
async function loadLogs() {
    try {
        const logs = await fetchAPI('/logs?limit=20');
        const logsDiv = document.getElementById('logs-list');
        
        if (logs.length === 0) {
            logsDiv.innerHTML = '<p>Sin eventos registrados</p>';
            return;
        }
        
        logsDiv.innerHTML = logs.map(log => `
            <div class="log-item">
                <div class="log-timestamp">${new Date(log.timestamp).toLocaleString('es-ES')}</div>
                <div class="log-webhook">📡 ${log.webhook_name}</div>
                <div class="log-data">${JSON.stringify(log.event_data, null, 2)}</div>
            </div>
        `).reverse().join('');
    } catch (error) {
        console.error('Error cargando logs:', error);
    }
}

// Crear webhook
document.getElementById('webhook-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const name = document.getElementById('webhook-name').value;
    const url = document.getElementById('webhook-url').value;
    const events = document.getElementById('webhook-events').value;
    
    try {
        const result = await fetchAPI('/webhooks', {
            method: 'POST',
            body: JSON.stringify({
                name: name,
                url: url,
                events: events
            })
        });
        
        if (result.success) {
            alert('✓ Webhook creado exitosamente');
            this.reset();
            loadWebhooks();
            loadStats();
        }
    } catch (error) {
        alert('Error al crear webhook: ' + error.message);
    }
});

// Disparar webhook
async function triggerWebhook(webhookId) {
    try {
        const result = await fetchAPI(`/webhooks/${webhookId}/trigger`, {
            method: 'POST',
            body: JSON.stringify({
                evento: 'test',
                timestamp: new Date().toISOString()
            })
        });
        
        if (result.success) {
            alert('✓ Webhook disparado exitosamente');
            loadLogs();
        }
    } catch (error) {
        alert('Error al disparar webhook: ' + error.message);
    }
}

// Activar/desactivar webhook
async function toggleWebhook(webhookId) {
    try {
        const result = await fetchAPI(`/webhooks/${webhookId}/toggle`, {
            method: 'POST'
        });
        
        if (result.success) {
            loadWebhooks();
            loadStats();
        }
    } catch (error) {
        alert('Error al cambiar estado: ' + error.message);
    }
}

// Eliminar webhook
async function deleteWebhook(webhookId) {
    if (!confirm('¿Seguro que quieres eliminar este webhook?')) {
        return;
    }
    
    try {
        const result = await fetchAPI(`/webhooks/${webhookId}`, {
            method: 'DELETE'
        });
        
        if (result.success) {
            alert('✓ Webhook eliminado exitosamente');
            loadWebhooks();
            loadStats();
        }
    } catch (error) {
        alert('Error al eliminar webhook: ' + error.message);
    }
}

// Cargar datos al iniciar la página
document.addEventListener('DOMContentLoaded', function() {
    loadStats();
    loadWebhooks();
    loadLogs();
    
    // Refrescar datos cada 5 segundos
    setInterval(() => {
        loadStats();
        loadLogs();
    }, 5000);
});

// Smooth scroll
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});
