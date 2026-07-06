import http from 'k6/http';
import { check, sleep } from 'k6';

// ============================================================
// LOAD TEST — Trafic réaliste attendu en production
// ============================================================
// Profil de charge : montée progressive → plateau → descente
// Simule une journée normale d'utilisation de l'application.
// ============================================================

export const options = {
  // Profil de charge en 3 phases
  stages: [
    { duration: '2m', target: 20 },   // Phase 1 : montée douce de 0 à 20 users en 2 min
    { duration: '5m', target: 20 },   // Phase 2 : plateau à 20 users pendant 5 min
    { duration: '2m', target: 0 },    // Phase 3 : descente à 0 en 2 min
  ],

  // Seuils SLO (Service Level Objectives)
  // Ces valeurs doivent refléter les engagements de qualité de service.
  thresholds: {
    http_req_duration: ['p(95)<1500', 'p(99)<3000'],  // 99% des requêtes < 3s
    http_req_failed: ['rate<0.02'],     // moins de 2% d'erreurs
  },

  // Tags pour filtrer dans Grafana
  tags: {
    testType: 'load',
    application: 'petstore',
  },
};

const BASE_URL = __ENV.BASE_URL || 'https://petstore.octoperf.com';

// ============================================================
// Scénario utilisateur : parcours réaliste
// ============================================================
export default function () {
  // 1. Page d'accueil du catalogue
  const homeResponse = http.get(`${BASE_URL}/actions/Catalog.action`, {
    tags: { endpoint: 'catalog_home' },
  });
  check(homeResponse, {
    'catalog home status is 200': (r) => r.status === 200,
  });
  sleep(Math.random() * 2 + 1);  // pause aléatoire entre 1s et 3s

  // 2. Consulter une catégorie
  const categories = ['DOGS', 'CATS', 'FISH', 'REPTILES', 'BIRDS'];
  const category = categories[Math.floor(Math.random() * categories.length)];

  const categoryResponse = http.get(
    `${BASE_URL}/actions/Catalog.action?viewCategory=&categoryId=${category}`,
    { tags: { endpoint: 'view_category' } }
  );
  check(categoryResponse, {
    'category status is 200': (r) => r.status === 200,
  });
  sleep(Math.random() * 3 + 2);  // pause 2-5s (l'utilisateur lit)

  // 3. Retour à l'accueil (comportement fréquent)
  const backHome = http.get(`${BASE_URL}/actions/Catalog.action`, {
    tags: { endpoint: 'catalog_home_back' },
  });
  check(backHome, {
    'back home status is 200': (r) => r.status === 200,
  });
  sleep(Math.random() * 2 + 1);
}
