import type { Profile, Run } from './schemas';

export const sampleProfile: Profile = {
  id: 'louis',
  name: 'Louis',
  age: 31,
  city: 'San Francisco',
  currentActivity: 'Founder and CEO of a seed-stage AI infrastructure startup',
  ambition10y: 'Build a company that outlives me and still be the father who shows up',
  traits: ['ambitious', 'athletic', 'short-tempered'],
  flaw: 'anger',
  fear: 'being forgotten, or remembered only for the company',
  habits: { sport: 8, alcohol: 3, sleep: 4 },
  relatives: [
    {
      id: 'camille',
      name: 'Camille',
      relation: 'partner',
      age: 30,
      relationshipState: 'in love, tired, carrying most of the home',
      grievance: 'He is never fully here, even when he is here',
    },
    {
      id: 'lea',
      name: 'Léa',
      relation: 'child',
      age: 2,
      relationshipState: 'adores him, does not yet know his absences',
      grievance: 'none yet',
    },
    {
      id: 'anne',
      name: 'Anne',
      relation: 'parent',
      age: 62,
      relationshipState: 'proud, worried, calls on Sundays',
      grievance: 'He stopped visiting after his father died',
    },
    {
      id: 'jules',
      name: 'Jules',
      relation: 'cofounder',
      age: 29,
      relationshipState: 'loyal, admiring, slightly afraid of him',
      grievance: 'He took credit for the pivot that Jules designed',
    },
  ],
};

const RUN_ID = 'louis-0001';

export const sampleRun: Run = {
  run_id: RUN_ID,
  profile_id: 'louis',
  seed: 1,
  death_age: 78,
  cause_of_death: 'heart attack',
  ending_cluster: 'admired-alone',
  years: [
    {
      run_id: RUN_ID,
      year_index: 0,
      protagonist_age: 33,
      shock: 'Series A closes; the company triples headcount in six months',
      shock_source: 'destiny',
      decisions: [
        {
          actor: 'louis',
          action: 'Moves the family to a bigger house closer to the office',
          reason: 'Less commute means more time at home, in theory',
        },
        {
          actor: 'louis',
          action: 'Shouts at Jules in front of the team after a failed demo',
          reason: 'Fear of looking weak in front of new investors',
        },
      ],
      relative_states: [
        {
          relative_id: 'camille',
          emotion: { valence: 0.2, arousal: 0.6 },
          relationship_score: 72,
          memory_update: 'The house is beautiful and empty on weeknights',
        },
        {
          relative_id: 'lea',
          emotion: { valence: 0.7, arousal: 0.5 },
          relationship_score: 85,
          memory_update: 'Papa comes home after bedtime',
        },
        {
          relative_id: 'anne',
          emotion: { valence: 0.4, arousal: 0.3 },
          relationship_score: 65,
          memory_update: 'He sent flowers instead of visiting',
        },
        {
          relative_id: 'jules',
          emotion: { valence: -0.4, arousal: 0.8 },
          relationship_score: 55,
          memory_update: 'He humiliated me in front of twenty people',
        },
      ],
      private_messages: [
        {
          from: 'jules',
          to: 'camille',
          text: 'Is he like this at home too? Asking as a friend.',
        },
      ],
    },
    {
      run_id: RUN_ID,
      year_index: 1,
      protagonist_age: 36,
      shock: 'Camille is offered a professorship in Lyon',
      shock_source: 'destiny',
      decisions: [
        {
          actor: 'louis',
          action: 'Asks Camille to turn it down',
          reason: 'The company cannot move and he will not do long distance',
        },
        {
          actor: 'camille',
          action: 'Turns it down, stops mentioning it',
          reason: 'Léa needs one stable parent',
        },
      ],
      relative_states: [
        {
          relative_id: 'camille',
          emotion: { valence: -0.5, arousal: 0.4 },
          relationship_score: 55,
          memory_update: 'I gave up Lyon and he never said thank you',
        },
        {
          relative_id: 'lea',
          emotion: { valence: 0.5, arousal: 0.5 },
          relationship_score: 78,
          memory_update: 'Papa missed the school play but sent a video message',
        },
        {
          relative_id: 'anne',
          emotion: { valence: 0.1, arousal: 0.3 },
          relationship_score: 58,
          memory_update: 'He forgot my birthday for the first time',
        },
        {
          relative_id: 'jules',
          emotion: { valence: 0.1, arousal: 0.5 },
          relationship_score: 60,
          memory_update: 'He apologized, in private, two years late',
        },
      ],
      private_messages: [
        {
          from: 'camille',
          to: 'anne',
          text: 'He is his father. I thought I could change that.',
        },
      ],
    },
    {
      run_id: RUN_ID,
      year_index: 2,
      protagonist_age: 41,
      shock: 'Acquisition offer at 400M; Jules wants to sell, Louis refuses',
      shock_source: 'destiny',
      decisions: [
        {
          actor: 'louis',
          action: 'Refuses the offer and pushes Jules out of the board',
          reason: 'Selling now would prove the doubters right',
        },
        {
          actor: 'jules',
          action: 'Leaves the company, keeps his shares',
          reason: 'Cannot work for someone who does not listen',
        },
      ],
      relative_states: [
        {
          relative_id: 'camille',
          emotion: { valence: -0.6, arousal: 0.5 },
          relationship_score: 42,
          memory_update: 'He chose the company over the only friend who stayed',
        },
        {
          relative_id: 'lea',
          emotion: { valence: -0.2, arousal: 0.6 },
          relationship_score: 60,
          memory_update: 'I heard him yell at Jules on speakerphone. I was 12.',
        },
        {
          relative_id: 'anne',
          emotion: { valence: -0.2, arousal: 0.3 },
          relationship_score: 50,
          memory_update: 'He paid for my new hip and did not come to the hospital',
        },
        {
          relative_id: 'jules',
          emotion: { valence: -0.7, arousal: 0.7 },
          relationship_score: 20,
          memory_update: 'Eleven years. He did not even shake my hand.',
        },
      ],
      private_messages: [
        {
          from: 'jules',
          to: 'lea',
          text: 'Your father is brilliant. Do not let him make you small.',
        },
      ],
    },
    {
      run_id: RUN_ID,
      year_index: 3,
      protagonist_age: 51,
      shock: 'Camille leaves after Léa goes to university',
      shock_source: 'destiny',
      decisions: [
        {
          actor: 'camille',
          action: 'Moves to Lyon, alone, twenty years late',
          reason: 'There is nothing left to stay for',
        },
        {
          actor: 'louis',
          action: 'Takes up marathons and stops drinking',
          reason: 'Discipline is the only language he trusts',
        },
      ],
      relative_states: [
        {
          relative_id: 'camille',
          emotion: { valence: -0.1, arousal: 0.2 },
          relationship_score: 30,
          memory_update: 'I am not angry anymore, which is worse',
        },
        {
          relative_id: 'lea',
          emotion: { valence: -0.5, arousal: 0.5 },
          relationship_score: 40,
          memory_update: 'He called me to talk about the company. Mum had just left.',
        },
        {
          relative_id: 'anne',
          emotion: { valence: -0.3, arousal: 0.2 },
          relationship_score: 48,
          memory_update: 'I am 82 and he still has not forgiven his father',
        },
        {
          relative_id: 'jules',
          emotion: { valence: 0.0, arousal: 0.2 },
          relationship_score: 35,
          memory_update: 'Saw him at a conference. He looked lonely and fit.',
        },
      ],
      private_messages: [
        {
          from: 'lea',
          to: 'camille',
          text: 'I am not going to his place for Christmas. Please do not ask.',
        },
      ],
    },
    {
      run_id: RUN_ID,
      year_index: 4,
      protagonist_age: 66,
      shock: 'The company IPOs; Louis steps down as CEO',
      shock_source: 'destiny',
      decisions: [
        {
          actor: 'louis',
          action: 'Writes Léa a long letter, does not send it',
          reason: 'Fear that she will not answer',
        },
        {
          actor: 'louis',
          action: 'Invites Jules to ring the bell with him',
          reason: 'A public apology is easier than a private one',
        },
      ],
      relative_states: [
        {
          relative_id: 'camille',
          emotion: { valence: 0.1, arousal: 0.1 },
          relationship_score: 35,
          memory_update: 'He sent me the article. I was glad for him, from far away.',
        },
        {
          relative_id: 'lea',
          emotion: { valence: -0.3, arousal: 0.3 },
          relationship_score: 38,
          memory_update: 'He thanked the team on stage. He did not mention us.',
        },
        {
          relative_id: 'anne',
          emotion: { valence: 0.3, arousal: 0.2 },
          relationship_score: 55,
          memory_update: 'My son on the news. His father would have cried.',
        },
        {
          relative_id: 'jules',
          emotion: { valence: 0.6, arousal: 0.6 },
          relationship_score: 65,
          memory_update: 'He said "we" on the podium. Twenty-five years for one word.',
        },
      ],
      private_messages: [
        {
          from: 'jules',
          to: 'louis',
          text: 'Send the letter. Whatever it is, send it.',
        },
      ],
    },
    {
      run_id: RUN_ID,
      year_index: 5,
      protagonist_age: 78,
      shock: 'Heart attack during a morning run in the Presidio',
      shock_source: 'destiny',
      decisions: [
        {
          actor: 'louis',
          action: 'Keeps running alone despite the cardiologist',
          reason: 'Slowing down feels like giving up',
        },
      ],
      relative_states: [
        {
          relative_id: 'camille',
          emotion: { valence: -0.3, arousal: 0.4 },
          relationship_score: 40,
          memory_update: 'I will go. I owe the girl I was that much.',
        },
        {
          relative_id: 'lea',
          emotion: { valence: -0.6, arousal: 0.7 },
          relationship_score: 35,
          memory_update: 'They found the letter in his desk. It was addressed to me.',
        },
        {
          relative_id: 'anne',
          emotion: { valence: -0.9, arousal: 0.5 },
          relationship_score: 60,
          memory_update: 'No mother should bury her son',
        },
        {
          relative_id: 'jules',
          emotion: { valence: -0.4, arousal: 0.4 },
          relationship_score: 70,
          memory_update: 'He finally called me his brother, at the IPO dinner',
        },
      ],
      private_messages: [
        {
          from: 'camille',
          to: 'lea',
          text: 'You do not have to speak. Being there is enough.',
        },
      ],
    },
  ],
  eulogies: [
    {
      run_id: RUN_ID,
      relative_id: 'jules',
      speaks: true,
      sentiment: 0.7,
      text: 'Louis was the hardest man I have ever worked with, and the only one who never once lowered the bar. He built something that will outlive all of us in this room. I spent years angry at him. I would do it all again.',
    },
    {
      run_id: RUN_ID,
      relative_id: 'anne',
      speaks: true,
      sentiment: -0.5,
      text: 'My son was three when he first refused help tying his shoes. He never stopped refusing. I was so proud of him, and I wish I had told him that less, and asked him to come home more.',
    },
    {
      run_id: RUN_ID,
      relative_id: 'camille',
      speaks: true,
      sentiment: 0.1,
      text: 'I loved Louis for twenty years and I left him for twenty-seven. Both were the right decision. He gave me Léa, and a house I never wanted, and a lesson about what I would not accept. I am grateful for two of those.',
    },
    {
      run_id: RUN_ID,
      relative_id: 'lea',
      speaks: false,
      sentiment: -0.7,
      text: '',
    },
  ],
};
