# Monitoring Stack — k6 + Prometheus + Grafana

> Stack Docker complète et modulable pour l'exécution de tests de charge avec visualisation en temps réel des métriques.

Cette stack permet de tester la performance de **n'importe quelle plateforme web** grâce à une configuration entièrement externalisée.

---

## Vue d'ensemble

```
┌─────────┐   requêtes HTTP    ┌──────────────┐
│   k6    │───────────────────>│ Application  │
│(charge) │   (simule users)   │   testée     │
└────┬────┘                    └──────────────┘
     │
     │ push métriques (Remote Write)
     ▼
┌──────────────┐   requêtes    ┌─────────────┐
│  Prometheus  │<──────────────│   Grafana   │
│    (TSDB)    │    PromQL     │ (dashboards)│
└──────────────┘               └─────────────┘
```

- **k6** — générateur de charge open-source (scripts JavaScript)
- **Prometheus** — collecte et stockage des métriques via Remote Write
- **Grafana** — visualisation en temps réel avec dashboards pré-provisionnés

---

## Prérequis

- **Docker Desktop** (macOS/Windows) ou **Docker Engine + Docker Compose v2** (Linux)
- **~2 Go de RAM** disponible
- Un accès réseau à la plateforme à tester

---

## Démarrage rapide

```bash
# 1. Cloner le repository
git clone https://github.com/Mouenisam/monitoring-stack.git
cd monitoring-stack

# 2. Configurer les variables d'environnement
cp .env.example .env

# 3. Démarrer la stack de monitoring
docker compose up -d

# 4. Lancer un test de charge
docker compose run --rm k6 run /scripts/smoke-test.js

# 5. Consulter les résultats sur http://localhost:3000
```

---

## Structure du projet

```
monitoring-stack/
├── docker-compose.yml           # Orchestration des 3 services
├── .env.example                 # Template de configuration
├── .env                         # Configuration locale (non versionnée)
│
├── prometheus/
│   └── prometheus.yml           # Config Prometheus (scraping, Remote Write)
│
├── grafana/
│   └── provisioning/
│       ├── datasources/
│       │   └── datasource.yml   # Connexion auto à Prometheus
│       └── dashboards/
│           ├── dashboards.yml   # Provider de dashboards
│           └── k6.json          # Dashboard k6 officiel (ID 19665)
│
└── scripts/
    ├── smoke-test.js            # Validation rapide (2 users, 30s)
    ├── load-test.js             # Charge réaliste (montée à 20 users, 9 min)
    └── stress-test.js           # Point de rupture (jusqu'à 200 users, 11 min)
```

---

## Utilisation

### Les 3 types de tests fournis

| Script | Objectif | Charge | Durée |
|--------|----------|--------|-------|
| `smoke-test.js` | Vérifier que la stack fonctionne | 2 VUs constants | 30s |
| `load-test.js` | Valider le trafic normal attendu | 0 → 20 → 0 VUs | 9 min |
| `stress-test.js` | Trouver le point de rupture | Paliers 50/100/200 VUs | 11 min |

### Lancer un test

```bash
docker compose run --rm k6 run /scripts/smoke-test.js
docker compose run --rm k6 run /scripts/load-test.js
docker compose run --rm k6 run /scripts/stress-test.js
```

Pour interrompre un test : `Ctrl+C` dans le terminal où tourne k6.

---

## Configuration

### Adapter à une autre plateforme

Toute la configuration est dans le fichier `.env`. Il suffit de modifier `BASE_URL` :

```bash
BASE_URL=https://ta-plateforme.com
```

Puis relancer la stack avec `docker compose up -d`.

### Variables d'environnement disponibles

| Variable | Rôle | Défaut |
|----------|------|--------|
| `BASE_URL` | URL de base de la cible | `https://petstore.octoperf.com` |
| `GF_SECURITY_ADMIN_USER` | Utilisateur admin Grafana | `admin` |
| `GF_SECURITY_ADMIN_PASSWORD` | Mot de passe admin Grafana | `admin` |
| `PROMETHEUS_VERSION` | Version de l'image Prometheus | `v3.1.0` |
| `GRAFANA_VERSION` | Version de l'image Grafana | `11.4.0` |
| `K6_VERSION` | Version de l'image k6 | `0.55.0` |

---

## Accès aux interfaces

| Service | URL | Identifiants |
|---------|-----|--------------|
| **Grafana** | http://localhost:3000 | `admin` / `admin` |
| **Prometheus** | http://localhost:9090 | Pas d'authentification |

Le dashboard k6 est pré-importé dans le dossier **Load Testing** de Grafana.

---

## Commandes utiles

```bash
docker compose ps                          # État de la stack
docker compose logs -f grafana             # Logs en direct
docker compose restart grafana             # Redémarrer un service
docker compose stop                        # Arrêter (garde les données)
docker compose down -v                     # Tout supprimer (perte des métriques)
```

---

## Troubleshooting

### Grafana ne se lance pas

Vérifier les logs : `docker compose logs grafana --tail 30`. Cas fréquent : un fichier de config vide (0 octets).

### k6 n'envoie pas les métriques à Prometheus

Vérifier le flag Remote Write : `docker compose logs prometheus | grep remote`. Si absent : `docker compose up -d --force-recreate prometheus`.

### Le dashboard Grafana est vide

Vérifier la plage temporelle (en haut à droite) : basculer sur **"Last 15 minutes"**.

### "Cannot connect to Docker daemon"

Docker Desktop n'est pas lancé. Le lancer via Spotlight (`Cmd+Espace` → "Docker").

---

## Bonnes pratiques

- **Jamais de stress test sur une plateforme tierce sans autorisation**
- Préférer les environnements de staging à la production
- Épingler des versions précises dans `.env` (jamais `latest`)
- Utiliser un vrai mot de passe Grafana en usage partagé

---

## Ressources

- **k6 Documentation** — https://grafana.com/docs/k6/latest/
- **Prometheus Remote Write** — https://prometheus.io/docs/specs/remote_write_spec/
- **Grafana Dashboard k6** — https://grafana.com/grafana/dashboards/19665

---

*Stack construite pas à pas avec un focus sur la compréhension de chaque composant.*
