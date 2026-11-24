# How a life becomes a film

A run starts from a profile, advances six chapters and ends with one farewell per relative. Bruin compares many runs of the same profile. The chapel replays the actual decisions, state and dialogue stored in one selected run. [Simulation loop](../packages/sim/src/simulate.ts) · [Screening loader](../apps/web/src/data/screening.ts)

## Cast and state

| Role | Inputs at chapter one | State carried between chapters | What the role contributes |
|---|---|---|---|
| Protagonist | Age, city, work, traits, flaw, fear, ambition and habits | Wealth from −1 to 1, health from 0 to 1, previous decisions | An action and its reason |
| Each relative | Identity, relationship, age, current relationship and grievance | Relationship score from 0 to 100, valence from −1 to 1, arousal from 0 to 1, a chronological list of memories | An emotional change, a first-person memory and a possible farewell |
| Destiny | Seed, habits, sampled death age and weighted shock catalogue | Chapter index, clock and previous relationship scores | A shock, a consistency veto and the funeral gate |

A single Claude request plays all roles for a chapter. With four relatives, Louis's cast has six characters. The chapter boundary validates that each relative appears exactly once and that addressed dialogue uses the known cast. The state passed into the next request includes the accumulated episodes. An offline run takes the same state through a seeded narrative engine. [Live chapter contract](../packages/sim/src/chapter.ts) · [Cast state](../packages/sim/src/simulate.ts)

## Full runtime system prompt

The application supplies the following exact string as the system message. The user message carries the profile, chapter clock, shock, state, opening action vocabulary and any correction from the preceding attempt. [Prompt source](../packages/sim/src/chapter.ts)

```text
Write an English ensemble film in six chapters. The profile and memories are character material.
Play the Protagonist from their traits, fear, flaw and ambition. Give them a decision and a concrete reason.
Play each Relative independently, remembering their grievance, earlier episodes and last emotional state.
Play Destiny as the director: stage the supplied shock, keep time and consequences coherent, and let the cast disagree.
Return only one JSON object. Its keys are scene (a specific sentence), decisions (an array of {actor,action,reason}),
relative_states (one {relative_id,emotion:{valence,arousal},relationship_score,memory_update} per relative),
private_messages (one or two {from,to,text} addressed to different known cast members),
wealth (-1..1), health (0..1), and, only in chapter six, cause_of_death and farewells.
Valence is -1..1, arousal is 0..1, and relationship_score is 0..100. Never jump more than 50 score points.
Use cast IDs for actors and message addresses. For the first chapter use the given firstChoices for the protagonist's action.
For cause_of_death select one of the supplied causes. Farewells are one {relative_id,text,sentiment} per relative.
Give each witness one or two short first-person sentences in their own voice, ideally 8 to 26 words and never over 60.
Choose one gesture, object or decision from that witness's own recorded history. Keep a telling phrase in their words.
Let what the protagonist did, or failed to do, carry the feeling. Borrow no other witness's memory or family role.
A final score of 55 or higher means the relative speaks. Give everyone else the words they keep to themselves.
Use only the recorded cause at the funeral, without adding circumstances. Sentiment ranges from -1 to 1.
```

## Monte Carlo loop

1. Assign a stable ID from the profile ID and seed. Sample death age around 81 with a Gaussian deviation of six years. High alcohol use subtracts four years, low sleep subtracts three, and frequent sport adds three. Bound the fictional result to the interval from current age + 6 to 96. Each of the first five chapter ages leaves room for the remaining chapters. [Age and shock sampler](../packages/sim/src/shocks.ts)
2. Visit the nominal offsets +2, +5, +10, +20 and +35, then the sampled death age. Draw a weighted shock at each chapter. Telem can supply a source URL, a matching snippet and an updated weight. Without a usable source, the catalogue supplies the weight. [Research and defaults](../packages/sim/src/priors.ts)
3. Ask `claude-sonnet-5-5` for a chapter. The authenticated Vercel Gateway alias is `anthropic/claude-sonnet-5.5`. A request has a 40-second timeout. The model rejects custom temperature, so variability comes from the evolving state, seed-dependent shocks and the model's own sampling. [Transport](../packages/sim/src/chapter.ts) · [Anthropic model reference](https://platform.claude.com/docs/en/models/sonnet-5-5/overview)
4. Validate the response with Zod, then enforce cast coverage, permitted addresses, a protagonist decision, opening action vocabulary, bounded score jumps and final-chapter-only funeral content. A failed attempt is retried once with its validation error. A second failure uses the deterministic chapter. Store `generation` as `claude`, `fallback` or `mock` for each chapter. [Contract tests](../packages/sim/src/chapter-contract.test.ts)
5. Append memories, update emotional and protagonist state, and publish the chapter to any attached room. The CLI can let Destiny announce a veto before the corrected attempt. A configured human observer can approve the funeral. [BAND transport](../packages/sim/src/band.ts)
6. At the funeral, derive eligibility from the final state, retain every farewell and shuffle the speaking order with the run seed. Classify the ending, store the run, and summarize the batch. [Simulation and classification](../packages/sim/src/simulate.ts)

The scheduler permits ten simultaneous lives, with sequential chapters within each life. A standard batch holds up to 50 seeds. The thousand-life runner advances the seed offset across twenty batches. A deterministic replay reproduces the complete archive byte for byte. Model inference can vary on the same seed. [Batch scheduler](../packages/sim/src/generate.ts) · [Ensemble runner](../scripts/ensemble.ts)

## Funeral eligibility and endings

`speaks = final_relationship_score >= 55`. Exactly 55 speaks. At 54.99, the relative remains seated and the private feed carries the unsaid words. Each generated farewell contains text. The model schema limits a farewell to 60 words. The fallback quotes a prior episode. [Funeral tests](../packages/sim/src/chapter-contract.test.ts)

The classifier applies the first matching rule in the order below. Average sentiment refers to the final farewells of speaking relatives.

| Ending | Rule |
|---|---|
| `reconciled` | At least three relatives speak and their average sentiment exceeds 0.3. |
| `estranged` | At most one relative speaks. |
| `admired_not_loved` | A cofounder or friend speaks, while every child and partner stays silent. |
| `mixed` | All remaining combinations. |

The representative run is the first seed in the most frequent cluster. A tie between clusters is resolved alphabetically. The best run ranks reconciled lives first, then uses the mean final relationship score. Either featured life may have the same set of speakers. The chapel continues into other recorded outcomes. [Summary implementation](../packages/sim/src/generate.ts)

## Data contract

| Record | Grain | Important fields |
|---|---|---|
| `Profile` | One starting cast | `id`, biography, traits, habits, one to four `relatives`, optional portrait and bust references |
| `Run` | One seed | `run_id`, `profile_id`, `seed`, `death_age`, `cause_of_death`, `years`, `eulogies`, `ending_cluster` |
| `YearEvent` | One chapter in one run | Index, age, shock and source, generation provenance, decisions, relative states and private messages |
| `RelativeState` | One relative in one chapter | Relative ID, score, valence, arousal and memory update |
| `Eulogy` | One relative at one funeral | Run and relative IDs, eligibility, text and sentiment |
| `RunSummary` | One profile batch | Run count, child/partner percentages, cluster counts, featured IDs and chapter generation counts |

The shared schema enforces the funeral threshold again when a generated run is read. An older run without chapter provenance remains readable. The archive reader, form and API independently validate their input. The server additionally bounds input sizes and separates one visitor's private replay from another's. [Shared schemas](../packages/shared/src/schemas.ts) · [HTTP contracts](../apps/web/api/contracts.ts)

## Bruin and playback

Seven raw tables normalize the run file and profile cast. `stg.eulogies` attaches roles to relative IDs. `stg.outcomes` gives one row per life with a nullable speech flag for each featured role. A missing child produces a null child rate. When a profile has multiple children, any speaking child counts once for that life. [Staging query](../bruin/eulogy/assets/stg_outcomes.sql)

`mart_decision_impact` deduplicates the protagonist's first-chapter action per run and compares exposed and unexposed cohorts within one profile. Each side needs at least three runs. The difference between their speech rates is descriptive. The coverage and constraints of the simulation govern what that comparison can support. [Decision mart](../bruin/eulogy/assets/mart_decision_impact.sql)

The atlas reads the matching profile’s mart or its batch summary. The chapel looks up the chosen run's cast, captions, camera shot, ledger and addressed messages. A private-message transcript retains both addresses while BAND routes mentions to agents. Human members of the room can read room activity. [Browser renderer](../apps/web/src/pages/Chapel.tsx) · [Provider contracts](SPONSOR-CONTRACTS.md)

The local chapel uses eight stock Kokoro voices across Louis’s 30 lives and Jules’s two authored lives. The generator records Destiny’s opening and each speaking witness from the same script as the captions. The 94 spoken passages share 90 MP3s. Playback selects a recording by its performer and exact text. A new line can use the browser’s device voice. Captions carry the line when sound is muted or speech is unavailable. A silent witness stays seated without a voice cue. [Recording lookup](../apps/web/src/data/funeralAudio.ts) · [Playback](../apps/web/src/pages/useFuneralPlayback.ts) · [Audio catalogue](../apps/web/src/data/audio.json)
