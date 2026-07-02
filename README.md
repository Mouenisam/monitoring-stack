# Monitoring Stack — k6 + Prometheus + Grafana

Stack Docker complète pour l'exécution de tests de charge avec visualisation en temps réel des métriques.

## Objectif

Fournir un environnement modulable pour tester la performance de n'importe quelle plateforme web, avec :

- **k6** — générateur de charge (scripts JavaScript)
- **Prometheus** — collecte et stockage des métriques (via Remote Write)
- **Grafana** — visualisation en temps réel

## Prérequis

- Docker Desktop (ou Docker Engine + Docker Compose v2)
- ~2 Go de RAM disponible

## Utilisation rapide

```bash
# Démarrer la stack de monitoring
docker compose up -d

# Lancer un test de charge
docker compose run --rm k6 run /scripts/smoke-test.js

# Consulter les résultats
# → Grafana : http://localhost:3000 (admin/admin)
# → Prometheus : http://localhost:9090
```

## Structure

```
.
├── docker-compose.yml
├── prometheus/
│   └── prometheus.yml
├── grafana/
│   └── provisioning/
└── scripts/
    ├── smoke-test.js
    ├── load-test.js
    └── stress-test.js
```

## Configuration

L'URL cible et les paramètres sont dans `.env` (voir `.env.example`).