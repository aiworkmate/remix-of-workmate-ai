import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

// Minimal SpeechRecognition typing (not in lib.dom for all browsers)
type SR = any;

// ---------------- Module-level autospeak store ----------------
let autoSpeak = typeof window !== "undefined" && localStorage.getItem("voice.autoSpeak") === "1";
const listeners = new Set<() => void>();
function setAutoSpeak(v: boolean) {
  autoSpeak = v;
  if (typeof window !== "undefined") {
    localStorage.setItem("voice.autoSpeak", v ? "1" : "0");
  }
  listeners.forEach((l) => l());
}
function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useAutoSpeak() {
  const value = useSyncExternalStore(subscribe, () => autoSpeak, () => false);
  return [value, setAutoSpeak] as const;
}

// ---------------- Speech synthesis ----------------
export function speak(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  // Strip markdown for cleaner narration
  const clean = text
    .replace(/```[\s\S]*?```/g, " code block ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[[^\]]*\]\([^)]+\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[#*_>~|]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!clean) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(clean);
  u.rate = 1.05;
  u.pitch = 1;
  u.volume = 1;
  // Prefer a high-quality English voice if available
  const voices = window.speechSynthesis.getVoices();
  const preferred =
    voices.find((v) => /Google.*US English|Samantha|Microsoft.*Aria|Microsoft.*Jenny/i.test(v.name)) ||
    voices.find((v) => v.lang?.startsWith("en"));
  if (preferred) u.voice = preferred;
  window.speechSynthesis.speak(u);
}

export function cancelSpeak() {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}

// ---------------- Speech recognition (mic to text) ----------------
export function useSpeechRecognition(onTranscript: (text: string, final: boolean) => void) {
  const [listening, setListening] = useState(false);
  const recRef = useRef<SR | null>(null);
  const cbRef = useRef(onTranscript);
  cbRef.current = onTranscript;

  const supported =
    typeof window !== "undefined" &&
    ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

  const start = useCallback(() => {
    if (!supported) return;
    if (recRef.current) {
      try { recRef.current.stop(); } catch { /* noop */ }
    }
    const Ctor: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const rec: SR = new Ctor();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = navigator.language || "en-US";
    rec.onresult = (e: any) => {
      let interim = "";
      let finalText = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalText += r[0].transcript;
        else interim += r[0].transcript;
      }
      if (finalText) cbRef.current(finalText, true);
      else if (interim) cbRef.current(interim, false);
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    recRef.current = rec;
    try {
      rec.start();
      setListening(true);
    } catch {
      setListening(false);
    }
  }, [supported]);

  const stop = useCallback(() => {
    try { recRef.current?.stop(); } catch { /* noop */ }
    setListening(false);
  }, []);

  useEffect(() => () => { try { recRef.current?.stop(); } catch { /* noop */ } }, []);

  return { listening, start, stop, supported: Boolean(supported) };
}
