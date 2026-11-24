/**
 * DEMO FIXTURES for the "Connect your conversations" step.
 * Everything here is seeded sample data: the real importer parses WhatsApp / Instagram /
 * iMessage / Snapchat / Gmail exports locally in the browser and derives the same shapes.
 */
import type { Relation } from './store';

export interface Source { id: string; name: string; kind: 'chats' | 'threads'; chats: number; messages: number; span: string; color: string }
export const SOURCES: Source[] = [
  { id: 'whatsapp', name: 'WhatsApp', kind: 'chats', chats: 184, messages: 12431, span: '2019–2026', color: '#5fd37a' },
  { id: 'instagram', name: 'Instagram', kind: 'chats', chats: 96, messages: 8204, span: '2020–2026', color: '#e86aa0' },
  { id: 'imessage', name: 'iMessage', kind: 'chats', chats: 41, messages: 22907, span: '2018–2026', color: '#6fb6ff' },
  { id: 'snapchat', name: 'Snapchat', kind: 'chats', chats: 58, messages: 3118, span: '2021–2026', color: '#f3e35a' },
  { id: 'gmail', name: 'Gmail', kind: 'threads', chats: 1204, messages: 4812, span: '2017–2026', color: '#ef7c6a' },
];
export const TOTAL_MESSAGES = SOURCES.reduce((a, s) => a + s.messages, 0); // 51,472

export interface Person { name: string; relation: Relation; relationLabel: string; age: number; messages: number; youFirst: number; lastReal: string; grievance: string; state: string; monthly: number[] }
const wave = (seed: number, base: number, amp: number, decay = 0) => Array.from({ length: 24 }, (_, i) => { const r = Math.sin(seed * 9.1 + i * 1.7) * 0.5 + Math.sin(seed * 3.3 + i * 0.6) * 0.5; return Math.max(2, Math.round(base * (1 - decay * (i / 23)) + amp * r)); });
export const PEOPLE: Person[] = [
  { name: 'Maman', relation: 'mother', relationLabel: 'mother', age: 52, messages: 6214, youFirst: 18, lastReal: '4 months ago', grievance: 'Dis-moi juste si tu viens à Noël.', state: 'We talk every two weeks. Never about anything real.', monthly: wave(1, 260, 60, 0.35) },
  { name: 'Papa', relation: 'father', relationLabel: 'father', age: 55, messages: 912, youFirst: 11, lastReal: '4 months ago', grievance: 'Tu appelles quand tu as besoin de quelque chose.', state: "Haven't spoken in four months.", monthly: wave(2, 60, 30, 0.8) },
  { name: 'Inès', relation: 'sister', relationLabel: 'sister', age: 16, messages: 3380, youFirst: 22, lastReal: '6 weeks ago', grievance: 'Tu sais même pas en quelle année je suis.', state: 'She texts. He answers two days later.', monthly: wave(3, 150, 50, 0.5) },
  { name: 'Theo', relation: 'cofounder', relationLabel: 'best friend · cofounder', age: 21, messages: 19742, youFirst: 47, lastReal: 'yesterday', grievance: "Tu m'as parlé comme à un stagiaire devant tout le monde.", state: 'Best friend. Has seen him lose his temper more than anyone.', monthly: wave(4, 800, 220, -0.2) },
  { name: 'Camille', relation: 'partner', relationLabel: 'girlfriend', age: 21, messages: 14108, youFirst: 31, lastReal: '3 days ago', grievance: "Je ne demande plus, c'est plus simple.", state: 'Together two years. Sundays are the only real time.', monthly: wave(5, 600, 160, 0.15) },
];

/** Analysis console lines: [delay before line in ms, text, kind]. ~12 s total. */
export type ConsoleLine = [number, string, 'ok' | 'info' | 'warn' | 'bar'];
export const CONSOLE: ConsoleLine[] = [
  [300, '$ eulogy import --local ./exports', 'info'],
  [420, 'parsing whatsapp export (zip) … 184 chats · 12,431 messages', 'ok'],
  [380, 'parsing instagram messages.json … 96 chats · 8,204 messages', 'ok'],
  [260, 'parsing imessage chat.db (sqlite) … 41 chats · 22,907 messages', 'ok'],
  [300, 'parsing snapchat json … 58 chats · 3,118 messages', 'ok'],
  [340, 'parsing gmail mbox … 1,204 threads · 4,812 messages', 'ok'],
  [500, 'normalizing 51,472 messages → 51,472 rows (sender, ts, text, reply_to, reaction)', 'info'],
  [400, 'dedupe cross-source: 1,316 duplicates removed (same text ±90 s)', 'info'],
  [360, 'language detect: fr 71 % · en 29 % · emoji-only 4 %', 'info'],
  [420, 'embedding 50,156 messages · bge-m3 · 1,024-d · batch 256 · WebGPU', 'bar'],
  [300, 'computing per-contact features: volume, reply latency p50, initiative ratio (who writes first), valence (−1..1), last contact', 'info'],
  [380, 'reply latency p50 — you: 6 h 12 m · them: 14 m', 'warn'],
  [300, 'clustering 312 contacts → 5 core · 19 close · 288 periphery (HDBSCAN on features + embeddings)', 'ok'],
  [420, 'extracting grievances: quoting messages with valence < −0.4 addressed to you · 1,117 candidates → 5 kept', 'info'],
  [360, 'writing memory vectors → agents (5) · 4,812 memories · episodic index ready', 'ok'],
  [500, 'done · 5 people · 4,812 memories · 11.8 s', 'ok'],
];
