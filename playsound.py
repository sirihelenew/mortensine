import sys
import os
import random

os.environ['PYGAME_HIDE_SUPPORT_PROMPT'] = '1'
import pygame

def play_sound(user_id):
    # Map user IDs to sound files
    sound_file=None
    dir_path = os.path.join('uploads', user_id)
    if not os.path.exists(dir_path):
        print(f'No directory found for user {user_id}')
    else:
        sound_files = [f for f in os.listdir(dir_path) if f.endswith('.mp3') or f.endswith('.wav')]
        sound_file = random.choice(sound_files)

    # Get the sound file for the user
    
    if sound_file is None:
        print(f'No sound file found for user {user_id}')
        sound_file='swamp.mp3'
        dir_path=os.path.join("uploads")

    # Initialize Pygame
    pygame.init()  
    pygame.mixer.init()

    # Load the sound file
    pygame.mixer.music.load(os.path.join(dir_path, sound_file))
    # Play the sound
    pygame.mixer.music.play()
    print("Playing sound", sound_file)
    pygame.time.set_timer(pygame.USEREVENT, 15000)


    # Wait for the sound to finish playing
    while pygame.mixer.music.get_busy():
        for event in pygame.event.get():
            if event.type == pygame.USEREVENT:
                pygame.mixer.music.stop()
        pygame.time.Clock().tick(10)

if __name__ == '__main__':
    # Get the user ID from the command line arguments
    user_id = sys.argv[1]

    # Play the sound for the user
    play_sound(user_id)