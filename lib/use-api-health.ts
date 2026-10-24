"use client";
import { useEffect, useState } from "react";
import { health } from "./api";
import { config } from "./config";

export function useApiHealth() {
  const [online, setOnline] = useState<boolean | null>(null);
  useEffect(() => {
    if (config.demo) return;
    const controller = new AbortController();
    let pending = false;
    let available = false;
    async function check() {
      if (pending || controller.signal.aborted) return;
      pending = true;
      try {
        available = await health(controller.signal);
        if (!controller.signal.aborted) setOnline(available);
      } finally {
        pending = false;
      }
    }
    const recheck = () => {
      void check();
    };
    recheck();
    // Keep the service warm while a tab is open, including background tabs
    // when the browser allows their timers to run.
    const keepAlive = window.setInterval(recheck, 10 * 60 * 1000);
    // Recover promptly after a cold start or temporary failure without polling
    // a healthy service every 30 seconds.
    const recovery = window.setInterval(() => {
      if (!available && document.visibilityState === "visible") recheck();
    }, 30000);
    window.addEventListener("focus", recheck);
    window.addEventListener("online", recheck);
    return () => {
      controller.abort();
      window.clearInterval(keepAlive);
      window.clearInterval(recovery);
      window.removeEventListener("focus", recheck);
      window.removeEventListener("online", recheck);
    };
  }, []);
  return online;
}
