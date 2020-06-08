from pathlib import Path
from datetime import datetime

def main_log(user, base_dir, service_provided):
    file_name = user + ".txt"
    log_file = open(Path(base_dir, file_name), 'a')

    word = "[ " + datetime.now().strftime("%m/%d/%Y, %H:%M:%S") + " ]: " + service_provided
    print("Service word", word)

    log_file.write(word)