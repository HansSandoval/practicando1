import { timingSafeEqual } from 'node:crypto';
import { del, get, list, put } from '@vercel/blob';

const PREFIX = 'meses/';
const MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;
const MAX_BYTES = 64 * 1024;

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });

function authorized(request) {
  const expected = process.env.APP_PIN || '';
  const given = request.headers.get('x-pin') || '';
  if (!expected || given.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(given), Buffer.from(expected));
}

function monthParam(request) {
  const mes = new URL(request.url).searchParams.get('mes') || '';
  return MONTH.test(mes) ? mes : null;
}

const str = (v, max) => String(v ?? '').slice(0, max);

// Keep only the fields the app uses, so the store never holds arbitrary payloads.
function clean(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return null;
  const expenses = Array.isArray(body.expenses) ? body.expenses.slice(0, 100) : [];
  return {
    incomes: { hans: str(body.incomes?.hans, 15), deylin: str(body.incomes?.deylin, 15) },
    splitMode: body.splitMode === 'equal' ? 'equal' : 'proportional',
    expenses: expenses.map((e) => ({
      name: str(e?.name, 80),
      amount: str(e?.amount, 15),
      payer: ['hans', 'deylin'].includes(e?.payer) ? e.payer : 'ambos',
    })),
    ...(body.ejemplo === true ? { ejemplo: true } : {}),
  };
}

export async function GET(request) {
  if (!authorized(request)) return json({ error: 'Código incorrecto' }, 401);
  const blobs = [];
  let cursor;
  do {
    const page = await list({ prefix: PREFIX, cursor });
    blobs.push(...page.blobs);
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);

  const meses = {};
  await Promise.all(
    blobs.map(async (b) => {
      const key = b.pathname.slice(PREFIX.length).replace(/\.json$/, '');
      if (!MONTH.test(key)) return;
      const result = await get(b.pathname, { access: 'private', useCache: false });
      if (result?.statusCode === 200) meses[key] = await new Response(result.stream).json();
    }),
  );
  return json({ meses });
}

export async function PUT(request) {
  if (!authorized(request)) return json({ error: 'Código incorrecto' }, 401);
  const mes = monthParam(request);
  if (!mes) return json({ error: 'Mes inválido' }, 400);
  const text = await request.text();
  if (text.length > MAX_BYTES) return json({ error: 'Datos demasiado grandes' }, 413);
  let data;
  try {
    data = clean(JSON.parse(text));
  } catch {
    data = null;
  }
  if (!data) return json({ error: 'Datos inválidos' }, 400);
  await put(`${PREFIX}${mes}.json`, JSON.stringify(data), {
    access: 'private',
    allowOverwrite: true,
    addRandomSuffix: false,
    contentType: 'application/json',
  });
  return json({ ok: true });
}

export async function DELETE(request) {
  if (!authorized(request)) return json({ error: 'Código incorrecto' }, 401);
  const mes = monthParam(request);
  if (!mes) return json({ error: 'Mes inválido' }, 400);
  await del(`${PREFIX}${mes}.json`);
  return json({ ok: true });
}
