can you read documents (that aren't synced to cloud) locally, and get somehow their cloud sync status to make it visual

Found results for read documents locally sync status cloud

Found results for cloud sync status visual indicator pending upload
Yes, you can read documents locally and track their cloud sync status. Here's how:

Reading Local Documents:
Use ditto.store.execute("SELECT _ FROM collection") to read documents from the local store regardless of sync status._

Tracking Cloud Sync Status:
Query the system:data_sync_info collection to monitor sync progress:

// Check cloud sync status
let result = await ditto.store.execute(
query: "SELECT \* FROM system:data_sync_info WHERE is_ditto_server = true"
)
Each document includes:

synced_up_to_local_commit_id - Latest commit ID synced to cloud
sync_session_status - "Connected", "Not Connected", or "Disabled"
Making it Visual:

Every mutation returns a commitID
Compare your document's commit ID with synced_up_to_local_commit_id
If synced_up_to_local_commit_id >= yourCommitID, the document has synced
Use registerObserver on system:data_sync_info for real-time UI updates showing sync status.

See Tracking Cloud Sync Status and System Sync Collection Reference for detailed examples.

https://docs.ditto.live/sdk/latest/sync/cloud-sync-status

The system:data_sync_info collection can be used to find and track cloud server connections.
To query for the Ditto Server (e.g. Cloud) connections only use the following DQL Query.
DQL
SELECT \* FROM system:data_sync_info
WHERE is_ditto_server = true
Check if you’re connected to the cloud:

Swift

Kotlin

JavaScript

TypeScript

Dart

Java

C#

C++

Rust

Go
let result = ditto.store().execute_v2((
"SELECT \* FROM system:data_sync_info WHERE is_ditto_server = true AND documents.sync_session_status = 'Connected' ORDER BY documents.synced_up_to_local_commit_id DESC LIMIT 1",
serde_json::Value::Null
)).await?;
println!("Connected to cloud: {}", !result.items().is_empty());
​

Verify Data Reached Cloud
Track when specific local commits reach the cloud:

Swift

Kotlin

JavaScript

TypeScript

Dart

Java

C#

C++

Rust

Go
// Step 1: Insert data and get commit ID
let result = ditto.store().execute_v2((
"INSERT INTO orders DOCUMENTS (:order)",
serde_json::json!({"order": {"\_id": "order-123", "total": 299.99}})
)).await?;
let commit_id = result.commit_id().unwrap();

// Step 2: Check if it synced to cloud
let sync_status = ditto.store().execute_v2((
"SELECT \* FROM system:data_sync_info WHERE is_ditto_server = true ORDER BY documents.synced_up_to_local_commit_id DESC LIMIT 1",
serde_json::Value::Null
)).await?;

if let Some(item) = sync_status.items().first() {
if let Some(value) = item.value().as_object() {
if let Some(documents) = value.get("documents").and_then(|d| d.as_object()) {
if let Some(synced_up_to) = documents.get("synced_up_to_local_commit_id").and_then(|s| s.as_u64()) {
if synced_up_to >= commit_id {
println!("✅ Commit synced to cloud");
} else {
println!("⏳ Commit pending sync");
}
}
}
}
}
​
Real-Time Sync Monitoring
​
Connection Status Observer
Monitor cloud connection Commits in real-time:
Observers on system:data_sync_info result in the callback triggering every 500ms even when the result remains the same. This frequency can be configured using the live_query_system_collection_refresh_interval system parameter.

Swift

Kotlin

JavaScript

TypeScript

Dart

Java

C#

C++

Rust

Go
let observer = ditto.store().register_observer(
"SELECT \* FROM system:data_sync_info WHERE is_ditto_server = true ORDER BY documents.synced_up_to_local_commit_id DESC LIMIT 1",
move |result| {
if let Some(item) = result.items().first() {
if let Some(value) = item.value().as_object() {
if let Some(documents) = value.get("documents").and_then(|d| d.as_object()) {
let is_connected = documents.get("sync_session_status")
.and_then(|s| s.as_str())
.map(|s| s == "Connected")
.unwrap_or(false);
println!("Cloud status: {}", if is_connected { "Connected" } else { "Disconnected" });
}
}
} else {
println!("Cloud status: No servers found");
}
}
)?;
​
Track Pending Cloud Syncs
Track multiple local commits and monitor when they sync to the cloud:

Swift

Kotlin

JavaScript

TypeScript

Dart

Java

C#

C++

Rust

Go
// Collect the local commit IDs we still need to confirm
let mut local_commit_ids: Vec<u64> = Vec::new();

// Watch the cloud sync progress
let observer = ditto.store().register_observer(
r#"
SELECT \*
FROM system:data_sync_info
WHERE is_ditto_server = true
ORDER BY documents.synced_up_to_local_commit_id DESC
LIMIT 1
"#,
move |result| {
if result.items().is_empty() { return; }

    if let Some(item) = result.items().first() {
      if let Some(value) = item.value().as_object() {
        if let Some(documents) = value.get("documents").and_then(|d| d.as_object()) {
          if let Some(latest_commit_id) = documents.get("synced_up_to_local_commit_id").and_then(|s| s.as_u64()) {

            // Find the first commitId that hasn't synced yet
            let mut confirmed_count = 0;
            for &commit_id in &local_commit_ids {
              if latest_commit_id >= commit_id {
                println!("Successfully synced commit {} to the cloud", commit_id);
                confirmed_count += 1;
              } else {
                break;  // Stop at first non-synced commit
              }
            }

            // Remove synced commitIds
            if confirmed_count > 0 {
              local_commit_ids.drain(0..confirmed_count);
            }
          }
        }
      }
    }

}
)?;

// Perform updates and track commit IDs
let result1 = ditto.store().execute_v2(("UPDATE customers SET verified = true WHERE \_id = 'customer-123'", serde_json::Value::Null)).await?;
if let Some(commit_id) = result1.commit_id() {
local_commit_ids.push(commit_id);
}

let result2 = ditto.store().execute_v2(("INSERT INTO orders DOCUMENTS ({ \_id: 'order-456', total: 599.99 })", serde_json::Value::Null)).await?;
if let Some(commit_id) = result2.commit_id() {
local_commit_ids.push(commit_id);
}
​
Monitor Incoming Cloud Data
Register an observer to track when new data arrives from the cloud by monitoring commits to last_update_received_time:
Observers on system:data_sync_info result in the callback triggering every 500ms even when the result remains the same. This frequency can be configured using the live_query_system_collection_refresh_interval system parameter.

Swift

Kotlin

JavaScript

TypeScript

Dart

Java

C#

C++

Rust

Go
// Watch for incoming data from cloud
let observer = ditto.store().register_observer(
"SELECT \* FROM system:data_sync_info WHERE is_ditto_server = true ORDER BY documents.synced_up_to_local_commit_id DESC LIMIT 1",
move |result| {
if result.items().is_empty() { return; }

    if let Some(item) = result.items().first() {
      if let Some(value) = item.value().as_object() {
        if let Some(documents) = value.get("documents").and_then(|d| d.as_object()) {
          if let Some(last_update) = documents.get("last_update_received_time").and_then(|s| s.as_i64()) {

            if last_update > 0 {
              println!("📥 New data received from cloud at: {}", last_update);
            }
          }
        }
      }
    }

}
)?;

# Presence

let presenceGraph = ditto.presence().graph()

{
localPeer: Peer;
remotePeers: Peer[];
}

let presenceObserver = ditto.presence().observe(move |\_graph| {
// observe changes to the presence graph
});

Reading Peer Keys
View your local device’s peer key or the peer key identifying a specific remote device:
To retrieve the peer key for the current peer:

Swift

Kotlin

JS

TS

Java

C#

C++

Rust

Dart

Go
ditto.presence().graph().local_peer.peer_key_string
To retrieve the peer key for a remote peer:

Swift

Kotlin

JS

TS

Java

C#

C++

Rust

Dart

Go
let remote_peers = ditto.presence().graph().remote_peers;
let first_peer = &remote_peers[0];

let peer_key_string = &first_peer.peer_key_string;
​
End-User Defined Peer Metadata
Using the peer-metadata property, you can provide each peer connected within the mesh the ability to set and view information about themselves or read information defined by other peers within the mesh.
Data added to the peer metadata object is shared during the connection handshake. Large data payloads may impact performance on low-bandwidth connections, such as BLE.
The following table provides an overview of key considerations to know before setting peer metadata, as well as Ditto’s recommended best practices to ensure optimal mesh performance and avoid potential issues:
Consideration Best Practice
Peer metadata syncs across the mesh with each new connection. Therefore, sharing large data over low-bandwidth transports, such as Bluetooth Low Energy (LE), and low-quality connections may slow or disrupt the connection process. Keep the size of peer metadata to a minimum, especially when syncing over Bluetooth LE or similar low-bandwidth transports. This is because peer metadata exceeding 128 KB, the maximum limit, results in the operation failing and Ditto throwing an error.
Peer metadata is visible to all peers connected in the mesh. Include only non-sensitive information in peer metadata.
​
Setting Local Peer Metadata
To implement functionality providing end users the ability to define metadata, call the setPeerMetadata API method as follows:

Swift

Kotlin

JS

TS

Java

C#

C++

Rust

Dart

Go
let metadata = json!({
"location": "inside",
});
ditto.presence().set_peer_metadata(&metadata)?;

Reading Local Peer Metadata
Once set, inspect the metadata:

Swift

Kotlin

JS

TS

Java

C#

C++

Rust

Dart

Go
// Reading from the presence namespace
ditto.presence().peer_metadata()

// Reading from the presence graph
ditto.presence().graph().local_peer.peer_metadata
​
Reading Remote Peer Metadata
To inspect the metadata set by all other peers in the mesh:

Swift

Kotlin

JS

TS

Java

C#

C++

Rust

Dart

Go
let remote_peers = ditto.presence().graph().remote_peers;
let first_peer = &remote_peers[0];

let peer_metadata = &first_peer.peer_metadata;
​
