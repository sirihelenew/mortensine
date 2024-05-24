import os
import sys
import time
import pygame
import threading
import paho.mqtt.client as mqtt
from gtts import gTTS
import random

# MQTT settings
mqtt_broker = "broker.hivemq.com"
mqtt_outbound_topic = "mortensinaActivate/go"

def read_greetings(filename):
    """Read greetings from a text file and return a dictionary of greetings."""
    greetings = {'in': [], 'ut': []}
    with open(filename, 'r') as file:
        current_event = None
        for line in file:
            line = line.strip()  # Remove leading and trailing whitespace
            if line.startswith('[') and line.endswith(']'):
                current_event = line[1:-1]  # Extract the event type from brackets
            elif line:  # Check if the line is not empty
                greetings[current_event].append(line)
        # Shuffle the list of greetings for each event type
        random.shuffle(greetings['in'])
        random.shuffle(greetings['ut'])
    return greetings

def select_random_greeting(greetings, event, name):
    """Select a random greeting from the list of greetings based on the event."""
    greeting = random.choice(greetings[event])
    return greeting.format(name=name)


def on_connect(client, userdata, flags, rc):
    if rc == 0:
        print("Connected to MQTT Broker")
    else:
        print("Failed to connect, return code %d\n", rc)

def send_mqtt_message():
    # Create MQTT client
    client = mqtt.Client()
    
    # Define on_connect callback
    def on_connect(client, userdata, flags, rc):
        if rc == 0:
            print("Connected to MQTT Broker")
            # Once connected, publish the message
            client.publish(mqtt_outbound_topic, "true")
            print("Message sent")
            # Disconnect from MQTT broker
            client.disconnect()
        else:
            print("Failed to connect to MQTT Broker, return code:", rc)
    
    # Assign on_connect callback
    client.on_connect = on_connect
    
    # Connect to MQTT broker
    client.connect(mqtt_broker, 1883, 60)

    # Start the MQTT client loop to process incoming and outgoing messages
    client.loop_start()


def play_audio(filename):
    pygame.mixer.init()
    pygame.mixer.music.load(filename)
    pygame.mixer.music.play()

def main():
    # Check if the correct number of arguments are provided
    if len(sys.argv) != 3:
        print("Usage: python program.py <name> <event>")
        print("Example: python program.py Erik entry")
        sys.exit(1)

    # Get the name and event from the command-line arguments
    name = sys.argv[1]
    event = sys.argv[2]

    # Set the Bluetooth sink
    os.environ['PULSE_SINK'] = 'bluez_output.FC_A8_9A_AF_F4_44.1'

    # Send MQTT message
    #send_mqtt_message()
    if name == "undefined":
        greeting_text="""
        Sign up for mortensine.no or get the fuck out of this room right now........ I swear to god i will get my robot ass off this chair and robochop your nuts off..........Thank you for cooperating, i am mortensina"""
    else:
        # Define the greeting text based on the event
        filename = 'greetings.txt'
        
        # Read greetings from the file
        greetings = read_greetings(filename)

        greeting_text = select_random_greeting(greetings, event, name)


    # Create the speech using gTTS
    tts = gTTS(text=greeting_text, lang='en', slow=False)

    # Save the speech to an MP3 file
    greeting_file = "greeting.mp3"
    tts.save(greeting_file)

    # Initialize pygame mixer
    pygame.mixer.init()

    # Load and play the MP3 file
    pygame.mixer.music.load(greeting_file)
    pygame.mixer.music.play()

    # Keep the script running until the music finishes
    while pygame.mixer.music.get_busy():
        time.sleep(1)

    # Clean up the MP3 file
    os.remove(greeting_file)

if __name__ == "__main__":
    main()
