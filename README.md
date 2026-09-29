# Gastos Hans & Deylin

App web sencilla para organizar los gastos mensuales en pareja.

## Cómo funciona

1. Ingresa los **ingresos** de Hans y Deylin (se muestra el total).
2. Agrega los **gastos fijos** e indica quién los paga: Hans, Deylin o Ambos.
   Los gastos de "Ambos" se reparten proporcional a los ingresos o 50/50 (configurable).
3. Lo que le sobra a cada uno después de sus gastos fijos se reparte así:
   - **20%** plata propia
   - **20%** mancomunada
   - **60%** ahorro
4. Secciones:
   - **Hans** y **Deylin**: ingresos, gastos fijos, sobrante y su reparto.
   - **Juntos**: suma de la mancomunada y del ahorro de ambos.

Cada mes se guarda por separado (selector "Mes"), y puedes copiar los gastos fijos del mes anterior.
Los datos quedan guardados en el navegador (localStorage).

## Uso

Abre `index.html` en el navegador. No necesita instalación.
Para usarla desde el celular, puedes activar GitHub Pages en este repositorio (Settings → Pages → rama `main`, carpeta raíz).
