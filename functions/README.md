# Firebase Functions for OTP SMS

This folder provides backend endpoints used by the app:

- `requestVoteOtp` (POST): generate OTP and send SMS via Twilio
- `verifyVoteOtp` (POST): verify OTP and mark as verified

## 1) Setup dependencies

```bash
cd functions
npm install
```

## 2) Set Twilio credentials in Firebase

Use Firebase runtime config:

```bash
firebase functions:config:set twilio.sid="YOUR_TWILIO_ACCOUNT_SID" twilio.token="YOUR_TWILIO_AUTH_TOKEN" twilio.from="+1XXXXXXXXXX"
```

Then redeploy functions.

## 3) Deploy

```bash
cd functions
npm run deploy
```

## 4) App endpoint

App calls by default:

- `https://us-central1-jokshu-voting.cloudfunctions.net/requestVoteOtp`
- `https://us-central1-jokshu-voting.cloudfunctions.net/verifyVoteOtp`

If your region/project differs, set `otpServiceBaseUrl` key in storage to your deployed base URL.
