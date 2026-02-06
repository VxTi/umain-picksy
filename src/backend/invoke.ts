import { invoke as invokeCore } from "@tauri-apps/api/core";
import { Effect } from "effect";
import { Args, Command, Result } from "./commands";

export const invoke = <C extends Command>(
  command: C,
  args: Args<C>,
): Effect.Effect<Result<C>, Error> => {
  return Effect.tryPromise({
    try: () => invokeCore(command, args),
    catch: (error) =>
      error instanceof Error ? error : new Error(String(error)),
  });
};
