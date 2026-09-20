"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { STORAGE_KEYS } from "@/lib/storage-keys";

type SoundName =
  | "menuOpen"
  | "menuClose"
  | "roomTransition"
  | "buttonClick"
  | "deploy"
  | "stepComplete"
  | "checkCorrect"
  | "checkWrong"
  | "missionAccomplished"
  | "missionFailed"
  | "bountyComplete"
  | "decayAlert";

// Lightweight synthesized sounds using Web Audio API
// No external library needed — pure oscillators + noise
class SoundEngine {
  private ctx: AudioContext | null = null;
  private enabled = true;
  private masterGain: GainNode | null = null;

  private getCtx(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.3;
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
    return this.ctx;
  }

  private getMaster(): GainNode {
    this.getCtx();
    return this.masterGain!;
  }

  setEnabled(val: boolean) {
    this.enabled = val;
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEYS.sound, val ? "on" : "off");
    }
  }

  isEnabled() {
    return this.enabled;
  }

  init() {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(STORAGE_KEYS.sound);
      if (stored === "off") this.enabled = false;
    }
  }

  play(name: SoundName) {
    if (!this.enabled) return;
    try {
      switch (name) {
        case "menuOpen":
          this.playClick(800, 0.06, 0.08);
          setTimeout(() => this.playClick(1000, 0.04, 0.06), 40);
          break;
        case "menuClose":
          this.playClick(1000, 0.04, 0.06);
          setTimeout(() => this.playClick(800, 0.04, 0.06), 40);
          break;
        case "roomTransition":
          this.playWhoosh(0.15, 0.3);
          break;
        case "buttonClick":
          this.playClick(600, 0.03, 0.05);
          break;
        case "deploy":
          this.playDeploy();
          break;
        case "stepComplete":
          this.playChime([880, 1100], 0.08, 0.1);
          break;
        case "checkCorrect":
          this.playChime([660, 880], 0.06, 0.08);
          break;
        case "checkWrong":
          this.playTone(220, "sawtooth", 0.1, 0.2);
          break;
        case "missionAccomplished":
          this.playFanfare();
          break;
        case "missionFailed":
          this.playTone(330, "sine", 0.15, 0.5);
          setTimeout(() => this.playTone(280, "sine", 0.12, 0.4), 200);
          break;
        case "bountyComplete":
          this.playChime([660, 880, 1100], 0.06, 0.08);
          break;
        case "decayAlert":
          this.playTone(440, "triangle", 0.08, 0.15);
          setTimeout(() => this.playTone(440, "triangle", 0.08, 0.15), 200);
          break;
      }
    } catch {
      // Silently fail — audio errors shouldn't break the app
    }
  }

  private playClick(freq: number, attack: number, release: number) {
    const ctx = this.getCtx();
    const master = this.getMaster();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.value = freq;

    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + attack);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + attack + release);

    osc.connect(gain);
    gain.connect(master);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + attack + release + 0.01);
  }

  private playWhoosh(duration: number, gain: number) {
    const ctx = this.getCtx();
    const master = this.getMaster();
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      const t = i / bufferSize;
      const envelope = Math.sin(t * Math.PI);
      data[i] = (Math.random() * 2 - 1) * envelope * 0.3;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(200, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(2000, ctx.currentTime + duration * 0.3);
    filter.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + duration);
    filter.Q.value = 0.5;

    const gainNode = ctx.createGain();
    gainNode.gain.value = gain;

    source.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(master);
    source.start();
    source.stop(ctx.currentTime + duration + 0.01);
  }

  private playChime(freqs: number[], attack: number, release: number) {
    freqs.forEach((freq, i) => {
      setTimeout(() => {
        this.playTone(freq, "sine", 0.12, attack + release);
      }, i * 80);
    });
  }

  private playTone(freq: number, type: OscillatorType, gain: number, duration: number) {
    const ctx = this.getCtx();
    const master = this.getMaster();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = type;
    osc.frequency.value = freq;

    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(gain, ctx.currentTime + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.connect(gainNode);
    gainNode.connect(master);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration + 0.01);
  }

  private playDeploy() {
    const ctx = this.getCtx();
    const master = this.getMaster();

    // Low rumble
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sawtooth";
    osc1.frequency.setValueAtTime(60, ctx.currentTime);
    osc1.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.5);
    gain1.gain.setValueAtTime(0, ctx.currentTime);
    gain1.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.1);
    gain1.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.3);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
    osc1.connect(gain1);
    gain1.connect(master);
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.85);

    // High sweep
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(200, ctx.currentTime + 0.1);
    osc2.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.5);
    gain2.gain.setValueAtTime(0, ctx.currentTime + 0.1);
    gain2.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.2);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    osc2.connect(gain2);
    gain2.connect(master);
    osc2.start(ctx.currentTime + 0.1);
    osc2.stop(ctx.currentTime + 0.65);
  }

  private playFanfare() {
    const notes = [523, 659, 784, 1047]; // C5 E5 G5 C6
    notes.forEach((freq, i) => {
      setTimeout(() => {
        this.playTone(freq, "sine", 0.12, 0.4);
        if (i < notes.length - 1) {
          this.playTone(freq * 0.5, "triangle", 0.06, 0.3);
        }
      }, i * 150);
    });
  }
}

// Singleton
let engine: SoundEngine | null = null;

function getEngine(): SoundEngine {
  if (!engine) {
    engine = new SoundEngine();
    engine.init();
  }
  return engine;
}

export function useSoundEngine() {
  const engineRef = useRef<SoundEngine>(null);

  if (!engineRef.current) {
    engineRef.current = getEngine();
  }

  const play = useCallback((name: SoundName) => {
    engineRef.current?.play(name);
  }, []);

  const toggle = useCallback(() => {
    const e = engineRef.current;
    if (e) {
      e.setEnabled(!e.isEnabled());
    }
  }, []);

  const isEnabled = useCallback(() => {
    return engineRef.current?.isEnabled() ?? true;
  }, []);

  return { play, toggle, isEnabled };
}
