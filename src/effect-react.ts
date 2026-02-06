import { Effect, Exit, Fiber, Runtime, Scope } from "effect";
import { useEffect } from "react";

const runtime = Runtime.defaultRuntime;

export function useEffectEffect<A, E>(
	effect: Effect.Effect<A, E, Scope.Scope>,
	deps: React.DependencyList,
) {
	useEffect(() => {
		// 1. Create a scope for this specific 'run'
		const scope = Runtime.runSync(runtime)(Scope.make());

		// 2. Build the program: provide the scope and handle errors
		const program = effect.pipe(
			Effect.provideService(Scope.Scope, scope),
			Effect.catchAllCause((cause) =>
				Effect.logError("Effect failed in useEffectEffect", cause),
			),
		);

		// 3. Start the execution
		const fiber = Runtime.runFork(runtime)(program);

		return () => {
			// 4. Cleanup: Close scope first (runs finalizers), then interrupt fiber (async, fire-and-forget)
			Runtime.runPromise(runtime)(
				Effect.all([Scope.close(scope, Exit.void), Fiber.interrupt(fiber)], {
					discard: true,
				}),
			).catch(() => {});
		};
	}, deps);
}
