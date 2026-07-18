import React from 'react';
import Link from 'next/link';

export function renderMessageWithLinks(text: string) {
  if (!text) return null;
  const regex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    const label = match[1];
    const url = match[2];
    const isExternal = url.startsWith('http');
    
    if (isExternal) {
      parts.push(
        <a key={match.index} href={url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-400 hover:underline font-semibold transition-colors">
          {label}
        </a>
      );
    } else {
      parts.push(
        <Link key={match.index} href={url} className="text-blue-500 hover:text-blue-400 hover:underline font-semibold transition-colors">
          {label}
        </Link>
      );
    }
    lastIndex = regex.lastIndex;
  }
  
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  
  return parts.length > 0 ? <>{parts.map((p, i) => <React.Fragment key={i}>{p}</React.Fragment>)}</> : <>{text}</>;
}
