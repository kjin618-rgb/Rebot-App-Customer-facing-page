import type { IncomingMessage, ServerResponse } from 'http';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error(`Missing env: SUPABASE_URL=${url ? 'ok' : 'MISSING'}, KEY=${key ? 'ok' : 'MISSING'}`);
  return createClient(url, key, { auth: { persistSession: false } });
}

function send(res: ServerResponse, statusCode: number, data: unknown) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

function parseBody(req: IncomingMessage): Promise<any> {
  if ((req as any).body !== undefined) return Promise.resolve((req as any).body);
  return new Promise((resolve) => {
    let raw = '';
    req.on('data', (chunk) => { raw += chunk; });
    req.on('end', () => { try { resolve(JSON.parse(raw)); } catch { resolve({}); } });
  });
}

function maskPhone(phone: string): string {
  const c = phone.replace(/[^0-9]/g, '');
  if (c.length === 11) return `${c.slice(0, 3)}-****-${c.slice(7)}`;
  return phone;
}

export async function handleApiRequest(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  const url = (req.url || '').split('?')[0];
  const method = req.method?.toUpperCase() || 'GET';

  if (!url.startsWith('/api/')) return false;

  const sb = getSupabase();

  // GET /api/store/:storeCode
  const storeMatch = url.match(/^\/api\/store\/([^/]+)$/);
  if (storeMatch && method === 'GET') {
    const { data } = await sb
      .from('stores')
      .select('store_code, store_name, stamp_goal, reward_desc')
      .eq('store_code', storeMatch[1])
      .single();
    if (!data) { send(res, 404, { error: 'store_not_found' }); return true; }
    send(res, 200, {
      storeCode: data.store_code,
      storeName: data.store_name,
      logoUrl: null,
      brandColor: null,
      stampGoal: data.stamp_goal,
      rewardDescription: data.reward_desc,
    });
    return true;
  }

  // GET /api/stamp/:storeCode/user/:phone
  const userMatch = url.match(/^\/api\/stamp\/([^/]+)\/user\/([^/]+)$/);
  if (userMatch && method === 'GET') {
    const [, storeCode, phone] = userMatch;
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (cleanPhone.length !== 11) { send(res, 400, { error: 'invalid_phone' }); return true; }

    const { data: store } = await sb.from('stores').select('id, stamp_goal').eq('store_code', storeCode).single();
    if (!store) { send(res, 404, { error: 'store_not_found' }); return true; }

    const { data: customer } = await sb
      .from('customers')
      .select('current_stamps, last_visit_at')
      .eq('store_id', store.id)
      .eq('phone', cleanPhone)
      .single();

    send(res, 200, customer
      ? { isNewCustomer: false, currentStamps: customer.current_stamps, stampGoal: store.stamp_goal, lastStampedAt: customer.last_visit_at }
      : { isNewCustomer: true, currentStamps: 0, stampGoal: store.stamp_goal, lastStampedAt: null }
    );
    return true;
  }

  // POST /api/stamp/:storeCode
  const stampMatch = url.match(/^\/api\/stamp\/([^/]+)$/);
  if (stampMatch && method === 'POST') {
    const storeCode = stampMatch[1];
    const { phone, name, marketingConsent, forceConsent } = await parseBody(req);

    if (!phone) { send(res, 400, { error: 'invalid_phone' }); return true; }
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (cleanPhone.length !== 11) { send(res, 400, { error: 'invalid_phone' }); return true; }

    const { data: store } = await sb.from('stores').select('id, stamp_goal').eq('store_code', storeCode).single();
    if (!store) { send(res, 404, { error: 'store_not_found' }); return true; }

    const { data: customer } = await sb
      .from('customers')
      .select('id, name, current_stamps, total_stamps, total_visits, last_visit_at')
      .eq('store_id', store.id)
      .eq('phone', cleanPhone)
      .single();

    const userExists = !!customer;

    if (!userExists && forceConsent !== true) {
      send(res, 200, { stampEarned: false, alreadyStampedToday: false, currentStamps: 0, stampGoal: store.stamp_goal, rewardTriggered: false, isNewCustomer: true });
      return true;
    }

    const nowStr = new Date().toISOString();

    if (userExists && customer.last_visit_at) {
      const todayKST = new Date(nowStr).toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul' });
      const lastKST = new Date(customer.last_visit_at).toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul' });
      if (todayKST === lastKST) {
        send(res, 200, { stampEarned: false, alreadyStampedToday: true, currentStamps: customer.current_stamps, stampGoal: store.stamp_goal, rewardTriggered: false, isNewCustomer: false });
        return true;
      }
    }

    let finalCustomerId: string;
    let finalCurrentStamps: number;

    if (!userExists) {
      const { data: newCustomer, error } = await sb.from('customers').insert({
        store_id: store.id,
        name: name || null,
        phone: cleanPhone,
        phone_masked: maskPhone(cleanPhone),
        marketing_consent: !!marketingConsent,
        marketing_consent_at: marketingConsent ? nowStr : null,
        current_stamps: 1,
        total_stamps: 1,
        total_visits: 1,
        last_visit_at: nowStr,
      }).select('id').single();
      if (error || !newCustomer) { send(res, 500, { error: 'failed_to_create_customer' }); return true; }
      finalCustomerId = newCustomer.id;
      finalCurrentStamps = 1;
    } else {
      const newStamps = customer.current_stamps + 1;
      const rewardNow = newStamps >= store.stamp_goal;
      await sb.from('customers').update({
        name: name || customer.name,
        current_stamps: rewardNow ? 0 : newStamps,
        total_stamps: customer.total_stamps + 1,
        total_visits: customer.total_visits + 1,
        last_visit_at: nowStr,
      }).eq('id', customer.id);
      finalCustomerId = customer.id;
      finalCurrentStamps = newStamps;
    }

    await sb.from('visit_logs').insert({
      customer_id: finalCustomerId,
      store_id: store.id,
      visited_at: nowStr,
      stamps_earned: 1,
      source: 'kiosk',
    });

    const rewardTriggered = finalCurrentStamps >= store.stamp_goal;
    send(res, 200, {
      stampEarned: true,
      alreadyStampedToday: false,
      currentStamps: rewardTriggered ? store.stamp_goal : finalCurrentStamps,
      stampGoal: store.stamp_goal,
      rewardTriggered,
      isNewCustomer: !userExists,
    });
    return true;
  }

  // POST /api/test/reset
  if (url === '/api/test/reset' && method === 'POST') {
    const { phone, storeCode, action, stamps } = await parseBody(req);
    const cleanPhone = phone ? phone.replace(/[^0-9]/g, '') : '';
    if (!cleanPhone) { send(res, 400, { error: 'Phone number required' }); return true; }

    const { data: store } = await sb.from('stores').select('id').eq('store_code', storeCode).single();
    if (!store) { send(res, 404, { error: 'store_not_found' }); return true; }

    const { data: customer } = await sb.from('customers').select('id').eq('store_id', store.id).eq('phone', cleanPhone).single();

    if (action === 'reset-all' && customer) {
      await sb.from('customers').delete().eq('id', customer.id);
    } else if (action === 'reset-today' && customer) {
      await sb.from('customers').update({ last_visit_at: null }).eq('id', customer.id);
    } else if (action === 'set-stamps') {
      const targetStamps = Number(stamps);
      if (customer) {
        await sb.from('customers').update({ current_stamps: targetStamps }).eq('id', customer.id);
      } else {
        await sb.from('customers').insert({
          store_id: store.id,
          phone: cleanPhone,
          phone_masked: maskPhone(cleanPhone),
          marketing_consent: false,
          current_stamps: targetStamps,
          total_stamps: targetStamps,
          total_visits: 0,
          last_visit_at: null,
        });
      }
    }

    send(res, 200, { success: true });
    return true;
  }

  return false;
}
