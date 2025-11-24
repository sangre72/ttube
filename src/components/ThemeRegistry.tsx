'use client';
import * as React from 'react';

export default function ThemeRegistry({ children }: { children: React.ReactNode }) {
  return (
    <div className="egov-theme-provider">
      {children}
    </div>
  );
}
