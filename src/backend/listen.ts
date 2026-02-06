import {
  EventName,
  EventCallback,
  Options,
  listen as listenCore,
} from "@tauri-apps/api/event";
import { Effect, Scope } from "effect";

export const listen = <T>(
  event: EventName,
  callback: EventCallback<T>,
  options?: Options,
): Effect.Effect<void, Error, Scope.Scope> =>
  Effect.acquireRelease(
    Effect.tryPromise({
      try: () =>
        listenCore<T>(event, callback, options).then((unlisten) => ({
          unlisten,
        })),
      catch: (e) => e as Error,
    }),
    ({ unlisten }) => Effect.sync(() => unlisten()),
  ).pipe(Effect.asVoid);
