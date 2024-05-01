import sys
import os

os.environ['PYGAME_HIDE_SUPPORT_PROMPT'] = '1'
import pygame

def play_sound(user_id):
    # Map user IDs to sound files
    sounds = {
        'Siri Helene Wahl': 'swamp.mp3',
        'user2': 'sound2.mp3',
        # Add more users and sounds here
    }
    
    # Get the sound file for the user
    
    sound_file = sounds.get(user_id)

    if sound_file is None:
        print(f'No sound file found for user {user_id}')
        sound_file='swamp.mp3'

    # Initialize Pygame
    pygame.mixer.init()

    # Load the sound file
    pygame.mixer.music.load(os.path.join("sounds", sound_file))
    # Play the sound
    pygame.mixer.music.play()
    print("Playing sound", sound_file)

    # Wait for the sound to finish playing
    while pygame.mixer.music.get_busy():
        pygame.time.Clock().tick(10)

if __name__ == '__main__':
    # Get the user ID from the command line arguments
    user_id = sys.argv[1]

    # Play the sound for the user
    play_sound(user_id)