from tkinter import *
from tkterminal import Terminal
import tkinter.filedialog


def choose_file():
    global selected_file
    filetypes = [("all video format", ".mp4"),
                 ("all video format", ".flv"),
                 ("all video format", ".avi"),
                 ("all video format", ".webm")]
    selected_file = tkinter.filedialog.askopenfilename(filetypes=filetypes)
    terminal.run_command(f"echo {selected_file}")


def run():
    selected_mode = mode.get()
    if selected_file == "":
        terminal.run_command("echo no file selected!")
        return
    terminal.run_command(f'node wackywebm.js {selected_mode} "{selected_file}"')


selected_file = ""
window = Tk()
icon = PhotoImage(file="icon.ico")
window.iconphoto(True, icon)
window.geometry("810x400")
window.title("Wacky WebM")
window.config(bg="gray")
window.resizable(False, False)

terminal = Terminal(window, bg="white", fg="black")
terminal.basename = "wackywebm$"
terminal.shell = True

mode = StringVar(window)
modes = ['Bounce', 'Shutter', 'Sporadic', 'Bounce+Shutter', 'Shrink', 'Audio-Bounce', 'Audio-Shutter']
mode.set(modes[0])
mode_width = len(max(modes, key=len))

mode_select = OptionMenu(window, mode, *modes)
mode_select.config(bg="gray", font=("Calibri", 12), highlightthickness=0, width=mode_width)
file_button = Button(window, text="Select file", bg="gray", fg="black", font=("Calibri", 15), command=choose_file)
run_button = Button(window, text="Execute", bg="gray", fg="black", font=("Calibri", 15), command=run)


mode_select.place(x=4, y=30)
file_button.place(x=30, y=80)
run_button.place(x=37, y=145)
terminal.place(x=160, y=6)
window.mainloop()