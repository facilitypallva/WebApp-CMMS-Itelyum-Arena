import { Resend } from 'resend';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { assetName, expiryDate, recipientEmail } = req.body;

  if (!assetName || !expiryDate || !recipientEmail) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (process.env.EMAIL_ENABLED !== 'true') {
    console.log('[EMAIL_DISABLED] Notification skipped', { assetName, expiryDate, recipientEmail });
    return res.status(200).json({ skipped: true, reason: 'EMAIL_DISABLED' });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    const { data, error } = await resend.emails.send({
      from: 'InsightCMMS <notifications@itelyum-arena.it>',
      to: [recipientEmail],
      subject: `ALERTA: Asset in scadenza - ${assetName}`,
      html: `
        <h1>Avviso Scadenza Manutenzione</h1>
        <p>L'asset <strong>${assetName}</strong> ha la prossima verifica prevista per il <strong>${expiryDate}</strong>.</p>
        <p>Si prega di programmare l'intervento.</p>
        <hr />
        <p><small>Inviato automaticamente da InsightCMMS</small></p>
      `,
    });

    if (error) {
      return res.status(500).json({ success: false, error });
    }

    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, error });
  }
}
