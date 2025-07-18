// /components/WriteAiMessage.jsx
import React from 'react';
import Markdown from 'markdown-to-jsx';

const WriteAiMessage = React.memo(({ message }) => {
  const formattedContent = (() => {
    try {
      const parsed = typeof message === 'string' ? JSON.parse(message) : message;
      if (typeof parsed === 'object' && parsed !== null) {
        if (typeof parsed.text === 'string') return parsed.text;
        if (typeof parsed.joke === 'string') return parsed.joke;
        const firstStringProp = Object.values(parsed).find(v => typeof v === 'string');
        if (firstStringProp) return firstStringProp;
        return JSON.stringify(parsed, null, 2);
      }
      return parsed;
    } catch {
      return typeof message === 'string' ? message : String(message);
    }
  })();

  return (
    <div className="ai-reply bg-gray-800 rounded-lg p-4 text-sm leading-relaxed text-gray-300 shadow-md border border-gray-700">
      <Markdown
        options={{
          overrides: {
            think: {
              component: ({ children }) => (
                <div className="bg-gray-700/50 p-3 rounded-lg my-3 border-l-4 border-blue-500">
                  <div className="text-blue-400 text-xs font-mono mb-2">THINKING PROCESS:</div>
                  <div className="text-gray-300 text-sm space-y-2">{children}</div>
                </div>
              ),
            },
            h1: { component: ({ children }) => <h1 className="text-xl font-bold text-gray-100 mb-3 mt-2">{children}</h1> },
            h2: { component: ({ children }) => <h2 className="text-lg font-semibold text-gray-100 mb-2 mt-4">{children}</h2> },
            h3: { component: ({ children }) => <h3 className="text-md font-medium text-gray-200 mb-2 mt-3">{children}</h3> },
            p: { component: ({ children }) => <p className="text-gray-300 mb-3 leading-relaxed">{children}</p> },
            code: {
              component: ({ children, className }) => {
                const language = className?.replace('language-', '') || 'plaintext';
                return (
                  <div className="bg-gray-900 rounded-md overflow-hidden mb-4 mt-2 shadow-lg">
                    <div className="flex justify-between items-center px-4 py-2 bg-gray-800 text-gray-400 text-xs">
                      <span>{language}</span>
                    </div>
                    <pre className="p-4 overflow-auto">
                      <code className={`language-${language} text-sm`}>{children}</code>
                    </pre>
                  </div>
                );
              },
            },
            inlineCode: { component: ({ children }) => <code className="bg-gray-700 px-1 py-0.5 rounded text-red-300 text-sm">{children}</code> },
            ul: { component: ({ children }) => <ul className="list-disc list-inside space-y-1 mb-4 pl-4">{children}</ul> },
            ol: { component: ({ children }) => <ol className="list-decimal list-inside space-y-1 mb-4 pl-4">{children}</ol> },
            li: { component: ({ children }) => <li className="text-gray-300 pl-2">{children}</li> },
            blockquote: {
              component: ({ children }) => (
                <blockquote className="border-l-4 border-green-500 pl-4 text-gray-400 italic my-4 bg-gray-700/20 py-2 rounded-r">
                  {children}
                </blockquote>
              ),
            },
            table: { component: ({ children }) => <table className="w-full my-4 bg-gray-700/20 rounded-lg overflow-hidden">{children}</table> },
            th: { component: ({ children }) => <th className="px-4 py-2 bg-gray-800 text-left text-gray-300 border-b border-gray-600">{children}</th> },
            td: { component: ({ children }) => <td className="px-4 py-2 border-b border-gray-700/50 text-gray-400">{children}</td> },
          },
        }}
      >
        {formattedContent}
      </Markdown>
    </div>
  );
});

export default WriteAiMessage;