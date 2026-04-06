"use client";
import React, { useMemo } from 'react';

export default function WordCloud({ words = [] }) {
  if (!words || words.length === 0) return null;

  const cloudItems = useMemo(() => {
    return words.map((word, i) => {
      const fontSize = 0.8 + Math.random() * 0.5;   // 0.80–1.30rem
      const opacity = 0.6 + Math.random() * 0.4;    // 0.60–1.00
      const rotate = (Math.random() - 0.5) * 15;   // -7.5 to +7.5 deg
      
      return {
        text: word.target,
        id: i,
        style: {
          fontSize: `${fontSize}rem`,
          opacity: opacity,
          transform: `rotate(${rotate}deg)`,
          padding: '4px 8px',
          background: 'rgba(255, 255, 255, 0.4)',
          borderRadius: '8px',
          fontWeight: '600',
          color: 'var(--brand-teal)',
          border: '1px solid rgba(0, 184, 212, 0.2)',
          display: 'inline-block',
          margin: '4px'
        }
      };
    });
  }, [words]);

  return (
    <div className="word-cloud-container">
      {cloudItems.map(item => (
        <span key={item.id} style={item.style}>
          {item.text}
        </span>
      ))}
    </div>
  );
}
