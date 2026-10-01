from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
from datetime import datetime
import json
import uuid

app = Flask(__name__)
CORS(app)

# Almacenamiento en memor
webhooks = {}
webhook_logs = []

class WebhookManager:
    """Gestor de webhooks"""
    
    @staticmethod
    def create_webhook(url, name, events):
        """Crear un nuevo webhook"""
        webhook_id = str(uuid.uuid4())
        webhooks[webhook_id] = {
            'id': webhook_id,
            'name': name,
            'url': url,
            'events': events,
            'created_at': datetime.now().isoformat(),
            'active': True,
            'last_triggered': None
        }
        return webhook_id
    
    @staticmethod
    def get_webhooks():
        """Obtener todos los webhooks"""
        return list(webhooks.values())
    
    @staticmethod
    def trigger_webhook(webhook_id, event_data):
        """Disparar un webhook"""
        if webhook_id not in webhooks:
            return False
        
        webhook = webhooks[webhook_id]
        if not webhook['active']:
            return False
        
        webhook_logs.append({
            'id': str(uuid.uuid4()),
            'webhook_id': webhook_id,
            'webhook_name': webhook['name'],
            'timestamp': datetime.now().isoformat(),
            'event_data': event_data,
            'status': 'success'
        })
        
        webhook['last_triggered'] = datetime.now().isoformat()
        return True
    
    @staticmethod
    def toggle_webhook(webhook_id):
        """Activar/desactivar un webhook"""
        if webhook_id in webhooks:
            webhooks[webhook_id]['active'] = not webhooks[webhook_id]['active']
            return True
        return False
    
    @staticmethod
    def delete_webhook(webhook_id):
        """Eliminar un webhook"""
        if webhook_id in webhooks:
            del webhooks[webhook_id]
            return True
        return False
    
    @staticmethod
    def get_logs(limit=50):
        """Obtener logs de webhooks"""
        return webhook_logs[-limit:]


# Rutas de la interfaz web
@app.route('/')
def index():
    """Página principal"""
    return render_template('index.html')


# API REST para webhooks
@app.route('/api/webhooks', methods=['GET'])
def get_webhooks_api():
    """Obtener lista de webhooks"""
    return jsonify(WebhookManager.get_webhooks())


@app.route('/api/webhooks', methods=['POST'])
def create_webhook_api():
    """Crear un nuevo webhook"""
    data = request.get_json()
    
    if not all(k in data for k in ['name', 'url', 'events']):
        return jsonify({'error': 'Faltan parámetros requeridos'}), 400
    
    webhook_id = WebhookManager.create_webhook(
        url=data['url'],
        name=data['name'],
        events=data['events']
    )
    
    return jsonify({
        'success': True,
        'webhook_id': webhook_id
    }), 201


@app.route('/api/webhooks/<webhook_id>/toggle', methods=['POST'])
def toggle_webhook_api(webhook_id):
    """Activar/desactivar un webhook"""
    if WebhookManager.toggle_webhook(webhook_id):
        return jsonify({'success': True})
    return jsonify({'error': 'Webhook no encontrado'}), 404


@app.route('/api/webhooks/<webhook_id>', methods=['DELETE'])
def delete_webhook_api(webhook_id):
    """Eliminar un webhook"""
    if WebhookManager.delete_webhook(webhook_id):
        return jsonify({'success': True})
    return jsonify({'error': 'Webhook no encontrado'}), 404


@app.route('/api/webhooks/<webhook_id>/trigger', methods=['POST'])
def trigger_webhook_api(webhook_id):
    """Disparar un webhook manualmente (para testing)"""
    data = request.get_json() or {}
    
    if WebhookManager.trigger_webhook(webhook_id, data):
        return jsonify({'success': True})
    return jsonify({'error': 'Webhook no encontrado'}), 404


@app.route('/api/logs', methods=['GET'])
def get_logs_api():
    """Obtener logs de webhooks"""
    limit = request.args.get('limit', 50, type=int)
    return jsonify(WebhookManager.get_logs(limit))


@app.route('/api/stats', methods=['GET'])
def get_stats_api():
    """Obtener estadísticas"""
    return jsonify({
        'total_webhooks': len(webhooks),
        'active_webhooks': sum(1 for w in webhooks.values() if w['active']),
        'total_events': len(webhook_logs),
        'webhooks': WebhookManager.get_webhooks(),
        'recent_events': WebhookManager.get_logs(10)
    })


# Ruta de prueba para recibir webhooks
@app.route('/webhook/receive/<webhook_id>', methods=['POST'])
def receive_webhook(webhook_id):
    """Endpoint que recibe webhooks (simula un servidor externo)"""
    data = request.get_json() or request.form.to_dict()
    
    if WebhookManager.trigger_webhook(webhook_id, data):
        return jsonify({'success': True, 'message': 'Webhook recibido'})
    return jsonify({'error': 'Webhook no encontrado'}), 404


if __name__ == '__main__':
    # Crear webhooks de ejemplo
    WebhookManager.create_webhook(
        name='Notificaciones de Ejemplo',
        url='https://ejemplo.com/webhook',
        events=['user.created', 'user.updated']
    )
    
    app.run(debug=True, host='0.0.0.0', port=5000)
