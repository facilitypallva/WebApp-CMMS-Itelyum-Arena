export async function sendAssetExpiryNotification(assetName: string, expiryDate: string, recipientEmail: string) {
  try {
    const response = await fetch('/api/send-notification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assetName, expiryDate, recipientEmail }),
    });

    const result = await response.json();

    if (!response.ok) {
      return { success: false, error: result.error };
    }

    return { success: true, data: result.data };
  } catch (error) {
    return { success: false, error };
  }
}
