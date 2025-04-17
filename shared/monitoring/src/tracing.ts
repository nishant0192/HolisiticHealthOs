import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';

let sdk: NodeSDK | undefined;

export const initTracing = (serviceName: string) => {
  if (sdk) return; // singleton
  sdk = new NodeSDK({
    serviceName,
    instrumentations: [getNodeAutoInstrumentations()]
  });
  sdk.start();
  process.on('SIGTERM', async () => {
    await sdk?.shutdown();
  });
};
