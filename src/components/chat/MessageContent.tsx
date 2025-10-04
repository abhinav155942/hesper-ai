import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface MessageContentProps {
  content: string;
}

export const MessageContent: React.FC<MessageContentProps> = ({ content }) => {
  return (
    <div className="prose prose-sm max-w-none text-foreground">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ node, inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : '';
            
            return !inline ? (
              <SyntaxHighlighter
                style={vscDarkPlus}
                language={language}
                PreTag="div"
                className="!mt-2 !mb-2 !rounded-lg !text-sm"
                {...props}
              >
                {String(children).replace(/\n$/, '')}
              </SyntaxHighlighter>
            ) : (
              <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                {children}
              </code>
            );
          },
          p({ children }) {
            return <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>;
          },
          h1({ children }) {
            return <h1 className="text-xl font-bold mb-3 mt-4 first:mt-0">{children}</h1>;
          },
          h2({ children }) {
            return <h2 className="text-lg font-bold mb-3 mt-4 first:mt-0">{children}</h2>;
          },
          h3({ children }) {
            return <h3 className="text-base font-bold mb-2 mt-3 first:mt-0">{children}</h3>;
          },
          ul({ children }) {
            return <ul className="list-disc list-inside mb-3 space-y-1">{children}</ul>;
          },
          ol({ children }) {
            return <ol className="list-decimal list-inside mb-3 space-y-1">{children}</ol>;
          },
          li({ children }) {
            return <li className="leading-relaxed">{children}</li>;
          },
          strong({ children }) {
            return <strong className="font-bold text-foreground">{children}</strong>;
          },
          em({ children }) {
            return <em className="italic">{children}</em>;
          },
          table({ children }) {
            return (
              <div className="overflow-x-auto my-3">
                <table className="min-w-full border-collapse border border-border">
                  {children}
                </table>
              </div>
            );
          },
          thead({ children }) {
            return <thead className="bg-muted">{children}</thead>;
          },
          tbody({ children }) {
            return <tbody>{children}</tbody>;
          },
          tr({ children }) {
            return <tr className="border-b border-border">{children}</tr>;
          },
          th({ children }) {
            return (
              <th className="px-3 py-2 text-left font-semibold border border-border">
                {children}
              </th>
            );
          },
          td({ children }) {
            return <td className="px-3 py-2 border border-border">{children}</td>;
          },
          blockquote({ children }) {
            return (
              <blockquote className="border-l-4 border-primary pl-4 italic my-3 text-muted-foreground">
                {children}
              </blockquote>
            );
          },
          a({ href, children }) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                {children}
              </a>
            );
          },
          hr() {
            return <hr className="my-4 border-border" />;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
