export interface EmailData {
  to: string;
  subject: string;
  html: string;
}

export const sendEmail = async (data: EmailData) => {
  try {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to send email');
    }

    return await response.json();
  } catch (error) {
    console.error('Email Service Error:', error);
    throw error;
  }
};

export const notifyNewPitch = async (founderName: string, companyName: string, recipientEmail: string) => {
  return sendEmail({
    to: recipientEmail,
    subject: `New Pitch Uploaded: ${companyName}`,
    html: `
      <div style="font-family: sans-serif; background: #000; color: #fff; padding: 40px; border-radius: 20px;">
        <h1 style="color: #f97316; font-style: italic; text-transform: uppercase;">Nexus Notification</h1>
        <p>Hello,</p>
        <p><strong>${founderName}</strong> just uploaded a new pitch for <strong>${companyName}</strong> on the Nexus network.</p>
        <p>Log in to view the pitch and connect with the founder.</p>
        <a href="https://${window.location.host}/" style="display: inline-block; background: #f97316; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 20px;">View Pitch Feed</a>
      </div>
    `
  });
};

export const notifyInvestmentInterest = async (investorName: string, recipientEmail: string) => {
  return sendEmail({
    to: recipientEmail,
    subject: `New Connection Request from ${investorName}`,
    html: `
      <div style="font-family: sans-serif; background: #000; color: #fff; padding: 40px; border-radius: 20px;">
        <h1 style="color: #f97316; font-style: italic; text-transform: uppercase;">Nexus Connection</h1>
        <p>Hello,</p>
        <p><strong>${investorName}</strong> is interested in your pitch and has requested a connection.</p>
        <p>Check your messages on Nexus to start the boardroom discussion.</p>
        <a href="https://${window.location.host}/" style="display: inline-block; background: #3b82f6; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 20px;">Go to Dashboard</a>
      </div>
    `
  });
};

export const notifyTransactionSuccess = async (amount: number, recipientEmail: string) => {
  return sendEmail({
    to: recipientEmail,
    subject: `Transaction Successful: ${amount} Credits Added`,
    html: `
      <div style="font-family: sans-serif; background: #000; color: #fff; padding: 40px; border-radius: 20px;">
        <h1 style="color: #10b981; font-style: italic; text-transform: uppercase;">System Ledger Update</h1>
        <p>Your transaction was processed successfully.</p>
        <p><strong>${amount} Neural Credits</strong> have been added to your vault.</p>
        <p>Transaction Node: ${Math.random().toString(36).substring(7).toUpperCase()}</p>
        <a href="https://${window.location.host}/dashboard?tab=vault" style="display: inline-block; background: #10b981; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 20px;">View Vault</a>
      </div>
    `
  });
};
