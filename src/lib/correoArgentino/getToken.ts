// /lib/correoArgentino/getToken.ts
export async function getCorreoArgentinoToken() {
  const username = process.env.CORREO_USER!;
  const password = process.env.CORREO_PASS!;

  const res = await fetch('https://api.correoargentino.com.ar/micorreo/v1/token', {
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + btoa(`${username}:${password}`),
    },
  });

  if (!res.ok) {
    throw new Error('No se pudo obtener el token de Correo Argentino');
  }

  const data = await res.json();
  return data.token;
}
