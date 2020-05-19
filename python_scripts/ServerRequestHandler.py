import os

from security import security
import json
import globals
from sys import getsizeof
from shutil import rmtree


class ServerRequestHandlerSwitch(object):
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
                body = {
                    'response': 'true',
                    'user': globals.users.get(request_body.get('username')).get('user')
                }
            else:
                body = {
                    'response': 'false'
                }
        else:
            body = {
                'response': 'false'
            }

        return json.dumps(body)

    def recursive_dir_copy(self, directories, current_dir, server_parent_path, client_base_path):

        sub_directories = current_dir.get('sub_directories')
        
        for sub_dir in sub_directories:
            dict_path = os.path.join(client_base_path, sub_dir)
            child_path = os.path.join(server_parent_path, sub_dir)

            if not os.path.exists(child_path):
                os.mkdir(child_path)
            
            if len(directories.get(dict_path).get('sub_directories')) > 0:
                self.recursive_dir_copy(directories, directories.get(dict_path), child_path, dict_path)

        return

    def handle_directory(self, request_body):
        server_base_path = request_body.get('base_path') 
        client_socket = request_body.get('client_connection')

        directories = json.loads(client_socket.recv(request_body.get('size')).decode('UTF-8')).get('directories')


        for dir in directories:
            path = os.path.join(server_base_path, os.path.basename(dir))

            if not os.path.exists(path):
                os.mkdir(path)

            self.recursive_dir_copy(directories=directories, current_dir=directories.get(dir), server_parent_path=path, client_base_path=dir)
            break
       

        return json.dumps({'response': 'success'})



    def handle_delete(self, request_body):
        deleting_items = request_body.get('to_delete')

        for item in deleting_items:
            if os.path.isfile(item):
                os.remove(item)
            else:
                rmtree(item)

        request_body.update({'from': 'self'})
        updated_directories = self.get_current_directory_names(request_body=request_body)


        return json.dumps(updated_directories)


    def handle_ls(self, request_body):
        return self.get_current_directory_names(request_body=request_body)

    def get_current_directory_names(self, request_body):
        desired_directory = request_body.get('current_directory')
        
        # If the requested directory doesn't exist, create it.
        if not os.path.exists(desired_directory):
            os.mkdir(desired_directory)       

        dir_file = os.walk(desired_directory)
        dict_of_dict_of_files = {}



        for root, directory, files in dir_file:
            dict_of_files = {
                'name': os.path.basename(root),
                'path': root,
                'sub_directories': directory,
                'file_names': files,
            }

            dict_of_dict_of_files.update({root : dict_of_files})

        dict_of_dict_of_files.update({"base_path": desired_directory})

        if request_body.get('from') == 'self':
            return dict_of_dict_of_files
        else:
            return json.dumps(dict_of_dict_of_files)

    def handle_file(self, request_body):
        # Create file path
        client_connection = request_body.get('client_connection')

        # Write the file to specified location
        try:
            # Prepare file for writing
            directory = request_body.get('current_directory')
            write_to = request_body.get('path')
            opened_file = open(write_to, 'wb')

            confirm_body = {
                'response': 'ready'
            }
            
            # Send a confirmation to Client
            client_connection.sendall(json.dumps(confirm_body).encode('UTF-8'))

            # If opening the desired location was successful,
            # get the bytes of the uploaded file and attempt
            # to write it.

            file = client_connection.recv(request_body.get('file_size'))
            opened_file.write(file)
            opened_file.close()

            final_body = {
                'response': 'File Saved',
                'updated_directories': self.get_current_directory_names(request_body={'current_directory': directory,
                                                                                      'from': 'self'})
            }
        except IOError:
            final_body = {
                'response': 'Unable to Save File'
            }


        # Send a confirmation to Client
        return json.dumps(final_body)

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

        return json.dumps(body)
