from os import path, mkdir
from pathlib import Path

def directory_download(user, item, download_directory, socket):
    download_body = {
        'header': 'download',
        'type': 'directory',
        'item': item,
        'user': user
    }
    socket.send(download_body)

    # Check if the Directory is found on the server
    response = socket.response()
    if response.get('found') == 'false':
        response = socket.response()
        return {
            'downloaded': False,
            'unsaved_files': [item]
        }


    list_dir = response.get('dir_list')
    i = 0
    root_removal = ''
    for directory in list_dir:
        if i == 0:
            root_removal, directory = path.split(directory)
            i += 1
        else:
            directory = directory.replace(root_removal, '')
            directory = directory[1:]

        dir_path = Path(download_directory, directory)

        if not path.exists(dir_path):
            mkdir(dir_path)

    # get list of files
    response = socket.response()
    files = response.get('file_list')

    unsaved_files = get_file(socket, user, download_directory, files, root_removal)

    return {
        'downloaded': True,
        'unsaved_files': unsaved_files
    }
    


def file_download(user, item, directory, socket):
    download_body = {
        'header': 'download',
        'type': 'file',
        'item': item,
        'user': user
    }
    socket.send(download_body)
    status = socket.response()

    if status.get('found') == 'false':
        status = socket.response()
        return {
            'downloaded': False,
            'unsaved_files': [item]
        }

    file_bytes = socket.recieve_file()
    _, item = path.split(item)
    try:
        opened_file = open(Path(directory, item), 'wb')
        opened_file.write(file_bytes)
        opened_file.close()
    except IOError as error:
        print("There was an error saving file")
        print(error)
        return {
            'downloaded': False,
            'unsaved_files': [item]
        }

    return {
        'downloaded': True,
        'unsaved_files': []
    }



def get_file(socket, user, parent_directory, files, root_removal):
    unsaved_files = []
    opened_file = None
    for file in files:
        try:
            file = files.get(file)
            path = file.get('file_sub_path').replace(root_removal, '', 1)
            path = path[1:]
            path = Path(parent_directory, path)
            opened_file = open(path, "wb")

            # request file bytes
            file_request = {
                'file': file.get('file_full_path')
            }
            socket.send(file_request)

            status = socket.response()

            if status.get('found') == 'false':
                unsaved_files.append(file.get('file_sub_path'))
                opened_file.close()
                continue


            # recieve file bytes
            file_bytes = socket.recieve_file()

            # write bytes
            opened_file.write(file_bytes)
            opened_file.close()
        except IOError as error:
            unsaved_files.append(file.get('file_sub_path'))
            print(error)
            if opened_file is not None:
                opened_file.close()
            continue

    socket.send({'file': 'done'})

    return unsaved_files