import { invoke as invokeCore, InvokeArgs } from "@tauri-apps/api/core";
import { Effect } from "effect";

export const invoke = <T extends InvokeArgs>(command: string, args: T): Effect.Effect<T, Error> => {
    return Effect.tryPromise({
        try: () => invokeCore(command, args),
        catch: (error) => (error instanceof Error ? error : new Error(String(error))),
    });
};