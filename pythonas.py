import paho.mqtt.client as mqtt
import traceback
import json
import time

mqtt_broker = "broker.hivemq.com"
mqtt_topic = "mortensineRfid/scan"
mqtt_outbound_topic = "mortensinaActivate/go"

def on_message(client, userdata, message):
    blob = message.payload.decode()
    parts = blob.split(", ")
    rfid = parts[0].split(": ")[1]
    in_out = parts[1].split(": ")[1] == "LOW"
    print(json.dumps({"rfid": rfid, "in_out": in_out}), flush=True)
    client.publish(mqtt_outbound_topic, True)

while True:
    try:
        client = mqtt.Client()
        client.on_message = on_message
        client.connect(mqtt_broker, 1883)
        client.subscribe(mqtt_topic)
        client.loop_forever()
    except Exception:
        traceback.print_exc()
        # Add a delay before attempting to reconnect
        time.sleep(5)  # Sleep for 5 seconds before attempting to reconnect
