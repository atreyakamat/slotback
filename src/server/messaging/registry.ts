import { demoProvider } from "./demo-provider";
import type { MessageProvider } from "./provider";
import { whatsAppCloudProvider, whatsAppConfigFrom } from "./whatsapp-cloud";

const providers: Record<string, MessageProvider> = { demo: demoProvider };

/** Real providers are built on first use from their environment variables, so a missing key fails loudly. */
const factories: Record<string, () => MessageProvider> = {
  whatsapp_cloud: () => {
    const config = whatsAppConfigFrom(process.env);
    if (!config) throw new Error("MESSAGE_PROVIDER is whatsapp_cloud but WHATSAPP_ACCESS_TOKEN or WHATSAPP_PHONE_NUMBER_ID is missing");
    return whatsAppCloudProvider(config);
  },
};

/**
 * Resolves the provider for a location. Demo workspaces always use the simulated provider,
 * so a demo can never message a real phone.
 */
export function providerFor(opts: { isDemo: boolean; configured?: string }): MessageProvider {
  if (opts.isDemo) return demoProvider;
  return providerByName(opts.configured ?? "demo");
}

export function providerByName(name: string): MessageProvider {
  if (!providers[name] && factories[name]) providers[name] = factories[name]();
  const provider = providers[name];
  if (!provider) throw new Error(`Unknown message provider "${name}"`);
  return provider;
}

/** Adds a provider implementation (used by tests). */
export function registerProvider(provider: MessageProvider) {
  providers[provider.name] = provider;
}
