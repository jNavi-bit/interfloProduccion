import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const components: Components = {
  h1: ({ children }) => (
    <h1 className="font-display mt-0 border-b border-sky-500/40 pb-4 text-3xl font-bold tracking-tight text-white">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="font-display mt-10 scroll-mt-24 border-l-4 border-sky-500 pl-4 text-xl font-semibold text-sky-100 first:mt-0 sm:text-2xl">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="font-display mt-8 text-lg font-semibold text-orange-200 sm:text-xl">
      {children}
    </h3>
  ),
  p: ({ children }) => (
    <p className="my-4 text-[15px] leading-relaxed text-slate-300 sm:text-base">
      {children}
    </p>
  ),
  ul: ({ children }) => (
    <ul className="my-4 list-disc space-y-2 pl-6 text-[15px] text-slate-300 marker:text-sky-400 sm:text-base">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="my-4 list-decimal space-y-2 pl-6 text-[15px] text-slate-300 marker:text-orange-400 sm:text-base">
      {children}
    </ol>
  ),
  li: ({ children }) => (
    <li className="leading-relaxed [&_input[type=checkbox]]:mr-2 [&_input[type=checkbox]]:size-4 [&_input[type=checkbox]]:translate-y-0.5 [&_input[type=checkbox]]:accent-sky-500">
      {children}
    </li>
  ),
  em: ({ children }) => <em className="text-slate-400 italic">{children}</em>,
  strong: ({ children }) => (
    <strong className="font-semibold text-slate-100">{children}</strong>
  ),
  a: ({ href, children }) => (
    <a
      href={href}
      className="font-medium text-cyan-400 underline decoration-cyan-500/40 underline-offset-2 transition hover:text-sky-300 hover:decoration-sky-400/60"
      target={href?.startsWith("http") ? "_blank" : undefined}
      rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
    >
      {children}
    </a>
  ),
  hr: () => (
    <hr className="my-10 border-0 bg-gradient-to-r from-transparent via-orange-500/40 to-transparent py-px" />
  ),
  blockquote: ({ children }) => (
    <blockquote className="my-6 border-l-4 border-orange-400/60 bg-orange-950/20 py-3 pr-4 pl-4 text-slate-300 italic">
      {children}
    </blockquote>
  ),
  code: ({ className, children }) => {
    const isBlock = /language-/.test(className ?? "");
    if (isBlock) {
      return (
        <code
          className={`${className ?? ""} block font-mono text-[13px] leading-relaxed text-sky-100`}
        >
          {children}
        </code>
      );
    }
    return (
      <code className="rounded-md border border-orange-500/30 bg-orange-950/50 px-1.5 py-0.5 font-mono text-[0.9em] text-orange-100">
        {children}
      </code>
    );
  },
  pre: ({ children }) => (
    <pre className="my-6 overflow-x-auto rounded-xl border border-sky-500/20 bg-slate-900/90 p-4 shadow-inner shadow-sky-900/30">
      {children}
    </pre>
  ),
  table: ({ children }) => (
    <div className="my-6 overflow-x-auto rounded-xl border border-sky-500/25 bg-slate-900/40 shadow-inner">
      <table className="w-full min-w-[520px] border-collapse text-left text-sm">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="border-b border-sky-500/35 bg-gradient-to-r from-blue-950/80 via-slate-900/90 to-orange-950/60">
      {children}
    </thead>
  ),
  tbody: ({ children }) => <tbody className="divide-y divide-white/[0.06]">{children}</tbody>,
  tr: ({ children }) => <tr className="transition hover:bg-sky-500/[0.07]">{children}</tr>,
  th: ({ children }) => (
    <th className="px-4 py-3 text-xs font-bold tracking-wide text-sky-100 uppercase">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="px-4 py-3 align-top text-slate-300">{children}</td>
  ),
};

type ManualMarkdownProps = {
  content: string;
};

export function ManualMarkdown({ content }: ManualMarkdownProps) {
  return (
    <div className="manual-md">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
