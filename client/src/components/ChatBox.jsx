import React, { useEffect, useRef, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { assets } from '../assets/assets';
import Message from './Message';
import toast from 'react-hot-toast';

const SEARCH_STATUS_STEPS = [
  'Searching the live web for verified data...',
  'Analyzing sources and fact-checking...',
  'Synthesizing grounded response...',
];

const ChatBox = () => {
  const containerRef = useRef(null);

  const {
    selectedChat,
    theme,
    user,
    axios,
    token,
    setUser,
    setSelectedChat,
    fetchUsersChats,
  } = useAppContext();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingStepIndex, setLoadingStepIndex] = useState(0);

  const [prompt, setPrompt] = useState('');
  const [mode, setMode] = useState('text');
  const [isPublished, setIsPublished] = useState(false);
  const [webSearchMode, setWebSearchMode] = useState('auto'); // 'auto' | 'enabled' | 'disabled'

  // Animate search status steps while loading
  useEffect(() => {
    let interval;
    if (loading) {
      setLoadingStepIndex(0);
      interval = setInterval(() => {
        setLoadingStepIndex((prev) => (prev + 1) % SEARCH_STATUS_STEPS.length);
      }, 1600);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const toggleWebSearch = () => {
    setWebSearchMode((prev) => {
      if (prev === 'auto') {
        toast.success('Web Search: Always ON (forces live internet search)');
        return 'enabled';
      }
      if (prev === 'enabled') {
        toast('Web Search: OFF (internal knowledge only)');
        return 'disabled';
      }
      toast.success('Web Search: Auto (searches automatically for current facts)');
      return 'auto';
    });
  };

  const onSubmit = async (e) => {
    try {
      e.preventDefault();

      if (!user) return toast('Login to send message');

      setLoading(true);

      const promptCopy = prompt;

      setPrompt('');

      setMessages((prev) => [
        ...prev,
        {
          role: 'user',
          content: promptCopy,
          timestamp: Date.now(),
          isImage: false,
        },
      ]);

      let currentChatId = selectedChat?._id;

      if (!currentChatId) {
        const { data: createData } = await axios.get('/api/chat/create', {
          headers: { Authorization: token },
        });
        if (createData.success && createData.chat) {
          currentChatId = createData.chat._id;

          // Inject the user's message so the useEffect doesn't clear it
          createData.chat.messages = [
            {
              role: 'user',
              content: promptCopy,
              timestamp: Date.now(),
              isImage: false,
            },
          ];

          setSelectedChat(createData.chat);
          fetchUsersChats();
        } else {
          toast.error('Failed to create chat');
          setLoading(false);
          return;
        }
      }

      const { data } = await axios.post(
        `/api/message/${mode}`,
        {
          chatId: currentChatId,
          prompt: promptCopy,
          isPublished,
          webSearch: webSearchMode,
        },
        {
          headers: {
            Authorization: token,
          },
        }
      );

      if (data.success) {
        setMessages((prev) => [...prev, data.reply]);
        // decrease credits updated
        if (mode === 'image') {
          setUser((prev) => ({ ...prev, credits: prev.credits - 2 }));
        } else {
          setUser((prev) => ({ ...prev, credits: prev.credits - 1 }));
        }
      } else {
        toast.error(data.message);
        setPrompt(promptCopy);
      }
    } catch (error) {
      console.log('Error:', error);
      console.log('Status:', error.response?.status);
      console.log('Response:', error.response?.data);

      toast.error(error.response?.data?.message || error.message);
    } finally {
      setPrompt('');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedChat) {
      setMessages(selectedChat.messages);
    } else {
      setMessages([]);
    }
  }, [selectedChat]);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages]);

  return (
    <div className="flex-1 flex flex-col justify-between m-5 md:m-10 xl:mx-30 max-md:mt-14">
      {/* Chat Messages */}
      <div ref={containerRef} className="flex-1 mb-5 overflow-y-scroll">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center gap-2 text-primary">
            <div className="flex flex-col items-center gap-4 mb-4">
              <img
                src={assets.logo_new}
                className="w-24 h-24 rounded-full shadow-lg"
                alt="ThinkMate Logo"
              />
              <span className="text-4xl font-bold text-black dark:text-white">
                Think<span className="text-[#10B981]">Mate</span>
              </span>
            </div>
            <p className="mt-5 text-4xl sm:text-6xl text-center text-black dark:text-white">
              How can I help you today?
            </p>
          </div>
        )}
        {messages.length > 0 && (
          <div className="w-full max-w-3xl mx-auto flex flex-col px-3 md:px-14 lg:px-0">
            {messages.map((message, index) => (
              <Message key={index} message={message} />
            ))}
            {loading && (
              <div className="flex items-start my-6 relative">
                <div className="hidden md:block absolute -left-14 top-0">
                  <img
                    src={assets.logo_new}
                    alt="ThinkMate"
                    className="w-8 h-8 rounded-full shadow-sm"
                  />
                </div>
                <img
                  src={assets.logo_new}
                  alt="ThinkMate"
                  className="w-8 h-8 rounded-full shadow-sm md:hidden mr-3 shrink-0"
                />
                <div className="flex flex-col gap-1.5 py-1 px-1">
                  <div className="flex items-center gap-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                    <svg
                      className="animate-spin"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                      <path d="M12 2a10 10 0 0 1 10 10" />
                    </svg>
                    <span>
                      {mode === 'image'
                        ? 'Creating your image...'
                        : webSearchMode === 'disabled'
                        ? 'Thinking...'
                        : SEARCH_STATUS_STEPS[loadingStepIndex]}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 pl-0.5">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce"></div>
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.2s]"></div>
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.4s]"></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {mode === 'image' && (
        <label className="inline-flex items-center gap-2 mb-3 text-sm mx-auto">
          <p className="text-xs">Publish Generated Image to Community</p>
          <input
            type="checkbox"
            className="cursor-pointer"
            checked={isPublished}
            onChange={(e) => setIsPublished(e.target.checked)}
          />
        </label>
      )}

      {/* Prompt Input Box */}
      <form
        onSubmit={onSubmit}
        className="bg-primary/20 dark:bg-[#064E3B]/30 border border-primary dark:border-[#059669]/30 rounded-full w-full max-w-3xl p-2.5 sm:p-3 pl-3 sm:pl-4 mx-auto flex gap-2 sm:gap-3 items-center"
      >
        <select
          onChange={(e) => setMode(e.target.value)}
          value={mode}
          className="text-xs sm:text-sm pl-2 sm:pl-3 pr-1 sm:pr-2 outline-none font-medium cursor-pointer"
        >
          <option className="dark:bg-emerald-900" value="text">
            Text
          </option>
          <option className="dark:bg-emerald-900" value="image">
            Image
          </option>
        </select>

        {mode === 'text' && (
          <button
            type="button"
            onClick={toggleWebSearch}
            title={
              webSearchMode === 'enabled'
                ? 'Web Search: Always ON (forces live internet search)'
                : webSearchMode === 'disabled'
                ? 'Web Search: OFF (internal knowledge only)'
                : 'Web Search: Auto (searches automatically for current facts)'
            }
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all cursor-pointer shrink-0 ${
              webSearchMode === 'enabled'
                ? 'bg-emerald-500 text-white shadow-xs'
                : webSearchMode === 'disabled'
                ? 'bg-gray-200/60 dark:bg-gray-800 text-gray-400'
                : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
            }`}
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
            <span className="hidden sm:inline">
              {webSearchMode === 'auto'
                ? 'Search'
                : webSearchMode === 'enabled'
                ? 'Search ON'
                : 'Search OFF'}
            </span>
          </button>
        )}

        <input
          onChange={(e) => setPrompt(e.target.value)}
          value={prompt}
          type="text"
          placeholder={
            mode === 'image'
              ? 'Describe the image you want to generate...'
              : webSearchMode === 'enabled'
              ? 'Ask anything (live web search active)...'
              : 'Ask anything or search current facts...'
          }
          className="flex-1 w-full text-sm outline-none bg-transparent"
          required
        />

        <button disabled={loading} type="submit" className="shrink-0">
          <img
            src={loading ? assets.stop_icon : assets.send_icon}
            className="w-8 cursor-pointer"
            alt=""
          />
        </button>
      </form>
    </div>
  );
};

export default ChatBox;
