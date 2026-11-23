import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { sampleProfile, type Profile } from '@eulogy/shared';

interface ProfileState {
  profile: Profile;
  setProfile: (patch: Partial<Profile>) => void;
  reset: () => void;
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set) => ({
      profile: sampleProfile,
      setProfile: (patch) => set((s) => ({ profile: { ...s.profile, ...patch } })),
      reset: () => set({ profile: sampleProfile }),
    }),
    { name: 'eulogy.profile' },
  ),
);
