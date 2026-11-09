import mongoose from "mongoose";

const SourceSchema = new mongoose.Schema({
    title: { type: String },
    url: { type: String },
    snippet: { type: String },
    source: { type: String },
}, { _id: false });

const ChatSchema = new mongoose.Schema({
    userId: { type: String, ref: 'User', required: true },
    userName: { type: String, required: true },
    name: { type: String, required: true },
    messages: [
        {
            isImage: { type: Boolean, required: true },
            isPublished: { type: Boolean, default: false },
            role: { type: String, required: true },
            content: { type: String, required: true },
            reasoning: { type: String },
            timestamp: { type: Number, required: true },
            isWebSearch: { type: Boolean, default: false },
            searchQuery: { type: String },
            sources: [SourceSchema],
        }
    ]
}, { timestamps: true })

const Chat = mongoose.model('Chat', ChatSchema)

export default Chat;
