import React, { useMemo, useState } from 'react'
import { assets } from '../assets/assets'
import moment from 'moment'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import toast from 'react-hot-toast'

import Prism from 'prismjs'
import 'prismjs/components/prism-markup'
import 'prismjs/components/prism-css'
import 'prismjs/components/prism-clike'
import 'prismjs/components/prism-javascript'
import 'prismjs/components/prism-typescript'
import 'prismjs/components/prism-jsx'
import 'prismjs/components/prism-tsx'
import 'prismjs/components/prism-python'
import 'prismjs/components/prism-bash'
import 'prismjs/components/prism-json'
import 'prismjs/components/prism-c'
import 'prismjs/components/prism-cpp'
import 'prismjs/components/prism-csharp'
import 'prismjs/components/prism-java'
import 'prismjs/components/prism-sql'
import 'prismjs/components/prism-go'
import 'prismjs/components/prism-rust'
import 'prismjs/components/prism-yaml'
import 'prismjs/components/prism-markdown'
import 'prismjs/components/prism-docker'

const LANGUAGE_MAP = {
  js: 'javascript',
  jsx: 'jsx',
  ts: 'typescript',
  tsx: 'tsx',
  py: 'python',
  python: 'python',
  html: 'markup',
  xml: 'markup',
  svg: 'markup',
  css: 'css',
  sh: 'bash',
  bash: 'bash',
  shell: 'bash',
  zsh: 'bash',
  json: 'json',
  c: 'c',
  cpp: 'cpp',
  'c++': 'cpp',
  cs: 'csharp',
  csharp: 'csharp',
  java: 'java',
  sql: 'sql',
  go: 'go',
  golang: 'go',
  rust: 'rust',
  rs: 'rust',
  yaml: 'yaml',
  yml: 'yaml',
  md: 'markdown',
  markdown: 'markdown',
  docker: 'docker',
  dockerfile: 'docker',
};

// Clean unrendered math delimiters like \( ... \) and \[ ... \] into clean text
const formatMath = (content) => {
  if (!content || typeof content !== 'string') return content;
  return content
    .replace(/\\\(([\s\S]*?)\\\)/g, '$1')
    .replace(/\\\[([\s\S]*?)\\\]/g, '$1')
    .replace(/\\times\b/g, '×')
    .replace(/\\div\b/g, '÷')
    .replace(/\\le\b/g, '≤')
    .replace(/\\ge\b/g, '≥')
    .replace(/\\ne\b/g, '≠')
    .replace(/\\approx\b/g, '≈')
    .replace(/\\pm\b/g, '±')
    .replace(/\\cdot\b/g, '·');
};

// ChatGPT-style Code Block component
const CodeBlock = ({ language, code }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success("Code copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const highlightedHtml = useMemo(() => {
    const rawLang = (language || '').toLowerCase().trim();
    const mappedLang = LANGUAGE_MAP[rawLang] || rawLang;
    if (mappedLang && Prism.languages[mappedLang]) {
      try {
        return Prism.highlight(code, Prism.languages[mappedLang], mappedLang);
      } catch (e) {
        console.error("Prism highlight error:", e);
      }
    }
    return null;
  }, [code, language]);

  return (
    <div className="my-4 rounded-xl overflow-hidden border border-gray-700/60 bg-[#1e1e1e] shadow-md text-sm">
      {/* Header bar matching ChatGPT */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#2d2d2d] border-b border-gray-700/50 text-gray-300 font-sans text-xs">
        <span className="font-medium text-gray-300 lowercase tracking-wide">
          {language || 'code'}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-gray-300 hover:text-white hover:bg-gray-700/50 transition-colors cursor-pointer text-xs font-sans"
          title="Copy code"
        >
          {copied ? (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span className="text-[#10B981] font-medium">Copied!</span>
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              <span>Copy code</span>
            </>
          )}
        </button>
      </div>

      {/* Code body with clean horizontal scrolling */}
      <pre className="p-4 overflow-x-auto text-[13.5px] leading-relaxed font-mono m-0 bg-[#1e1e1e] text-[#d4d4d4]">
        {highlightedHtml ? (
          <code
            className={`language-${language || 'text'}`}
            dangerouslySetInnerHTML={{ __html: highlightedHtml }}
          />
        ) : (
          <code>{code}</code>
        )}
      </pre>
    </div>
  );
};

const Message = ({ message }) => {
  const [copiedMessage, setCopiedMessage] = useState(false);
  const [showReasoning, setShowReasoning] = useState(false);

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(message.content);
    setCopiedMessage(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedMessage(false), 2000);
  };

  return (
    <div>
      {message.role === "user" ? (
        <div className="flex items-start justify-end my-6 gap-3">
          <div className="flex flex-col gap-1 p-3.5 px-5 bg-gray-100 dark:bg-gray-800 rounded-3xl max-w-2xl shadow-xs">
            <p className="text-[15px] text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">
              {message.content}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-start my-6 relative">
          {/* Desktop Avatar: Hangs in the left margin so text aligns with the input box */}
          <div className="hidden md:block absolute -left-14 top-0">
            <img
              src={assets.logo_new}
              alt="ThinkMate"
              className="w-8 h-8 rounded-full shadow-sm"
            />
          </div>
          
          {/* Mobile Avatar: Inline */}
          <img
            src={assets.logo_new}
            alt="ThinkMate"
            className="w-8 h-8 rounded-full shadow-sm md:hidden mr-3 shrink-0"
          />
          
          <div className="flex flex-col gap-2 flex-1 min-w-0">
            {message.isImage ? (
              <>
                <img
                  src={message.content}
                  alt="Generated AI"
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
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer p-1 rounded"
                    title="Download image"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* Optional Collapsible Reasoning (Thought Process like modern GPT/o1) */}
                {message.reasoning && (
                  <div className="mb-3 border border-gray-200 dark:border-gray-700/70 rounded-xl overflow-hidden bg-gray-50/70 dark:bg-gray-800/40 text-xs">
                    <button
                      onClick={() => setShowReasoning(!showReasoning)}
                      className="w-full flex items-center justify-between px-3.5 py-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors font-medium cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" />
                          <path d="M12 16v-4" />
                          <path d="M12 8h.01" />
                        </svg>
                        <span>Thought Process</span>
                      </div>
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={`transition-transform duration-200 ${showReasoning ? 'rotate-180' : ''}`}
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </button>
                    {showReasoning && (
                      <div className="px-3.5 pb-3 pt-1 border-t border-gray-200/60 dark:border-gray-700/40 text-gray-600 dark:text-gray-300 leading-relaxed font-sans whitespace-pre-wrap text-[13px]">
                        {message.reasoning}
                      </div>
                    )}
                  </div>
                )}

                {/* Main Markdown Content formatted like ChatGPT */}
                <div className="text-[15px] text-gray-800 dark:text-gray-200 markdown-content">
                  <Markdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      pre({ children }) {
                        return <>{children}</>;
                      },
                      code({ node, className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || '');
                        const isBlock = match || String(children).includes('\n');
                        if (isBlock) {
                          const codeString = String(children).replace(/\n$/, '');
                          return (
                            <CodeBlock
                              language={match ? match[1] : ''}
                              code={codeString}
                            />
                          );
                        }
                        return (
                          <code
                            className="px-1.5 py-0.5 mx-0.5 rounded-md text-[13.5px] font-mono bg-gray-100 dark:bg-gray-800 text-pink-600 dark:text-emerald-400 border border-gray-200/80 dark:border-gray-700/60 font-medium"
                            {...props}
                          >
                            {children}
                          </code>
                        );
                      },
                      table({ children }) {
                        return (
                          <div className="my-5 overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700/80 shadow-xs bg-white dark:bg-transparent">
                            <table className="min-w-full text-left text-sm border-collapse">
                              {children}
                            </table>
                          </div>
                        );
                      },
                      thead({ children }) {
                        return (
                          <thead className="bg-gray-50 dark:bg-gray-800/80 border-b border-gray-200 dark:border-gray-700">
                            {children}
                          </thead>
                        );
                      },
                      tbody({ children }) {
                        return (
                          <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                            {children}
                          </tbody>
                        );
                      },
                      tr({ children }) {
                        return (
                          <tr className="hover:bg-gray-50/70 dark:hover:bg-gray-800/40 transition-colors">
                            {children}
                          </tr>
                        );
                      },
                      th({ children }) {
                        return (
                          <th className="px-4 py-2.5 font-semibold text-gray-900 dark:text-gray-100 text-xs tracking-wider uppercase">
                            {children}
                          </th>
                        );
                      },
                      td({ children }) {
                        return (
                          <td className="px-4 py-2.5 text-gray-700 dark:text-gray-300 leading-normal">
                            {children}
                          </td>
                        );
                      },
                      blockquote({ children }) {
                        return (
                          <blockquote className="border-l-4 border-emerald-500 pl-4 py-1.5 my-4 bg-emerald-50/40 dark:bg-emerald-950/20 rounded-r-md text-gray-700 dark:text-gray-300 italic">
                            {children}
                          </blockquote>
                        );
                      },
                      input({ type, checked, ...props }) {
                        if (type === 'checkbox') {
                          return (
                            <input
                              type="checkbox"
                              checked={checked}
                              readOnly
                              className="mr-2 rounded accent-emerald-500 cursor-default align-middle"
                              {...props}
                            />
                          );
                        }
                        return <input type={type} {...props} />;
                      },
                      a({ href, children }) {
                        return (
                          <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
                          >
                            {children}
                          </a>
                        );
                      },
                      hr() {
                        return <hr className="my-6 border-gray-200 dark:border-gray-800" />;
                      },
                    }}
                  >
                    {formatMath(message.content)}
                  </Markdown>
                </div>

                {/* Bottom action bar */}
                <div className="flex justify-between items-center mt-2 pt-1">
                  <span className='text-xs text-gray-400'>{moment(message.timestamp).fromNow()}</span>
                  <button 
                    onClick={handleCopyMessage}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer flex items-center gap-1.5 text-xs p-1 rounded transition-colors"
                    title="Copy response"
                  >
                    {copiedMessage ? (
                      <>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        <span className="text-[#10B981] font-medium">Copied!</span>
                      </>
                    ) : (
                      <>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                        </svg>
                        <span>Copy</span>
                      </>
                    )}
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
