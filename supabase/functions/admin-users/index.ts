// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const allowedRoles = ['ADMIN', 'RESPONSABILE', 'TECNICO', 'LETTURA'] as const;

type AppRole = typeof allowedRoles[number];

type CreateUserPayload = {
  action: 'create_user';
  email: string;
  password: string;
  full_name: string;
  role: AppRole;
  is_active: boolean;
};

type UpdateUserPayload = {
  action: 'update_user';
  user_id: string;
  email: string;
  password?: string;
  full_name: string;
  role: AppRole;
  is_active: boolean;
};

type RequestPayload = CreateUserPayload | UpdateUserPayload;

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}

function normalizeRole(role: string): AppRole {
  const normalizedRole = role.toUpperCase();
  if (allowedRoles.includes(normalizedRole as AppRole)) {
    return normalizedRole as AppRole;
  }

  throw new Error(`Ruolo non valido: "${role}"`);
}

function decodeJwtPayload(token: string): Record<string, unknown> {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Struttura JWT non valida');
  const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
  const json = atob(base64);
  return JSON.parse(json) as Record<string, unknown>;
}

async function requireAdmin(req: Request) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const authHeader = req.headers.get('Authorization') ?? '';

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('requireAdmin: env vars mancanti', { hasUrl: !!supabaseUrl, hasService: !!serviceRoleKey });
    throw new Error('Configurazione Supabase incompleta');
  }

  if (!authHeader.startsWith('Bearer ')) {
    console.error('requireAdmin: Authorization header mancante o malformato');
    return { error: jsonResponse({ error: 'Autorizzazione mancante' }, 401) };
  }

  const token = authHeader.slice(7);
  let userId: string;
  let jwtRole: string;

  try {
    const payload = decodeJwtPayload(token);
    userId = String(payload.sub ?? '');
    jwtRole = String(
      (payload.app_metadata as Record<string, unknown>)?.role ??
      (payload.user_metadata as Record<string, unknown>)?.role ??
      ''
    ).toUpperCase();
    if (!userId) throw new Error('sub mancante nel JWT');
  } catch (e) {
    console.error('requireAdmin: JWT decode fallito', e instanceof Error ? e.message : e);
    return { error: jsonResponse({ error: 'Token non valido' }, 401) };
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  const { data: profile, error: profileError } = await adminClient
    .from('profiles')
    .select('role, is_active')
    .eq('id', userId)
    .maybeSingle();

  if (profileError) {
    console.error('requireAdmin: errore lettura profilo', profileError.message);
    return { error: jsonResponse({ error: profileError.message }, 500) };
  }

  const profileRole = String(profile?.role ?? '').toUpperCase();
  const profileIsActive = profile?.is_active !== false;

  const isAdmin = jwtRole === 'ADMIN' || profileRole === 'ADMIN';

  console.log('requireAdmin:', { userId, jwtRole, profileRole, profileIsActive, isAdmin });

  if (!isAdmin || !profileIsActive) {
    console.error('requireAdmin: permessi insufficienti', { isAdmin, profileIsActive });
    return { error: jsonResponse({ error: 'Permessi insufficienti' }, 403) };
  }

  return { adminClient };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Metodo non supportato' }, 405);
  }

  try {
    const adminResult = await requireAdmin(req);
    if ('error' in adminResult) {
      return adminResult.error;
    }

    const { adminClient } = adminResult;
    const payload = (await req.json()) as RequestPayload;

    console.log('Payload ricevuto:', { action: payload.action, role: payload.role });

    const role = normalizeRole(payload.role);

    if (payload.action === 'create_user') {
      const { data, error } = await adminClient.auth.admin.createUser({
        email: payload.email.trim().toLowerCase(),
        password: payload.password,
        email_confirm: true,
        app_metadata: { role },
        user_metadata: {
          full_name: payload.full_name.trim(),
          is_active: payload.is_active,
        },
      });

      if (error || !data.user) {
        console.error('create_user auth error:', error?.message);
        return jsonResponse({ error: error?.message ?? 'Errore nella creazione utente' }, 400);
      }

      const { error: profileError } = await adminClient.from('profiles').upsert({
        id: data.user.id,
        email: payload.email.trim().toLowerCase(),
        full_name: payload.full_name.trim(),
        role,
        is_active: payload.is_active,
        updated_at: new Date().toISOString(),
      });

      if (profileError) {
        console.error('create_user profile upsert error:', profileError.message);
      }

      return jsonResponse({ success: true, user_id: data.user.id });
    }

    if (payload.action !== 'update_user') {
      return jsonResponse({ error: 'Azione non supportata' }, 400);
    }

    const updateAttributes: {
      email: string;
      app_metadata: { role: AppRole };
      user_metadata: { full_name: string; is_active: boolean };
      password?: string;
    } = {
      email: payload.email.trim().toLowerCase(),
      app_metadata: { role },
      user_metadata: {
        full_name: payload.full_name.trim(),
        is_active: payload.is_active,
      },
    };

    if (payload.password?.trim()) {
      updateAttributes.password = payload.password.trim();
    }

    const { error: updateError } = await adminClient.auth.admin.updateUserById(payload.user_id, updateAttributes);
    if (updateError) {
      console.error('update_user auth error:', updateError.message);
      return jsonResponse({ error: updateError.message }, 400);
    }

    const { error: profileUpdateError } = await adminClient.from('profiles').upsert({
      id: payload.user_id,
      email: payload.email.trim().toLowerCase(),
      full_name: payload.full_name.trim(),
      role,
      is_active: payload.is_active,
      updated_at: new Date().toISOString(),
    });

    if (profileUpdateError) {
      console.error('update_user profile upsert error:', profileUpdateError.message);
      return jsonResponse({ error: profileUpdateError.message }, 500);
    }

    console.log('update_user completato per', payload.user_id);
    return jsonResponse({ success: true, user_id: payload.user_id });
  } catch (error) {
    console.error('Errore non gestito:', error instanceof Error ? error.message : error);
    const message = error instanceof Error ? error.message : 'Errore inatteso';
    return jsonResponse({ error: message }, 500);
  }
});
