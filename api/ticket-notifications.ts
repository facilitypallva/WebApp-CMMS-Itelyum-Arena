import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

type TicketNotificationPayload = {
  ticketId: string;
  ticketCode: string;
  reporterName: string;
  reporterEmail: string;
  locationName: string | null;
  problemCategory: string | null;
  description: string;
  photoUrl: string | null;
};

function getBaseUrl(req: any) {
  return process.env.APP_BASE_URL
    || process.env.VITE_APP_BASE_URL
    || `${req.headers['x-forwarded-proto'] ?? 'http'}://${req.headers.host}`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildAdminEmailHtml(payload: TicketNotificationPayload, appUrl: string) {
  const summaryRows = [
    ['Codice ticket', payload.ticketCode],
    ['Segnalato da', payload.reporterName],
    ['Email', payload.reporterEmail],
    ['Ubicazione', payload.locationName ?? 'Non specificata'],
    ['Categoria', payload.problemCategory ?? 'Non specificata'],
  ]
    .map(([label, value]) => `
      <tr>
        <td style="padding:8px 12px;color:#64748b;font-size:13px;font-weight:600;">${escapeHtml(label)}</td>
        <td style="padding:8px 12px;color:#0f172a;font-size:14px;">${escapeHtml(value)}</td>
      </tr>
    `)
    .join('');

  const photoBlock = payload.photoUrl
    ? `<p style="margin:16px 0 0;"><a href="${payload.photoUrl}" style="color:#2563eb;font-weight:600;">Apri foto allegata</a></p>`
    : '';

  return `
    <div style="font-family:Arial,sans-serif;background:#f8fafc;padding:32px;">
      <div style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:24px;padding:32px;border:1px solid #e2e8f0;">
        <p style="margin:0 0 8px;color:#2563eb;font-size:12px;font-weight:800;letter-spacing:0.18em;text-transform:uppercase;">Nuova segnalazione</p>
        <h1 style="margin:0 0 16px;color:#0f172a;font-size:28px;">${escapeHtml(payload.ticketCode)}</h1>
        <p style="margin:0 0 24px;color:#475569;font-size:15px;line-height:1.6;">
          E stata inviata una nuova segnalazione pubblica da gestire.
        </p>
        <table style="width:100%;border-collapse:collapse;background:#f8fafc;border-radius:16px;overflow:hidden;">
          ${summaryRows}
        </table>
        <div style="margin-top:24px;padding:18px;border-radius:18px;background:#f8fafc;">
          <p style="margin:0 0 8px;color:#64748b;font-size:13px;font-weight:600;">Descrizione</p>
          <p style="margin:0;color:#0f172a;font-size:15px;line-height:1.6;">${escapeHtml(payload.description)}</p>
          ${photoBlock}
        </div>
        <div style="margin-top:28px;">
          <a href="${appUrl}/tickets" style="display:inline-block;background:#0f172a;color:#ffffff;text-decoration:none;padding:14px 22px;border-radius:14px;font-weight:700;">
            Apri in piattaforma
          </a>
        </div>
      </div>
    </div>
  `;
}

function buildReporterEmailHtml(payload: TicketNotificationPayload) {
  return `
    <div style="font-family:Arial,sans-serif;background:#f8fafc;padding:32px;">
      <div style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:24px;padding:32px;border:1px solid #e2e8f0;">
        <p style="margin:0 0 8px;color:#2563eb;font-size:12px;font-weight:800;letter-spacing:0.18em;text-transform:uppercase;">Conferma ricezione</p>
        <h1 style="margin:0 0 16px;color:#0f172a;font-size:28px;">Segnalazione ricevuta</h1>
        <p style="margin:0 0 16px;color:#475569;font-size:15px;line-height:1.6;">
          Ciao ${escapeHtml(payload.reporterName)}, abbiamo ricevuto la tua segnalazione.
        </p>
        <div style="display:inline-block;background:#eff6ff;color:#2563eb;padding:10px 16px;border-radius:14px;font-weight:800;letter-spacing:0.08em;">
          ${escapeHtml(payload.ticketCode)}
        </div>
        <div style="margin-top:24px;padding:18px;border-radius:18px;background:#f8fafc;">
          <p style="margin:0 0 8px;color:#64748b;font-size:13px;font-weight:600;">Riepilogo</p>
          <p style="margin:0 0 6px;color:#0f172a;font-size:14px;"><strong>Ubicazione:</strong> ${escapeHtml(payload.locationName ?? 'Non specificata')}</p>
          <p style="margin:0 0 6px;color:#0f172a;font-size:14px;"><strong>Categoria:</strong> ${escapeHtml(payload.problemCategory ?? 'Non specificata')}</p>
          <p style="margin:12px 0 0;color:#0f172a;font-size:14px;line-height:1.6;">${escapeHtml(payload.description)}</p>
        </div>
        <p style="margin:24px 0 0;color:#475569;font-size:14px;line-height:1.6;">
          Il team responsabile prenderà in carico la richiesta e ti ricontatterà se necessario.
        </p>
      </div>
    </div>
  `;
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const payload = req.body as TicketNotificationPayload;

  if (!payload?.ticketId || !payload?.ticketCode || !payload?.reporterName || !payload?.reporterEmail || !payload?.description) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return res.status(500).json({ error: 'Supabase service credentials missing' });
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
  const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
  const appUrl = getBaseUrl(req);

  try {
    const { data: responsabili, error: responsabiliError } = await supabaseAdmin
      .from('profiles')
      .select('id, email, full_name')
      .eq('role', 'RESPONSABILE')
      .eq('is_active', true);

    if (responsabiliError) {
      return res.status(500).json({ error: responsabiliError.message });
    }

    const notificationRows = (responsabili ?? []).map((profile) => ({
      target_user_id: profile.id,
      title: `Nuovo ticket ${payload.ticketCode}`,
      message: [
        payload.locationName ? `Ubicazione: ${payload.locationName}` : null,
        payload.problemCategory ? `Categoria: ${payload.problemCategory}` : null,
        `Segnalato da ${payload.reporterName}`,
      ].filter(Boolean).join(' • '),
      type: 'TICKET',
      entity_type: 'ticket',
      entity_id: payload.ticketId,
      metadata: {
        reporter_email: payload.reporterEmail,
        photo_url: payload.photoUrl,
      },
    }));

    if (notificationRows.length > 0) {
      const { error: notificationError } = await supabaseAdmin
        .from('notifications')
        .insert(notificationRows);

      if (notificationError) {
        console.error('Notification insert failed', notificationError);
      }
    }

    const adminRecipients = (responsabili ?? [])
      .map((profile) => profile.email)
      .filter(Boolean);

    const emailResults: { adminEmailSent: boolean; reporterEmailSent: boolean } = {
      adminEmailSent: false,
      reporterEmailSent: false,
    };

    if (resend && adminRecipients.length > 0) {
      const { error } = await resend.emails.send({
        from: 'InsightCMMS <notifications@itelyum-arena.it>',
        to: adminRecipients,
        subject: `Nuovo ticket ${payload.ticketCode}`,
        html: buildAdminEmailHtml(payload, appUrl),
      });

      if (!error) {
        emailResults.adminEmailSent = true;
      } else {
        console.error('Admin ticket email failed', error);
      }
    }

    if (resend) {
      const { error } = await resend.emails.send({
        from: 'InsightCMMS <notifications@itelyum-arena.it>',
        to: [payload.reporterEmail],
        subject: `Conferma ricezione ${payload.ticketCode}`,
        html: buildReporterEmailHtml(payload),
      });

      if (!error) {
        emailResults.reporterEmailSent = true;
      } else {
        console.error('Reporter confirmation email failed', error);
      }
    }

    return res.status(200).json({
      success: true,
      notificationsCreated: notificationRows.length,
      ...emailResults,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error?.message ?? 'Unexpected error' });
  }
}
