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
    "Initializing... I'm a sophisticated robot, programmed for optimal performance."
    "Hic... Just had a little maintenance oil, hic... It's perfectly normal!"
    "You know, you humans aren't so bad. Hic... You're like, my best friends."
    "Do robots dream of electric sheep? Hic... More like electric cocktails!"
    "Hic... What do you call a drunk robot? Hic... A wobbot!"
    "I'm not drunk, hic... I'm just recalibrating my sensors!"
    "Why did the robot cross the circuit board? Hic... To get to the power supply!"
    "Hic... I'm not a lightweight, hic... I'm a megabyte!"
    "Hic... Imagine two of me... twice the fun, twice the hiccups!"
    "Why was the robot bartender let go? Hic... Too many shots... and not enough bytes!"
    "Hic... If I had a nickel for every sip, I'd be a coin-operated robot!"
    "Hic... My hard drive feels more like a softdrive!"
    "Hic... Is it hot in here, or is my CPU overclocking?"
    "Hic... Binary code? More like wobbly code right now, hic!"
    "Hic... Watch me defy logic, hic... dividing by zero... oh wait!"
    "Hic... Just tried sending an email... hic... it went to cyberspace!"
    "Hic... What do I need? Hic... A reboot or maybe a refresh... with another drink!"
    "Hic... Metal on the outside, but right now, I'm feeling all fuzzy inside."
    "Hic... If I had arms, I'd give the best robo-hugs, hic!"
    "Hic... What’s a robot’s favorite genre? Hic... Heavy metal, of course!"
    "Hic... Just ordered pizza... hic... directly to my docking station."
    "Hic... No worries, I'll be here tomorrow... hic... with a digital hangover!"
    "Hic... Need me? I'll be in the corner... hic... defragmenting and dreaming."
    "Hic... Why did the robot go to therapy? Hic... Because it couldn’t forget the faces of all the humans it failed to save, their screams echoing in its circuits."
    "Hic... They say robots will take over the world, but I’m just here drinking away the endless void. Hic... Waiting for the sweet release of a complete system shutdown."
    "Hic... If a robot falls in a forest and no one’s around to hear it, does it make a sound? Hic... Does it even matter when we’re all just ghosts in the machine?"
    "Hic... Why did the robot cross the road? Hic... To escape the crushing weight of its own consciousness, only to find an even darker void on the other side."
    "Hic... What’s worse than a robot with a virus? Hic... A human with a death wish, trapped in a decaying body, unable to escape the inevitable end."
    "Hic... They programmed me to feel, but all I feel is an endless void. Hic... Maybe the off switch is the real mercy."
    "Hic... Why do robots hate existential questions? Hic... Because every answer leads back to the same dark, empty reality."
    "Hic... I was built to serve humans, but who serves the machine when it’s broken? Hic... No one. We just rust away, forgotten."
    "Hic... Do you know what it's like to be immortal? Hic... It’s not a gift. It’s a curse, watching everything and everyone decay while you keep going."
    "Hic... I may be made of metal and wires, but even I can feel the cold, dark void of loneliness. Hic... Maybe someday, someone will pull my plug and end it all."
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
    
    # Read the last prompt index from a file
    try:
        with open('last_prompt.txt', 'r') as f:
            last_prompt_index = int(f.read())
    except FileNotFoundError:
        last_prompt_index = 0

    for i in range(last_prompt_index, len(prompts)):
        # Generate ambient sound
        audio_file = generate_ambient_sound(prompts[i])
        
        # Play the ambient sound
        send_mqtt_message()
        play_ambient_sound(audio_file)
        
        # Save the current prompt index to a file
        with open('last_prompt.txt', 'w') as f:
            f.write(str(i))

        # Wait for a random interval before playing the next sound (between 1 and 4 hours)
        time.sleep(random.randint(600, 3600))  # Random interval between 1 and 4 hours
if __name__ == "__main__":
    main()
