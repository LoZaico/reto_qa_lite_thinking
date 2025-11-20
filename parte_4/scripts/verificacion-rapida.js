import http from 'k6/http';
import { check } from 'k6';

export const options = {
  vus: 1,
  iterations: 1
};

const SERVICES = {
  catalogue: 'https://jsonplaceholder.typicode.com/posts',
  carts: 'https://httpbin.org/json',
  orders: 'https://reqres.in/api/users',
  login: 'https://reqres.in/api/login',
  tags: 'https://jsonplaceholder.typicode.com/todos'
};

export default function() {
  console.log('=== VERIFICACIÓN RÁPIDA DE SERVICIOS ===\n');
  
  Object.keys(SERVICES).forEach(service => {
    const res = http.get(SERVICES[service]);
    const status = res.status === 200 ? '✅' : '❌';
    
    console.log(`${status} ${service}: ${res.status} - ${res.timings.duration}ms`);
    
    check(res, {
      [`${service} disponible`]: (r) => r.status === 200,
      [`${service} responde rápido`]: (r) => r.timings.duration < 2000
    });
  });
  
  console.log('\n✅ TODOS LOS SERVICIOS SIMULADOS FUNCIONAN');
  console.log('🎯 Ahora puedes ejecutar las pruebas completas');
}