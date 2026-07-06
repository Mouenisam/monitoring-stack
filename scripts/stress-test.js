import http from 'k6/http';
import { check, sleep } from 'k6';

// ============================================================
// STRESS TEST — Trouver le point de rupture
// ============================================================
// ATTENTION : ce test pousse volontairement la cible au-delà
// de sa capacité normale. À utiliser uniquement sur des
// environnements dédiés (jamais en production directe).
// ============================================================

export const options = {
  // Montée agressive par paliers jusqu'à trouver la limite
  stages: [
    { duration: '1m', target: 50 },    // Palier 1 : 50 users (charge normale)
    { duration: '2m', target: 50 },    // Stabilisation
    { duration: '1m', target: 100 },   // Palier 2 : 100 users (charge élevée)
    { duration: '2m', target: 100 },
    { duration: '1m', target: 200 },   // Palier 3 : 200 users (stress)
    { duration: '2m', target: 200 },
    { duration: '2m', target: 0 },     // Recovery : retour au calme
  ],

  // Seuils PLUS PERMISSIFS que le load test
  // On s'attend à ce que la cible souffre : ce qu'on veut mesurer,
  // c'est OÙ elle craque, pas si elle craque.
  thresholds: {
    http_req_duration: ['p(95)<5000'],   // P95 < 5s (au-delà, considéré comme cassé)
    http_req_failed: ['rate<0.10'],      // moins de 10% d'erreurs (au-delà = rupture)
  },

  // Tags pour filtrer dans Grafana
  tags: {
    testType: 'stress',
    application: 'petstore',
  },
};

const BASE_URL = __ENV.BASE_URL || 'https://petstore.octoperf.com';

// ============================================================
// Scénario utilisateur simplifié
// ============================================================
// On garde volontairement un scénario léger pour maximiser
// le RPS et solliciter le serveur au maximum.
export default function () {
  const response = http.get(`${BASE_URL}/actions/Catalog.action`, {
    tags: { endpoint: 'catalog_home' },
  });

  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time acceptable': (r) => r.timings.duration < 3000,
  });

  sleep(1);  // pause courte pour maximiser la pression
}
