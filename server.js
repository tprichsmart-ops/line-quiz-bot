const express = require('express');
const line = require('@line/bot-sdk');

const app = express();

const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET
};

const client = new line.Client(config);

function normalizeAnswer(text) {
  return (text || '')
    .replace(/[()（）\s]/g, '')
    .toUpperCase();
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

  const userText = (event.message.text || '').trim();
  const answer = normalizeAnswer(userText);

  let imageUrl = '';

  if (answer === 'A') {
    imageUrl = 'https://sport115ntpc-line.onrender.com/assets/A.png';
  } else if (answer === 'B') {
    imageUrl = 'https://sport115ntpc-line.onrender.com/assets/B.png';
  } else if (answer === 'C') {
    imageUrl = 'https://sport115ntpc-line.onrender.com/assets/C.png';
  } else {
    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: '請輸入 A、B 或 C 喔。'
    });
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
