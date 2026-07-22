"use client";

import { useEffect, useState } from "react";
import { PixelIcon } from "@/components/PixelIcon";

/** "Welcome to Macintosh" — shown once per session, then never again. */
export default function BootSplash() {
  const [show, setShow] = useState(false);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("falfoul-booted")) return;
    sessionStorage.setItem("falfoul-booted", "1");
    setShow(true);
    const fade = setTimeout(() => setFading(true), 1500);
    const done = setTimeout(() => setShow(false), 2000);
    return () => {
      clearTimeout(fade);
      clearTimeout(done);
    };
  }, []);

  if (!show) return null;

  return (
    <div
      className={`mac fixed inset-0 z-[200] flex items-center justify-center transition-opacity duration-500 ${
        fading ? "opacity-0" : "opacity-100"
      }`}
      style={{
        backgroundColor: "#d7e4e2",
        backgroundImage:
          "repeating-conic-gradient(#8fb4ae 0% 25%, #d7e4e2 0% 50%)",
        backgroundSize: "4px 4px",
      }}
    >
      <div className="mac-window w-72 p-8 text-center">
        <PixelIcon name="smile" size={56} className="mx-auto text-gray-900" />
        <div className="pixel mt-4 text-lg font-semibold text-gray-900">
          Welcome to Falfoul
        </div>
        <div className="mt-5 h-3 w-full border-2 border-gray-900 bg-white">
          <div className="boot-progress h-full bg-gray-900" />
        </div>
      </div>
    </div>
  );
}
