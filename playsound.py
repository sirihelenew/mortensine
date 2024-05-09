import sys
import os
import random
import json

os.environ['PYGAME_HIDE_SUPPORT_PROMPT'] = '1'
import pygame
def play_sound(user_id):
    try:
    # Map user IDs to sound files
        sound_file=None
        dir_path = os.path.join('uploads', user_id)
        if not os.path.exists(dir_path):
            print(f'No directory found for user {user_id}')
        else:
            sound_files = [f for f in os.listdir(dir_path) if f.endswith('.mp3') or f.endswith('.wav')]
            try:
                with open('sound_indices.json', 'r') as file:
                    sound_indices = json.load(file)
            except FileNotFoundError:
                sound_indices = {}
            # Get the current index for the user
            sound_index = sound_indices.get(user_id, 0)
            # Use the sound_index to select a sound file
            if len(sound_files) == 0:
                print(f'No sound files found for user {user_id}')
            else:
                sound_file = sound_files[sound_index % len(sound_files)]
            # Increment the sound_index and save it
                sound_indices[user_id] = sound_index + 1
            # Write the sound indices back to the file
                with open('sound_indices.json', 'w') as file:
                    json.dump(sound_indices, file)

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
        pygame.time.set_timer(pygame.USEREVENT, 15000)
        name = sound_file.split('-')[0]
        print(name)
        # Wait for the sound to finish playing
        while pygame.mixer.music.get_busy():
            for event in pygame.event.get():
                if event.type == pygame.USEREVENT:
                    pygame.mixer.music.stop()
            pygame.time.Clock().tick(10)
    except Exception as e:
        print(f"An error occure: {e}-b")

if __name__ == '__main__':
    # Get the user ID from the command line arguments
    user_id = sys.argv[1]

    # Play the sound for the user
    play_sound(user_id)