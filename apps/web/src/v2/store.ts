import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Relation = 'mother' | 'father' | 'sister' | 'brother' | 'partner' | 'friend' | 'cofounder' | 'child' | 'other';
export interface Relative { name: string; age?: number; relation: Relation; state?: string; grievance?: string; messages?: number }
export interface DemoProfile {
  name: string; age: number; city: string; activity: string;
  relatives: Relative[]; flaws: string[]; fear: string;
}
export const JULES: DemoProfile = {
  name: 'Jules', age: 20, city: 'Chicago', activity: 'Computer science and data. Startup weekends. Varsity tennis.',
  relatives: [
    { name: 'Maman', age: 52, relation: 'mother', state: 'We talk every two weeks. Never about anything real.', grievance: 'Dis-moi juste si tu viens à Noël.' },
    { name: 'Inès', age: 16, relation: 'sister', state: 'She texts. He answers two days later.', grievance: 'Tu sais même pas en quelle année je suis.' },
    { name: 'Theo', age: 21, relation: 'cofounder', state: 'Best friend. Has seen him lose his temper more than anyone.', grievance: "Tu m'as parlé comme à un stagiaire devant tout le monde." },
    { name: 'Papa', age: 55, relation: 'father', state: "Haven't spoken in four months.", grievance: 'Tu appelles quand tu as besoin de quelque chose.' },
    { name: 'Camille', age: 21, relation: 'partner', state: 'Together two years. Sundays are the only real time.', grievance: "Je ne demande plus, c'est plus simple." },
  ],
  flaws: ['Loses his temper', 'Apologizes last', 'Big ego'],
  fear: 'Ending up like my father. Respected. Alone.',
};

interface DemoState {
  photo?: string; portraits: string[]; transcript: string; profile: DemoProfile; usedDemo: boolean; connected: boolean;
  setPhoto: (p?: string) => void; setPortraits: (p: string[]) => void; setTranscript: (t: string) => void;
  setProfile: (p: DemoProfile) => void; useDemo: () => void; reset: () => void;
  /** The Connect step found the people: merge them into the profile (fills identity from the demo profile when still empty). */
  setConnected: (relatives: Relative[]) => void;
}
const empty: DemoProfile = { name: '', age: 0, city: '', activity: '', relatives: [], flaws: [], fear: '' };
export const useDemo = create<DemoState>()(
  persist(
    (set) => ({
      photo: undefined, portraits: [], transcript: '', profile: empty, usedDemo: false, connected: false,
      setPhoto: (photo) => set({ photo }),
      setConnected: (relatives) => set((s) => ({ connected: true, profile: { ...(s.profile.name ? s.profile : JULES), relatives } })),
      setPortraits: (portraits) => set({ portraits }),
      setTranscript: (transcript) => set({ transcript }),
      setProfile: (profile) => set({ profile, usedDemo: false }),
      useDemo: () => set({ profile: JULES, usedDemo: true }),
      reset: () => set({ photo: undefined, portraits: [], transcript: '', profile: empty, usedDemo: false, connected: false }),
    }),
    { name: 'eulogy.v2', partialize: (s) => ({ profile: s.profile, transcript: s.transcript, usedDemo: s.usedDemo, connected: s.connected, portraits: s.portraits.filter((p) => p.startsWith('http')) }) },
  ),
);

/** Pick who is "at risk": youngest sibling/child, else first relative. */
export function focusRelative(p: DemoProfile): Relative | undefined {
  const kids = p.relatives.filter((r) => ['sister', 'brother', 'child'].includes(r.relation)).sort((a, b) => (a.age ?? 99) - (b.age ?? 99));
  return kids[0] ?? p.relatives[0];
}
/** Who to call: father, else mother, else the first relative with a tense state, else first. */
export function callRelative(p: DemoProfile): Relative | undefined {
  return p.relatives.find((r) => r.relation === 'father') ?? p.relatives.find((r) => r.relation === 'mother') ?? p.relatives.find((r) => /never|haven|not spoken|don't talk|fight/i.test(r.state ?? '')) ?? p.relatives[0];
}
export function isComplete(p: DemoProfile) { return p.name.length > 0 && p.relatives.length > 0; }
