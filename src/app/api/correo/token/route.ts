// Solo si usás Next.js App Router
export async function POST() {
  const username = process.env.CORREO_USER!;
  const password = process.env.CORREO_PASS!;
  const baseURL = 'https://apitest.correoargentino.com.ar/micorreo/v1';

  const response = await fetch(`${baseURL}/token`, {
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64'),
    },
  });

  if (!response.ok) {
    const error = await response.json();
    return new Response(JSON.stringify({ error }), { status: response.status });
  }

  const data = await response.json();
  return new Response(JSON.stringify(data), { status: 200 });
}
