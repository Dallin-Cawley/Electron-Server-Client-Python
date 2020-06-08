import os
import json
import globals
import log

from security import security
from sys import getsizeof
from shutil import rmtree
from pathlib import Path


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
            print('\nHashed password: ', security.encrypt_password(request_body.get('password')), '\n')
            if security.check_encrypted_password(request_body.get('password'),
                                                 globals.users.get(request_body.get('username')).get('password')):
                user = globals.users.get(request_body.get('username')).get('user')
                body = {
                    'response': 'true',
                    'user': user
                }
                service = "\n\n" + '(' + user + ')' + " has been logged in.\n"
                log.main_log(user=user, base_dir=request_body.get("base_dir"), service_provided=service)
            else:
                body = {
                    'response': 'false'
                }
        else:
            body = {
                'response': 'false'
            }

        return body
        

    def handle_directory(self, request_body):
        dropped_info = self.con_socket.request()
        print("Dropped info", dropped_info, '\n')
        directories = dropped_info.get('directories')
        files = dropped_info.get('files')
        paste_dir = dropped_info.get('current_directory')
        base_dir = Path(request_body.get('base_dir'), paste_dir)

        # Create Directories if they don't already exist from sent list of directories
        try:
            for dir_list in directories:
                for dir in dir_list:
                    print("dir:", dir)
                    full_path = Path(base_dir, dir)

                    if not os.path.exists(full_path):
                        os.mkdir(full_path)
        except:
            print("There was an error creating directory")

        # Get files and save them to this machine
        try:
            for file_key in files:
                file_info = files.get(file_key)
                print("File_Key:", file_key, '\n')
                print("File_info:", file_info, '\n')

                # Ask client for next file in list
                file_request = {
                    'file': file_info.get('file_full_path')
                }
                self.con_socket.send(file_request)

                # Recieve the file bytes and write them
                file_bytes = self.con_socket.response

                file = open(Path(request_body.get('base_dir'), paste_dir, file_info.get('file_sub_path')), 'wb')
                file.write(file_bytes)
                file.close()

            # Inform client that all files have been saved
            self.con_socket.send({"file": 'done'})
        except IOError as error:
            print("There was an error saving file", file_info.get('file_sub_path'), "\n")
            print(error)

        request_body.update({'current_directory': paste_dir})

        final_body = {
            'response': 'Directory Saved',
            'updated_directories': self.get_current_directory_names(request_body=request_body)
        }

        return final_body



    def handle_delete(self, request_body):
        deleting_items = request_body.get('to_delete')

        for item_del in deleting_items:
            item = os.path.join(request_body.get('base_dir'), item_del)
            if os.path.isfile(item):
                os.remove(item)
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
        if not os.path.exists(desired_directory):
            os.mkdir(desired_directory)       

        dir_file = os.walk(desired_directory)
        dict_of_dict_of_files = {}


        for root, directory, files in dir_file:

            key = os.path.relpath(root, base_dir)
            dict_of_files = {
                'name': os.path.basename(root),
                'path': root,
                'sub_directories': directory,
                'file_names': files,
            }

            if key[0] == '\\':
                key = key[1:]

            dict_of_dict_of_files.update({key : dict_of_files})

        return dict_of_dict_of_files

    def handle_file(self, request_body):
        client_connection = request_body.get('client_connection')
        
        try:
            file_path = os.path.join(request_body.get('base_dir'), request_body.get('current_directory'), request_body.get('name'))
            opened_file = open(file_path, 'wb')

            client_connection.sendall(json.dumps({'status': 'ready'}).encode('UTF-8'))
            opened_file.write(client_connection.recv(request_body.get('size')))
            opened_file.close()

            

            final_body = {
                'response': 'File Saved',
                'updated_directories': self.get_current_directory_names(request_body=request_body)
            }
        except IOError:
            final_body = {
                'response': 'Unable to Save File'
            }


        # Send a confirmation to Client
        return final_body

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
