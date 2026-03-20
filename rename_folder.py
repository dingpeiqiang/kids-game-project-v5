import os
src = r'c:\Users\a1521\Desktop\kids-game-project\kids-game-house\zhiwudazhanjiangshi'
dest = r'c:\Users\a1521\Desktop\kids-game-project\kids-game-house\plants-vs-zombie'

if os.path.exists(src):
    os.rename(src, dest)
    print('Folder renamed successfully!')
else:
    print('Source folder not found:', src)
