const functions = require('firebase-functions');
const admin = require('firebase-admin');
const twilio = require('twilio');

admin.initializeApp();
const db = admin.firestore();

const twilioConfig = (functions.config && functions.config().twilio) || {};
const twilioSid = twilioConfig.sid || process.env.TWILIO_ACCOUNT_SID;
const twilioToken = twilioConfig.token || process.env.TWILIO_AUTH_TOKEN;
const twilioFrom = twilioConfig.from || process.env.TWILIO_FROM_NUMBER;
const twilioClient = twilioSid && twilioToken ? twilio(twilioSid, twilioToken) : null;

const OTP_TTL_SECONDS = 120;
const OTP_MAX_ATTEMPTS = 5;

const normalizePhone = (phoneNumber) => {
  const p = String(phoneNumber || '').trim();
  if (!p) return '';
  if (p.startsWith('+')) return p;
  return `+${p}`;
};

const hashOtp = (otpCode) => {
  return require('crypto').createHash('sha256').update(String(otpCode)).digest('hex');
};

exports.requestVoteOtp = functions.https.onRequest(async (req, res) => {
  try {
    if (req.method !== 'POST') {
      res.status(405).json({ ok: false, message: 'Method not allowed' });
      return;
    }

    const { studentId, phoneNumber } = req.body || {};
    const normalizedPhone = normalizePhone(phoneNumber);

    if (!studentId || !normalizedPhone) {
      res.status(400).json({ ok: false, message: 'studentId and phoneNumber are required' });
      return;
    }

    if (!twilioClient || !twilioFrom) {
      res.status(500).json({ ok: false, message: 'Twilio environment variables are missing' });
      return;
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const now = admin.firestore.Timestamp.now();
    const expiresAt = admin.firestore.Timestamp.fromMillis(now.toMillis() + OTP_TTL_SECONDS * 1000);

    await db.collection('voteOtps').doc(studentId).set({
      phoneNumber: normalizedPhone,
      otpHash: hashOtp(otpCode),
      attempts: 0,
      createdAt: now,
      expiresAt,
      verified: false,
    }, { merge: true });

    await twilioClient.messages.create({
      from: twilioFrom,
      to: normalizedPhone,
      body: `JOKSHU ভোট OTP: ${otpCode}. মেয়াদ ${OTP_TTL_SECONDS} সেকেন্ড।`,
    });

    res.status(200).json({ ok: true });
  } catch (error) {
    console.error('requestVoteOtp failed', error);
    res.status(500).json({ ok: false, message: error?.message || 'Unknown server error' });
  }
});

exports.verifyVoteOtp = functions.https.onRequest(async (req, res) => {
  try {
    if (req.method !== 'POST') {
      res.status(405).json({ ok: false, message: 'Method not allowed' });
      return;
    }

    const { studentId, otpCode } = req.body || {};
    if (!studentId || !otpCode) {
      res.status(400).json({ ok: false, message: 'studentId and otpCode are required' });
      return;
    }

    const ref = db.collection('voteOtps').doc(studentId);
    const snap = await ref.get();
    if (!snap.exists) {
      res.status(200).json({ ok: true, verified: false, message: 'OTP not found' });
      return;
    }

    const data = snap.data();
    const nowMillis = Date.now();
    const expiresMillis = data.expiresAt?.toMillis?.() || 0;

    if (data.verified) {
      res.status(200).json({ ok: true, verified: true });
      return;
    }

    if (nowMillis > expiresMillis) {
      await ref.update({ verified: false });
      res.status(200).json({ ok: true, verified: false, message: 'OTP expired' });
      return;
    }

    if ((data.attempts || 0) >= OTP_MAX_ATTEMPTS) {
      res.status(200).json({ ok: true, verified: false, message: 'Too many attempts' });
      return;
    }

    const incomingHash = hashOtp(otpCode);
    const isMatch = incomingHash === data.otpHash;

    if (!isMatch) {
      await ref.update({ attempts: (data.attempts || 0) + 1 });
      res.status(200).json({ ok: true, verified: false, message: 'Invalid OTP' });
      return;
    }

    await ref.update({ verified: true });
    res.status(200).json({ ok: true, verified: true });
  } catch (error) {
    console.error('verifyVoteOtp failed', error);
    res.status(500).json({ ok: false, message: error?.message || 'Unknown server error' });
  }
});
