import os
import sys
import time
import pygame
import paho.mqtt.client as mqtt
from gtts import gTTS
import random
from pydub import AudioSegment


# MQTT settings
mqtt_broker = "broker.hivemq.com"
mqtt_outbound_topic = "mortensinaActivate/go"

def add_silence_to_start(audio_file, duration_ms):
    """Add silence to the start of the audio file."""
    silence = AudioSegment.silent(duration=duration_ms)
    audio = AudioSegment.from_mp3(audio_file)
    combined = silence + audio
    combined.export(audio_file, format='mp3')

def read_greetings(filename):
    """Read greetings from a text file and return a dictionary of greetings and current index."""
    greetings = {'in': {'index': 0, 'greetings': []}, 'ut': {'index': 0, 'greetings': []}}
    current_event = None
    
    with open(filename, 'r') as file:
        for line in file:
            line = line.strip()
            if line.startswith('[') and '][' in line:
                event_type, index = line[1:-1].split('][')
                greetings[event_type]['index'] = int(index)
                current_event = event_type
            elif line:
                greetings[current_event]['greetings'].append(line)
    
    return greetings

def write_greetings(filename, greetings):
    """Write the greetings and current index to a text file."""
    with open(filename, 'w') as file:
        for event_type in greetings:
            file.write(f'[{event_type}][{greetings[event_type]["index"]}]\n')
            for greeting in greetings[event_type]['greetings']:
                file.write(f'{greeting}\n')

def get_next_greeting(greetings, event_type , name):
    """Get the next greeting from the list for the specified event type."""
    index = greetings[event_type]['index']
    greeting = greetings[event_type]['greetings'][index]
    greetings[event_type]['index'] = (index + 1) % len(greetings[event_type]['greetings'])
    
    # Reshuffle if we've used all greetings
    if greetings[event_type]['index'] == 0:
        random.shuffle(greetings[event_type]['greetings'])
    
    return greeting.format(name=name)

def update_greeting_file(filename, greetings):
    """Update the greeting file with the new order and index."""
    with open(filename, 'w') as file:
        for event_type in greetings:
            file.write(f'[{event_type}][{greetings[event_type]["index"]}]\n')
            for greeting in greetings[event_type]['greetings']:
                file.write(f'{greeting}\n')



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
        
        greetings = read_greetings(filename)
        
        # Example usage
        greeting_text = get_next_greeting(greetings, event,name)
        print(greeting_text)
        
        # Update greeting file with new order and index
        update_greeting_file(filename, greetings)


    # Create the speech using gTTS
    tts = gTTS(text=greeting_text, lang='en', slow=False)

    # Save the speech to an MP3 file
    greeting_file = "greeting.mp3"
    tts.save(greeting_file)
    add_silence_to_start(greeting_file, 1000)
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
