import axios from "axios";
import Chat from "../models/chat.js";
import User from "../models/user.js";
import imagekit from "../configs/imagekit.js";
import openai from '../configs/openai.js'

// Text-based AI Chat Message Controller
export const textMessageController = async (req, res) => {
  try {
    const userId = req.user._id

     // check credits
    if (req.user.credits < 1) {
      return res.json({
        success: false,
        message: "you don't have enough credits to use this fetaure"
      });
    }


    const { chatId, prompt } = req.body;

    const chat = await Chat.findOne({ userId, _id: chatId });
    
    if (!chat) {
      return res.status(404).json({ success: false, message: "Chat not found. Please start a new chat." });
    }

    chat.messages.push({
      role: "user",
      content: prompt,
      timestamp: Date.now(),
      isImage: false,
    });

    // const { choices } = await openai.chat.completions.create({
    //   model: "gemini-3.5-flash",
    //   messages: [
    //     {
    //       role: "user",
    //       content: prompt,
    //     },
    //   ],
    // });

       

const response = await openai.chat.completions.create({
  model: "openai/gpt-oss-20b",
  messages: [
    {
      role: "system",
      content: "You are ThinkMate, a helpful AI assistant. When asked about your identity, name, or who created you, always state that you are ThinkMate."
    },
    {
      role: "user",
      content: prompt,
    },
  ],
});



const { choices } = response;

 

    const reply = {
      ...choices[0].message,
      timestamp: Date.now(),
      isImage: false,
    };

    res.json({ success: true, reply });

    if (chat.name === "New Chat") {
      try {
        const titleResponse = await openai.chat.completions.create({
          model: "openai/gpt-oss-20b",
          messages: [
            {
              role: "user",
              content: `Generate a very short 3-4 word title for this prompt: "${prompt}". Only return the title, no quotes or extra text.`,
            },
          ],
        });
        if (titleResponse.choices && titleResponse.choices[0] && titleResponse.choices[0].message) {
          chat.name = titleResponse.choices[0].message.content.trim().replace(/^["']|["']$/g, '');
        }
      } catch (err) {
        console.error("Failed to generate title", err);
      }
    }

    chat.messages.push(reply);
    await chat.save();

    await User.updateOne({ _id: userId }, { $inc: { credits: -1 } });
  } catch (error) {
  console.error(error);

  if (error.status === 429) {
    return res.status(429).json({
      success: false,
      message: "Rate limit exceeded. Please wait a moment and try again.",
    });
  }

  return res.status(500).json({
    success: false,
    message: error.message || "Something went wrong.",
  });
}
};
// Image Generation message controller
export const imageMessageController = async (req, res) => {
  try {
    const userId = req.user._id;
    // check credits
    if (req.user.credits < 2) {
      return res.json({
        success: false,
        message: "you don't have enough credits to use this fetaure"
      });
    }
    const { prompt, chatId, isPublished } = req.body;
    //Find chat
    const chat = await Chat.findOne({ userId, _id: chatId });

    if (!chat) {
      return res.status(404).json({ success: false, message: "Chat not found. Please start a new chat." });
    }

    // push user message
    chat.messages.push({
      role: "user",
      content: prompt,
      timestamp: Date.now(),
      isImage: false,
    });

    // Encode the prompt
    const encodedPrompt = encodeURIComponent(prompt);

    // Construct ImageKit AI generation URL
    const generatedImageUrl = `${process.env.IMAGEKIT_URL_ENDPOINT}/ik-genimg-prompt-${encodedPrompt}/gpt/${Date.now()}.png?tr=w-800,h-800`;
    console.log("Generated URL:", generatedImageUrl);

    // Trigger generation by fetching from ImageKit
    const aiImageResponse = await axios.get(generatedImageUrl, {
      responseType: "arraybuffer",
    });

    // Convert to Base64
    const base64Image = `data:image/png;base64,${Buffer.from(
      aiImageResponse.data,
      "binary",
    ).toString("base64")}`;

    // Upload to ImageKit Media Library
    const uploadResponse = await imagekit.upload({
      file: base64Image,
      fileName: `${Date.now()}.png`,
      folder: "thinkmate",
    });

    const reply = {
      role: "assistant",
      content: uploadResponse.url,
      timestamp: Date.now(),
      isImage: true,
      isPublished,
    };

    res.json({ success: true, reply });

    if (chat.name === "New Chat") {
      try {
        const titleResponse = await openai.chat.completions.create({
          model: "openai/gpt-oss-20b",
          messages: [
            {
              role: "user",
              content: `Generate a very short 3-4 word title for this prompt: "${prompt}". Only return the title, no quotes or extra text.`,
            },
          ],
        });
        if (titleResponse.choices && titleResponse.choices[0] && titleResponse.choices[0].message) {
          chat.name = titleResponse.choices[0].message.content.trim().replace(/^["']|["']$/g, '');
        }
      } catch (err) {
        console.error("Failed to generate title", err);
      }
    }

    chat.messages.push(reply);
    await chat.save();

    await User.updateOne({ _id: userId }, { $inc: { credits: -2 } });
  } catch (error) {
    console.log("========== IMAGE ERROR ==========");
    console.log("Status:", error.response?.status);
    console.log("Data:", error.response?.data);
    console.log("Message:", error.message);
    console.log(error);

    return res.status(error.response?.status || 500).json({
      success: false,
      message: error.response?.data || error.message,
    });
  }
};
