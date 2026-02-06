import { type Options, listen as listenCore } from "@tauri-apps/api/event";
import { Data, Effect, ParseResult, Schema, Scope } from "effect";
import { type Events, type Result, EventsSchemas } from "./events";

/** Event payload failed schema validation */
export class EventUnexpectedDataError extends Data.TaggedError(
  "EventUnexpectedDataError",
)<{
  readonly cause?: unknown;
}> {}

type ListenOptions = Options & {
  onValidationError?: (err: EventUnexpectedDataError) => void;
};

export const listen = <E extends Events>(
  event: E,
  callback: (payload: Result<E>) => void,
  options?: ListenOptions,
): Effect.Effect<void, Error, Scope.Scope> => {
  const payloadSchema = EventsSchemas[event].result;
  const { onValidationError, ...tauriOptions } = options ?? {};
  return Effect.acquireRelease(
    Effect.tryPromise({
      try: () =>
        listenCore<unknown>(
          event,
          (ev) => {
            const decoded = Schema.decodeUnknown(payloadSchema)(
              ev.payload,
            ).pipe(
              Effect.mapError(
                (e) =>
                  new EventUnexpectedDataError({
                    cause: ParseResult.TreeFormatter.formatErrorSync(e),
                  }),
              ),
            );
            const result = Effect.runSync(Effect.either(decoded));
            if (result._tag === "Left") {
              onValidationError?.(result.left);
              return;
            }
            callback(result.right as Result<E>);
          },
          tauriOptions,
        ).then((unlisten) => ({ unlisten })),
      catch: (e) => e as Error,
    }),
    ({ unlisten }) => Effect.sync(() => unlisten()),
  ).pipe(Effect.asVoid);
};
