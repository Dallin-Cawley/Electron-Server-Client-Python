
import json
import globals
import log
import sys

from security import security
from sys import getsizeof
from shutil import rmtree
from pathlib import PurePath, Path
from os import path, mkdir, walk, remove


class ServerRequestHandlerSwitch:
    def __init__(self, con_socket):
        self.con_socket = con_socket

    def handle_request(self, header, request_body):
        if " " in header:
            header = header.replace(" ", "_")

        method_name = 'handle_' + header
        handler = getattr(self, method_name, lambda: "Unable to complete Request")

        return handler(request_body=request_body)

    def handle_login(self, request_body):
        if request_body.get('username') in globals.users:
            if security.check_encrypted_password(request_body.get('password'),
                                                 globals.users.get(request_body.get('username')).get('password')):
                user = globals.users.get(request_body.get('username')).get('user')
                body = {
                    'response': 'true',
                    'user': user
                }
                service = '(' + user + ')' + " has been logged in.\n"
                log.main_log(user=user, base_dir=request_body.get("base_dir"), service_provided=service, logging_in=True)
            else:
                body = {
                    'response': 'false'
                }
        else:
            body = {
                'response': 'false'
            }

        return body
    
    def handle_download(self, request_body):
        base_dir = request_body.get('base_dir')
        item = request_body.get('item')
        user = request_body.get('user')
        
        download_directory_fail = []
        download_directory_success = []
        download_file_fail = []
        download_file_success = []
        if request_body.get('type') == 'directory':
            # item is directory
            list_file = ''
            list_dir = ''
            if path.exists(path.join(base_dir, item)):
                list_dir, list_file = self.recursive_get_dir_names(path.join(base_dir, item), item)
                sending = {
                    'dir_list': list_dir
                }
                self.con_socket.send(sending)
                download_directory_success.append(item)

                print("List of directories:", list_dir)
                print("List of files:", list_file)
            else:
                download_directory_fail.append(item)
                status = {
                    'found': 'false'
                }
                self.con_socket.send(status)
                return


            self.con_socket.send({'file_list': list_file})
            # begin taking requests
            file_name = self.con_socket.request().get('file')

            while True:
                try:
                    if file_name  == 'done':
                        break

                    opened_file = open(file_name, 'rb')
                    file_bytes = opened_file.read()
                    opened_file.close()
                    # If the file was found, send a confirmation
                    # Otherwise, the FileNotFoundError would be thrown
                    status = {
                        'found': 'true'
                    }
                    self.con_socket.send(status)

                    self.con_socket.send_file(file_bytes)

                    download_file_success.append(path.basename(file_name))
                    file_name = self.con_socket.request().get('file')
                except FileNotFoundError:
                    download_file_fail.append(path.basename(file_name))
                    status = {
                        'found': 'false'
                    }
                    self.con_socket.send(status)
                    continue
        else:
            # item is file

            file_name = Path(base_dir, item)
            try:
                opened_file = open(file_name, 'rb')
            except IOError:
                print("Unable to open file:", file_name)
                self.con_socket.send({'found': 'false'})
                opened_file.close()
                download_file_fail.append(path.basename(file_name))
            else:
                self.con_socket.send({'found': 'true'})

                file_bytes = opened_file.read()
                self.con_socket.send_file(file_bytes)
                opened_file.close()
                download_file_success.append(path.basename(file_name))

        if len(download_file_fail) > 0:
            log.log_file_download(user, base_dir, download_file_fail, False)
        if len(download_directory_fail) > 0:
            log.log_directory_download(user, base_dir, download_directory_fail, False)
        if len(download_file_success) > 0:
            log.log_file_download(user, base_dir, download_file_success)
        if len(download_directory_success) > 0:
            log.log_directory_download(user, base_dir, download_directory_success)

        return {'response': 'done'}

    def recursive_get_dir_names(self, directory_path, directory_sub_path):
        list_dir_names = []
        dict_file_names = {}

        list_dir_names.append(directory_sub_path)
        directory_walked = walk(directory_path)

        # Get names of files in all sub-directories
        for root, sub_directories, files in directory_walked:
            for file in files:
                dict_file_names.update({path.join(directory_sub_path, file): {
                        'file_sub_path': path.join(directory_sub_path, file),
                        'file_full_path': path.join(root, file)
                    }
                })

            # This for loop only iterates once because the recursion will take care of the rest
            # of the sub directories in the list returned by walk().     
            for sub_dir in sub_directories:
                sub_dir_path = path.join(directory_path, sub_dir)
                sub_dir_sub_path = path.join(directory_sub_path, sub_dir)

                r_dir_names, r_file_names = self.recursive_get_dir_names(sub_dir_path, sub_dir_sub_path)
                list_dir_names = list_dir_names + r_dir_names
                dict_file_names.update(r_file_names)
            break

        return list_dir_names, dict_file_names


    def handle_upload(self, request_body):
        dropped_info = self.con_socket.request()

        directories = dropped_info.get('directories')
        files = dropped_info.get('files')
        dir_files = dropped_info.get('dir_files')
        paste_dir = dropped_info.get('current_directory')

        base_dir = Path(request_body.get('base_dir'), paste_dir)

        # Create Directories if they don't already exist from sent list of directories
        directory_list = []
        try:
            for dir_list in directories:
                for dir in dir_list:

                    if '\\' in dir:
                        dir = dir.replace('\\', '/')

                    full_path = Path(base_dir, dir)
                    print("Full_path:", full_path)

                    if not path.exists(full_path):
                        mkdir(full_path)
                        directory_list.append(dir)
        except IOError as ioerror:
            error = "IOError: unable to create Directory....\n\t" + ioerror
            log.main_log(user=dropped_info.get('user'), base_dir=request_body.get('base_dir'), service_provided=error)
        
        log.log_directory_upload(user=dropped_info.get('user'), base_dir=request_body.get('base_dir'), directory_list=directory_list)

        # Save Directory Files
        file_list = []
        self.con_socket.set_timeout(5)
        for file_key in dir_files:
            try:
                file_info = dir_files.get(file_key)

                # Ask client for next file in list
                file_request = {
                    'file': file_info.get('file_full_path')
                }
                self.con_socket.send(file_request)

                # Recieve the file bytes and write them
                file_bytes = self.con_socket.recieve_file()
                file_sub_path = file_info.get('file_sub_path')

                if '\\' in file_sub_path:
                    file_sub_path = file_sub_path.replace('\\', '/')

                opened_file = open(Path(request_body.get('base_dir'), paste_dir, file_sub_path), 'wb')
                opened_file.write(file_bytes)
                opened_file.close()
                file_list.append(file_sub_path)

            except IOError as ioerror:
                error = "There was an error saving file " + file_info.get('file_sub_path') + "\n\t" + "ERROR: " + str(ioerror) + "\n"
                log.main_log(user=dropped_info.get('user'), base_dir=request_body.get('base_dir'), service_provided=error)
                continue

        self.con_socket.set_timeout(None)

        # Save Individual Files
        for file in files:
            try:
                print("File:", file)
                file_path = file.get('path')

                # Ask client for next file in list
                file_request = {
                    'file': file_path
                }
                self.con_socket.send(file_request)

                # Recieve the file bytes and write them
                file_bytes = self.con_socket.recieve_file()
                opened_file = open(Path(request_body.get('base_dir'), paste_dir, file.get('name')), 'wb')
                opened_file.write(file_bytes)
                opened_file.close()
                file_list.append(file.get('name'))

            except IOError as ioerror:
                error = "There was an error saving file " + file.get('name') + "\n\t" + ioerror
                log.main_log(user=dropped_info.get('user'), base_dir=request_body.get('base_dir'), service_provided=error)
                continue

        log.log_file_upload(user=dropped_info.get('user'), base_dir=request_body.get('base_dir'), file_list=file_list)
        
        # Inform client that all files have been saved
        self.con_socket.send({"file": 'done'})


        request_body.update({'current_directory': paste_dir})

        final_body = {
            'response': 'Directory Saved',
            'updated_directories': self.get_current_directory_names(request_body=request_body)
        }

        return final_body



    def handle_delete(self, request_body):
        deleting_items = request_body.get('to_delete')

        for item_del in deleting_items:
            
            if '\\' in item_del:
                item_del = item_del.replace('\\', '/')

            item = Path(request_body.get('base_dir'), item_del)
            if path.isfile(item):
                remove(item)
            else:
                rmtree(item)

        final_body = {
            'response': 'File Deleted',
            'updated_directories': self.get_current_directory_names(request_body=request_body)
        }
        return final_body


    def handle_ls(self, request_body):
        return self.get_current_directory_names(request_body=request_body)

    def get_current_directory_names(self, request_body):
        base_dir = request_body.get('base_dir')

        desired_directory = base_dir / request_body.get('current_directory')
        
        # If the requested directory doesn't exist, create it.
        # Only used if the user's directory doesn't exist.
        if not path.exists(desired_directory):
            mkdir(desired_directory)       

        dir_file = walk(desired_directory)
        dict_of_dict_of_files = {}


        for root, directory, files in dir_file:

            key = path.relpath(root, base_dir)
            dict_of_files = {
                'name': path.basename(root),
                'path': root,
                'sub_directories': directory,
                'file_names': files,
            }

            if key[0] == '\\':
                key = key[1:]

            dict_of_dict_of_files.update({key : dict_of_files})

        return dict_of_dict_of_files

    def handle_file(self, request_body):        
        file_paths = request_body.get('files')
        file_list = []
        for file in file_paths:
            try:
                file_request = {
                    'file_path': file
                }
                server_path = Path(request_body.get('base_dir'), request_body.get('user'), request_body.get('current_directory'), path.basename(file))

                opened_file = open(server_path, 'wb')
                self.con_socket.send(file_request)

                opened_file.write(self.con_socket.recieve_file())
                file_list.append(path.join(request_body.get('current_directory'), path.basename(file)))
            except IOError as ioerror:
                error = "There was an error saving file " + str(Path(request_body.get('current_directory'), path.basename(file))) + "\n\t" + ioerror
                log.main_log(user=request_body.get('user'), base_dir=request_body.get('base_dir'), service_provided=error)
                continue

        self.con_socket.send({'file_path': 'done'})

        log.log_file_upload(user=request_body.get('user'), base_dir=request_body.get('base_dir'), file_list=file_list)

        return self.get_current_directory_names(request_body=request_body)

        

    def handle_new_user(self, request_body):
        hashed_password = security.encrypt_password(request_body.get('password'))
        globals.users.update({request_body.get('username'):
            {
                'user': request_body.get('name'),
                'password': hashed_password
            }
        })
        users_file = open('security/passwords.txt', 'w')
        users_file.write(json.dumps(globals.users))
        users_file.close()

        body = {
            'response': 'User Created'
        }

        return body
