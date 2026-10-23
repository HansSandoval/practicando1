# Gastos Hans & Deylin

Presupuesto mensual compartido para Hans y Deylin: sueldos, gastos fijos y reparto
del sobrante en **20% plata propia · 20% mancomunada · 60% ahorro**, con secciones
Hans, Deylin, Juntos y un **acumulado** de todos los meses.

## Estructura

- `index.html` — la app (HTML/CSS/JS, sin build).
- `api/meses.js` — función de Vercel que guarda cada mes en Vercel Blob (privado).
  Todas las llamadas exigen el código de acceso (`APP_PIN`).

La app consulta el servidor cada 10 segundos y al volver a la pestaña, así que lo
que edita uno le aparece al otro.

## Desplegar en Vercel

1. En https://vercel.com/new importa el repositorio `practicando1`
   (Framework Preset: **Other**, sin comando de build). Vercel despliega la rama `main`.
2. En el proyecto: **Storage → Create Database → Blob**, acceso **Private**,
   y conéctalo al proyecto (crea la variable `BLOB_READ_WRITE_TOKEN`).
3. En **Settings → Environment Variables** agrega `APP_PIN` con el código que
   van a usar los dos.
4. **Deployments → Redeploy** para que tome las variables.
5. Abran `https://<proyecto>.vercel.app`, ingresen el código y, en el celular,
   usen "Agregar a pantalla de inicio".

Para cambiar el código, edita `APP_PIN` y vuelve a desplegar.
