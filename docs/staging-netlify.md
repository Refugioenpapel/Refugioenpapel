# Staging / testing en Netlify

Esta guía deja un ambiente de pruebas para validar checkout, Mercado Pago, Supabase, emails y Correo Argentino sin tocar producción.

## Opción recomendada: branch deploy

1. Crear una rama de pruebas:

```bash
git checkout -b staging
git push origin staging
```

2. En Netlify ir a:

```txt
Site configuration → Build & deploy → Continuous deployment → Branches and deploy contexts
```

3. Habilitar deploys para la rama `staging`.

Netlify va a crear una URL parecida a:

```txt
https://staging--TU-SITIO.netlify.app
```

## Variables de entorno para staging

En Netlify, configurar variables con contexto `Branch deploys` o específicamente para la rama `staging`.

### Mercado Pago sandbox

Usar un access token de prueba/sandbox:

```env
MERCADOPAGO_ACCESS_TOKEN=TEST-...
MERCADOPAGO_USE_SANDBOX=true
```

Con `MERCADOPAGO_USE_SANDBOX=true`, la API devuelve/redirige al `sandbox_init_point` de Mercado Pago cuando está disponible.

### Correo Argentino en staging

Para no crear envíos reales mientras probás:

```env
CORREO_IMPORT_SHIPPING=false
```

Podés dejar habilitada la cotización de Correo si querés probar costos:

```env
CORREO_BASE_URL=https://api.correoargentino.com.ar/micorreo/v1
CORREO_CUSTOMER_ID=0001654651
CORREO_USER=...
CORREO_PASS=...
CORREO_POSTAL_CODE_ORIGIN=...
```

Si querés probar la importación real a Correo desde staging, cambiar temporalmente:

```env
CORREO_IMPORT_SHIPPING=true
```

pero recordá que eso puede generar datos reales en MiCorreo.

## NEXT_PUBLIC_SITE_URL

En producción debe apuntar al dominio real:

```env
NEXT_PUBLIC_SITE_URL=https://www.refugioenpapel.com.ar
```

En staging conviene no definirla, o definirla con la URL exacta del branch deploy. Si queda definida con el dominio de producción en staging, Mercado Pago puede volver al sitio productivo después del pago.

## Flujo de prueba seguro

1. Entrar a la URL staging.
2. Hacer una compra chica.
3. Elegir Mercado Pago.
4. Confirmar que la URL de pago sea sandbox/test.
5. Usar comprador/tarjeta de prueba.
6. Verificar en `/admin/ventas` que el pedido cambie de estado.
7. Para probar Correo sin generar envíos reales, mantener `CORREO_IMPORT_SHIPPING=false`.

## Producción

En producción usar:

```env
MERCADOPAGO_ACCESS_TOKEN=APP_USR-...
MERCADOPAGO_USE_SANDBOX=false
CORREO_IMPORT_SHIPPING=true
NEXT_PUBLIC_SITE_URL=https://www.refugioenpapel.com.ar
```