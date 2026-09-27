import React, { useMemo } from "react";
import katex from "katex";

interface MathRendererProps {
  text: string;
  className?: string;
  inline?: boolean;
}

/**
 * Parses a string containing LaTeX delimiters ($...$ for inline, $$...$$ for block)
 * and renders formatted math expressions using KaTeX.
 */
export const MathRenderer: React.FC<MathRendererProps> = ({
  text,
  className = "",
  inline = false,
}) => {
  const renderedElements = useMemo(() => {
    if (!text) return null;

    // Pattern to match $$...$$ (display math) or $...$ (inline math) or \(...\) or \[...\]
    const regex = /(\$\$[\s\S]*?\$\$|\$[^$\n]+?\$|\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\))/g;

    const parts = text.split(regex);

    return parts.map((part, index) => {
      if (!part) return null;

      const isBlockDisplay =
        (part.startsWith("$$") && part.endsWith("$$")) ||
        (part.startsWith("\\[") && part.endsWith("\\]"));

      const isInlineDisplay =
        (part.startsWith("$") && part.endsWith("$")) ||
        (part.startsWith("\\(") && part.endsWith("\\)"));

      if (isBlockDisplay || isInlineDisplay) {
        let mathContent = "";
        if (part.startsWith("$$")) {
          mathContent = part.slice(2, -2).trim();
        } else if (part.startsWith("\\[")) {
          mathContent = part.slice(2, -2).trim();
        } else if (part.startsWith("\\(")) {
          mathContent = part.slice(2, -2).trim();
        } else {
          mathContent = part.slice(1, -1).trim();
        }

        try {
          const html = katex.renderToString(mathContent, {
            displayMode: isBlockDisplay && !inline,
            throwOnError: false,
            output: "htmlAndMathml",
          });

          return (
            <span
              key={index}
              dangerouslySetInnerHTML={{ __html: html }}
              className={isBlockDisplay && !inline ? "block my-2 text-center" : "inline-block mx-0.5"}
            />
          );
        } catch (e) {
          console.warn("KaTeX rendering error:", e);
          return (
            <span key={index} className="font-mono text-xs text-orange-700 bg-orange-50 px-1 rounded">
              {part}
            </span>
          );
        }
      }

      // Regular text: preserve newlines if needed
      return <span key={index}>{part}</span>;
    });
  }, [text, inline]);

  return <span className={className}>{renderedElements}</span>;
};
