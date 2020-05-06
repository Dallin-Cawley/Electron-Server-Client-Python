import json
import os
from sys import getsizeof

class FunctionCallHandlerSwitch(object):

    def handle_function_call(self, header, function_call_body):
        method_name = 'handle_' + header

        handler = getattr(self, method_name, lambda: "Unable to complete Request")
        return handler(function_call_body=function_call_body)


    def handle_login(selv, function_call_body):
        client_socket = function_call_body.get('client_socket')

        body = {
            'header': 'login',
            'username': function_call_body.get(2),
            'password': function_call_body.get(3)
        }

        client_socket.sendall(json.dumps(body).encode('UTF-8'))
        response = json.loads(client_socket.recv(1024).decode('UTF-8'))

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


    def handle_file_view(self, function_call_body):
        client_socket = function_call_body.get('client_socket')
        requested_directory = os.path.join('C:\\','Users','lette','Documents','Server-Files', function_call_body.get(2))

        body = {
            'header': 'ls',
            'current_directory': requested_directory
        }

        client_socket.sendall(json.dumps(body).encode('UTF-8'))
        current_directory_list = client_socket.recv(1024).decode('UTF-8')

        return json.loads(current_directory_list);

    def handle_send_file(self, function_call_body):
        client_socket = function_call_body.get('client_socket')

        # The second argument in the function_call_body for sending a file
        # is a stringified object that needs to be reloaded.
        file_info = json.loads(function_call_body.get(2))

        try:
            files = {}
            i = 0
            for file_path in file_info.get('files_to_send'):
                
                if i > 0:
                    print(json.loads(client_socket.recv(1024).decode('UTF-8')))
                
                file_size = os.path.getsize(file_path)
                
                file = open(file_path, 'rb');
                file_bytes = file.read(file_size)
                file.close()

                body = {
                    'header': 'file',
                    'file_size': file_size,
                    'directory': file_info.get('sending_to'),
                    'file_name': os.path.basename(file_path),
                    'file_type': os.path.splitext(file_path)[1],                    
                }

                client_socket.sendall(json.dumps(body).encode('UTF-8'))
                response = json.loads(client_socket.recv(1024).decode('UTF-8'))

                # If the server successfully opened where the file is being sent to
                # send the file.
                #
                # Else, try again. If that fails, the file was unable to be saved
                if response.get('response') == 'ready':
                    client_socket.sendall(file_bytes)
                else:
                    client_socket.sendall(json.dumps(body).encode('UTF-8'))
                    
                    if json.loads(client_socket.recv(1024).decode('UTF-8')).get('response') == 'ready':
                        client_socket.sendall(file_bytes)
                    else:
                        print(json.loads(client_socket.recv(1024).decode('UTF-8')).get('response'))
                i += 1
            
            return json.loads(client_socket.recv(1024).decode('UTF-8'))
        except FileNotFoundError:
            print('File not found. Try again.')
            pass