# Ditto

Ditto is mesh networking independent / for many different languages, frameworks and devices.

Setup for Rust:
https://docs.ditto.live/sdk/latest/install-guides/rust

We use it to keep the state of the library in sync between users collaborating.

## Mobile SDK override (Android/iOS)

For mobile builds, you can provide the closed-source Ditto SDK yourself (from the
Android/iOS SDKs) instead of using the Rust SDK. Point the build to the prebuilt
Ditto FFI library by exporting one of the following environment variables.

Android (aarch64):
```bash
export DITTOFFI_SEARCH_PATH=/path/to/ditto/android/aarch64
# or
export AARCH64_LINUX_ANDROID_OUT_DIR=/path/to/ditto/android/aarch64
RUSTUP_TOOLCHAIN=1.88 bunx tauri android dev
```

iOS (aarch64):
```bash
export DITTOFFI_SEARCH_PATH=/path/to/ditto/ios/aarch64
# or
export AARCH64_APPLE_IOS_OUT_DIR=/path/to/ditto/ios/aarch64
RUSTUP_TOOLCHAIN=1.88 bunx tauri ios dev
```

Troubleshooting docs are here: https://docs.ditto.live/sdk/latest/deployment/troubleshooting
Index:
OBTAINING AND ANALYZING THE DEBUG LOGS
SETTING THE LOGS TO DEBUG LEVEL
AUTHENTICATION
INCORRECT APP ID
OUTDATED CERTIFICATE
AUTHENTICATION SERVER UNAVAILABLE
DITTO CLOSING PREMATURELY
COMMON MISTAKES
IS YOUR AUTHCLIENT BECOMING GARBAGE COLLECTED?
SYNCING WITH BIG PEER
CORRUPTED CERTIFICATE
PERMISSIONS AND SUBSCRIPTIONS
PERMISSIONS
SUBSCRIPTIONS
QUERY PARSING ERRORS
WRITES
DID YOUR DEVICE CONNECT TO THE INTERNET?
DO YOU HAVE A FIREWALL OR PROXY ENABLED THAT IS BLOCKING DITTO’S CONNECTION TO THE BIG PEER?
CONNECTION ISSUES
BLUETOOTH
APPLE WIRELESS DIRECT LINK, P2P-WIFI, WIFI AWARE
LOCAL AREA NETWORK (LAN)
DEBUGGING BLOCKED TRANSACTIONS
DID YOUR CERTIFICATE EXPIRE AND FAIL TO REFRESH?
VERIFY THAT YOUR WEBHOOK PROVIDER NAME IS CORRECTLY COPIED IN THE DITTO PORTAL
IS YOUR AUTHCLIENT BECOMING GARBAGE COLLECTED?
BLUETOOTH
APPLE WIRELESS DIRECT LINK, P2P-WIFI, WIFI AWARE
LOCAL AREA NETWORK (LAN)
SYNCHRONIZATION SEEMS SLOW, OR COMES TO A HALT OVER TIME
APP IS USING TOO MUCH MEMORY, WHY?
DEBUGGING BLOCKED TRANSACTIONS
WHAT IS A “BLOCKED” TRANSACTION?
READ VS. WRITE TRANSACTIONS
READING THE LOGS
ORIGINATORS
CAUSES OF BLOCKED TRANSACTIONS
USER BLOCKS USER
STILL STUCK?'

## Ditto 101

Document Model

Copy page

Ditto stores data records as JSON-like documents. Internally these documents are CRDTs, which are a binary representation of JSON documents designed for automatic conflict resolution.

Creating documents

ditto
.store()
.execute_v2((
"INSERT INTO cars DOCUMENTS (:newCar)",
serde_json::json!({
"newCar": {
"color": "blue"
}
}),
)).await?;

Inserting multiple documents

ditto
.store()
.execute_v2((
"INSERT INTO cars DOCUMENTS (:doc1), (:doc2)",
serde_json::json!({
"doc1": {
"color": "blue"
},
"doc2": {
"color": "red"
}
}),
)).await?;

Reading documents

let result = ditto.store().execute_v2("SELECT \* FROM cars");

# Debugging Blocked Transactions

https://docs.ditto.live/sdk/latest/deployment/troubleshooting#debugging-blocked-transactions
