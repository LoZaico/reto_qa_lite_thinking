import http from 'k6/http';
import { check, group, sleep } from 'k6';

// Configuración para todas las pruebas
export const options = {
  stages: [
    { duration: '1m', target: 10 },   // Prueba de carga leve
    { duration: '2m', target: 10 },   
    { duration: '1m', target: 25 },   // Prueba de carga media  
    { duration: '2m', target: 25 },
    { duration: '1m', target: 50 },   // Prueba de estrés
    { duration: '2m', target: 50 },
    { duration: '1m', target: 0 },    // Recuperación
  ],
  thresholds: {
    http_req_failed: ['rate<0.05'],    // Menos del 5% de errores
    http_req_duration: ['p(95)<3000'], // 95% de requests bajo 3s
    checks: ['rate>0.95']              // 95% de checks exitosos
  }
};

// Servicios públicos que simulan tus microservicios
const SERVICES = {
  catalogue: 'https://jsonplaceholder.typicode.com/posts',
  carts: 'https://httpbin.org/json', 
  orders: 'https://reqres.in/api/users',
  login: 'https://reqres.in/api/login',
  tags: 'https://jsonplaceholder.typicode.com/todos'
};

export default function() {
  // GRUPO 1: Comunicación entre servicios
  group('Comunicación entre servicios', function() {
    // Simular flujo: catalogue -> carts -> orders
    const catalogueRes = http.get(SERVICES.catalogue);
    check(catalogueRes, {
      'catalogue responde': (r) => r.status === 200,
      'catalogue tiene datos': (r) => JSON.parse(r.body).length > 0
    });
    
    if (catalogueRes.status === 200) {
      const cartsRes = http.get(SERVICES.carts);
      check(cartsRes, {
        'carts responde después de catalogue': (r) => r.status === 200,
        'comunicación exitosa': (r) => r.timings.duration < 2000
      });
    }
    
    sleep(1);
  });

  // GRUPO 2: Manejo de errores
  group('Manejo de errores', function() {
    // Test endpoint que no existe (debería dar 404)
    const notFoundRes = http.get('https://httpbin.org/status/404');
    check(notFoundRes, {
      'maneja 404 correctamente': (r) => r.status === 404
    });
    
    // Test error del servidor (500)
    const serverErrorRes = http.get('https://httpbin.org/status/500');
    check(serverErrorRes, {
      'maneja 500 correctamente': (r) => r.status === 500
    });
    
    // Test timeout
    const timeoutRes = http.get('https://httpbin.org/delay/2', { timeout: '1s' });
    check(timeoutRes, {
      'maneja timeout': (r) => r.status === 0 || r.timings.duration < 3000
    });
  });

  // GRUPO 3: Tiempos de respuesta
  group('Tiempos de respuesta', function() {
    const endpoints = [
      { name: 'catalogue', url: SERVICES.catalogue },
      { name: 'carts', url: SERVICES.carts },
      { name: 'orders', url: SERVICES.orders },
      { name: 'login', url: SERVICES.login },
      { name: 'tags', url: SERVICES.tags }
    ];

    endpoints.forEach(endpoint => {
      const res = http.get(endpoint.url);
      check(res, {
        [`${endpoint.name} responde en <2s`]: (r) => r.timings.duration < 2000,
        [`${endpoint.name} tiene contenido`]: (r) => r.body.length > 0
      });
    });
  });

  // GRUPO 4: Pruebas de carga específicas
  group('Pruebas de carga', function() {
    // Multiple requests simultáneas
    const responses = http.batch([
      ['GET', SERVICES.catalogue],
      ['GET', SERVICES.carts],
      ['GET', SERVICES.orders]
    ]);
    
    check(responses[0], {
      'catalogue soporta carga': (r) => r.status === 200
    });
    check(responses[1], {
      'carts soporta carga': (r) => r.status === 200
    });
    check(responses[2], {
      'orders soporta carga': (r) => r.status === 200
    });
  });
}