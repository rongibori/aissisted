import React from "react";

/*
 * StatusBar — decorative phone-frame chrome.
 * 9:41 / WiFi / battery — never reads to assistive tech (aria-hidden).
 */

interface StatusBarProps {
  time?: string;
}

export function StatusBar({ time = "9:41" }: StatusBarProps) {
  return (
    <div
      aria-hidden="true"
      className="flex items-center justify-between px-6 pt-3 pb-2 text-ink font-system text-[14px] font-medium select-none"
      style={{ height: 44 }}
    >
      <span className="tabular-nums">{time}</span>
      <div className="flex items-center gap-1.5">
        {/* Cellular signal — three ascending dots */}
        <span className="flex items-end gap-[2px]" aria-hidden="true">
          <span className="block w-[3px] h-[4px] rounded-[1px] bg-ink" />
          <span className="block w-[3px] h-[6px] rounded-[1px] bg-ink" />
          <span className="block w-[3px] h-[8px] rounded-[1px] bg-ink" />
        </span>
        {/* WiFi — three concentric arcs */}
        <svg
          width="14"
          height="10"
          viewBox="0 0 14 10"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M7 9.2a1 1 0 100-2 1 1 0 000 2z"
            fill="currentColor"
          />
          <path
            d="M3.5 5.5a5 5 0 017 0"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
          <path
            d="M1.2 3.2a8.2 8.2 0 0111.6 0"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
        </svg>
        {/* Battery — outline + fill */}
        <span
          className="relative inline-block ml-1 border border-ink rounded-[3px]"
          style={{ width: 22, height: 11 }}
          aria-hidden="true"
        >
          <span
            className="absolute top-[1px] left-[1px] bottom-[1px] bg-ink rounded-[1.5px]"
            style={{ width: 16 }}
          />
          <span
            className="absolute top-[3px] -right-[2px] bg-ink rounded-r-[1px]"
            style={{ width: 1.5, height: 5 }}
          />
        </span>
      </div>
    </div>
  );
}
