describe('CP-01-Sock Shop - búsqueda de productos "christmas"', () => {
  beforeEach(() => {
    // Raiz del sitio
    cy.visit('https://www.sockshop.co.uk')
  })

  it('debe listar al menos un producto relacionado con "christmas"', () => {
    // Selectores comunes para input de búsqueda en distintas versiones del demo
    const searchSelectors =
      'input[placeholder*="Search"], input[placeholder*="Buscar"], input[type="search"], input[name="search"], input[aria-label*="search"], .search input'

    // Intenta encontrar el input de búsqueda y escribir "christmas"
    cy.get(searchSelectors)
      .first()
      .should('be.visible')
      .clear()
      .type('christmas{enter}')

    // Tras buscar, esperamos a que aparezcan productos (timeout aumentado por si la app responde lento)
    cy.get('body', { timeout: 10000 }).then($body => {
      if ($body.find('.thumbnail').length) {
        cy.get('.thumbnail', { timeout: 10000 }).then($cards => {
          const found = Cypress._.some($cards.toArray(), card =>
            /christmas/i.test(card.innerText)
          )
          expect(found, 'Al menos un .thumbnail contiene "christmas"').to.be.true
        })
      } else if ($body.find('.product').length) {
        // Otra convención posible
        cy.get('.product', { timeout: 10000 }).then($cards => {
          const found = Cypress._.some($cards.toArray(), card =>
            /christmas/i.test(card.innerText)
          )
          expect(found, 'Al menos un .product contiene "christmas"').to.be.true
        })
      } else {
        // Comprobar que la página contiene la palabra
        cy.contains(/christmas/i, { timeout: 10000 }).should('exist')
      }
    })
  })
})

describe('CP-02-Sock Shop - seleccionar producto específico y verificar advertencia', () => {
  const BASE = 'https://www.sockshop.co.uk'
  const TERM = 'Christmas'
  const PRODUCT_NAME = "Women's 3 Pair SOCKSHOP Gentle Grip Cotton Christmas Socks"
  const COOKIE_SELECTORS = [
    '#onetrust-accept-btn-handler',
    '.cky-preference-wrapper button',
    '.cookie-banner button',
    '.qc-cmp2-footer .qc-cmp2-summary-buttons button',
    '.cookie-consent button',
    '.js-cookie-accept',
    '.cc-btn',
  ]

  function closeCookieOverlaysIfAny() {
    // No-blocking scan and click the first matching cookie/overlay button found
    cy.get('body').then($body => {
      for (const sel of COOKIE_SELECTORS) {
        if ($body.find(sel).length) {
          cy.get(sel).first().click({ force: true })
          return
        }
      }
    })
  }

  beforeEach(() => {
    cy.visit(BASE)
    // intentar cerrar overlays de cookies si aparecen
    closeCookieOverlaysIfAny()
  })

  it('busca "Christmas", abre el producto exacto y verifica la advertencia al añadir sin opciones', () => {
    // 1) Buscar "Christmas"
    cy.get('input[aria-label="Search"], input[type="search"], input#search, input[placeholder*="Search"], input[name="search"]', { timeout: 10000 })
      .first()
      .should('be.visible')
      .clear()
      .type(`${TERM}{enter}`)

    // 2) Esperar resultados y localizar el producto por texto EXACTO
    cy.contains(PRODUCT_NAME, { timeout: 15000 })
      .should('exist')
      .then($el => {
        // Asegurarnos de interactuar con el enlace que lleva al producto.
        // Si el elemento encontrado es un enlace, hacemos click directo.
        // Si no, buscamos el ancestro <a> más cercano y lo usamos; si no existe, forzamos click sobre el elemento.
        const $j = Cypress.$($el)
        if ($j.is('a')) {
          cy.wrap($j).scrollIntoView().click()
        } else {
          const $anc = $j.closest('a')
          if ($anc && $anc.length) {
            cy.wrap($anc).scrollIntoView().click()
          } else {
            // último recurso: click forzado en el texto encontrado para abrir la ficha
            cy.wrap($j).scrollIntoView().click({ force: true })
          }
        }
      })

    // 3) Al entrar en la ficha del producto: pulsar "Add to basket" sin seleccionar opciones
    cy.contains(/^Add to basket$/i, { timeout: 10000 })
      .should('be.visible')
      .click()

    // 4) Verificar la advertencia exacta
    cy.contains('Please select a colour and size', { timeout: 7000 })
      .should('be.visible')
  })
})

describe('CP-03-SockShop — buscar "Christmas" y clicar banner con logo central', () => {
  beforeEach(() => {
    cy.visit('https://www.sockshop.co.uk');
  });

  it('busca Christmas, hace click en el banner con el logo central y verifica redirección a home', () => {
    // 1) Localizar campo de búsqueda (varios selectores probados) y buscar "Christmas"
    cy.get('input[type="search"], input[name*="search"], input[placeholder*="Search"], input[aria-label*="Search"]', { timeout: 10000 })
      .first()
      .should('be.visible')
      .clear()
      .type('Christmas{enter}');

    // 2) Esperar a que aparezcan resultados: comprobamos existencia de un contenedor principal o lista de productos
    cy.get('main, #main, .content, .search-results, .products, .product-list', { timeout: 10000 })
      .should('exist');

    // 3) Intentar localizar y clicar el banner con el logo central.
    // Usamos una colección de selectores heurísticos y manejamos varios casos (img dentro de enlace, banner clickable, etc).
    cy.get('body', { timeout: 8000 }).then(($body) => {
      cy.log('Buscando banner con logo central (heurísticos)...');

      const selectors = [
        // banners / hero
        'main .hero, main .promo, .hero, .promo, .banner, .search-hero, .search-banner',
        // logo / link a home
        'a[href="/"], a.home-link, .logo a, .site-logo a, .brand a',
        // imágenes con texto/alt relacionado
        'img[alt*="SockShop"], img[alt*="sock shop"], img[src*="logo"], img[src*="sockshop"]'
      ].join(',');

      const found = $body.find(selectors).filter(':visible');

      if (found.length) {
        cy.log(`Encontrado(s) ${found.length} elemento(s) candidatas, seleccionando la primera visible...`);
        cy.wrap(found.first()).then(($el) => {
          // Si es una imagen, preferimos clicar en el ancestro <a>
          if ($el.is('img')) {
            const link = $el.closest('a');
            if (link && link.length) {
              cy.wrap(link).click({ force: true });
            } else {
              // si no hay enlace, clicamos la imagen
              cy.wrap($el).click({ force: true });
            }
          } else {
            // si el elemento es un enlace o bloque clickable, clicarlo directamente
            cy.wrap($el).click({ force: true });
          }
        });
      } else {
        // Fallback: buscar elementos interactivos que contengan la palabra "sockshop" o texto parecido
        cy.log('No se encontró banner por selectores heurísticos, buscando por texto "sockshop"...');
        cy.contains(/sockshop/i, { timeout: 5000 })
          .filter(':visible')
          .first()
          .then(($txtEl) => {
            // preferir clicar en un ancestro <a> si existe
            const link = $txtEl.closest('a');
            if (link && link.length) {
              cy.wrap(link).click({ force: true });
            } else {
              cy.wrap($txtEl).click({ force: true });
            }
          });
      }
    });

    // 4) Verificación: se espera ser redirigido a la raíz (home). Comprobamos el pathname es '/'.
    cy.location('pathname', { timeout: 10000 })
      .should('match', /^\/$/)
      .then(() => {
        cy.log('Redirección a la página principal verificada (pathname = /).');
      });
  });
});
