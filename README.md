# Monitoring Stack — k6 + Prometheus + Grafana

> Stack Docker complète et modulable pour l'exécution de tests de charge avec visualisation en temps réel des métriques.

Cette stack permet de tester la performance de **n'importe quelle plateforme web** grâce à une configuration entièrement externalisée. Le générateur de charge, la collecte de métriques et la visualisation sont pré-configurés, prêts à l'emploi en quelques secondes.

---

## Vue d'ensemble

`​``
┌─────────┐   requêtes HTTP    ┌──────────────┐
│   k6    │───────────────────>│ Application  │
│(charge) │   (simule users)   │   testée     │
└────┬────┘                    └──────────────┘
     │
     │ push métriques
     │ (Remote Write)
     ▼
┌──────────────┐   requêtes    ┌─────────────┐
│  Prometheus  │<──────────────│   Grafana   │
│    (TSDB)    │    PromQL     │ (dashboards)│
└──────────────┘               └─────────────┘
`​``

- **k6** — générateur de charge open-source par Grafana Labs (scripts JavaScript)
- **Prometheus** — collecte et stockage des métriques via Remote Write
- **Grafana** — visualisation en temps réel avec dashboards pré-provisionnés

---

## Prérequis

- **Docker Desktop** (macOS/Windows) ou **Docker Engine + Docker Compose v2** (Linux)
- **~2 Go de RAM** disponible
- Un accès réseau à la plateforme à tester

Vérification des versions :

`​``bash
docker --version         # 24.x ou supérieur
docker compose version   # v2.x ou supérieur
`​``

---

## Démarrage rapide

`​``bash
# 1. Cloner le repository
git clone https://github.com/Mouenisam/monitoring-stack.git
cd monitoring-stack

# 2. Configurer les variables d'environnement
cp .env.example .env
# Édite .env pour adapter BASE_URL à ta cible

# 3. Démarrer la stack de monitoring
docker compose up -d

# 4. Lancer un test de charge (smoke test — 30 secondes)
docker compose run --rm k6 run /scripts/smoke-test.js

# 5. Consulter les résultats
# → http://localhost:3000 (Grafana, admin / admin)
`​``

---

## Structure du projet

`​``
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
`​``

---

## Utilisation

### Les 3 types de tests fournis

| Script | Objectif | Charge | Durée | Cas d'usage |
|--------|----------|--------|-------|-------------|
| `smoke-test.js` | Vérifier que la stack fonctionne | 2 VUs constants | 30s | À chaque modification du script |
| `load-test.js` | Valider le trafic normal attendu | 0 → 20 → 0 VUs | 9 min | Avant chaque mise en production |
| `stress-test.js` | Trouver le point de rupture | Paliers 50/100/200 VUs | 11 min | Capacity planning, en environnement dédié |

### Lancer un test

`​``bash
# Smoke test
docker compose run --rm k6 run /scripts/smoke-test.js

# Load test
docker compose run --rm k6 run /scripts/load-test.js

# Stress test (ATTENTION : uniquement sur environnement dédié)
docker compose run --rm k6 run /scripts/stress-test.js
`​``

### Interrompre un test en cours

`​``bash
# Ctrl+C dans le terminal où tourne k6
# k6 termine proprement les VUs en cours et sort le résumé
`​``

---

## Configuration

### Adapter à une autre plateforme

Toute la configuration est dans le fichier `.env`. Il suffit de modifier `BASE_URL` :

`​``bash
# Dans .env
BASE_URL=https://ta-plateforme.com
`​``

Puis relancer la stack :

`​``bash
docker compose up -d
`​``

### Créer un scénario pour ta propre plateforme

Copie un script existant et adapte les endpoints :

`​``bash
cp scripts/smoke-test.js scripts/mon-test.js
`​``

Dans `mon-test.js`, remplace les URLs par tes propres endpoints, par exemple :

`​``javascript
export default function () {
  const response = http.get(`${BASE_URL}/api/v1/produits`);
  check(response, {
    'status is 200': (r) => r.status === 200,
  });
  sleep(1);
}
`​``

Puis lance :

`​``bash
docker compose run --rm k6 run /scripts/mon-test.js
`​``

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
| **Grafana** | http://localhost:3000 | `admin` / `admin` (défaut) |
| **Prometheus** | http://localhost:9090 | Pas d'authentification |

### Dashboards Grafana

Un dashboard k6 officiel est pré-importé automatiquement. Pour y accéder :

1. Ouvrir http://localhost:3000
2. Se connecter (`admin` / `admin`)
3. Menu de gauche → **Dashboards**
4. Ouvrir le dossier **Load Testing**
5. Cliquer sur **k6 Prometheus**

Astuce : en haut à droite du dashboard, régler la plage temporelle sur **"Last 15 minutes"** et le rafraîchissement automatique sur **5s** pour du live monitoring pendant un test.

---

## Commandes utiles

`​``bash
# État de la stack
docker compose ps

# Logs en direct
docker compose logs -f grafana
docker compose logs -f prometheus

# Redémarrer un service
docker compose restart grafana

# Arrêter la stack (garde les données)
docker compose stop

# Tout supprimer (conteneurs + volumes = perte des métriques)
docker compose down -v

# Vérifier la config résolue
docker compose config
`​``

---

## Troubleshooting

### Grafana ne se lance pas

`​``bash
docker compose logs grafana --tail 30
`​``

Cas fréquent : le fichier `datasource.yml` ou `dashboards.yml` est vide (0 octets). Vérifier avec `ls -la` et re-créer avec la syntaxe `cat > fichier << 'EOF' ... EOF`.

### k6 échoue à envoyer les métriques à Prometheus

Vérifier que Prometheus a bien été démarré avec le flag Remote Write :

`​``bash
docker compose logs prometheus | grep "remote"
`​``

Si le flag est absent, forcer la recréation :

`​``bash
docker compose up -d --force-recreate prometheus
`​``

### Le dashboard Grafana est vide malgré un test réussi

Vérifier que la plage temporelle en haut à droite couvre bien le moment du test (par défaut "Last 6 hours"). Basculer sur **"Last 15 minutes"**.

### "Cannot connect to Docker daemon"

Docker Desktop n'est pas lancé. Le lancer via Spotlight (`Cmd+Espace` → "Docker") et attendre que la baleine dans la barre de menus se stabilise.

### Le fichier `.env` apparaît sur GitHub

C'est une erreur critique de sécurité. Vérifier le `.gitignore` puis :

`​``bash
git rm --cached .env
git commit -m "Remove .env from tracking"
git push
`​``

---

## Bonnes pratiques

### Éthique des tests de charge

- **Jamais de stress test sur une plateforme tierce sans autorisation**
- **Toujours prévenir l'équipe** avant un test sur un environnement partagé
- **Préférer les environnements de staging** aux environnements de production
- Documenter les tests dans un journal (date, cible, résultat)

### En production

- Épingler des versions précises dans `.env` (jamais `latest`)
- Utiliser un vrai mot de passe Grafana (pas `admin`)
- Sauvegarder régulièrement les dashboards personnalisés
- Considérer un stockage long terme (Thanos, Mimir) au-delà de 15 jours

---

## Ressources

- **k6 Documentation** — https://grafana.com/docs/k6/latest/
- **Prometheus Remote Write** — https://prometheus.io/docs/specs/remote_write_spec/
- **Grafana Dashboard officiel k6** — https://grafana.com/grafana/dashboards/19665
- **PromQL Cheat Sheet** — https://promlabs.com/promql-cheat-sheet/

---

## Licence

Projet à usage interne / démonstration.


