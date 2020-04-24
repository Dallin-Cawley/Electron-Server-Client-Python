import os

from security import security
import json
import globals


class RequestHandlerSwitch(object):
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
                    'user': 'Dallin' 
                    # globals.users.get(request_body.get('username')).get('user')
                }
            else:
                body = {
                    'response': 'false'
                }
        else:
            body = {
                'response': 'false'
            }

        return json.dumps(body).encode('UTF-8')

    def handle_ls(self, request_body):
        return self.get_current_directory_names(request_body=request_body)

    def get_current_directory_names(self, request_body):
        dir_file = os.walk(request_body.get('current_directory'))
        dict_of_dict_of_files = {}
        i = 0
        for root, directory, files in dir_file:
            dict_of_files = {
                'current_directory': root,
                'sub_directories': directory,
                'file_names': files,
            }
            dict_of_dict_of_files.update({i: dict_of_files})
            i += 1

        return json.dumps(dict_of_dict_of_files).encode('UTF-8')

    def handle_file(self, request_body):
        # Create file path
        client_connection = request_body.get('client_connection')
        directory = os.path.join("C:\\", "Users", "lette", "PycharmProjects", "Python-Socket-Server-Client",
                                  request_body.get('directory'))

        # If the requested directory doesn't exist, create it.
        if not os.path.exists(directory):
            os.mkdir(directory)

        # Get the file from the client
        sent_file = client_connection.recv(request_body.get('file_size'))
        file_name = os.path.join(directory, request_body.get('file_name'))

        # Write the file to specified location
        file = open(file_name, 'wb')
        file.write(sent_file)
        file.close()

        # Send a confirmation to Client
        body = {
            'response': 'File saved'
        }

        return json.dumps(body).encode('UTF-8')

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

        return json.dumps(body).encode('UTF-8')
