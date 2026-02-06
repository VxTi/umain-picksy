# Tauri + React + Typescript

This template should help get you started developing with Tauri, React and Typescript in Vite.

## Key dependencies

- **[effect-ts](https://effect.website/)** — Effect system for TypeScript
- **[react-photo-view](https://github.com/MinJieLiu/react-photo-view)** — Photo preview component

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)

## Setup
```bash
curl -fsSL https://bun.com/install | bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

## Protocol

There are 2 important protocols in this app:

1. commands.ts:  Data storage & sync protocol = all data that is persisted; this is like EventSource data stream.
2. ditto         Back-end & front-end communication protocol = backend accesses files, metadata etc. Front-end
                 request what to display and sends what front-end controls are used, the backend reacts to that
                 by emitting new data to be displayed.

For peers, pictures are added to the Ditto storage as ATTACHMENT. The metadata in the storage contains a small base64 thumbnail, but the full picture is only downloaded upon request.

https://docs.ditto.live/sdk/latest/crud/working-with-attachments

## Ditto protocol
The typical flow of a Ditto session:

1. user A opens app
2. user A opens folder
3. list of photos is added to storage; metadata is embedded
4. user B opens app
5. user B's client shows the list of photos
6. user B's client downloads the full photos (attachments) for the currently displayed images

In this flow there is also front-end - back-end communication which follows logically from the Ditto session: the Ditto changes will constantly inform the front-ends (on both clients) about the latest state of the storage and the front-end will then request the metadata & images it wants to display.
