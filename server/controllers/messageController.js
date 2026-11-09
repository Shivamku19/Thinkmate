import axios from "axios";
import Chat from "../models/chat.js";
import User from "../models/user.js";
import imagekit from "../configs/imagekit.js";
import openai from "../configs/openai.js";
import { performWebSearch } from "../services/searchService.js";
import { requiresWebSearch, extractSearchKeywords } from "../utils/queryClassifier.js";
import { buildSystemPrompt } from "../utils/promptBuilder.js";

// Text-based AI Chat Message Controller
export const textMessageController = async (req, res) => {
  try {
    const userId = req.user._id;

    // check credits
    if (req.user.credits < 1) {
      return res.json({
        success: false,
        message: "you don't have enough credits to use this fetaure",
      });
    }

    const { chatId, prompt, webSearch = "auto" } = req.body;

    const chat = await Chat.findOne({ userId, _id: chatId });

    if (!chat) {
      return res
        .status(404)
        .json({ success: false, message: "Chat not found. Please start a new chat." });
    }

    chat.messages.push({
      role: "user",
      content: prompt,
      timestamp: Date.now(),
      isImage: false,
    });

    // Determine if web search is needed to ground the answer and prevent hallucination
    const shouldSearch = requiresWebSearch(prompt, webSearch);
    let searchResults = [];
    let searchQuery = "";

    if (shouldSearch) {
      searchQuery = extractSearchKeywords(prompt);
      try {
        searchResults = await performWebSearch(searchQuery);
      } catch (searchErr) {
        console.error("Web search execution failed:", searchErr);
      }
    }

    const isWebSearch = shouldSearch && searchResults.length > 0;

    // Filter and format previous messages for the API (only text)
    const conversationHistory = chat.messages
      .filter((msg) => !msg.isImage)
      .map((msg) => ({
        role: msg.role === "assistant" ? "assistant" : "user",
        content: msg.content,
      }));

    // Dynamic system prompt with real-time web grounding and temporal anchoring
    const systemPrompt = buildSystemPrompt({
      isWebSearch,
      searchResults,
      searchQuery,
    });

    const response = await openai.chat.completions.create({
      model: "openai/gpt-oss-20b",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        ...conversationHistory,
      ],
    });

    const { choices } = response;

    const reply = {
      ...choices[0].message,
      timestamp: Date.now(),
      isImage: false,
      isWebSearch,
      searchQuery: isWebSearch ? searchQuery : undefined,
      sources: isWebSearch ? searchResults : [],
    };

    // Sanitize output if model prepends nameplate
    if (reply.content) {
      reply.content = reply.content
        .replace(/^(\*\*ThinkMate\*\*|ThinkMate:|\*\*ThinkMate:\*\*)\s*\n*/i, "")
        .trim();
    }

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
        if (
          titleResponse.choices &&
          titleResponse.choices[0] &&
          titleResponse.choices[0].message
        ) {
          chat.name = titleResponse.choices[0].message.content
            .trim()
            .replace(/^["']|["']$/g, "");
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
        message: "you don't have enough credits to use this fetaure",
      });
    }
    const { prompt, chatId, isPublished } = req.body;
    //Find chat
    const chat = await Chat.findOne({ userId, _id: chatId });

    if (!chat) {
      return res
        .status(404)
        .json({ success: false, message: "Chat not found. Please start a new chat." });
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

    // Construct image generation URL (using a synchronous free API to prevent async HTML issues)
    const generatedImageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?nologo=true`;
    console.log("Generated URL:", generatedImageUrl);

    // Trigger generation and wait for the image buffer
    const aiImageResponse = await axios.get(generatedImageUrl, {
      responseType: "arraybuffer",
    });

    // Convert to Base64
    const base64Image = `data:image/jpeg;base64,${Buffer.from(
      aiImageResponse.data,
      "binary"
    ).toString("base64")}`;

    // Upload the valid image to ImageKit Media Library
    const uploadResponse = await imagekit.upload({
      file: base64Image,
      fileName: `${Date.now()}.jpg`,
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
        if (
          titleResponse.choices &&
          titleResponse.choices[0] &&
          titleResponse.choices[0].message
        ) {
          chat.name = titleResponse.choices[0].message.content
            .trim()
            .replace(/^["']|["']$/g, "");
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
