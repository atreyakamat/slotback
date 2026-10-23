import { demoProvider } from "./demo-provider";
import type { MessageProvider } from "./provider";

const providers: Record<string, MessageProvider> = { demo: demoProvider };

/**
 * Resolves the provider for a location. Demo workspaces always use the simulated provider,
 * so a demo can never message a real phone. Real providers are added here once approved.
 */
export function providerFor(opts: { isDemo: boolean; configured?: string }): MessageProvider {
  if (opts.isDemo) return demoProvider;
  const provider = providers[opts.configured ?? "demo"];
  if (!provider) throw new Error(`Unknown message provider "${opts.configured}"`);
  return provider;
}

export function providerByName(name: string): MessageProvider {
  const provider = providers[name];
  if (!provider) throw new Error(`Unknown message provider "${name}"`);
  return provider;
}

/** Adds a provider implementation (used for real providers once approved, and by tests). */
export function registerProvider(provider: MessageProvider) {
  providers[provider.name] = provider;
}
