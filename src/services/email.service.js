const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM || 'onboarding@resend.dev';

const sendVerificationEmail = async (email, token) => {
  const link = `${process.env.APP_URL}/api/auth/verify-email?token=${token}`;
  await resend.emails.send({
    from: FROM,
    to: email,
    subject: 'Verify your Saukele account',
    html: `
      <h2>Welcome to Saukele!</h2>
      <p>Click the link below to verify your email address:</p>
      <a href="${link}" style="background:#6366f1;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;">Verify Email</a>
      <p>This link expires in 24 hours.</p>
    `
  });
};

const sendPasswordResetEmail = async (email, token) => {
  const link = `${process.env.APP_URL}/api/auth/reset-password?token=${token}`;
  await resend.emails.send({
    from: FROM,
    to: email,
    subject: 'Reset your Saukele password',
    html: `
      <h2>Password Reset</h2>
      <p>Click the link below to reset your password:</p>
      <a href="${link}" style="background:#6366f1;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;">Reset Password</a>
      <p>This link expires in 1 hour.</p>
    `
  });
};

const sendContributionConfirmedEmail = async (email, giftName, amountKzt) => {
  await resend.emails.send({
    from: FROM,
    to: email,
    subject: 'New contribution received!',
    html: `
      <h2>You received a contribution!</h2>
      <p>Someone contributed <strong>${amountKzt.toLocaleString()} KZT</strong> toward <strong>${giftName}</strong>.</p>
    `
  });
};

const sendGiftFundedEmail = async (email, giftName) => {
  await resend.emails.send({
    from: FROM,
    to: email,
    subject: `🎉 "${giftName}" is fully funded!`,
    html: `
      <h2>Great news!</h2>
      <p>Your gift <strong>${giftName}</strong> has been fully funded by your guests!</p>
    `
  });
};

const sendVendorStatusEmail = async (email, shopName, status) => {
  const messages = {
    APPROVED: { subject: 'Your vendor account is approved!', body: `Your shop <strong>${shopName}</strong> has been approved. You can now list gift items.` },
    SUSPENDED: { subject: 'Your vendor account has been suspended', body: `Your shop <strong>${shopName}</strong> has been suspended. Contact support for more info.` }
  };
  const { subject, body } = messages[status] || {};
  if (!subject) return;
  await resend.emails.send({ from: FROM, to: email, subject, html: `<h2>${subject}</h2><p>${body}</p>` });
};

const sendRegistryInvitationEmail = async (email, brideName, groomName, inviteCode, appUrl) => {
  const link = `${appUrl}/pages/registry.html?invite=${inviteCode}`;
  await resend.emails.send({
    from: FROM,
    to: email,
    subject: `You're invited to ${brideName} & ${groomName}'s wedding registry!`,
    html: `
      <h2>Wedding Registry Invitation</h2>
      <p>You have been invited to view and contribute to the wedding registry of <strong>${brideName}</strong> and <strong>${groomName}</strong>.</p>
      <a href="${link}" style="background:#6366f1;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;">View Registry</a>
      <p>Use invite code: <strong>${inviteCode}</strong></p>
    `
  });
};

const sendDeliveryConfirmedEmail = async (email, giftName) => {
  await resend.emails.send({
    from: FROM,
    to: email,
    subject: `🎁 "${giftName}" has been delivered!`,
    html: `
      <h2>Gift Delivered!</h2>
      <p>Great news! Your gift <strong>${giftName}</strong> has been successfully delivered to the couple.</p>
    `
  });
};



module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendContributionConfirmedEmail,
  sendGiftFundedEmail,
  sendVendorStatusEmail,
  sendRegistryInvitationEmail,
  sendDeliveryConfirmedEmail
};