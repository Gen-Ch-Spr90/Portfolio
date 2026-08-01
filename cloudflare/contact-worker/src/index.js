function jsonResponse(status, payload, corsHeaders) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      ...corsHeaders,
    },
  });
}

function getCorsHeaders(request, env) {
  const origin = request.headers.get('Origin') || '';
  const configuredOrigins = (env.ALLOWED_ORIGINS || '')
    .split(',')
    .map(function (value) {
      return value.trim();
    })
    .filter(Boolean);

  const allowOrigin = configuredOrigins.includes(origin) ? origin : configuredOrigins[0] || '*';

  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    Vary: 'Origin',
  };
}

function sanitize(value, maxLength) {
  const str = (value || '').toString().replace(/\u0000/g, '').trim();
  if (!maxLength) {
    return str;
  }
  return str.slice(0, maxLength);
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function toHtmlSafe(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function sendMail(payload, env) {
  const toEmail = sanitize(env.TO_EMAIL, 200);
  const fromEmail = sanitize(env.FROM_EMAIL, 200);
  const subjectPrefix = sanitize(env.SUBJECT_PREFIX || '[Portfolio Contact]', 80);

  if (!toEmail || !fromEmail) {
    throw new Error('Worker email settings are incomplete.');
  }

  const fullName = (payload.name + ' ' + payload.last_name).trim();
  const subject = subjectPrefix + ' New message from ' + fullName;

  const plainText = [
    'New contact submission',
    '',
    'Name: ' + fullName,
    'Email: ' + payload.email,
    'Phone: ' + (payload.phone || 'Not provided'),
    '',
    'Message:',
    payload.message,
  ].join('\n');

  const html =
    '<h2>New contact submission</h2>' +
    '<p><strong>Name:</strong> ' + toHtmlSafe(fullName) + '</p>' +
    '<p><strong>Email:</strong> ' + toHtmlSafe(payload.email) + '</p>' +
    '<p><strong>Phone:</strong> ' + toHtmlSafe(payload.phone || 'Not provided') + '</p>' +
    '<p><strong>Message:</strong></p>' +
    '<pre style="white-space:pre-wrap;font-family:inherit">' + toHtmlSafe(payload.message) + '</pre>';

  const mcPayload = {
    personalizations: [
      {
        to: [{ email: toEmail }],
      },
    ],
    from: {
      email: fromEmail,
      name: 'Portfolio Contact Bot',
    },
    reply_to: {
      email: payload.email,
      name: fullName,
    },
    subject,
    content: [
      { type: 'text/plain', value: plainText },
      { type: 'text/html', value: html },
    ],
  };

  const response = await fetch('https://api.mailchannels.net/tx/v1/send', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(mcPayload),
  });

  if (!response.ok) {
    const failureBody = await response.text();
    throw new Error('Mail delivery request failed: ' + failureBody.slice(0, 400));
  }
}

export default {
  async fetch(request, env) {
    const corsHeaders = getCorsHeaders(request, env);

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }

    if (request.method !== 'POST') {
      return jsonResponse(405, { error: 'Method not allowed' }, corsHeaders);
    }

    let parsed;
    try {
      parsed = await request.json();
    } catch {
      return jsonResponse(400, { error: 'Invalid JSON payload' }, corsHeaders);
    }

    const payload = {
      name: sanitize(parsed.name, 60),
      last_name: sanitize(parsed.last_name, 60),
      email: sanitize(parsed.email, 160),
      phone: sanitize(parsed.phone, 40),
      message: sanitize(parsed.message, 4000),
      subject: sanitize(parsed.subject, 120),
      honey: sanitize(parsed._honey, 100),
    };

    if (payload.honey) {
      return jsonResponse(200, { success: true }, corsHeaders);
    }

    if (!payload.name || !payload.last_name || !payload.email || !payload.message) {
      return jsonResponse(400, { error: 'Missing required fields' }, corsHeaders);
    }

    if (!isValidEmail(payload.email)) {
      return jsonResponse(400, { error: 'Invalid email address' }, corsHeaders);
    }

    try {
      await sendMail(payload, env);
      return jsonResponse(200, { success: true }, corsHeaders);
    } catch (error) {
      return jsonResponse(502, { error: error.message || 'Unable to send email' }, corsHeaders);
    }
  },
};
