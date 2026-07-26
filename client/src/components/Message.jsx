import React, { useEffect } from 'react'
import { assets } from '../assets/assets'
import moment from 'moment'
import Markdown from 'react-markdown'
import Prism from 'prismjs'
import toast from 'react-hot-toast'

const Message = ({ message }) => {

useEffect(()=>{
  Prism.highlightAll()
},[message.content])

  return (
    <div>
      {message.role === "user" ? (
        <div className="flex items-start justify-end my-4 gap-2">
          <div className="flex flex-col gap-2 p-2 px-4 bg-slate-50 dark:bg-[#064E3B]/30 border border-[#059669]/30 rounded-md max-w-2xl">
            <p className="text-sm dark:text-primary">
              {message.content}
            </p>
            <span className="text-xs text-gray-400 dark:text-[#B1A6C0]">
              {moment(message.timestamp).fromNow()}
            </span>
          </div>

          <img
            src={assets.user_icon}
            alt=""
            className="w-8 rounded-full"
          />
        </div>
      ) : (
        <div className="inline-flex flex-col gap-2 p-2 px-4 max-w-2xl bg-primary/20 dark:bg-[#064E3B]/30 border border-[#059669]/30 rounded-md my-4">
          {message.isImage ? (
            <>
              <img
                src={message.content}
                alt=""
                className="w-full max-w-md mt-2 rounded-md"
              />
              <div className="flex justify-between items-center mt-1">
                <span className='text-xs text-gray-400 dark:text-[#B1A6C0]'>{moment(message.timestamp).fromNow()}</span>
                <button 
                  onClick={() => {
                    const a = document.createElement('a');
                    a.href = message.content;
                    a.download = `thinkmate_image_${Date.now()}.png`;
                    a.click();
                    toast.success("Downloading image...");
                  }}
                  className="text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-white cursor-pointer"
                  title="Download image"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="text-sm dark:text-primary reset-tw">
                <Markdown>{message.content}</Markdown>
              </div>
              <div className="flex justify-between items-center mt-1">
                <span className='text-xs text-gray-400 dark:text-[#B1A6C0]'>{moment(message.timestamp).fromNow()}</span>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(message.content);
                    toast.success("Copied to clipboard!");
                  }}
                  className="text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-white cursor-pointer"
                  title="Copy text"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default Message
