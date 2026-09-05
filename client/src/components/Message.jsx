import React, { useEffect } from 'react'
import { assets } from '../assets/assets'
import moment from 'moment'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import Prism from 'prismjs'
import toast from 'react-hot-toast'

const Message = ({ message }) => {

useEffect(()=>{
  Prism.highlightAll()
},[message.content])

  return (
    <div>
      {message.role === "user" ? (
        <div className="flex items-start justify-end my-6 gap-3">
          <div className="flex flex-col gap-1 p-3 px-5 bg-gray-100 dark:bg-gray-800 rounded-3xl max-w-2xl">
            <p className="text-[15px] text-gray-800 dark:text-gray-200">
              {message.content}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-4 my-6">
          <img
            src={assets.logo_new}
            alt="AI"
            className="w-8 h-8 rounded-full shadow-sm"
          />
          <div className="flex flex-col gap-2 flex-1 max-w-3xl">
            {message.isImage ? (
              <>
                <img
                  src={message.content}
                  alt=""
                  className="w-full max-w-md mt-2 rounded-xl shadow-md"
                />
                <div className="flex justify-between items-center mt-1">
                  <span className='text-xs text-gray-400'>{moment(message.timestamp).fromNow()}</span>
                  <button 
                    onClick={() => {
                      const a = document.createElement('a');
                      a.href = message.content;
                      a.download = `thinkmate_image_${Date.now()}.png`;
                      a.click();
                      toast.success("Downloading image...");
                    }}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer"
                    title="Download image"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="text-[15px] text-gray-800 dark:text-gray-200 reset-tw leading-relaxed">
                  <Markdown remarkPlugins={[remarkGfm]}>{message.content}</Markdown>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className='text-xs text-gray-400'>{moment(message.timestamp).fromNow()}</span>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(message.content);
                      toast.success("Copied to clipboard!");
                    }}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer flex items-center gap-1"
                    title="Copy text"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default Message
