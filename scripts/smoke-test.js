import http from 'k6/http';
import { check, sleep } from 'k6';

// ============================================================
// Configuration du test
// ============================================================
export const options = {
  // Smoke test : très petite charge, courte durée
  vus: 2,              // 2 utilisateurs virtuels en parallèle
  duration: '30s',     // pendant 30 secondes

  // Seuils : si l'un est cassé, le test est marqué "failed"
  thresholds: {
    http_req_duration: ['p(95)<2000'],  // 95% des requêtes doivent répondre en < 2s
    http_req_failed: ['rate<0.01'],     // moins de 1% d'erreurs HTTP
  },

  // Tags qui seront attachés à toutes les métriques envoyées à Prometheus
  // Permet de filtrer dans Grafana : "montre-moi seulement les tests de type smoke"
  tags: {
    testType: 'smoke',
    application: 'petstore',
  },
};

// URL cible (injectée depuis le docker-compose via BASE_URL)
const BASE_URL = __ENV.BASE_URL || 'https://petstore.octoperf.com';

// ============================================================
// Scénario utilisateur : ce que chaque VU fait en boucle
// ============================================================
export default function () {
  // Étape 1 : afficher la page d'accueil du catalogue
  const homeResponse = http.get(`${BASE_URL}/actions/Catalog.action`, {
    tags: { endpoint: 'catalog_home' },
  });

  check(homeResponse, {
    'catalog home status is 200': (r) => r.status === 200,
    'catalog home has content': (r) => r.body && r.body.length > 100,
  });

  sleep(1);  // pause 1s (simule un vrai utilisateur qui lit la page)

  // Étape 2 : afficher une catégorie (les chiens par exemple)
  const categoryResponse = http.get(
    `${BASE_URL}/actions/Catalog.action?viewCategory=&categoryId=DOGS`,
    { tags: { endpoint: 'category_dogs' } }
  );

  check(categoryResponse, {
    'category status is 200': (r) => r.status === 200,
  });

  sleep(2);  // pause 2s avant de recommencer la boucle
}
