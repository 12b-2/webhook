# Webhook Project

Interfaz web y API Python para la gestión de webhooks.

## Descripción

Este proyecto proporciona:
- Un servidor Python (Flask) que maneja webhooks
- Un sitio web interactivo que explica qué son los webhooks
- Una interfaz para registrar, ver y gestionar webhooks
- Ejemplos de cómo usar la API

## Instalación

```bash
pip install flask flask-cors requests
```

## Ejecución

```bash
python app.py
```

Luego accede a `http://localhost:5000` en tu navegador.

## Estructura

```
webhook/
├── app.py           # Servidor Flask
├── requirements.txt # Dependencias
├── static/
│   ├── css/
│   │   └── style.css    # Estilos
│   └── js/
│       └── script.js    # Interactividad
└── templates/
    └── index.html       # Sitio web
```
