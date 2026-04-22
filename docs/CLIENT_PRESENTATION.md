# Client Presentation: Zynk Play Entertainment Platform

## Project Summary

Zynk Play is a full-stack entertainment platform built with Django and React. It delivers:

- OTP-based authentication for simple, secure login
- Subscription plans and access control
- Streaming and media playback capabilities
- Interactive gaming and dashboard experiences
- Docker-ready deployment for consistent delivery

## Key Highlights

- Backend: Django + Django REST Framework
- Frontend: React + TypeScript
- Database: SQLite for development, production-ready migration paths available
- Authentication: OTP + JWT workflows
- Deployment support: Docker Compose, Nginx, and environment configuration

## What’s Included

1. **API-first backend**
   - 23 REST API endpoints
   - Serialized models and viewsets for modern frontend integration
   - Clean separation of Django app logic in `entertainment_platform/`

2. **React frontend**
   - Modular page components under `frontend/src/pages/`
   - API client utilities for communication with Django backend
   - Stream player and game launcher UI screens

3. **Professional deployment setup**
   - `docker-compose.yml` for local multi-container development
   - `Dockerfile.backend` and `Dockerfile.frontend`
   - `nginx.conf` for production reverse proxy support

## Screenshot

![Live App Demo](assets/project-screenshot.png)

> Screenshot placeholder: replace this image with an actual capture of the app dashboard, login screen, or streaming page.

## Quick Demo Instructions

1. Open the project folder:

```cmd
cd d:\Projects\zynk-play
```

2. Install backend dependencies:

```cmd
pip install -r requirements.txt
```

3. Copy environment template:

```cmd
copy .env.example .env
```

4. Run Django migrations:

```cmd
python manage.py migrate
```

5. Start the application:

```cmd
python manage.py runserver 0.0.0.0:8000
```

6. Open the client app:

- Backend API: `http://localhost:8000/api/v1/`
- Frontend (if configured separately): `http://localhost:3000/`

## Notes for the Client

- The attached screenshot is a placeholder. For the final client presentation, replace it with a screenshot of the live app screen you want to showcase.
- If you want, I can also create a polished presentation version using the actual app screenshot and summary text.
