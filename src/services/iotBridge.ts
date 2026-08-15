import mqtt, { type MqttClient } from 'mqtt';
import { isFeatureEnabled } from './featureFlags.js';

export interface MqttBridgeStatus {
    configured: boolean;
    enabled: boolean;
    connected: boolean;
    brokerConfigured: boolean;
    lastError?: string;
    activationRequirement: string;
}

let client: MqttClient | null = null;
let status: MqttBridgeStatus = {
    configured: false,
    enabled: false,
    connected: false,
    brokerConfigured: false,
    activationRequirement: 'Set MQTT_BROKER_URL and explicitly enable FF_IOT_REMOTE outside production only after broker/device authorization is verified.',
};

function startBridge(): void {
    const brokerUrl = String(process.env.MQTT_BROKER_URL || '').trim();
    const enabled = isFeatureEnabled(process.env.KURUKOO_DEFAULT_COUNTRY || 'ng', 'iot_remote');
    status = { ...status, enabled, brokerConfigured: Boolean(brokerUrl), configured: Boolean(brokerUrl && enabled) };
    if (!brokerUrl || !enabled || client) return;

    try {
        client = mqtt.connect(brokerUrl, { reconnectPeriod: 5000, connectTimeout: 5000 });
        client.on('connect', () => { status = { ...status, connected: true, lastError: undefined }; console.log('[MQTT] Broker connection established; external device delivery remains provider-dependent.'); });
        client.on('close', () => { status = { ...status, connected: false }; });
        client.on('error', (error) => { status = { ...status, connected: false, lastError: String(error?.message || error) }; console.error('[MQTT] Broker error:', status.lastError); });
    } catch (error) {
        status = { ...status, connected: false, lastError: String((error as Error)?.message || error) };
        client = null;
    }
}

export function getMqttBridgeStatus(): MqttBridgeStatus {
    startBridge();
    return { ...status };
}

export function sendMqttCommand(topic: string, payload: string): { accepted: boolean; state: 'queued' | 'not_configured' | 'not_connected'; reason?: string } {
    startBridge();
    if (!status.configured) return { accepted: false, state: 'not_configured', reason: status.activationRequirement };
    if (!client?.connected) return { accepted: false, state: 'not_connected', reason: status.lastError || 'MQTT broker is not connected; no command was delivered.' };
    client.publish(topic, payload, (error) => { if (error) status = { ...status, lastError: error.message }; });
    return { accepted: true, state: 'queued' };
}
