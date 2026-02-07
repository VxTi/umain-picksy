export interface PresencePeer {
	peer_key: string;
	device_name: string;
	metadata: Record<string, unknown> | null;
}

export interface PresencePayload {
	local_peer: PresencePeer;
	remote_peers: PresencePeer[];
}
