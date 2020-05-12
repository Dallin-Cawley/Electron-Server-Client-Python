import os

from security import security
import json
import globals


class ServerRequestHandlerSwitch(object):
    def handle_request(self, header, request_body):
        if " " in header:
            header = header.replace(" ", "_")

        method_name = 'handle_' + header
        print("in handle request")
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
        print("base_path: ", dict_of_dict_of_files.get("base_path"))

        if request_body.get('from') == 'self':
            return dict_of_dict_of_files
        else:
            return json.dumps(dict_of_dict_of_files)

    def handle_file(self, request_body):
        # Create file path
        client_connection = request_body.get('client_connection')
        directory = os.path.join("C:\\", "Users", "lette", "PycharmProjects", "Python-Socket-Server-Client",
                                  request_body.get('directory'))

        # If the requested directory doesn't exist, create it.
        if not os.path.exists(directory):
            os.mkdir(directory)

        # Write the file to specified location
        try:
            # Prepare file for writing
            write_to = os.path.join(directory, request_body.get('file_name'))
            opened_file = open(write_to, 'wb')

            body = {
                'response': 'ready'
            }
            
            # Send a confirmation to Client
            client_connection.sendall(json.dumps(body).encode('UTF-8'))

            # If opening the desired location was successful,
            # get the bytes of the uploaded file and attempt
            # to write it.

            file = client_connection.recv(request_body.get('file_size'))
            opened_file.write(file)
            opened_file.close()

            body = {
                'response': 'File Saved',
                'updated_directories': self.get_current_directory_names(request_body={'current_directory': directory,
                                                                                      'from': 'self'})
            }        

            print("Sending to Client: ", body, '\n\n')    
        except IOError:
            body = {
                'response': 'Unable to Save File'
            }

        # Send a confirmation to Client
        return json.dumps(body)

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
