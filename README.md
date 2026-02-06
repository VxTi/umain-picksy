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

1. data storage & sync protocol = all data that is persisted; this is like EventSource data stream
2. back-end front-end communication protocol = backend accesses files, metadata etc. front-end request what to display and sends what front-end controls are used, the backend reacts to that by emitting new data to be displayed.
