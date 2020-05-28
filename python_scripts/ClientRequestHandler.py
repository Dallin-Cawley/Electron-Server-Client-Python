import json
import os
from sys import getsizeof

class ClientRequestHandlerSwitch(object):

    def handle_function_call(self, header, function_call_body):
        method_name = 'handle_' + header

        handler = getattr(self, method_name, lambda: "Unable to complete Request")
        return handler(function_call_body=function_call_body)


    def handle_login(self, function_call_body):
        client_socket = function_call_body.get('client_socket')

        body = {
            'header': 'login',
            'username': function_call_body.get(2),
            'password': function_call_body.get(3)
        }

        client_socket.sendall(json.dumps(body).encode('UTF-8'))
        recieving_size = json.loads(client_socket.recv(1024).decode('UTF-8'))
        response = json.loads(client_socket.recv(recieving_size.get('size')).decode('UTF-8'))

        if response.get('response') == 'true':
            response_body = {
                'authenticated': True,
                'user': response.get('user')
            }
            return response_body
        else:
            response_body = {
                'authenticated': False,
            }
            return response_body


    def handle_delete(self, function_call_body):
        client_socket = function_call_body.get('client_socket')

        body = {
            'header': 'delete',
            'to_delete': json.loads(function_call_body.get(2)),
            'current_directory': function_call_body.get(3)
        }

        client_socket.sendall(json.dumps(body).encode('UTF-8'))

        # recieve the updated directories size after sending
        recieving_size = json.loads(client_socket.recv(1024).decode('UTF-8'))

        # return the updated directories
        return json.loads(client_socket.recv(recieving_size.get('size')).decode('UTF-8'))


    def handle_file_view(self, function_call_body):
        client_socket = function_call_body.get('client_socket')
        requested_directory = os.path.join('C:\\','Users','lette','Documents','Server-Files', function_call_body.get(2))

        body = {
            'header': 'ls',
            'current_directory': requested_directory
        }

        client_socket.sendall(json.dumps(body).encode('UTF-8'))
        recieving_size = json.loads(client_socket.recv(1024).decode('UTF-8'))
        current_directory_list = client_socket.recv(recieving_size.get('size')).decode('UTF-8')

        return json.loads(current_directory_list)


    def recursive_get_dir_names(self, directory_path, directory_sub_path):
        list_dir_names = []
        dict_file_names = {}

        list_dir_names.append(directory_sub_path)
        directory_walked = os.walk(directory_path)

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
        dropped_items = json.loads(function_call_body.get(2))
        client_socket = function_call_body.get('client_socket')

        # List of File objects
        directories = dropped_items.get('directories')

        files = dropped_items.get('files')
        current_directory = dropped_items.get('current_directory')

        list_dir_names = []
        dict_file_names = {}
        for i in range(0, len(directories)):
            r_dir_names, r_file_names = self.recursive_get_dir_names(directories[i].get('path'), directories[i].get('name'))
            list_dir_names.append(r_dir_names)
            dict_file_names.update(r_file_names)
            
        directory_body = {
            'header': 'directory',
            'directories': list_dir_names,
            'files': dict_file_names,
            'current_directory': current_directory
        }
        # Send Directory names for creation
        client_socket.sendall(json.dumps(directory_body).encode('UTF-8'))



        # Send Directory Files
        while True:
            try:
                # Recieve file request
                response = json.loads(client_socket.recv(1024).decode('UTF-8'))
                file_name = response.get('file')
                if file_name == 'done':
                    break

                opened_file = open(file_name, 'rb')

                # Send the size of file
                size_body = {
                    'size': os.stat(response.get('file')).st_size
                }
                client_socket.sendall(json.dumps(size_body).encode('UTF-8'))

                # Send file bytes
                client_socket.sendall(opened_file.read())
                opened_file.close()
            except:
                print("Unable to save file", response.get('file'))
                return response



        size = json.loads(client_socket.recv(100).decode('UTF-8'))
        response = json.loads(client_socket.recv(size.get('size')).decode('UTF-8'))



        # Send all files
        for file_obj in files:
            file = file_obj

            file_name = {
                'header': 'file',
                'name': file.get('name'),
                'size': file.get('size'),
                'current_directory': current_directory
            }

            client_socket.sendall(json.dumps(file_name).encode('UTF-8'))
            status = json.loads(client_socket.recv(100).decode('UTF-8'))

            if status.get('status') == 'ready':
                opened_file = open(file.get('path'), 'rb')

                client_socket.sendall(opened_file.read())

                response_size = json.loads(client_socket.recv(100).decode('UTF-8'))
                response = json.loads(client_socket.recv(response_size.get('size')).decode('UTF-8'))

            else:
                print("Server was unable to open", file.get('name'))
        
        return response



        