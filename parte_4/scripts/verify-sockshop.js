// scripts/verify-sockshop.js
import http from 'k6/http';
import { check } from 'k6';

export const options = {
  vus: 1,
  iterations: 1
};

// URLs REALES de Sock Shop (si estuviera funcionando)
const SOCKSHOP_SERVICES = {
  frontend: 'http://localhost:8079',
  catalogue: 'http://localhost:8081/api/catalogue',
  carts: 'http://localhost:8082/api/carts',
  orders: 'http://localhost:8083/api/orders',
  login: 'http://localhost:8084/api/login',
  tags: 'http://localhost:8081/api/tags'
};

export default function() {
  console.log('=== VERIFICANDO SOCK SHOP REAL ===\n');
  
  Object.keys(SOCKSHOP_SERVICES).forEach(service => {
    const url = SOCKSHOP_SERVICES[service];
    console.log(`🔍 ${service}: ${url}`);
    
    const response = http.get(url, { timeout: '10s' });
    
    if (response.status !== 0) {
      console.log(`   ✅ Status: ${response.status}`);
    } else {
      console.log(`   ❌ No conecta: ${response.error}`);
    }
  });
}