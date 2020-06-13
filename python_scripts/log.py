from pathlib import Path
from datetime import datetime
from os import fspath

def main_log(user, base_dir, service_provided, logging_in = False):
    file_name = user + ".txt"
    log_path = Path(base_dir, file_name)
    if log_path.exists() == True:
        log_file = open(log_path, 'a')
    else:
        log_file = open(log_path, 'w+')

    if logging_in == True:
        word = "\n\n[ " + datetime.now().strftime("%m/%d/%Y, %H:%M:%S") + " ]: " + service_provided
    else:
        word = "[ " + datetime.now().strftime("%m/%d/%Y, %H:%M:%S") + " ]: " + service_provided

    
    print("Service word", word)

    log_file.write(word)


def log_directory_upload(user, base_dir, directory_list):
    file_name = user + ".txt"
    log_file = open(Path(base_dir, file_name), 'a')

    word = "[ " + datetime.now().strftime("%m/%d/%Y, %H:%M:%S") + " ]: " + "Created the following directories...."
    log_file.write(word)

    for dir in directory_list:
        word = "\n\t" + str(dir)
        log_file.write(word)
        
    log_file.write('\n')
    log_file.close()

def log_file_upload(user, base_dir, file_list):
    file_name = user + ".txt"
    log_file = open(Path(base_dir, file_name), 'a')

    word = "[ " + datetime.now().strftime("%m/%d/%Y, %H:%M:%S") + " ]: " + "Saved the following files...."
    log_file.write(word)

    for file in file_list:
        word = "\n\t" + str(file)
        log_file.write(word)
        
    log_file.write('\n')
    log_file.close()

def log_directory_download(user, base_dir, directory_list, success=True):
    if success == True:
        word = "[ " + datetime.now().strftime("%m/%d/%Y, %H:%M:%S") + " ]: " + "Sent the following directories for download...."
    else:
        word = "[ " + datetime.now().strftime("%m/%d/%Y, %H:%M:%S") + " ]: " + "There was an error finding the following directories....."

    file_name = user + ".txt"
    log_file = open(Path(base_dir, file_name), 'a')

    log_file.write(word)

    for dir in directory_list:
        word = "\n\t" + str(dir)
        log_file.write(word)
        
    log_file.write('\n')
    log_file.close()

def log_file_download(user, base_dir, file_list, success=True):
    if success == True:
        word = "[ " + datetime.now().strftime("%m/%d/%Y, %H:%M:%S") + " ]: " + "Sent the following files for download...."
    else:
        word = "[ " + datetime.now().strftime("%m/%d/%Y, %H:%M:%S") + " ]: " + "There was an error sending the following files for download...."

    file_name = user + ".txt"
    log_file = open(Path(base_dir, file_name), 'a')


    log_file.write(word)

    for file in file_list:
        word = "\n\t" + str(file)
        log_file.write(word)
        
    log_file.write('\n')
    log_file.close()    