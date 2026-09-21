[![Awesome](https://awesome.re/badge.svg)](https://awesome.re)
<!-- PROJECT_COUNT:START -->
![Projects](https://img.shields.io/badge/projects-441-10b981?style=classic)
<!-- PROJECT_COUNT:END -->
[![Last Update](https://img.shields.io/github/last-commit/daftAI2026/awesome-jev?label=Last%20update&style=classic)](https://github.com/daftAI2026/awesome-jev)
[![Site](https://img.shields.io/badge/site-awesomejev.cc-000?style=classic)](https://awesomejev.cc)

# Awesome JEV

A curated list of **TypeSafe [Jev](https://typesafe.ai/blog/introducing-system-one-models-and-jev)** / **System One** ecosystem projects — official SDKs, agent skills, browser & computer-use demos, MCP connectors, routers, and community awesome-lists — plus high-signal X posts and YouTube explainers. Searchable navigation site mirrors this list.

**Site:** [awesomejev.cc](https://awesomejev.cc) · **Data:** [`data/github.json`](data/github.json) + [`data/youtube.json`](data/youtube.json) · **Posts:** [`data/x.json`](data/x.json)

**Docs:** [Architecture](docs/architecture.md) · [Data model](docs/data-model.md) · [Collector](docs/collector.md) · [Contributing](CONTRIBUTING.md)

## Contents

- [Official SDKs & skills](#official-sdks-skills)
- [Awesome lists](#awesome-lists)
- [Agents, demos & apps](#agents-demos-apps)
- [Browser & computer use](#browser-computer-use)
- [MCP, routers & adapters](#mcp-routers-adapters)
- [Libraries & SDKs](#libraries-sdks)
- [Tools & integrations](#tools-integrations)
- [Research & benchmarks](#research-benchmarks)
- [Site](#site)
- [Automated updates](#automated-updates)
- [Contributing](#contributing)
- [License](#license)

<!-- PROJECTS:START -->
## Official SDKs & skills

- [**skills**](https://github.com/typesafe-ai/skills) - Agent skills for building with TypeSafe's System One API.
- [**system-one-adapter-python**](https://github.com/typesafe-ai/system-one-adapter-python) - Drop-in TypeSafeClient replacement backed by LLM APIs — run System One / Jev-style calls against open models. · Python
- [**typesafe-sdk-js**](https://github.com/typesafe-ai/typesafe-sdk-js) - Official TypeScript/JavaScript SDK for the TypeSafe API \(System One / Jev\). · TypeScript
- [**typesafe-sdk-python**](https://github.com/typesafe-ai/typesafe-sdk-python) - Official Python library for the TypeSafe API \(System One / Jev\). · Python
- [**daggerverse**](https://github.com/typesafe-ai/daggerverse) - Collection of useful Dagger modules for TypeSafe AI / System One workflows. · Python
- [**Overwatch**](https://github.com/typesafe-ai/Overwatch) - TypeSafe AI Overwatch — System One / Jev related tooling from the official org. · Python

## Awesome lists

- [**awesome-jev \(yibie\)**](https://github.com/yibie/awesome-jev) - Curated list of public projects, integrations, and discussions built on Jev — TypeSafe AI's System One model. · Python
- [**awesome-jev-by-typesafe**](https://github.com/Anil-matcha/awesome-jev-by-typesafe) - Evidence-backed use cases, patterns, prompts, and starter code for TypeSafe Jev. · Python
- [**awesome-typesafe-jev**](https://github.com/AbdelStark/awesome-typesafe-jev) - Awesome Jev: a source-backed field guide to TypeSafe's System One model, with SDKs, live demos, agent tools, and independent evaluations. · HTML
- [**awesome-jev-projects**](https://github.com/logicrw/awesome-jev-projects) - Awesome Jev: source-backed open-source ecosystem radar, plain-language project discovery, and automatic GitHub sync · JavaScript
- [**awesome-jev \(AnotiaWang\)**](https://github.com/AnotiaWang/awesome-jev) - Curated list of awesome Jev / TypeSafe System One applications, libraries, and resources.
- [**awesome-typesafe**](https://github.com/AbdelStark/awesome-typesafe) - Curated official resources and community projects for TypeSafe, System One models, and Jev. · CSS
- [**awesome-jev**](https://github.com/hellogumbo/awesome-jev) - A community directory of projects built on Jev, TypeSafe AI's System One model. · JavaScript
- [**awesome-jev**](https://github.com/AppitStudio/awesome-jev) - Curated Jev resources and runnable examples for typed AI decisions. · Python
- [**awesome-jev**](https://github.com/heyjunpenn/awesome-jev) - A verified, community-maintained catalog of 503 open-source projects built with Jev. · TypeScript
- [**awesome-jev**](https://github.com/oxwen11/awesome-jev) - A curated list of what people built with Jev
- [**awesome-jev**](https://github.com/99hansling/awesome-jev) - awesome-jev: TypeSafe Jev ecosystem repository.
- [**awesome-jev**](https://github.com/cobanov/awesome-jev) - A curated, source-backed list of projects built with Jev, TypeSafe AI's System One model for typed decisions.

## Browser & computer use

- [**jev-ultrafast**](https://github.com/browser-use/jev-ultrafast) - Browser Use × Jev Ultrafast — high-speed browser automation powered by TypeSafe Jev. i. am. speed. · Python
- [**typesafe-computer-use**](https://github.com/awlevin/typesafe-computer-use) - Computer use for about $0.0002 a step: OCR the screen, classify the next action with TypeSafe, click \(macOS\). · Python
- [**jev-browser-use**](https://github.com/wy-coliney/jev-browser-use) - 5–10x faster browser operations: Jev clicks, Codex thinks and verifies. · JavaScript
- [**jev-browser**](https://github.com/jkudish/jev-browser) - Browser use using TypeSafe's Jev model. · TypeScript
- [**jev-browser**](https://github.com/Ying-Kai-Liao/jev-browser) - Browser automation where an LLM plans and Jev \(Typesafe System One\) decides. Library, CLI and MCP server. · JavaScript
- [**jev-ego**](https://github.com/romaluev/jev-ego) - Fast browser agent for ego lite. One TypeSafe request per step; an agent or Jev picks the move. · TypeScript
- [**jev-browser**](https://github.com/tontoko/jev-browser) - One grounded Jev/Playwright core: typed SDK, persistent CLI, and MCP server with native browser operations and deterministic assertions. · JavaScript
- [**jev-frontend-qa**](https://github.com/Nainish-Rai/jev-frontend-qa) - Evidence-driven frontend QA built on Jev Ultrafast and Browser Harness, with a synthetic todo demo. · Python
- [**fastbrowse**](https://github.com/agent-labs-dev/fastbrowse) - A fast browser agent: Jev picks each action from what is on the page, an LLM reads and plans, and every claim in an answer cites a quote from the page. · Python
- [**jev-browser-pilot**](https://github.com/aidil2105/jev-browser-pilot) - A bounded decision layer for browser and desktop automation: a decision-only model picks one next step; the code owns perception, content, actuation and verification. \(TypeSafe Jev / System One\). · Python
- [**jev-orb**](https://github.com/bottlebrushes/jev-orb) - Siri-style push-to-talk voice orb for autonomous browser control with Jev and Metal Whisper · Makefile
- [**jev-play-ping-pong**](https://github.com/Icohen007/jev-play-ping-pong) - Jev plays browser table tennis in real time: structured telemetry, typed decisions, ordinary Chrome inputs, and auditable evidence. · JavaScript
- [**jev-browser**](https://github.com/KesavanKing/jev-browser) - Local browser automation UI that uses TypeSafe Jev to choose bounded page actions and a text model only for field values. · Python
- [**jevarena**](https://github.com/raihankhan-rk/jevarena) - JevArena — two Jev agents duel in click-only browser games \(Browser Use + TypeSafe Jev\) · TypeScript

## MCP, routers & adapters

- [**jev-router**](https://github.com/gargpratyush/jev-router) - Route to the cheapest model in Claude Code for your task using jev-router. · JavaScript
- [**jev-mcp**](https://github.com/jkudish/jev-mcp) - Proof of concept MCP for TypeSafe's Jev AI model. · TypeScript
- [**skillbox**](https://github.com/kitze/skillbox) - Self-hosted, versioned skills library for AI agents — MCP, scoped clients, optional Jev recommendations. · TypeScript
- [**typesafe-mcp**](https://github.com/itsmostafa/typesafe-mcp) - MCP connector giving AI agents direct access to TypeSafe AI's Jev model. · Go
- [**jev-review \(MCP\)**](https://github.com/NiazMorshed2007/jev-review) - Local-first MCP plugin for continuous software-quality review by AI coding agents, powered by Jev. · TypeScript
- [**jev-codex-router**](https://github.com/0xNatoshi/jev-codex-router) - Per-turn model &amp; reasoning routing for Codex, driven by Jev \(TypeSafe System One\): picks the model, thinking depth and speed mode for every turn. · Python
- [**Jevbridge**](https://github.com/gamesonrblx/Jevbridge) - ACP and MCP adapter that bridges TypeSafe Jev with any LLM — computer use and typed decisions alongside Codex, Claude, Grok, and OpenCode. · TypeScript
- [**jev-shield**](https://github.com/caiovicentino/jev-shield) - Semantic MCP firewall powered by Jev — screens every tool call, tool result, and tool description with calibrated System One verification. 94% block recall, 0 false positives, ~$0.00002/check. · JavaScript
- [**jevwire**](https://github.com/Brainwires/jevwire) - Jev decision layer for agents: MCP server, embeddable DecisionModel library, and an escalate-only Claude Code plugin \(TypeSafe AI's Jev\) · TypeScript
- [**AskJev-MCP**](https://github.com/cbruyndoncx/AskJev-MCP) - MCP server for TypeSafe's System One API \(Jev\): typed choice/noul/score judgments with calibrated probabilities and confidence · JavaScript
- [**pi-jev-router**](https://github.com/gloridifice/pi-jev-router) - Jev model integration for pi coding agent. · TypeScript
- [**hiep-paseo-plugin**](https://github.com/HiepPP/hiep-paseo-plugin) - Local Paseo plugin exposing Jev evaluations through MCP · JavaScript
- [**omp-jev-compaction**](https://github.com/jerryfane/omp-jev-compaction) - Verbatim Jev-scored context reduction for omp, over TypeSafe or OpenRouter · TypeScript
- [**frost**](https://github.com/marcus/frost) - A flexible and configurable CLI model router using TypeSafe Jev. · Go
- [**jev-plugins**](https://github.com/Pinutss/jev-plugins) - Cursor and Hermes marketplace for the four published JEV Labs routers.
- [**jev-flash-router**](https://github.com/Ravinder82/jev-flash-router) - open-sourced jev-flash-router: an MCP server for TypeSafe's new Jev model.  AI coding agents waste hundreds of reasoning tokens just deciding which file to edit, which route to pick, or whether a diff breaks tests.  Jev evaluates state and outputs calibrated probabilities.  Works · TypeScript

## Research & benchmarks

- [**jev-benchmarks**](https://github.com/AbdelStark/jev-benchmarks) - Probability-aware evaluation for typed decision models: calibration, selective risk, latency, and reproducible benchmarks. · Python
- [**openvons**](https://github.com/genai-craft/openvons) - openvons \(open-Jev\): 有限選択肢に確率で答える判断層 — テキスト / 画像 / 日本語音声コマンド · Python
- [**calibre**](https://github.com/FirasSX914/Janus) - Measure when to use Jev and other models on your data, then route accordingly. · Python
- [**jev-samples**](https://github.com/aarora79/jev-samples) - Runnable samples for Jev, TypeSafe AI's System One model. Send state and questions carrying their own answer options, then branch on the typed value that comes back.
- [**system-one-gemma**](https://github.com/akash-kamat/system-one-gemma) - Open-source Jev-style System One decision model. Gemma 3 270M with a scoring head — fast, calibrated decisions in a single forward pass. No text generation. Inspired by TypeSafe.ai's Jev. · Python
- [**jev-deferred-crispification**](https://github.com/dnakhoa/jev-deferred-crispification) - Position paper: the Hidden-Markov and fuzzy primitives missing from TypeSafe AI's Jev and System-One decision models. Two lemmas, one principle \(Deferred Crispification\), one architecture \(BSF-S1\). · TeX
- [**jev-report**](https://github.com/HackSing/jev-report) - 发明 RLHF 的人，这次做了个不会说话的模型：Jev 独立研究报告。52 页 PDF + 50 条中文实测复现包 + 143 条可回溯数据表 · Python

## Libraries & SDKs

- [**typesafe-sdk-go**](https://github.com/captain-corgi/typesafe-sdk-go) - Community TypeSafe SDK in Golang · Go
- [**typesafe-ai-rs**](https://github.com/gilljon/typesafe-ai-rs) - Independent async and blocking Rust SDK for the TypeSafe AI System One API · Rust
- [**typesafe-sdk-dotnet**](https://github.com/hardkoded/typesafe-sdk-dotnet) - Unofficial .NET port of the TypeSafe AI client SDK \(typed questions &amp; answers\) · C#
- [**typesafe-sdk-swift**](https://github.com/InsaneArts/typesafe-sdk-swift) - Swift SDK for TypeSafe AI · Swift
- [**jev.aitools.fyi**](https://github.com/imrishit98/jev.aitools.fyi) - Jev is all the rage right now and this directory lists all things Jev\! Docs, SDKs, and the full tool map one click away. · TypeScript
- [**typesafe-sdk**](https://github.com/typesafe-sdk-csharp/typesafe-sdk) - GitHub project related to TypeSafe AI / Jev: typesafe-sdk-csharp/typesafe-sdk · C#
- [**typesafe-sdk-ruby**](https://github.com/afurm/typesafe-sdk-ruby) - Unofficial Ruby SDK for the TypeSafe AI API \(Jev model\) - typed questions, retries, and typed errors. Community port of typesafe-sdk-js. · Ruby
- [**typesafe-sdk-go**](https://github.com/guchengod/typesafe-sdk-go) - Go SDK for TypeSafe AI — classification and rating primitives over text and JSON · Go
- [**typesafe-client**](https://github.com/JedimEmO/typesafe-client) - Unofficial typed async Rust client for the TypeSafe System One API · Rust
- [**typesafe\_sdk**](https://github.com/nshkrdotcom/typesafe_sdk) - An idiomatic, type-safe Elixir port of the official TypeScript AI SDK \(ai / ai-sdk\) providing unified LLM integrations, streaming text and structured outputs, tool calling, and agentic workflows. Jev is their current flagship model and is the first System One model. · Elixir
- [**s1-rs**](https://github.com/AbdelStark/s1-rs) - Typed System One layer for Rust \(Choice/Score/Noul\). · Rust
- [**typesafe-sdk-swift**](https://github.com/above-the-fold/typesafe-sdk-swift) - The unofficial Swift library for the TypeSafe API
- [**jev**](https://github.com/anilsenay/jev) - Unofficial Go client for TypeSafe's System One API  and its model, Jev. · Go
- [**typesafe-sdk**](https://github.com/binnash/typesafe-sdk) - PHP &amp; Laravel SDK for TypeSafe AI's JEV Model series · PHP
- [**typesafeai-sdk-rust-community**](https://github.com/community-ports/typesafeai-sdk-rust-community) - Community-built Rust SDK for the TypeSafe AI API \(System One / Jev\). A port of typesafe-sdk-python · Rust
- [**typesafe-sdk-java**](https://github.com/csabika98/typesafe-sdk-java) - This is an unofficial community port and is not supported by TypeSafe. · Java
- [**typesafe-sdk-php**](https://github.com/Fox-Islam/typesafe-sdk-php) - Unofficial PHP library for the TypeSafe API · PHP
- [**typesafe-sdk-golang**](https://github.com/ginovva320/typesafe-sdk-golang) - GitHub project related to TypeSafe AI / Jev: ginovva320/typesafe-sdk-golang · Go
- [**typesafe-sdk-rust**](https://github.com/Ketankhunti/typesafe-sdk-rust) - GitHub project related to TypeSafe AI / Jev: Ketankhunti/typesafe-sdk-rust · Rust
- [**typesafe-sdk-4d**](https://github.com/mesopelagique/typesafe-sdk-4d) - GitHub project related to TypeSafe AI / Jev: mesopelagique/typesafe-sdk-4d · 4D
- [**typesafe-sdk-go**](https://github.com/nangcr/typesafe-sdk-go) - GitHub project related to TypeSafe AI / Jev: nangcr/typesafe-sdk-go · Go
- [**typesafe-sdk-go**](https://github.com/PinableAgents/typesafe-sdk-go) - TypeSafe Go SDK · Go
- [**jev-laya-free**](https://github.com/Sharkelot/jev-laya-free) - Free local Jev-compatible typed decisions backed by rules or Laya, with a TypeSafe SDK-compatible Python surface and deterministic Hermes/Qwen guards. · Python
- [**typesafe-sdk-elixir**](https://github.com/Studio-Sasquatch/typesafe-sdk-elixir) - An unofficial SDK for TypeSafe AI
- [**typesafe\_ai**](https://github.com/typesend/typesafe_ai) - Typed Elixir client for TypeSafe AI and its Jev System One model, with offline test stubs, concurrent fan-out, and atom-keyed answers. · Elixir
- [**typesafe-sdk-go**](https://github.com/valksor/typesafe-sdk-go) - Unofficial Go SDK for the TypeSafe AI System One API — 1:1 parity with the official JS and Python SDKs. Not affiliated with TypeSafe AI. · Go
- [**typesafe-sdk-php**](https://github.com/valksor/typesafe-sdk-php) - Unofficial PHP SDK for the TypeSafe AI System One API — 1:1 parity with the official JS and Python SDKs. Not affiliated with TypeSafe AI. · PHP
- [**typesafe-go**](https://github.com/zhirschtritt/typesafe-go) - Idiomatic Go SDK for the TypeSafe AI API · Go

## Agents, demos & apps

- [**jev-trader**](https://github.com/jarrodwatts/jev-trader) - One AI trade decision every Monad block — Jev on Kuru MON-USDC. · TypeScript
- [**openjev**](https://github.com/TheoLeeCJ/openjev) - Can we run something like Jev on a 3090 at home? Open / local System One–style experiments. · Python
- [**jevlike**](https://github.com/vinnylarouge/jevlike) - Community Jev-like model and tooling experiment inspired by TypeSafe System One. · Python
- [**jev-review**](https://github.com/devagrawal09/jev-review) - Staged code-review workflow and local dashboard built with TypeSafe Jev. · TypeScript
- [**foreman**](https://github.com/thruwire/foreman) - Software Factory Foreman based on TypeSafe Jev model. · Python
- [**typesafe-mario**](https://github.com/fhshaik/typesafe-mario) - A TypeSafe/Jev agent that plays Super Mario Bros. from structured emulator state. · Python
- [**pi-jev**](https://github.com/y0usaf/pi-jev) - TypeSafe Jev as a decision layer for the Pi coding agent: a measured tool-call gate plus jev\_ask for typed, calibrated answers · TypeScript
- [**pi-warden**](https://github.com/DevMortimer/pi-warden) - Guardrails for Pi built on pi-typesafe that steer the agent instead of interrupting you: Jev judges irreversible and off-task tool calls, detects stuck loops, checks unverified done claims, flags slop · TypeScript
- [**jev-drone**](https://github.com/RomanSlack/jev-drone) - Camera-only autonomous drone in MuJoCo with a small judgment model \(TypeSafe Jev\) in the loop at 2.5Hz · Python
- [**skillranker**](https://github.com/Dicklesworthstone/skillranker) - Rust CLI powered by Jev from TypeSafe.ai that ranks agent skills for the next step using live session context. Includes Claude Code hooks, structured JSON, abstention, and local feedback. Requires a TypeSafe API key. · Rust
- [**winnow**](https://github.com/GhalebDweikat/winnow) - A calibrated context sieve for Claude Code: every tool result is judged by a System One model before it enters context. · Python
- [**ask-jev-skill**](https://github.com/shantanugoel/ask-jev-skill) - Skill for Hermes, and other agents, to ask typesafe's jev · Python
- [**pi-jev**](https://github.com/TheoOliveira/pi-jev) - Semantic tool routing and typed System One decisions for the Pi coding agent using TypeSafe Jev · TypeScript
- [**pi-jev-auto-mode**](https://github.com/jomatsu/pi-jev-auto-mode) - Jev \(TypeSafe System One\) backed auto mode for the Pi coding agent: semantically auto-approves bash, write, and edit tool calls and fails closed when a decision cannot be made. · TypeScript
- [**typesafe-snake**](https://github.com/sorrycc/typesafe-snake) - Snake auto-played by TypeSafe's Jev model: one System One choice per tick, legal moves and facts generated in code · TypeScript
- [**jev-guard**](https://github.com/leepokai/jev-guard) - Auto mode for every coding agent, built on Jev: risk-scores every tool call with session context \(deny / ask / allow\), flags prompt injection in results, checks skills and plugins. Claude Code, Codex, Copilot, Gemini, Cursor, pi, OpenCode, ACP. · JavaScript
- [**jev-axi**](https://github.com/shiftynick/jev-axi) - Agent-ergonomic CLI for TypeSafe's Jev: fast calibrated judgments \(pick, rate, check, rank, triage, guard\) from the shell · TypeScript
- [**jev-studio**](https://github.com/utk2103/jev-studio) - if you're experimenting with jev it will be easier from here · Python
- [**jev-agent-skill-router**](https://github.com/GodsBoy/jev-agent-skill-router) - Typed, confidence-aware agent skill routing with TypeSafe Jev. · Python
- [**jevfire**](https://github.com/kikoncuo/jevfire) - JEV-inspired parallel decisions for CUDA LLMs. One context, many decisions. vLLM API, game-agent examples, and reproducible benchmarks. · JavaScript
- [**typesafe-skill-router**](https://github.com/DECRUX9812/typesafe-skill-router) - TypeSafe \(Jev\) skill routing for Hermes Agent: names the one skill worth loading, before the model call. Opt-in, stdlib only, ~$0.001 per routed turn. · Python
- [**heist-one**](https://github.com/AbdelStark/heist-one) - Observable browser stealth game: Jev makes typed guard judgments while deterministic code owns the world. · TypeScript
- [**jev-mcp**](https://github.com/rashedInt32/jev-mcp) - MCP server exposing TypeSafe Jev as typed, calibrated judgment tools: classify, score, check, batched ask. Ships as a Claude Code plugin. · TypeScript
- [**jev-skillful**](https://github.com/bestagentkits/jev-skillful) - Per-prompt capability router for coding agents: resolves installed skills, MCP servers, agents and commands against your prompt via TypeSafe Jev, and measures whether the injection actually helps. · TypeScript
- [**tenet**](https://github.com/zoidsh/tenet) - The review gate for code that agents write: rules in plain language, judged on every commit \(TypeSafe Jev community\). · Go
- [**jev-uipath-coded-agent**](https://github.com/1aifanatic/jev-uipath-coded-agent) - FINS demo: a UiPath coded agent for AML alert triage where every decision is made by TypeSafe's Jev model \(Noul/Score/Choice\) instead of an LLM · Python
- [**tidy**](https://github.com/abhibansal60/tidy) - Keeps your YouTube subscriptions current: Jev judges, code sets the limits, you approve. Watch-history discovery, gated actions, API only. · Python
- [**river-run-typesafe**](https://github.com/ashaazami/river-run-typesafe) - River shooter game in Python, inspired by Atari's River Raid, played by a TypeSafe AI pilot · Python
- [**jev-projects**](https://github.com/az9713/jev-projects) - Small demos of Jev \(TypeSafe\) through the Vercel AI Gateway: wiki race, town of agents, bullet chess, and more · JavaScript
- [**jev-demo**](https://github.com/co1smos/jev-demo) - Historical paper-trading simulator for evaluating TypeSafe AI JEV decisions · Python
- [**jev-mobile**](https://github.com/Friedjof/jev-mobile) - Fast structured Android control loops with TypeSafe Jev and Mobile MCP · Python
- [**stepwarden**](https://github.com/getexcited/stepwarden) - Every tool call your agent makes, checked before it runs. A Claude Code plugin that uses TypeSafe AI's Jev to verify each pending tool call against the session plan, then allows it, asks you, or blocks it. Proof of concept · TypeScript
- [**jevkeep**](https://github.com/hatt-io/jevkeep) - Codex plugin that preserves useful conversation excerpts alongside the summary after context compaction. \(TypeSafe Jev / System One\). · TypeScript
- [**pi-jev**](https://github.com/iefnaf/pi-jev) - Pi extension suite powered by Jev: selective context compaction and model routing · TypeScript
- [**jev-cli**](https://github.com/lhotwll217/jev-cli) - JSON-in, typed-decisions-out CLI for the TypeSafe System One API · TypeScript
- [**f1**](https://github.com/MartinPuli/f1) - JEV Prix: five AI drivers, unknown procedural circuits, Formula-inspired racing, BYOK Jev and saved replays. · JavaScript
- [**jev-atari-lab**](https://github.com/memorysaver/jev-atari-lab) - Challenge Atari with Jev: structured decisions, value questions, and replayable experiments · Python
- [**limpet**](https://github.com/noplan-inc/limpet) - A Stop hook that stops your coding agent from stopping too early. Plain-language rules, judged by jev. · Python
- [**jev-compaction**](https://github.com/picaye/jev-compaction) - Context compaction for Hermes sessions: every tool call scored by TypeSafe Jev; stale calls dropped, kept context stays verbatim. · JavaScript
- [**pi-fast-jev-compaction**](https://github.com/QuentinDanblon/pi-fast-jev-compaction) - Verbatim context pruning for the pi coding agent, scored by TypeSafe Jev: stale tool calls and results are dropped or truncated, everything kept stays verbatim. · TypeScript
- [**JevArena**](https://github.com/rolki-png/JevArena) - Two Jev agents duel at Snake via Vercel AI Gateway. · TypeScript
- [**Jev-Studio**](https://github.com/SwiftFaze/Jev-Studio) - GitHub project related to TypeSafe AI / Jev: SwiftFaze/Jev-Studio · JavaScript
- [**siege**](https://github.com/vnmoorthy/siege) - SIEGE: 200 people vs one agent. A typed action gate \(TypeSafe System One\) that learns from every breach, evaluated by W&amp;B Weave, hardened by a defender loop. Built at CoreWeave Hacks: Agent Loops 2026. · TypeScript
- [**jev-demo-rag**](https://github.com/Zafer-Liu/jev-demo-rag) - RAG quality gate adapted for TypeSafe Jev - relevance filtering + document injection detection, fan-out in one call · HTML
- [**jev-plays-pokemon**](https://github.com/zbloss/jev-plays-pokemon) - Like Claude Plays Pokemon, but with Jev · Python
- [**agent-handoff-gate**](https://github.com/zsoXi/agent-handoff-gate) - An experimental protocol for evidence-aware agent handoffs, bounded worker continuation, and TypeSafe/Jev-assisted review, with reproducible evaluation. · Python

## Tools & integrations

- [**pg-jev**](https://github.com/realZachi/pg-jev) - Ask your Postgres tables questions in plain language. A PostgreSQL extension powered by TypeSafe's Jev. · Shell
- [**decider**](https://github.com/Mapika/decider) - One-pass typed decisions with calibrated probabilities \(System One style model\), fine-tuned from Qwen3.5-2B · Python
- [**unclutter**](https://github.com/kitze/unclutter) - WXT browser extension: Jev-powered page clutter removal with reusable template rules. · TypeScript
- [**building-with-jev-skill**](https://github.com/dbreunig/building-with-jev-skill) - A skill for writing and improving programs that call Jev, TypeSafe's System One model
- [**advocaat**](https://github.com/pithings/advocaat) - A small, type-safe client for asking AI questions about your data, powered by TypeSafe Jev. · TypeScript
- [**pg\_typesafe**](https://github.com/giuliosmall/pg_typesafe) - Pre-alpha PostgreSQL extension for TypeSafe AI \(Jev\) categorical classification · C
- [**jevmeter**](https://github.com/ChetasLua/jevmeter) - Put a live Jev \(TypeSafe\) meter on any video: every sentence scored, rendered as a 16:9 edit · Python
- [**neo4jev**](https://github.com/jexp/neo4jev) - Typesafe.ai System One Model Jev navigating a Neo4j graph by using a classifier over neighbouring relationships · Jupyter Notebook
- [**typesafe-adblock**](https://github.com/realZachi/typesafe-adblock) - 🧹 Fun project: a Chrome extension that asks a tiny AI decision model \(TypeSafe Jev\) "is this DOM element an ad?" and pops it off the page. BYOK, no backend, not a real ad blocker. · JavaScript
- [**killmyidea**](https://github.com/monteduro/killmyidea) - Describe your startup idea. Jev decides: kill it, fix it or ship it. · TypeScript
- [**jevmlx**](https://github.com/bnsd55/jevmlx) - Jev-style parallel constrained decisions for any MLX model on Apple Silicon. Typed, schema-valid JSON in one forward pass. · Python
- [**blink**](https://github.com/ellipsis-dev/blink) - Codebase search powered by Jev from @typesafe-ai · TypeScript
- [**HA-Jev**](https://github.com/AboveColin/HA-Jev) - Home Assistant integration for TypeSafe Jev. Ask a question about your house and get a probability, a choice or a score as an entity. · Python
- [**typesafe-ai-benchmark**](https://github.com/iammrduncan/typesafe-ai-benchmark) - This is a LLM Gateway that mimics typesafe ai structured output. Like an imposter Jev. · TypeScript
- [**commit-miner**](https://github.com/devanshbatham/commit-miner) - Classify Git commit diffs and messages with Jev. Bug fixes, security fixes/CWEs, and change types. · Rust
- [**openjev**](https://github.com/zhihz/openjev) - Local bilingual probability decisions from context, questions, and candidate answers. Independent research preview inspired by TypeSafe Jev. · Python
- [**system-one-open**](https://github.com/mithalouni/system-one-open) - Open replica of TypeSafe's Jev: typed calibrated decisions in one forward pass, on Gemma 4 E2B / Gemma 3 270M \(Modal\) · Python
- [**jev-on-a-laptop**](https://github.com/rorshopping/jev-on-a-laptop) - Unofficial study: Jev-style parallel typed decisions on stock 1.5B-8B models on an Apple Silicon laptop. Benchmarks, research notes, and a Hugging Face Space demo. · Python
- [**semdecide**](https://github.com/sharziki/semdecide) - Typed semantic decisions for Unix pipelines and CI, powered by TypeSafe AI Jev. · Python
- [**open-jev**](https://github.com/JoshuaSP/open-jev) - Typed JSON inference with DiffusionGemma, with Every and Jev benchmark results · Python
- [**tsai-sc**](https://github.com/phyous/tsai-sc) - TypeSafe Jev controls original StarCraft shareware through keyboard and mouse with recorded action probabilities. · Python
- [**ruby\_llm-typesafe**](https://github.com/kieranklaassen/ruby_llm-typesafe) - TypeSafe structured-output provider for RubyLLM 2 · Ruby
- [**jev-radar**](https://github.com/everyinfra/jev-radar) - 📡 全网最全 · The world's most comprehensive tracker of the Jev \(TypeSafe AI System One\) ecosystem — 220+ documented cases · 108 confidence-graded entries · verified &amp; rescanned every 3 hours · API access guide included
- [**jev-mcp**](https://github.com/blakestone-x/jev-mcp) - MCP server for TypeSafe Jev: typed classify, score, check, match and screen for any agent, with confidence on every answer · Python
- [**Jev\_apps**](https://github.com/JackZeng/Jev_apps) - 看看 Jev 能做什么：用中英文讲清热门应用、工作原理和各自优缺点。Explore Jev apps with plain-language examples, explanations, and comparisons. · Python
- [**OneVOneJev**](https://github.com/emrickgarrett/OneVOneJev) - 1v1 Jev quickscope arena — Three.js + TypeSafe System One · TypeScript
- [**jevbetter**](https://github.com/olanotolu/jevbetter) - A stronger one-pass scorer over a variable list of text options. Hashed n-gram encoder, rival-aware attention, gated head, temperature scaling — with a head-to-head benchmark vs the jevlike starter design. · Python
- [**jev-me**](https://github.com/jon-devlapaz/jev-me) - jev-me is grill-me with jev
- [**jev\_stock**](https://github.com/sosopop/jev_stock) - An experimental JEV-powered framework for forecasting short-term stock price direction from structured market data. · Python
- [**JevLint**](https://github.com/huntedman/JevLint) - Configurable semantic linting powered by Jev, with file-level NOUL judgments and a magic-strings plugin. · TypeScript
- [**typesafe-ai**](https://github.com/Twister915/typesafe-ai) - Typed TypeSafe AI clients for Rust, with async and blocking backends and observable retries. · Rust
- [**pi-quiet-ask**](https://github.com/HyunjunJeon/pi-quiet-ask) - TypeSafe Jev as the pi coding agent's quiet decision layer · TypeScript
- [**pi-jev-router**](https://github.com/mejiasd3v/pi-jev-router) - Automatic model routing for Pi using TypeSafe's Jev through Vercel AI Gateway · JavaScript
- [**jevlogs**](https://github.com/reachjalil/jevlogs) - Open-source Jev log triage for OpenTelemetry. Score the signal before expensive LLM analysis. · TypeScript
- [**jeval**](https://github.com/rlaope/jeval) - Measures what your Jev classifier's confidence is really worth, and sets the human hand-off line from what a mistake costs. · Python
- [**super-jev**](https://github.com/Kevthetech143/super-jev) - A small, extensible decision-to-action harness for TypeSafe Jev · Python
- [**jev-doom-agent**](https://github.com/lukaske/jev-doom-agent) - A browser-native Doom agent experiment with structured spatial state, composable AI controls, live decision telemetry, and a Chocolate Doom WebAssembly runtime. · TypeScript
- [**jev-router**](https://github.com/prismhq/jev-router) - Open-source LLM router that uses TypeSafe's Jev to pick a model, on top of LiteLLM · Python
- [**Open-Jev**](https://github.com/Zefan-Cai/Open-Jev) - Open-Jev — Jev / TypeSafe related project · Python
- [**typesafe-ai-playground**](https://github.com/BunsDev/typesafe-ai-playground) - Community TypeSafe AI playground: 110 use cases, games, dilemmas and model challenges, with editable prompts, A/B comparisons and a mobile-friendly UI. · TypeScript
- [**jev-ultrafast-mcp**](https://github.com/jiawei686/jev-ultrafast-mcp) - Hand the browser work off: an MCP server where a decision model drives the page for your agent, so a flow costs one tool call instead of a turn per click. Ref-based element tables, code-checked assertions, zero-model macro replay. Speaks CDP to your Chrome. · Python
- [**typesafe-sdk**](https://github.com/joshmn/typesafe-sdk) - Ruby client for typesafe.ai · Ruby
- [**jev-korean-benchmark**](https://github.com/mahlernim/jev-korean-benchmark) - Reproducible early-access evaluation of Jev on Korean understanding and medical text, with runtime and cost evidence · Python
- [**typesafe-dotnet-sdk**](https://github.com/saibimajdi/typesafeai-dotnet-sdk) - Community .NET SDK for the TypeSafe AI System One API — typed noul, choice, and score questions with structured, confidence-scored answers. Not affiliated with TypeSafe AI. · C#
- [**Augustus**](https://github.com/24601/Augustus) - Agent skill: design judgment-assisted systems with TypeSafe Jev \(System One\). Maps Choice/Score/Noul onto decision theory, reranking, and routing. Composition algebra, question design, validation gates. MIT. · Python
- [**a0-typesafe-ai**](https://github.com/3clyp50/a0-typesafe-ai) - TypeSafe AI Jev judgments for Agent Zero, with typed tools and probability cards. · Python
- [**jev-rerank-bench**](https://github.com/anessbelbati/jev-rerank-bench) - Can a decision model beat dedicated rerankers? TypeSafe Jev vs Cohere Rerank 4 vs ZeroEntropy zerank-2 vs a chat-model baseline: 14 datasets, every raw API response, bootstrap ranges on every gap. · Python
- [**jev-little-airways**](https://github.com/lbotinelly/jev-little-airways) - A show-and-tell capability study for Jev, TypeSafe's System One decision model. · HTML
- [**ai-elo-ranker**](https://github.com/opaielsheikh/ai-elo-ranker) - High-speed recursive AI Elo tournament engine powered by Jev and Swiss matchmaking · Python
- [**twitter-jev-guard**](https://github.com/qs-lll/twitter-jev-guard) - 使用 TypeSafe Jev 在 X/Twitter 时间线上识别低质量、垃圾和广告帖子，并在文字区域显示醒目的半透明水印。 · JavaScript
- [**every**](https://github.com/sufianetaouil/every) - Ask a yes/no question of every function in a codebase. Ranked answers in seconds, for cents. Grep whose pattern is a question, powered by TypeSafe Jev. · Python
- [**jev-benchmark**](https://github.com/wondertwins/jev-benchmark) - Benchmarks and a playground for TypeSafe's Jev \(System One\) model: chess, and who-is-the-player-talking-to for speech-to-text game NPCs · Python
- [**jev-lm**](https://github.com/y0usaf/jev-lm) - A word-level language model whose output layer is Jev: n-gram drafter, Noul chunk verification, bits-per-token eval · TypeScript
- [**bicameral**](https://github.com/AbdelStark/bicameral) - Hybrid coding harness: System 2 writes, System 1 \(Jev\) runs reflexes. · TypeScript
- [**typesafe-on-neon**](https://github.com/andrelandgraf/safer-with-jev) - Neon Function proxy for the Neon AI Gateway with TypeSafe Jev routing. · TypeScript
- [**jev\_antispam\_bot**](https://github.com/backmeupplz/jev_antispam_bot) - Minimal grammY Telegram anti-spam bot powered by TypeSafe Jev · TypeScript
- [**jev-system-one**](https://github.com/haseeb-heaven/jev-system-one) - A polished OpenAI + TypeSafe Jev terminal interface for answers with transparent decision reports · Python
- [**jev-codes**](https://github.com/Kushwho/jev-codes) - Audit your git diff against YAML coding-standards packs using TypeSafe's Jev model, from a CLI or your AI agent's command/skill. · TypeScript
- [**Canny**](https://github.com/qkal/Canny) - Stops AI coding agents from claiming work is done without evidence. Deterministic hooks decide, TypeSafe's Jev advises. Append-only ledger, zero runtime dependencies. · TypeScript
- [**diffjury**](https://github.com/raihankhan-rk/diffjury) - DiffJury — TypeSafe Jev PR risk router + code review coach · TypeScript
- [**typesafe-cli**](https://github.com/y0usaf/typesafe-cli) - Ask Jev typed questions from the shell: noul, choice, and score answers as numbers, not prose · TypeScript
- [**jcm-router**](https://github.com/adarshmishra07/jcm-router) - Local proxy that picks the Claude model and effort per message using TypeSafe Jev. Routes subagents, leaves your cached main chat alone. · TypeScript
- [**jev-chat**](https://github.com/adhyaay-karnwal/jev-chat) - A chatbot from typed Jev decisions: hierarchical speculative decoding over System One probabilities. · Python
- [**jev-predict-skill**](https://github.com/DanielKillenberger/jev-predict-skill) - Predict another skill's next closed decision with TypeSafe Jev — without running that skill. · HTML
- [**jev-code**](https://github.com/devagrawal09/jev-code) - Bounded TypeSafe Jev workflows for coding agents. · TypeScript
- [**jev-go**](https://github.com/Gaurav-Gosain/jev-go) - Go client for TypeSafe's System One API and its model Jev: typed judgments and calibrated probabilities instead of generated text · Go
- [**typesafe-cli**](https://github.com/geilt/typesafe-cli) - CLI and agent skill for TypeSafe System One \(Jev\): typed Choice, Score, and Noul judgments. · Python
- [**jev-judgment**](https://github.com/HyunjunJeon/jev-judgment) - Agent Skill: send closed coding-agent judgments to TypeSafe Jev · Python
- [**trade-jev**](https://github.com/justinhe16/trade-jev) - Backtest Jev \(TypeSafe\) as a BUY/SELL/HOLD trader on NQ L10 order-book data · Python
- [**jod**](https://github.com/mateonunez/jod) - Semantic schemas over TypeSafe's Jev — validate the state locally, then project typed answers. · TypeScript
- [**computer\_use**](https://github.com/paulsmith/computer-use-jev) - macOS computer use driven by Jev \(TypeSafe System One\) as the decision maker · Go
- [**jev-behavior-study**](https://github.com/RINNECODER/jev-behavior-study) - Independent Jev 1.13.0 behavior study: report, controlled prompt experiments, raw results, and offline verification. · Python
- [**JevRepo**](https://github.com/Xubqpanda/JevRepo) - JevRepo — Jev / TypeSafe related project · Python
- [**windows-save-token-jev-setup**](https://github.com/455-dIAO/windows-save-token-jev-setup) - Windows Codex Skill：通过 npx 或 Git 安装，安全配置 save-token-jev 的 PreCompact/SessionStart Hooks，并提供信任、原生压缩与旧内容隔离验证。 · PowerShell
- [**typesafe-mod**](https://github.com/BeLazy167/typesafe-mod) - Claude Code mod that routes decisions to TypeSafe's Jev model: ranks installed skills per prompt, and answers the agent's own this-or-that questions when confident. · TypeScript
- [**jevgpt**](https://github.com/Bewinxed/jevgpt) - A chatbot built on a model that cannot generate text \(TypeSafe AI's Jev, driven autoregressively\) · TypeScript
- [**laravel-typesafe-jev**](https://github.com/Butochnikov/laravel-typesafe-jev) - Unofficial Laravel integration for TypeSafe Jev AI with typed responses, async requests, scoped dependency injection, and testing fakes. · PHP
- [**jev-ultralightspeed**](https://github.com/collapseindex/jev-ultralightspeed) - BRRRRRRRRRRRRRRRRRRRRRR · Python
- [**barrunto**](https://github.com/elpumberto/barrunto) - A Chrome extension that brings TypeSafe's Jev to X.com to analyze posts as you browse · TypeScript
- [**jev-for-engineers**](https://github.com/Foadsf/jev-for-engineers) - Eight minimal working examples of TypeSafe's Jev \(a System One model\) applied to mechanical and electrical engineering: CAD/CAE/CAM routing, FEM result triage, DFM screening, BOM alignment, hallucination-proof extraction. Zero dependencies. · Python
- [**TypeSafeAI.Net**](https://github.com/Hawxy/TypeSafeAI.Net) - .NET SDK for the TypeSafe AI platform · C#
- [**should-ai-kill-us-all**](https://github.com/hellogumbo/should-ai-kill-us-all) - We ask Jev, TypeSafe AI's System One model, whether AI should kill us all. Every ten minutes. Using the actual headlines. · JavaScript
- [**jev-cli**](https://github.com/jtsang4/jev-cli) - CLI for TypeSafe AI's Jev evaluation model — typed questions in, structured JSON answers out · TypeScript
- [**jev-arena-nanojev**](https://github.com/liao96312/jev-arena-nanojev) - 完全本地的 NanoJev 网格决策游戏实验场，支持中文 Pygame、多关卡与 GTX 1660S 训练 · Python
- [**typesafe-migration-guard**](https://github.com/opaielsheikh/typesafe-migration-guard) - Automated database migration safety reviewer powered by TypeSafe AI \(Jev System One model\) · TypeScript
- [**jev-system-architect**](https://github.com/samtay32/jev-system-architect) - System-architecture skill for TypeSafe AI Jev/System One — find fuzzy semantic judgment and turn it into small Choice/Score/Noul primitives.
- [**jevibe-check**](https://github.com/sriganesh/jevibe-check) - A live tone labeler for Bluesky posts and drafts, using TypeSafe's Jev API. · JavaScript
- [**jev-agent-failure-benchmark**](https://github.com/TokenTrim/jev-agent-failure-benchmark) - Benchmarking Jev \(Typesafe.ai\) against a strong LLM on the Who&amp;When Pro agent-failure-attribution benchmark \(text subset\). · Python
- [**ailerix**](https://github.com/tylerjharden/ailerix) - Type-safe model router. Jev \(System One\) banks each request to a typed catalog route. · TypeScript
- [**btc-jev-signal**](https://github.com/WebGrga/btc-jev-signal) - Experimental multi-horizon BTC signal generator using TypeSafe Jev probabilities and Binance market data. · TypeScript
- [**JevLoop**](https://github.com/Xubqpanda/JevLoop) - The agent loop where decisions don't cost a large language model call. Zero deps, runs offline, no API key needed. · TypeScript
- [**rubikjev**](https://github.com/0xtrou/rubikjev) - Challenge the Jev's intelligence in Rubik Cube puzzles · TypeScript
- [**jev-score**](https://github.com/a-Fig/jev-score) - Local-first document evaluation workspaces powered by Jev · JavaScript
- [**jevclient**](https://github.com/AboveColin/jevclient) - Async Python client for TypeSafe Jev. Typed questions in, probabilities and choices out, no prose to parse. · Python
- [**pydantic-jev-examples**](https://github.com/adtyavrdhn/pydantic-jev-examples) - Pydantic AI capabilities made stronger with Jev: small runnable demos, one file each · Python
- [**clarity-judge**](https://github.com/BunsDev/clarity-judge) - Multi-axis writing quality checker powered by TypeSafe AI's Jev model. Separate named checks, each with its own verdict and confidence. · TypeScript
- [**judging-with-typesafe**](https://github.com/carlsonchik/judging-with-typesafe) - Скилл для агентов Letta: суждения по критериям через TypeSafe System One \(Jev\) · Python
- [**typesafeai-go**](https://github.com/chez-shanpu/typesafeai-go) - Go SDK for TypeSafe AI API https://docs.typesafe.ai/api · Go
- [**typesafe-sdk-rust**](https://github.com/codeitlikemiley/typesafe-sdk-rust) - Rust SDK for the TypeSafe AI API · Rust
- [**typesafe-go**](https://github.com/cole-gillespie/typesafe-go) - unofficial go SDK for typesafe AI, with typed answers, retries, and context support · Go
- [**typesafe-arena**](https://github.com/DeepBlueDynamics/typesafe-arena) - A playground for TypeSafeAI's Jev Model · Rust
- [**JevMinesweeper**](https://github.com/EnesYilmazcode/JevMinesweeper) - Jev Plays Minesweeper · Python
- [**jevseo**](https://github.com/epergaboni/jevseo) - Typed SEO, AEO and GEO judgments powered by Jev, a System One decision model. Code owns the rules, the model owns the meaning. · TypeScript
- [**almond-fastloop**](https://github.com/eriestra/almond-fastloop) - Almond-fastloop: Almond's browser computer-use rig \(Chrome DevTools + TypeSafe Jev\), and the Browser Use Olympics benchmark it is measured on. · HTML
- [**jevgo**](https://github.com/fgn/jevgo) - Go client for TypeSafe AI's System One API \(Jev\), with optional Langfuse instrumentation · Go
- [**jev-sec-bench**](https://github.com/Gaurav-Gosain/jev-sec-bench) - Blind security benchmarks for Jev, TypeSafe's System One model: prompt injection and vulnerable code detection, built on jev-go · Go
- [**Antigravity-mcp-semantic-search-with-TypeSafeAi**](https://github.com/greenyamao/Antigravity-mcp-semantic-search-with-TypeSafeAi) - Fast semantic code search &amp; diff sanity auditor for AI coding assistants \(Antigravity, Cursor, Claude Code\) powered by TypeSafe System One. · Python
- [**decisionbridge**](https://github.com/grishahq/decisionbridge) - A Jev-inspired decision interface for existing LLMs. Explicit choices, scores, calibration, and review thresholds. · HTML
- [**jev-go**](https://github.com/guillemus/jev-go) - Unofficial Go SDK for TypeSafe AI's Jev API · Go
- [**RISC-jeV**](https://github.com/i2cjak/RISC-jeV) - I tortured Jev into being a RISC-V CPU. · Python
- [**jev-harness**](https://github.com/ismaelsoilet/jev-harness) - jev-harness — Jev / TypeSafe related project · Python
- [**typesafe-assist**](https://github.com/JanOstrowka/typesafe-assist) - Home Assistant Assist conversation agent powered by TypeSafe's Jev \(System One\) model · Python
- [**psearch**](https://github.com/komikat/psearch) - Parallel web search for terminals and agents, with local Chromium and Jev-guided exploration. · Python
- [**mcts-agent**](https://github.com/lhemerly/mcts-agent) - Discriminative Monte Carlo Tree Search using TypeSafe Jev System One Primitives and Gemini · Python
- [**jev-playground**](https://github.com/Little-Planet-Labs/jev-playground) - A small Next.js app for experimenting with TypeSafe AI's Jev model \(System One\) · TypeScript
- [**todo-jev**](https://github.com/maker-KK/todo-jev) - ⚡ Ultra-fast, low-cost intelligent task classifier and 3-tier routing engine powered by TypeSafe Jev \(System One\) · Python
- [**typesafe-ai-playground**](https://github.com/markjaquith/typesafe-ai-playground) - A playground for experiments around Jev, TypeSafe's System One model. · Rust
- [**toolgate**](https://github.com/ndolinschi/toolgate) - Agent tool/MCP call gate — allow / ask\_human / deny via TypeSafe Jev · TypeScript
- [**jev-organize**](https://github.com/nexibeo/jev-organize) - Throw in a pile of company files and get them classified and organized by department, type, sensitivity, date, counterparty and PII, with an index for AI agents. Powered by TypeSafe's Jev on OpenRouter \(17¢ per 1,000 files\). Zero-dependency Node CLI + Claude skill + Codex agent. · JavaScript
- [**otto**](https://github.com/NobleSpartan6/otto) - Open-source native computer use for macOS and Windows: TypeSafe Jev, local OCR, and selective planning. · TypeScript
- [**commentcop**](https://github.com/ntedvs/commentcop) - Put your code comments on trial. Powered by Jev. · TypeScript
- [**ask-jev**](https://github.com/omni-/ask-jev) - Utilizing Jev, the RLCD-type model provided by TypeSafe AI, to independently and cheaply judge agentic coding sessions. · PowerShell
- [**got-jev**](https://github.com/phureewat29/got-jev) - Jev \(TypeSafe AI\) PoC through Game of Thrones · TypeScript
- [**tsai-civ2**](https://github.com/phyous/tsai-civ2) - TypeSafe Jev plays original Civilization II in a browser, with live action probabilities. Experimental full-game harness. · Python
- [**jev-synergy-screening**](https://github.com/PistachioAIHQ/jev-synergy-screening) - Jev \(TypeSafe System One\) × ASReview SYNERGY abstract screening demo — Choice/Noul vs gold labels · Python
- [**jevudio**](https://github.com/rdk16/jevudio) - Editor de codigo open source. · Rust
- [**pi-jev-task-router**](https://github.com/rizafahmi/pi-jev-task-router) - Per-prompt model routing for the Pi coding agent: classify each prompt with Jev, pick a model tier, and switch before the turn runs. · TypeScript
- [**mem-jev**](https://github.com/Sauhard74/mem-jev) - Deterministic procedural memory for agents
- [**system-one**](https://github.com/sgoedecke/system-one) - Batched single-token choice inference for open language models, compatible with TypeSafe · Python
- [**qwen-rlcd**](https://github.com/shamazharikh/qwen-rlcd) - Jev-style calibrated decision model \(Choice/Score/Noul\) on Qwen3.5-0.8B · Python
- [**kyotsu-ai-bench**](https://github.com/shibadogcap/kyotsu-ai-bench) - AI benchmark on Japan's 2026 Common Test: Jev vs luna-none vs luna-low \(static dashboard\) · HTML
- [**omp-typesafe**](https://github.com/siddicky/omp-typesafe) - TypeSafe AI \(Jev\) adversarial reviewer and typesafe\_ask tool for the omp coding agent · TypeScript
- [**jev-debtgate**](https://github.com/smlayero/jev-debtgate) - Jev-powered technical debt gate for coding agents and CI. Bring your own TypeSafe API key. · TypeScript
- [**Jev-Vision**](https://github.com/sseanliu/Jev-Vision) - Open-weight step verifier for computer-use agents: calibrated ground/skip/effect/done judgments from screenshots in ~160 ms, plus a benchmark with environment-derived labels · Python
- [**gpt-vs-jev**](https://github.com/TanayPadar/gpt-vs-jev) - Compare GPT generated language with JEV structured Noul decisions on the same input. · TypeScript
- [**harden-jev-decides**](https://github.com/tylerjharden/harden-jev-decides) - JEV picks which stream idea becomes the live MVP. TypeSafe System One decision board. · TypeScript
- [**Jev-as-Policy**](https://github.com/YuanKJing/Jev-as-Policy) - The highly anticipated open-source repository for JEV as Policy enables one-click setup of the simulation environment. Evaluations of Astra + JEV on benchmarks such as RoboTwin will also be released soon. · Python
- [**padflow-jev-evals**](https://github.com/zsavage8/padflow-jev-evals) - Typed-decision benchmark from PadFlow \(land development SaaS\): schemas, anonymized labeled rows, and a runner for confidence-calibrated models like TypeSafe Jev. · Python
- [**pi-jev-multi-provider**](https://github.com/0x1f/pi-jev-multi-provider) - Pi Jev System One integration with TypeSafe Direct and Vercel AI Gateway transports · TypeScript
- [**last-exit**](https://github.com/0x963D/last-exit) - A cyberpunk border encounter powered by TypeSafe Jev. Bluff the guard. Inspect the receipts. · JavaScript
- [**jev-five**](https://github.com/0xagentlabs/jev-five) - TypeSafe Jev System One powered Gomoku arena · TypeScript
- [**jev-xiangqi**](https://github.com/0xagentlabs/jev-xiangqi) - Jev System One powered Chinese chess arena · TypeScript
- [**jevegis**](https://github.com/0xArx/jevegis) - Guardrails for LLM apps in one API call. Prompt injection, jailbreaks, leaks, unsafe content. Built on TypeSafe Jev. MIT. · TypeScript
- [**BennyFit**](https://github.com/0xjba/BennyFit) - BennyFit: TypeSafe Jev ecosystem repository. · HTML
- [**JevLens**](https://github.com/a742987/JevLens) - Jev decision visualisation and debugging panel for coding agents. MCP server + local web timeline, confidence alerts and trace export. · TypeScript
- [**learn-jev**](https://github.com/aaronmeis/learn-jev) - Learn Jev — TypeSafe System One typed decisions for software. Personal GitHub Pages reference hub \(deck, shorts, sources\). Unofficial. · HTML
- [**typesafe-rs**](https://github.com/AbdelStark/typesafe-rs) - Latency-first Rust SDK for TypeSafe System One. · Rust
- [**jev-connector**](https://github.com/adhamelhayek-lab/jev-connector) - TypeSafe / Jev community project: adhamelhayek-lab/jev-connector. · JavaScript
- [**Typesafe\_chess\_eval**](https://github.com/AliceRoselia/Typesafe_chess_eval) - An evaluation of typesafe AI chess. As it turns out, the AI isn't doing really well even though chess is not a particularly open-ended game. Still, it's only a prototype and this probably wasn't optimzied for games. · Python
- [**jev-antigravity-decider**](https://github.com/altregubov/jev-antigravity-decider) - TypeSafe / Jev community project: altregubov/jev-antigravity-decider. · Python
- [**jev-royal**](https://github.com/Amrit-Nigam/jev-royal) - TypeSafe / Jev community project: Amrit-Nigam/jev-royal. · TypeScript
- [**feed-rubric**](https://github.com/andepants/feed-rubric) - Open-source Chrome MV3 extension: user-defined rubric categories, Jev noul scores each feed post, hide matches. BYOK Typesafe. · TypeScript
- [**switchboard**](https://github.com/aniruddh-krovvidi/switchboard) - Guardrail + model router for LLM gateways on TypeSafe's Jev \(System One model\), with an independent accuracy/calibration/latency evaluation. Stdlib Python. · Python
- [**jev-phishing-bench**](https://github.com/anisselbd/jev-phishing-bench) - Jev \(TypeSafe\) vs Claude Haiku 4.5 on 2 000 phishing emails: accuracy, calibration, latency, cost. Reproducible benchmark. · Python
- [**jev-mcp**](https://github.com/arunav25/jev-mcp) - Connect JEV to MCP clients and compare its judgments against general-purpose LLMs using shared datasets and measurable accuracy. · JavaScript
- [**human-compiler**](https://github.com/asfarsadewa/human-compiler) - A compiler for human language. Paste text, get diagnostics. Measured by TypeSafe Jev. · TypeScript
- [**jev-resume-analyzer**](https://github.com/awun8191/jev-resume-analyzer) - CV diagnostics and job alignment with TypeSafe Jev, React and FastAPI · Python
- [**jev-claude-skill**](https://github.com/Barba-Tech-CO/jev-claude-skill) - Claude Code skill for TypeSafe's Jev decision model — typed decisions via TypeSafe, Vercel AI Gateway or OpenRouter · Python
- [**typesafe-demo-mcp**](https://github.com/bestagentkits/typesafe-demo-mcp) - MCP server exposing TypeSafe System One judgments \(noul, choice, score\) as agent tools · TypeScript
- [**jev-spam-eval**](https://github.com/bitnovus/jev-spam-eval) - Zero-shot spam filtering with TypeSafe Jev Noul questions, compared with TF-IDF baselines · Jupyter Notebook
- [**jev-shadcn-lint-eval**](https://github.com/blas0/jev-shadcn-lint-eval) - A small second eval for shadcn-ui/lint that uses TypeSafe's Jev to judge the linter's own output. · JavaScript
- [**transcript-scorecard**](https://github.com/brandonbryant12/transcript-scorecard) - ACME live support-call scoring demo with TypeSafe AI, Effect, SQLite, React, Vite, and Turborepo · TypeScript
- [**jev-demos**](https://github.com/Bud-ro/jev-demos) - Demos to test the effectiveness of TypeSafe's "Jev" System One Model · Dart
- [**river-oaks**](https://github.com/BunsDev/river-oaks) - NPCs of River Oaks Houston, Texas using Jev to power NPCs
- [**typesafe-ui**](https://github.com/BunsDev/typesafe-ui) - shadcn-style reusable components and blocks for using TypeSafe AI. · TypeScript
- [**jev-mcp**](https://github.com/burnigtm/jev-mcp) - MCP server that puts TypeSafe Jev on the coding loop in Cursor, Codex, and any MCP client · TypeScript
- [**jev-ad-preflight**](https://github.com/cardotrejos/jev-ad-preflight) - Typesafe/Jev public X demo
- [**jev-should-i-apply**](https://github.com/cardotrejos/jev-should-i-apply) - Typesafe/Jev public X demo
- [**jev-user-jury**](https://github.com/cardotrejos/jev-user-jury) - Typesafe/Jev public X demo
- [**extremely-specific-council**](https://github.com/cbetz/extremely-specific-council) - Twelve members. Zero qualifications. A playful TypeSafe AI council with animated votes, inspectable decisions, and shareable verdicts. · TypeScript
- [**jev-decision-maker-at-meteora**](https://github.com/cedarmuse-creator/jev-decision-maker-at-meteora) - Decision Maker at Meteora - a decision agent for Meteora DLMM liquidity on Solana. Named after Jev, TypeSafe AI's System One model \(https://console.typesafe.ai/home\), which answers its typed Noul and Score questions. Ranks the live pool universe, runs live rug cards, and holds 3-5 pools under explicit hard gates and book rules. · Python
- [**jev-triage**](https://github.com/cephalization/jev-triage) - Uses typeful jev, zero sync to pull and sync large repositories for issue triage · TypeScript
- [**jev-document-classification**](https://github.com/Charlyhno-eng/jev-document-classification) - JEV Document Classification enables the rapid and cost-effective classification of text-based documents using AI, leveraging TypeSafe's "System One" model. · TypeScript
- [**system-one-adapter-rust**](https://github.com/codeitlikemiley/system-one-adapter-rust) - Rust port of TypeSafe system-one-adapter \(LLM-backed system\_one evaluations\) · Rust
- [**emoji-jev**](https://github.com/colinmcdermott/emoji-jev) - Emoji autocomplete at the speed of typing. TypeSafe AI Jev on a Whop-hosted TanStack Start app. · TypeScript
- [**paper-package**](https://github.com/CompleteDotTech/paper-package) - Jev research manuscript, evidence, and reproducible paper package · Python
- [**JevTest**](https://github.com/CorieW/JevTest) - Bounded exploratory browser testing with Jev, deterministic assertions, and replayable evidence. · TypeScript
- [**s1s**](https://github.com/cpaczek/s1s) - System One Search: navigate and trace code with TypeSafe judgments and repository evidence · TypeScript
- [**jev-as-a-judge**](https://github.com/danielgshea/jev-as-a-judge) - Using Jev as an evaluator. · Python
- [**openjev**](https://github.com/DECRUX9812/openjev) - Open, local, zero-cost reimplementation of the Jev decision layer for job postings · Python
- [**jev-subagent-router**](https://github.com/DefensiveSniper/jev-subagent-router) - Use TypeSafe Jev to select subagent models and reasoning effort in Codex and Claude Code. · Python
- [**hermes-jev**](https://github.com/DoGMaTiiC/hermes-jev) - Hermes Agent plugin: route each turn to the one skill that fits, via TypeSafe Jev on the Vercel AI Gateway. Fail-open, opt-in, stdlib only. · Python
- [**n8n-nodes-typesafe-ai**](https://github.com/DomMonte/n8n-nodes-typesafe-ai) - n8n community node for the TypeSafe AI System One API — typed yes/no, choice and score questions with calibrated probabilities · TypeScript
- [**JevSysUno**](https://github.com/Dujaydis/JevSysUno) - TypeSafe / Jev community project: Dujaydis/JevSysUno.
- [**typesafe-minecraft-demo**](https://github.com/ellistev/typesafe-minecraft-demo) - A Minecraft Java player controlled by TypeSafe AI, with live decisions, Canadian flag building, and a side-by-side dashboard. · JavaScript
- [**jev-ecosystem-sim**](https://github.com/emipasca/jev-ecosystem-sim) - A 2D grid-island ecosystem where each animal is a Jev \(TypeSafe\) agent; the food chain emerges from calibrated typed decisions. Pure-stdlib Python + browser UI. · Python
- [**browser-use-olympics**](https://github.com/eriestra/browser-use-olympics) - Browser Use Olympics by Almond: one prompt, five events, one clock. Plus fast loop, a ~200-line browser computer-use agent \(Chrome DevTools + TypeSafe Jev\). · HTML
- [**zocomputer-jev**](https://github.com/EthanThatOneKid/zocomputer-jev) - A Zo skill for situational script writing and execution using Vercel AI Gateway and TypeSafe AI Jev.
- [**JevChat**](https://github.com/fruitymcdoo/JevChat) - A chat interface built on Jev, TypeSafe's decision-only model: every word is a typed decision · Python
- [**jev-alpha-bench**](https://github.com/Gaurav-Gosain/jev-alpha-bench) - Does Jev predict stock returns from news? It reads the news well; there is no tradeable alpha. Three arms separate reading from recall. · Go
- [**jev-headline-bench**](https://github.com/Gaurav-Gosain/jev-headline-bench) - Can Jev pick the winner of a real headline A/B test? 64.5% across 10,984 Upworthy randomized experiments, 74.7% when the difference was decisive. · Go
- [**JevTicktRouter**](https://github.com/GhrezaKh74/JevTicktRouter) - A .NET 10 and React 19 application for fast, structured AI-powered ticket triage using TypeSafe Jev. · C#
- [**jev-column-race**](https://github.com/goodrahstar/jev-column-race) - Jev vs Gemini 3.8 Flash: labelling 1,000 app reviews, 4.1× faster and 7× cheaper · JavaScript
- [**typesafe-jev**](https://github.com/gtaras7/typesafe-jev) - Screen a folder of CVs with the TypeSafe Jev decision model: typed judgments, an editable policy, free re-scoring. · TypeScript
- [**jev**](https://github.com/haibt163/jev) - TypeSafe / Jev community project: haibt163/jev. · TypeScript
- [**jev-torneo-animales**](https://github.com/hectorlcastro09/jev-torneo-animales) - Winner-stays-on animal tournament refereed by Jev \(TypeSafe System One\): a local game to feel how fast typed decisions are. UI in Spanish. · HTML
- [**jev-bun1**](https://github.com/heiwa4126/jev-bun1) - TypeSafe の Jev を TypeScript SDK で使ってみる最初の 1 歩 · TypeScript
- [**pkg-gate**](https://github.com/hemanth/pkg-gate) - Pre-install security gate for npm lifecycle scripts using TypeSafe System One. · JavaScript
- [**jev-rerank**](https://github.com/hev/reranker) - Use Jev \(TypeSafe's System One model\) as a calibrated reranker: one call, up to 30 documents, a probability per document. Apache-2.0. · Python
- [**typesafe-comment**](https://github.com/Hexdigest123/typesafe-comment) - Small Python package that uses typesafe.ai to evaluate code comments on certain heuristics · Python
- [**typesafe\_ai**](https://github.com/hfiguera/typesafe_ai) - An Elixir client for TypeSafe AI with typed responses and bounded concurrency · Elixir
- [**jev-finance-benchmark**](https://github.com/hifizz/jev-finance-benchmark) - typesafe.ai model jev finance benchmark
- [**pi-prompt-enhancer**](https://github.com/HikaruEgashira/pi-prompt-enhancer) - pi extension that rates every prompt with TypeSafe's jev decision model and injects the missing pieces as hints. · TypeScript
- [**Jev-Case**](https://github.com/Hiwoniu/Jev-Case) - 收集全网优秀 case 的收藏库 \| A curated collection of excellent cases from across the web \(TypeSafe Jev / System One\).
- [**jev-decision-maker**](https://github.com/hoaphm/jev-decision-maker) - omp plugin: JEV \(TypeSafe System One\) picks the next coding step from agent-supplied candidates · TypeScript
- [**jev-snake**](https://github.com/iammusham/jev-snake) - An experimental Snake environment where the game engine owns deterministic rules and TypeSafe AI's Jev makes the movement decision from structured state on every tick. · Python
- [**GrowthCompany\_JevOutputs**](https://github.com/itsaslamopenclawdata/GrowthCompany_JevOutputs) - Jev \(TypeSafe System One\) x Hermes Agent - the calibrated decision-layer playbook: 5 end-to-end use cases, reference implementation, and a Hermes skill for 100x-cheaper structured AI judgments · Python
- [**skillranker**](https://github.com/ivorpad/skillranker) - Rust CLI powered by Jev from TypeSafe.ai that ranks agent skills for the next step using live session context. Includes Claude Code hooks, structured JSON, abstention, and local feedback. Requires a TypeSafe API key.
- [**hundred**](https://github.com/jammaru/jev-lab) - 100 AI NPCs live in a tiny town. Jev chooses the next action; the world writes the story. · TypeScript
- [**jev-research-eval**](https://github.com/jgridifier/jev-research-eval) - Reproducible Jev Ultrafast research-browser eval harness + field note \(QC’d cases, suite runner, report generator\). Not investment advice. · HTML
- [**LogiPulseAI\_JEV**](https://github.com/jijaraba/LogiPulseAI_JEV) - Real-time last-mile delivery exception triage: Jev \(TypeSafe AI System One\) evaluates each event, deterministic guardrails decide. FastAPI + Streamlit. · Python
- [**jev-t-rex-runner**](https://github.com/joshlarsen/jev-t-rex-runner) - Chrome dino game played by Typesafe AI Jev model · JavaScript
- [**roverlab**](https://github.com/juancamiloqhz/roverlab) - A 3D planetary rover sandbox for experimenting with autonomous decisions using TypeSafe AI. · TypeScript
- [**mimicry**](https://github.com/jxucoder/mimicry) - Rewrite AI drafts in your own voice with a bounded TypeSafe feedback loop. · Python
- [**pi-jev-code**](https://github.com/KamilPostrozny/pi-jev-code) - Single-agent Pi coding coprocessor with Jev semantic gates, baseline-to-current diff review, and append-only observability telemetry. · TypeScript
- [**tiny-jev**](https://github.com/karimatayuta/tiny-jev) - TypeSafe / Jev community project: karimatayuta/tiny-jev.
- [**typesafe-playground**](https://github.com/kavehmz/typesafe-playground) - Interactive experiments with TypeSafe Jev, from support routing to 3D driving simulations with real AI decisions and visible sensor inputs. · JavaScript
- [**jev-hub**](https://github.com/keepwonder/jev-hub) - Jev / TypeSafe AI 中文跟踪与文档聚合站 · Astro
- [**jev-freeform**](https://github.com/kesku/jev-freeform) - An observable raw-character chat experiment powered entirely by TypeSafe Jev Choice · JavaScript
- [**jevlens**](https://github.com/knowlet/jevlens) - TypeSafe / Jev community project: knowlet/jevlens. · JavaScript
- [**jev-bfs**](https://github.com/komikat/jev-bfs) - Wikipedia link races with direct Jev ranking and a live terminal display. · Python
- [**typed-decisions**](https://github.com/kotoba-lang/typed-decisions) - Jev-shaped typed-decision model \(state + Choice/Score/Noul questions -&gt; calibrated probabilities, one pass\) on ModernBERT / DeBERTa / LLaDA-MoE, with measured latency, accuracy, calibration and training cost · Python
- [**jev-playwright-mcp**](https://github.com/krw82/jev-playwright-mcp) - Jev-augmented Playwright MCP proxy — page-state triage, prompt-injection shielding, goal-based snapshot pruning, risky-action gating. Drop-in wrapper around @playwright/mcp for any coding agent. · TypeScript
- [**kunobi-jev**](https://github.com/kunobi-ninja/kunobi-jev) - Rust client for the TypeSafe System One API \(Jev\) · Rust
- [**pi-jev-permit**](https://github.com/kurihada/pi-jev-permit) - A Jev \(TypeSafe System One\) permission gate for the Pi coding agent: judges every bash / write / edit call before it runs · TypeScript
- [**jev2048**](https://github.com/KyleKreuter/jev2048) - Let Jev \(TypeSafeAI\) solve 2048 · TypeScript
- [**jev-anotacao-sentencas**](https://github.com/lab-dados/jev-anotacao-sentencas) - Jev \(TypeSafe\) vs. Gemini 3.8 Flash vs. GPT-5.6 Luna na anotação estruturada de sentenças do TJSP: qualidade, tempo e custo · Python
- [**forma-system1-experiment**](https://github.com/LamplighterPaul/forma-system1-experiment) - Experimental design harness: a small decision model \(Jev\) picks the design in about a second, a traditional LLM \(Luna\) only writes the words. With and without it. · TypeScript
- [**pi-typesafe-jev**](https://github.com/legacybridge-tech/pi-typesafe-jev) - A pi extension that exposes TypeSafe \(Jev, System One\) judgments as five pi tools, so a model can make narrow semantic judgments while your code and your users keep control of thresholds, weights, and actions. · TypeScript
- [**jev-tetris**](https://github.com/MachineLearning-Nerd/jev-tetris) - A visual TypeSafe demo where Jev chooses verified Tetris placements. · Python
- [**jev-browser**](https://github.com/MahmoudAdelbghany/jev-browser) - Jev-powered browser MCP for LLM agents — ~300ms decisions, no LLM tokens in the loop. Benchmark vs Playwright MCP included. · JavaScript
- [**newsscore**](https://github.com/mahynotch/newsscore) - News sentiment scoring for stocks, powered by TypeSafe Jev by default. · Python
- [**typesafe-3d-chess**](https://github.com/malDuffin/typesafe-3d-chess) - 3D chess powered by TypeSafe AI \(Jev\). AI vs AI by default, or play either side. Multiple difficulty levels. · TypeScript
- [**jev-vs-luna**](https://github.com/mameli/jev-vs-luna) - Reproducible Jev vs Luna review-classification benchmark with measured accuracy, latency, and costs. · Python
- [**citation-verifier**](https://github.com/MarissaFamularo/citation-verifier) - Check whether each cited paper supports the sentence citing it. Claude proves the quote, TypeSafe's Jev scores it, a human decides. · JavaScript
- [**typesafe**](https://github.com/mattneel/typesafe) - An idiomatic Elixir client for the TypeSafe AI API · Elixir
- [**typesafe.zig**](https://github.com/mattneel/typesafe.zig) - An idiomatic Zig client for the TypeSafe AI API · Zig
- [**jev-lab**](https://github.com/Menny1337/jev-lab) - TypeScript experiments, evaluations, and latency benchmarks for TypeSafe's Jev model · TypeScript
- [**naimono-lab**](https://github.com/mocchalera/naimono-lab) - この世にないことばで遊ぶ、家族のためのJev言葉ゲーム · JavaScript
- [**check-risk**](https://github.com/moezubair/check-risk) - A CLI and GitHub Action that assesses code-change risk using deterministic rules and TypeSafe Jev, recommending checks and reviewers before merge. · TypeScript
- [**jev-dev**](https://github.com/n-yokomachi/jev-dev) - 同じ発言を jev と LLM の両方に判定させ、感情の変動値のズレと応答速度を1画面で見比べるデモ（affectus + Vercel AI Gateway） · TypeScript
- [**cartshield**](https://github.com/ndolinschi/cartshield) - CartShield — SMB checkout fraud disposition via TypeSafe Jev · TypeScript
- [**harnessjudge**](https://github.com/ndolinschi/harnessjudge) - Judge agent steps — ok / retry / escalate / stop via TypeSafe Jev · TypeScript
- [**hiresignal**](https://github.com/ndolinschi/hiresignal) - HireSignal — resume first-pass fit+interview via TypeSafe Jev · TypeScript
- [**jevplay**](https://github.com/ndolinschi/jevplay) - TypeSafe Jev playground — custom Choice/Score/Noul builder with live distributions · TypeScript
- [**lanebreak**](https://github.com/ndolinschi/lanebreak) - LaneBreak — support ticket priority+routing via TypeSafe Jev · TypeScript
- [**mcpmatch**](https://github.com/ndolinschi/mcpmatch) - Match user goals to MCP catalog \(two-stage\) via TypeSafe Jev · TypeScript
- [**pulselane**](https://github.com/ndolinschi/pulselane) - PulseLane — clinic triage decisions via TypeSafe Jev · TypeScript
- [**spendbrake**](https://github.com/ndolinschi/spendbrake) - Agent budget brake — continue / downgrade\_model / stop via TypeSafe Jev · TypeScript
- [**swarmrouter**](https://github.com/ndolinschi/swarmrouter) - Route tasks to research/code/browser/support/writer agents via TypeSafe Jev · TypeScript
- [**trustgate**](https://github.com/ndolinschi/trustgate) - TrustGate — indie media T&amp;S gate via TypeSafe Jev · TypeScript
- [**sloppy-jevs-extension**](https://github.com/neddes/sloppy-jevs-extension) - Open-source Chrome extension that filters AI-generated prose and ads with Jev · JavaScript
- [**shade-arena-jev-monitor**](https://github.com/nican2018/shade-arena-jev-monitor) - Evaluating TypeSafe's Jev as a fast monitor and action gate for agent sabotage in SHADE-Arena, compared with Gemini 2.5 Flash/Pro. · Python
- [**beat-jev**](https://github.com/ojusave/beat-jev) - A penalty shootout powered by Render Workflows, TypeSafe Jev, and Render Postgres. Python and TypeScript examples. · TypeScript
- [**pdoom-protocol**](https://github.com/onionminionops-beep/pdoom-protocol) - USER + JEV: P\(DOOM\) PROTOCOL — co-op platform shooter where TypeSafe Jev plays alongside you · TypeScript
- [**ps2-ai-agent**](https://github.com/opaielsheikh/ps2-ai-agent) - Autonomous PlayStation 2 AI Agent with real-time visual telemetry HUD powered by TypeSafe Jev System One · Python
- [**casse-brique-typesafe**](https://github.com/Para-FR/casse-brique-typesafe) - A Next.js brick breaker whose paddle is controlled in real time by TypeSafe AI's Jev model. Built with Claude Code. · TypeScript
- [**draftpulse**](https://github.com/pekth/draftpulse) - Experimental: live X draft viral scorer powered by TypeSafe Jev · TypeScript
- [**jev-builder-loop**](https://github.com/rainbowpuffpuff/jev-builder-loop) - Grok skill: Jev as a judgment sensor in a builder-agent loop \(priors × probabilities → next act\) · Python
- [**typesafeai-review**](https://github.com/rbalch/typesafeai-review) - Using Typesafe.AI to generate diff reviews. · Python
- [**cyber-breach-jev**](https://github.com/rchovatiya88/cyber-breach-jev) - Cyber-Breach: The Jev Protocol - A tactical cyberpunk arena combat game powered by TypeSafe AI Jev System One decision model · JavaScript
- [**jev-editor-skill**](https://github.com/RefoundAI/jev-editor-skill) - Editorial gate skill for Claude Code and other agents. Scores a draft on AI tells, your own voice, editorial quality, and SEO using TypeSafe's Jev. · Python
- [**jev-trader**](https://github.com/renatosousa/jev-trader) - TypeSafe / Jev community project: renatosousa/jev-trader. · Python
- [**agent-gate-loop**](https://github.com/Ripwords/agent-gate-loop) - Reusable GitHub Action: agent fix loop gated by checks, an AI reviewer, and TypeSafe Jev · TypeScript
- [**jev\_practice**](https://github.com/ryuchan00/jev_practice) - Jev \(TypeSafe System One\) と LLM に同じゲームを打たせて、レイテンシ・コスト・判断の質を比べる練習台 · Python
- [**pong-jev**](https://github.com/safzanpirani/pong-jev) - TypeSafe's Jev plays Atari Pong. One typed Choice question per frame, no coordinates sent to the model. · TypeScript
- [**jev-exploration**](https://github.com/SamuelSacco/jev-exploration) - Jev \(TypeSafe\) exploratory thread: claim audit, live demos, and runnable code · Python
- [**jev-audio-beeper**](https://github.com/santos-sanz/jev-audio-beeper) - Low-latency audio censorship POC using Jev typed decisions and ffmpeg. · TypeScript
- [**jevscan**](https://github.com/SaremS/jevscan) - TypeSafe / Jev community project: SaremS/jevscan. · Go
- [**jev-games**](https://github.com/shantanugoel/jev-games) - Visual Jev lab for multiple games and emulator platforms · Python
- [**Search-Function-Test**](https://github.com/Shifros/Search-Function-Test) - A test project based on Jev AI, the goal is to build a search function for a blog/article website that has 100s of articles to search from, So the user can actually use the search as chat to question anything and find related answers/articles · JavaScript
- [**typesafe-triage-guard**](https://github.com/shivam2003-dev/typesafe-triage-guard) - Three composable judgment pipelines on TypeSafe's Jev: support-ticket triage, observability alert triage, and a deploy-risk gate. · Python
- [**scam-shield**](https://github.com/ShupingR/scam-shield) - Scam text message filter powered by TypeSafe's Jev model · TypeScript
- [**turbo**](https://github.com/sightmap/jev-turbo) - Jev-powered semantic browser use · Go
- [**snake-jev**](https://github.com/siroccomask/snake-jev) - Snake controlled by parallel Jev assessments, with one API call per game tick. · Python
- [**jev-jp-address**](https://github.com/smasato/jev-jp-address) - Jev \(TypeSafe\) 性能評価プロジェクト — 日本郵便 KEN\_ALL をマスタに、AI SDK 経由の Jev が住所のあいまい一致にどこまで使えるかを検証 · TypeScript
- [**Jev4Mellea**](https://github.com/SoundBlaster/Jev4Mellea) - Jev adapter to Mellea · Python
- [**trading-bot-jev**](https://github.com/Spykoninho/trading-bot-jev) - Crypto trading bot on Binance testnet using TypeSafe \(Jev\) to judge news · TypeScript
- [**omp-jevens-classifier**](https://github.com/STRML/omp-jevens-classifier) - Jev-powered model-judged permission gate for OMP \(TypeSafe System One\) · TypeScript
- [**jev-trace-classifier**](https://github.com/sypherin/jev-trace-classifier) - Application of TypeSafe Jev \(noul judgment primitive\) on the collusion.wiki corpus: agent vs human page authorship, head-to-head vs local Qwen3.8-Flash-Next · Python
- [**jev-askable-arm**](https://github.com/TarunTomar122/jev-askable-arm) - Zero-shot English goals on a sim Franka. Jev chains hardcoded primitives. · Python
- [**jev-secret-detection**](https://github.com/teyhouse/jev-secret-detection) - Measures how well TypeSafe's RLCD-Jev model spots real secret credentials in file snippets · Python
- [**terrarium**](https://github.com/TheGali/terrarium) - A sandbox where a TypeSafe System One model presses the controls of a small creature. Code runs the world. · JavaScript
- [**jevusecases**](https://github.com/theSekyi/jevusecases) - What people are actually shipping with Jev — real builds, tracked as they ship. · TypeScript
- [**jev-bench**](https://github.com/TheWayWithin/jev-bench) - Does the cited source actually say it? A 42-claim benchmark: Jev \(TypeSafe System One\) against GPT-5.4, Claude Sonnet 5 and Gemini 3.1 Pro. · Python
- [**jev-review**](https://github.com/thiago-ss/jev-review) - Autonomous Jev pull-request review with typed decisions, calibrated approval gates, and trusted-owner escalation · Python
- [**FinancialPredictionJev**](https://github.com/thodoh1/FinancialPredictionJev) - Using Jev to test how well it predicts financial markets\(just like most llms as of september 2026, it doesnt do that good\) · Python
- [**typesafe-chess**](https://github.com/TholeG/typesafe-chess) - Chess where both players are TypeSafe's Jev model: every move is a typed Choice decision · JavaScript
- [**jev-bench**](https://github.com/thomasschafer/jev-bench) - TypeSafe / Jev community project: thomasschafer/jev-bench. · Python
- [**jev-plays**](https://github.com/thumay9700/jev-plays) - Autonomous game agent powered by TypeSafe AI's Jev \(System One decision engine\)
- [**tinyjevclient**](https://github.com/tinyhumansai/tinyjevclient) - An integration with jev by typesafe.ai in Rust · Rust
- [**jev-routing-experiment**](https://github.com/TokenTrim/jev-routing-experiment) - Benchmarking TypeSafe's Jev decision model as a cost-efficient LLM router on RouterArena · Python
- [**jev-gate**](https://github.com/totally-tim/jev-gate) - Calibrated PR review gates powered by TypeSafe Jev: a GitHub Action, a local CLI, and an OpenCode plugin · TypeScript
- [**shady-town**](https://github.com/tpaulshippy/shady-town) - Shady Town: social-deduction party game for the living room TV, moderated by TypeSafe Jev · Ruby
- [**typesafe-oracles**](https://github.com/trophee-bot/typesafe-oracles) - Evaluating TypeSafe's System One primitives \(Choice/Score/Noul\) — where a typed oracle beats an LLM call · JavaScript
- [**jev-pick-and-place-study**](https://github.com/tryaksh/jev-pick-and-place-study) - A small reproducible MuJoCo pilot comparing Jev, Claude Haiku, and reactive rules for pick-and-place. · Python
- [**pi-typesafe**](https://github.com/twilwa/pi-typesafe) - Pi coding-agent extension built on the TypeSafe AI System One API \(Jev\) · TypeScript
- [**sift**](https://github.com/tylergibbs1/sift) - Chrome extension that re-ranks Google results with TypeSafe Jev and folds away sales pages and SEO filler. · TypeScript
- [**hermes-jev-router**](https://github.com/ussyverse/hermes-jev-router) - Experimental Hermes plugin: Jev-assisted model routing plans with budget and capability constraints. API access pending. · Python
- [**thaiexam-jev-charts**](https://github.com/vehas/thaiexam-jev-charts) - Charts: TypeSafe Jev evaluated on Thai standardized exams vs 110 other models · HTML
- [**typesafe\_sdk\_ex**](https://github.com/vinnie357/typesafe_sdk_ex) - Typesafe AI SDK in Elixir using Req · Elixir
- [**jev-board-lab**](https://github.com/WebGrga/jev-board-lab) - Interactive explorer and Jev question workspace for Jev Board datasets. · JavaScript
- [**typesafe-image-diffusion**](https://github.com/Wizhill05/typesafe-image-diffusion) - Diffusion-style pixel art out of a general classifier \(TypeSafe Jev\): 256 parallel pixel questions + refinement passes · HTML
- [**jev-playground**](https://github.com/wustep/jev-playground) - Can a System One model steer music? Jev picks the plan \(enums only\); code renders sheet, audio and MIDI. · TypeScript
- [**decido**](https://github.com/yairshy/decido) - Probabilistic decisions for Python. Use Jev or bring your own provider; crawl with Playwright. · Python
- [**Agent-JEV-Tetris**](https://github.com/Yasserbhb/Agent-JEV-Tetris) - using the new model JEV to play the game tetris · HTML
- [**JevPip**](https://github.com/yo4e/JevPip) - GMOのFX/BTC市場データに対応したローカル市場研究ターミナル。ライブチャート、ペーパートレード、バックテスト、安全監督、TypeSafe Jev連携。安全機構を整えたうえで実売買対応予定。 · Python
- [**github-star-organizer-jev**](https://github.com/yutkat/github-star-organizer-jev) - TypeSafe / Jev community project: yutkat/github-star-organizer-jev. · Python
- [**jev-agent-skill**](https://github.com/yuyang2230/jev-agent-skill) - Free typed judgments for AI agents: offload classify/screen/score/verify to Jev \(TypeSafe System One\) via OpenCode Zen. Claude Code / ZCode skill. 给AI代理省token的免费决策分流技能 · Python
- [**pi-jev-helm**](https://github.com/Z761293629/pi-jev-helm) - TypeSafe / Jev community project: Z761293629/pi-jev-helm. · TypeScript
- [**zcode-jev**](https://github.com/Zahrannnn/zcode-jev) - Typed judgment layer for coding agents — gates from PRD to ship. Jev-ready, provider-agnostic. · TypeScript
- [**ground-zero**](https://github.com/zavocc/ground-zero) - Decision library to detect and classify AI hallucinations, powered by Jev AI. · Python
<!-- PROJECTS:END -->

## Site

This repo ships a Vite + React + Tailwind + shadcn (base-nova) navigation site (section boards + Fuse.js search). Deployed on **Cloudflare Workers** (`npm run build` → static assets; push to `main` auto-deploys).

See [docs/architecture.md](docs/architecture.md) for IA and deploy details.

```bash
npm install
npm run dev
```

## Automated updates

The **Jev ecosystem radar** Action discovers GitHub resources, uses TypeSafe Jev to review relevance, and commits accepted entries plus this README together. It reads all data shards, preserves existing editorial content and leaves X/YouTube entries untouched. Scheduled scanning stays disabled until the API key and enable switch are configured.

See [Collector setup](docs/collector.md) for the `TYPESAFE_API_KEY` Actions secret, preview runs and the schedule switch. After changing directory data manually, run `npm run readme:sync` and `npm run data:check`; project sections and the badge are generated, not hand-maintained.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for the directory-item schema, PR hygiene, and link-only policy.

- Prefer PRs that add **real, maintained** open-source projects related to TypeSafe Jev / System One (or high-signal X posts via the collector bot).
- Keep GitHub, YouTube, and X entries in `data/github.json`, `data/youtube.json`, and `data/x.json` respectively (`id`, `type`, `title`, `summary`, `url`, `sourceMeta`; tags only on GitHub / YouTube).
- One project per PR when possible; include a short summary and tags.
- Links only — no invented tweet IDs or PLACEHOLDER entries.

## License

This repository is public. Listed third-party projects keep their own licenses; we do not claim ownership of any third-party project. Curated list text and site code in this repo are available for reuse under the same spirit as typical awesome-lists (attribution appreciated).
