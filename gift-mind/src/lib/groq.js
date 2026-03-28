import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function generateCompletion(messages, stream = false) {
  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: messages,
    temperature: 0.8,
    max_tokens: 1024,
    stream: stream,
  });
  return response;
}

export { groq };
