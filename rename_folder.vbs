Set fso = CreateObject("Scripting.FileSystemObject")
source = "c:\Users\a1521\Desktop\kids-game-project\kids-game-house\zhiwudazhanjiangshi"
dest = "c:\Users\a1521\Desktop\kids-game-project\kids-game-house\plants-vs-zombie"

If fso.FolderExists(source) Then
    fso.MoveFolder source, dest
    WScript.Echo "Renamed successfully"
Else
    WScript.Echo "Source folder not found"
End If
