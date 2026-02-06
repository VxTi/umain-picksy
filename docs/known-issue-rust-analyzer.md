# Known Issue: rust-analyzer proc macro server error

## Symptoms

You may see an error like:

```
tauri::command: proc macro server error: Cannot create expander for .../libtauri_macros-*.dylib: unsupported metadata version 10
rust-analyzer: macro-error
```

## Cause

This is a tooling mismatch: rust-analyzer's proc-macro server cannot load the
`tauri_macros` dylib because it was built with a newer Rust metadata version
than the analyzer understands. It is not a runtime error in the app.

## Fix

Prefer aligning rust-analyzer with your Rust toolchain:

1. Install the rustup-provided server:
   - `rustup component add rust-analyzer`
2. Point your editor to it:
   - Set `rust-analyzer.server.path` to `~/.cargo/bin/rust-analyzer`
3. Restart the editor and rebuild if needed.

## Workarounds

- Reinstall/upgrade the rust-analyzer extension and run "Rust Analyzer: Clear
  Cache and Restart".
- Disable proc macro expansion:
  - Set `rust-analyzer.procMacro.enable` to `false` (macros will not expand).

## Notes

- `rustup update` being "up to date" does not guarantee rust-analyzer matches
  the current Rust metadata version.

