const express = require('express');
const line = require('@line/bot-sdk');

const app = express();

const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET
};

const client = new line.Client(config);

const QUIZ_ABC_ENABLED = process.env.QUIZ_ABC_ENABLED !== 'false';
const QUIZ_ABC_END_AT = process.env.QUIZ_ABC_END_AT || '2026-04-27T00:00:00+08:00';

function normalizeAnswer(text) {
  return (text || '')
    .replace(/[()（）\s]/g, '')
    .toUpperCase();
}

function isQuizAbcActive() {
  if (!QUIZ_ABC_ENABLED) return false;

  const endAt = new Date(QUIZ_ABC_END_AT);
  if (Number.isNaN(endAt.getTime())) {
    console.error('Invalid QUIZ_ABC_END_AT:', QUIZ_ABC_END_AT);
    return false;
  }

  return new Date() < endAt;
}

app.get('/health', (req, res) => {
  res.status(200).send('ok');
});

app.post('/webhook', line.middleware(config), async (req, res) => {
  try {
    const results = await Promise.all(req.body.events.map(handleEvent));
    res.json(results);
  } catch (error) {
    console.error('Webhook Error:', error?.response?.data || error?.message || error);
    res.status(500).end();
  }
});

async function handleEvent(event) {
  console.log('EVENT:', JSON.stringify(event, null, 2));

  if (event.type !== 'message' || event.message.type !== 'text') {
    return null;
  }

  if (!isQuizAbcActive()) {
    return null;
  }

  const userText = (event.message.text || '').trim();
  const answer = normalizeAnswer(userText);

  if (!['A', 'B', 'C'].includes(answer)) {
    return null;
  }

  let imageUrl = '';

  if (answer === 'A') {
    imageUrl = 'https://sport115ntpc-line.onrender.com/assets/A.png';
  } else if (answer === 'B') {
    imageUrl = 'https://sport115ntpc-line.onrender.com/assets/B.png';
  } else if (answer === 'C') {
    imageUrl = 'https://sport115ntpc-line.onrender.com/assets/C.png';
  }

  return client.replyMessage(event.replyToken, {
    type: 'image',
    originalContentUrl: imageUrl,
    previewImageUrl: imageUrl
  });
}

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`server running on ${port}`);
});
