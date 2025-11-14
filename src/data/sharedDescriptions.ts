// src/data/sharedDescriptions.ts

// 🧁 Descripción genérica para productos físicos
export const GENERIC_PHYSICAL_DESCRIPTION = `
<p>
  Cada producto de <strong>Refugio en Papel</strong> está pensado para que tus momentos
  sean únicos y llenos de detalles.
</p>
<br />
<p>
  Personalizá con el nombre, la temática o los colores que más te representen.
</p>
<br />
<p>
  En las imágenes vas a encontrar la descripción completa del producto,
  con todo lo que incluye y sus características.
</p>
<br />
<p>
  💌 Recordá que todos nuestros productos son hechos con amor, uno por uno,
  especialmente para vos.
</p>
`;

// 💻 Descripción genérica para productos digitales
export const GENERIC_DIGITAL_DESCRIPTION = `
<p>
  <strong style="color:red;">IMPORTANTE</strong><br />
  Este producto es un <strong>archivo digital</strong>, no recibirás ningún
  producto físico.
</p>
<br />
<p>
  El archivo se envía por mail (y/o WhatsApp) una vez confirmado el pago.
</p>
<br />
<p>
  Vas a poder descargarlo y usarlo las veces que quieras, siguiendo las indicaciones
  de impresión y uso que te enviamos.
</p>
<br />
<p>
  💌 Ante cualquier duda sobre cómo usar o imprimir tu archivo, podés escribirme
  y te acompaño en el paso a paso.
</p>
`;

// ⚠️ Dejamos estos exports vacíos por compatibilidad por si en algún lugar
// quedó alguna importación vieja. Pero ya no se usan en ProductDetail.
export const descriptionsBySlug: Record<string, string> = {};
export const descriptionsByCategory: Record<string, string> = {};
