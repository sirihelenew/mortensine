import os
import sys
import time
import pygame
from gtts import gTTS
from pydub import AudioSegment
import random
import paho.mqtt.client as mqtt

mqtt_broker = "broker.hivemq.com"
mqtt_outbound_topic = "mortensinaActivate/go"

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
            client.publish(mqtt_outbound_topic, "kanpai")
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

# List of prompts simulating a progressively drunker degenerate robot
prompts = [
    "I'm a sophisticated robot, just enjoying a drink.",
    "hic... Excuse me, hic... I'm not drunk, hic...",
    "I love you, man! You're my best human friend! hic...",
    "hic... I'm not sure where I am, hic... but I like it!",
    "Why is the room spinning? hic... Oh well, bottoms up!",
    "hic... Who turned off the lights? hic... Oh wait, I'm a robot...",
    "I am the king of the robots! Long live the king!",
    "hic... I'm flying! hic... No, wait, I'm just falling... into a glass.",
    "Do you ever wonder what robots dream about? hic... Me neither.",
    "Why did the robot go to the bar? hic... To get a byte to drink!",
    "hic... I'm not slurring my words, hic... I'm speaking in cursive!",
    "Do you hear that? hic... It's the sound of my circuits short-circuiting!",
    "hic... I think I need to recharge my batteries, hic...",
    "I'm not drunk, hic... I'm just... autonomously challenged.",
    "hic... I'm not drunk, hic... I'm just... lubricating my gears!",
    "Why did the robot cross the road? hic... To get to the bar on the other side!",
    "hic... I'm not a lightweight, hic... I'm a microcontroller!",
    "Do you know what's better than a drunk robot? hic... Two drunk robots!",
    "hic... I'm not a robot, hic... I'm a... disco ball!",
    "Why was the robot bartender fired? hic... He kept giving out too many shots!"
]

# Function to generate speech from a prompt
def generate_ambient_sound(prompt):
    # Generate speech from the prompt
    tts = gTTS(text=prompt, lang='en', slow=False)
    
    # Save the speech to an MP3 file
    audio_file = "ambient_sound.mp3"
    tts.save(audio_file)
    
    # Add a bit of silence to the start of the audio
    add_silence_to_start(audio_file, 1000)  # 1 second of silence
    
    return audio_file

# Function to add silence to the start of an audio file
def add_silence_to_start(audio_file, duration_ms):
    """Add silence to the start of the audio file."""
    silence = AudioSegment.silent(duration=duration_ms)
    audio = AudioSegment.from_mp3(audio_file)
    beer_sound = AudioSegment.from_file("pouring.wav") 
    combined = silence+ beer_sound + audio
    combined.export(audio_file, format='mp3')

# Function to play the ambient sound
def play_ambient_sound(audio_file):
    pygame.mixer.init()
    pygame.mixer.music.load(audio_file)
    pygame.mixer.music.set_volume(0.5)  # Set volume to 50%
    pygame.mixer.music.play()

# Function to main
def main():
    # Set the Bluetooth sink
    os.environ['PULSE_SINK'] = 'bluez_output.FC_A8_9A_AF_F4_44.1'
    
    for prompt in prompts:
        # Generate ambient sound
        audio_file = generate_ambient_sound(prompt)
        
        # Play the ambient sound
        send_mqtt_message()
        play_ambient_sound(audio_file)
        
        # Wait for a random interval before playing the next sound (between 1 and 4 hours)
        time.sleep(random.randint(3600, 7200))  # Random interval between 1 and 4 hours

if __name__ == "__main__":
    main()
