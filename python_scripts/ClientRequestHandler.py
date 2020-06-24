import os
import json

from sys import getsizeof
from pathlib import Path
from net_socket import ClientSocket
from download import directory_download, file_download

class ClientRequestHandlerSwitch(object):
    def __init__(self, client_socket):
        self.net_socket = client_socket


    def handle_function_call(self, header, function_call_body):
        method_name = 'handle_' + header
        handler = getattr(self, method_name, lambda: "Unable to complete Request")
        
        return handler(function_call_body=function_call_body)

    def handle_update_server(self, function_call_body):
        self.net_socket.send({'header': 'update'})

        return {'response:': 'sent'}

    def handle_login(self, function_call_body):

        body = {
            'header': 'login',
            'username': function_call_body.get(2),
            'password': function_call_body.get(3)
        }

        self.net_socket.send(body)
        response = self.net_socket.response()

        if response.get('response') == 'true':
            response_body = {
                'authenticated': True,
                'user': response.get('user')
            }
        else:
            response_body = {
                'authenticated': False,
            }
        
        return response_body


    def handle_delete(self, function_call_body):

        body = {
            'header': 'delete',
            'to_delete': json.loads(function_call_body.get(3)),
            'current_directory': function_call_body.get(4)
        }

        self.net_socket.send(body)


        # return the updated directories
        return self.net_socket.response()

    def handle_download(self, function_call_body):
        user = function_call_body.get(2)
        item = function_call_body.get(3)
        download_directory = function_call_body.get(4)

        _, ext = os.path.splitext(item)

        # Item is a directory to download
        if not ext:
            return directory_download(user, item, download_directory, self.net_socket)
        else:
            return file_download(user, item, download_directory, self.net_socket)

    def handle_file_view(self, function_call_body):

        body = {
            'header': 'ls',
            'current_directory': function_call_body.get(2)
        }

        self.net_socket.send(body)
        current_directory_list = self.net_socket.response()

        return convertPath(current_directory_list)


    def recursive_get_dir_names(self, directory_path, directory_sub_path):
        list_dir_names = []
        dict_file_names = {}

        list_dir_names.append(directory_sub_path)
        directory_walked = os.walk(directory_path)

        # Get names of files in all sub-directories
        for root, sub_directories, files in directory_walked:
            for file in files:
                dict_file_names.update({os.path.join(directory_sub_path, file): {
                        'file_sub_path': os.path.join(directory_sub_path, file),
                        'file_full_path': os.path.join(root, file)
                    }
                })

            # This for loop only iterates once because the recursion will take care of the rest
            # of the sub directories in the list returned by os.walk().     
            for sub_dir in sub_directories:
                sub_dir_path = os.path.join(directory_path, sub_dir)
                sub_dir_sub_path = os.path.join(directory_sub_path, sub_dir)

                r_dir_names, r_file_names = self.recursive_get_dir_names(sub_dir_path, sub_dir_sub_path)
                list_dir_names = list_dir_names + r_dir_names
                dict_file_names.update(r_file_names)
            break

        return list_dir_names, dict_file_names


    def handle_send_file(self, function_call_body):
        dropped_items = json.loads(function_call_body.get(3))
        user = function_call_body.get(2)

        # List of Directories
        directories = dropped_items.get('directories')

        # List of File objects
        files = dropped_items.get('files')
        current_directory = dropped_items.get('current_directory')

        # Get the directory and file names of each sub-directory recursively
        list_dir_names = []
        dict_file_names = {}

        for i in range(0, len(directories)):
            r_dir_names, r_file_names = self.recursive_get_dir_names(directories[i].get('path'), directories[i].get('name'))
            list_dir_names.append(r_dir_names)
            dict_file_names.update(r_file_names)
            
        directory_body = {
            'directories': list_dir_names,
            'dir_files': dict_file_names,
            'files': files,
            'current_directory': current_directory,
            'user': user
        }

        request_body = {
            'header': 'upload',
        }
        self.net_socket.send(request_body)

        # Send Directory names for creation
        self.net_socket.send(directory_body)



        # Send Directory and individual files
        while True:
            try:
                # Recieve file request
                response = self.net_socket.response()
                file_name = response.get('file')

                if file_name == 'done':
                    break

                opened_file = open(file_name, 'rb')

                self.net_socket.send_file(opened_file.read())

                opened_file.close()
            except FileNotFoundError as error:
                print("Unable to find:", file_name)
                print(error)
                return response

        response = self.net_socket.response()


        return response

    def convertPath(self, paths):
        converted_paths = {}
        for dir in paths:
            new_dir = paths.get(dir)
            new_dir.update({'name': Path(new_dir.get('name'))})
            new_dir.update({'path': Path(new_dir.get('path'))})

            sub_directories = new_dir.get('sub_directories')
            new_sub_directories = []
            for i in range(0, len(sub_directories)):
                new_sub_directories.append(Path(sub_directories[i]))

            files = new_dir.get('files_names')
            new_files = []
            for i in range(0, len(files)):
                new_files.append(Path(files[i]))

            new_dir.update({'file_names': new_files})
            new_dir.update({'sub_directories': sub_directories})

            converted_paths.update({Path(dir): new_dir})

        return converted_paths


        