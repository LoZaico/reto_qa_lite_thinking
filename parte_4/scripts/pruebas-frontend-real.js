import http from 'k6/http';
import { check, group } from 'k6';

export const options = {
  vus: 10,
  duration: '5m',
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<3000']
  }
};

// URLs de frontend reales (páginas web públicas que simulan una aplicación completa)
const FRONTEND_URLS = {
  homepage: 'https://httpbin.org/',
  apiDocs: 'https://httpbin.org/#/',
  forms: 'https://httpbin.org/forms/post',
  uiComponents: 'https://httpbin.org/html',
  jsonResponse: 'https://httpbin.org/json'
};

export default function() {
  // GRUPO 1: Navegación y visualización de páginas
  group('Navegación y Visualización UI', function() {
    // Test de página principal
    const homepageResponse = http.get(FRONTEND_URLS.homepage);
    check(homepageResponse, {
      'Homepage carga correctamente': (r) => r.status === 200,
      'Homepage tiene contenido HTML': (r) => r.body.includes('</html>'),
      'Homepage tiempo carga < 2s': (r) => r.timings.duration < 2000,
      'Homepage tiene metadatos básicos': (r) => r.body.includes('<title>') || r.body.includes('<head>')
    });

    // Test de página de documentación
    const docsResponse = http.get(FRONTEND_URLS.apiDocs);
    check(docsResponse, {
      'Documentación carga correctamente': (r) => r.status === 200,
      'Documentación tiene contenido': (r) => r.body.length > 5000
    });
  });

  // GRUPO 2: Formularios e interacciones de usuario
  group('Interacciones de Usuario y Formularios', function() {
    // Cargar página de formularios
    const formsPageResponse = http.get(FRONTEND_URLS.forms);
    check(formsPageResponse, {
      'Página de formularios carga': (r) => r.status === 200,
      'Formulario detectado en página': (r) => r.body.includes('form') || r.body.includes('input')
    });

    // Simular envío de formulario (POST)
    const formData = {
      custname: 'Juan Pérez',
      custtel: '123456789',
      custemail: 'juan@example.com',
      size: 'medium',
      topping: ['bacon', 'cheese'],
      delivery: '19:30',
      comments: 'Comentarios de prueba para el formulario'
    };

    const formSubmitResponse = http.post(
      'https://httpbin.org/post',
      JSON.stringify(formData),
      {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'K6-Frontend-Test'
        }
      }
    );

    check(formSubmitResponse, {
      'Formulario se envía exitosamente': (r) => r.status === 200,
      'Datos del formulario se reciben correctamente': (r) => {
        try {
          const response = JSON.parse(r.body);
          return response.json && response.json.custname === 'Juan Pérez';
        } catch (e) {
          return false;
        }
      }
    });
  });

  // GRUPO 3: Comportamiento dinámico y AJAX
  group('Comportamiento Dinámico y APIs', function() {
    // Simular múltiples llamadas AJAX simultáneas
    const concurrentRequests = http.batch([
      ['GET', FRONTEND_URLS.jsonResponse],
      ['GET', FRONTEND_URLS.uiComponents],
      ['GET', 'https://jsonplaceholder.typicode.com/posts/1'],
      ['GET', 'https://jsonplaceholder.typicode.com/comments?postId=1']
    ]);

    check(concurrentRequests[0], {
      'Llamada API JSON funciona': (r) => r.status === 200,
      'Respuesta JSON es válida': (r) => {
        try {
          JSON.parse(r.body);
          return true;
        } catch (e) {
          return false;
        }
      }
    });

    check(concurrentRequests[1], {
      'Componentes UI cargan correctamente': (r) => r.status === 200
    });

    check(concurrentRequests[2], {
      'Datos dinámicos se cargan': (r) => r.status === 200
    });

    check(concurrentRequests[3], {
      'Filtrado de datos funciona': (r) => r.status === 200
    });
  });

  // GRUPO 4: Rendimiento y experiencia de usuario
  group('Rendimiento y UX', function() {
    const performanceTest = http.get(FRONTEND_URLS.homepage);
    check(performanceTest, {
      'Tiempo de respuesta consistente': (r) => r.timings.duration < 3000,
      'Contenido above-the-fold rápido': (r) => r.timings.waiting < 1000,
      'Recursos cargan completamente': (r) => r.timings.receiving > 0
    });

    // Test de contenido estático
    const staticContentResponse = http.get('https://httpbin.org/image/png');
    check(staticContentResponse, {
      'Recursos estáticos cargan': (r) => r.status === 200,
      'Content-Type correcto para imágenes': (r) => r.headers['Content-Type'] === 'image/png'
    });
  });
}