import mqtt from 'mqtt';

const client = mqtt.connect(process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883');

client.on('connect', () => {
    console.log('Connected to MQTT broker for IoT devices');
});

client.on('error', (err) => {
    console.error('MQTT Connection Error:', err);
});

export function sendMqttCommand(topic: string, payload: string) {
    if (client.connected) {
        client.publish(topic, payload);
    } else {
        console.warn('MQTT client not connected. Command dropped:', topic, payload);
    }
}
