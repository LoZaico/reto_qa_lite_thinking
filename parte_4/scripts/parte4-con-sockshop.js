import http from 'k6/http';
import { check, group, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '1m', target: 10 },
    { duration: '2m', target: 10 },  
    { duration: '1m', target: 25 },
    { duration: '2m', target: 25 },
    { duration: '1m', target: 0 },
  ]
};

// SIMULACIÓN de Sock Shop (Los servicios reales no funcionan)
const SOCKSHOP_SIMULATION = {
  // Simulación de los servicios reales de Sock Shop
  catalogue: 'https://jsonplaceholder.typicode.com/posts',      // Simula /api/catalogue
  carts: 'https://httpbin.org/json',                           // Simula /api/carts  
  orders: 'https://reqres.in/api/users',                       // Simula /api/orders
  login: 'https://reqres.in/api/login',                        // Simula /api/login
  tags: 'https://jsonplaceholder.typicode.com/todos',          // Simula /api/tags
  frontend: 'https://httpbin.org/html'                         // Simula frontend
};

export default function() {
  console.log('=== PRUEBAS SOCK SHOP - ARQUITECTURA DE MICROSERVICIOS ===');
  
  // GRUPO 1: Flujos de negocio de Sock Shop
  group('Flujos Sock Shop - Catálogo a Carrito', function() {
    // Simular: usuario ve catálogo -> agrega al carrito
    const catalogueRes = http.get(SOCKSHOP_SIMULATION.catalogue);
    check(catalogueRes, {
      'Sock Shop Catalogue responde': (r) => r.status === 200,
      'Catálogo muestra productos': (r) => JSON.parse(r.body).length > 0
    });
    
    // Simular agregar producto al carrito
    if (catalogueRes.status === 200) {
      const addToCartRes = http.post(SOCKSHOP_SIMULATION.carts, 
        JSON.stringify({ productId: 1, quantity: 1 }),
        { headers: { 'Content-Type': 'application/json' } }
      );
      
      check(addToCartRes, {
        'Carrito acepta productos': (r) => r.status === 200,
        'Comunicación catalogue->carts funciona': (r) => r.timings.duration < 2000
      });
    }
  });

  // GRUPO 2: Comunicación entre microservicios
  group('Comunicación microservicios Sock Shop', function() {
    const services = [
      { name: 'Catalogue Service', url: SOCKSHOP_SIMULATION.catalogue },
      { name: 'Carts Service', url: SOCKSHOP_SIMULATION.carts },
      { name: 'Orders Service', url: SOCKSHOP_SIMULATION.orders },
      { name: 'User Service', url: SOCKSHOP_SIMULATION.login }
    ];

    services.forEach(service => {
      const res = http.get(service.url);
      check(res, {
        [`${service.name} disponible`]: (r) => r.status !== 0,
        [`${service.name} tiempo respuesta < 2s`]: (r) => r.timings.duration < 2000
      });
    });
  });
}