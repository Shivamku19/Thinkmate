import "dotenv/config";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.GEMINI_API_KEY,
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai",
});

try {
  const response = await client.chat.completions.create({
    model: "gemini-flash-latest",
    messages: [
      {
        role: "user",
        content: "Hello",
      },
    ],
  });

  console.log(response.choices[0].message);
} catch (err) {
  console.error(err);
}