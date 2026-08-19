import { getFirebaseFcmReadiness, getFirebaseWebConfig } from './firebaseCloudMessaging.js';
import { getMqttBridgeStatus } from './iotBridge.js';
import { getWebRTCClientConfig, getWebRTCStatus } from './webrtcSignalling.js';

export interface IntegrationOperationalStatus {
  id: 'fcm' | 'mqtt_iot' | 'webrtc';
  configured: boolean;
  connected: boolean;
  runtimeReady: boolean;
  physicalOrProviderEvidenceRequired: boolean;
  detail: string;
}

export function getExternalIntegrationOperationalStatus(): IntegrationOperationalStatus[] {
  const fcm = getFirebaseFcmReadiness();
  const web = getFirebaseWebConfig();
  const mqtt = getMqttBridgeStatus();
  const webrtc = getWebRTCStatus();
  const webrtcConfig = getWebRTCClientConfig();

  return [
    {
      id: 'fcm',
      configured: fcm.configured && web.configured,
      connected: fcm.configured,
      runtimeReady: fcm.configured && web.configured,
      physicalOrProviderEvidenceRequired: true,
      detail: fcm.configured && web.configured
        ? 'Server and Web/PWA Firebase configuration are present. A real registered device and physical receipt still provide delivery evidence.'
        : fcm.reason || web.reason,
    },
    {
      id: 'mqtt_iot',
      configured: mqtt.configured,
      connected: mqtt.connected,
      runtimeReady: mqtt.configured && mqtt.connected,
      physicalOrProviderEvidenceRequired: true,
      detail: mqtt.connected
        ? `Broker connected; ${mqtt.subscribedTopics} authorized state topics are subscribed.`
        : mqtt.lastError || mqtt.activationRequirement,
    },
    {
      id: 'webrtc',
      configured: webrtc.relayConfigured,
      connected: false,
      runtimeReady: webrtc.available && webrtcConfig.iceServers.length > 0,
      physicalOrProviderEvidenceRequired: true,
      detail: webrtc.available
        ? `WebRTC signalling and ICE configuration are available via ${webrtcConfig.transport}; peer interoperability still requires a real call.`
        : webrtc.activationRequirement,
    },
  ];
}
