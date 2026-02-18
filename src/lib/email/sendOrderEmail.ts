type SendOrderEmailParams = {
  templateParams: Record<string, unknown>;
};

export async function sendOrderEmail({ templateParams }: SendOrderEmailParams) {
  const serviceId = process.env.EMAILJS_SERVICE_ID || 'service_wg78xcn';
  const templateId = process.env.EMAILJS_TEMPLATE_ID || 'template_b529mq6';
  const publicKey = process.env.EMAILJS_PUBLIC_KEY || 'cHz6pQf3uU5jTYI48';

  const res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      service_id: serviceId,
      template_id: templateId,
      user_id: publicKey,
      template_params: templateParams,
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Error enviando email por EmailJS: ${errorText}`);
  }
}

