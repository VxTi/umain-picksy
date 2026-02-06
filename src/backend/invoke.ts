import { invoke as invokeCore, type InvokeArgs } from "@tauri-apps/api/core";
import { Data, Effect, ParseResult, Schema } from "effect";
import { Args, Command, CommandSchemas, Result } from "./commands";

/** Base type: any error produced by invoke */
export type InvokeError = InvokeFailedError | BackendUnexpectedDataError;

/** Backend call failed (e.g. command threw, bridge error) */
export class InvokeFailedError extends Data.TaggedError("InvokeFailedError")<{
  readonly cause: unknown;
}> {}

/** Backend returned value that failed schema validation */
export class BackendUnexpectedDataError extends Data.TaggedError("BackendUnexpectedDataError")<{
  readonly cause?: unknown;
}> {}

export const invoke = <C extends Command>(
  command: C,
  args: Args<C>,
): Effect.Effect<Result<C>, InvokeError> => {
  const resultSchema = CommandSchemas[command].result;
  return Effect.gen(function* () {
    const raw = yield* Effect.tryPromise({
      try: () => invokeCore(command, args as InvokeArgs),
      catch: (error) => new InvokeFailedError({ cause: error }),
    });
    const decoded = yield* Schema.decodeUnknown(resultSchema)(raw).pipe(
      Effect.mapError((e) =>
        new BackendUnexpectedDataError({
          cause: ParseResult.TreeFormatter.formatErrorSync(e),
        }),
      ),
    );
    return decoded as Result<C>;
  });
};
