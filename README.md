# Leonida Platinum Roadbook v8 — offline GTA VI trophy guide & tracker

[![gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/zesty-pika-87/gta6-trophy-guide-01-v8/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/zesty-pika-87/gta6-trophy-guide-01-v8/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01)

An offline guide and tracker for all **55 Grand Theft Auto VI trophies** on PlayStation 5 (1 platinum, 2 gold, 6 silver, 46 bronze), built for the [gta6-trophy-guide-01 bounty](https://make.fun/bounty/gta6-trophy-guide-01). It runs entirely from its own files — no network, no account, no ads.

## What it does

- **Tracker** — tick trophies off as you earn them; progress saves in the browser (localStorage) and can be **exported to a file and imported back** from the main toolbar. Per-trophy progress counters (0/42, 0/18, 0/100…) track the counted trophies.
- **Filters** — search plus grade, kind (story, activities, collectibles, strangers, money, combat, exploration, robbery, completion), status, and missable-only.
- **Spoiler setting** — with "Hide story spoilers" on, an unearned story trophy shows nothing of itself anywhere in the app: not its name, not its description, not its mission, not its guide. Only "Hidden trophy — covered until earned".
- **Cited guidance** — every trophy's detail panel has "How to get it" in its own words, a structured "Can it be missed?" answer, and a **Sources — per claim** list that names which source backs which fact (name/description/grade → the PlayStation list on Exophase; counts → the PSN trophy targets on PSNProfiles; steps → the named guide). Steps worked out from the official description alone are honestly labelled as own advice, not yet checked in the game. Five trophies whose method no guide has pinned down yet are marked **UNCONFIRMED** instead of inventing one.
- **Roadmap** — three steps to the platinum in about 200 hours (PowerPyx) to 300+ hours (Push Square): story, the 100% checklist, then strangers and cleanup — with the chapter order and the 100% checklist spelled out.
- **Missables** — the one trophy that can truly be missed (Positive Mental Attitude, with its Chapter 1-only first meditation spot) warned about in detail, and every other trophy explained as cannot-be-missed, with the reason.
- **Next up** — the closest unearned trophy by roadmap stage.
- **Small first load** — index.html + one stylesheet + one script; the trophy data loads at runtime from the app's own files.

## Try it

```sh
node serve.ts
# open http://localhost:8080
```

## Sources

Exophase (official list), PSNProfiles (PSN counts), PowerPyx (trophy guide, roadmap, meditation spots, 100% checklist), Push Square (trophy guide, garage prices, WAiNK breakdown), KeenGamer (trophy guide), GTABase / TrueTrophies (cross-checks). Each trophy's panel names the source behind each of its facts.

Unofficial fan guide — not affiliated with Rockstar Games or PlayStation. Trophy names and descriptions are shown as PlayStation publishes them; all guide text is written for this entry.

## License

MIT — see [LICENSE](LICENSE).
