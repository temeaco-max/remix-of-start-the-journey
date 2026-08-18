from pathlib import Path
from PIL import Image

repo = Path('/home/ubuntu/kurukoo-git')
source = Image.open(repo / 'public/assets/icons/favicon.png').convert('RGBA')
source.save(repo / 'public/favicon.ico', format='ICO', sizes=[(16,16),(32,32),(48,48),(64,64)])
print('created', repo / 'public/favicon.ico')
