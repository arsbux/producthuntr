import os
import re

directory = '/Users/keithkatale/Downloads/productHuntr/public/marquee'
files = [f for f in os.listdir(directory) if f.endswith('.avif')]
files.sort()

new_files = []

for i, filename in enumerate(files):
    old_path = os.path.join(directory, filename)
    new_filename = f"icon_{i+1}.avif"
    new_path = os.path.join(directory, new_filename)
    os.rename(old_path, new_path)
    new_files.append(f"/marquee/{new_filename}")
    print(f"Renamed '{filename}' to '{new_filename}'")

print("\nNew file list for TSX:")
print(new_files)
