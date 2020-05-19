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

    def handle_send_file(self, function_call_body):
        client_socket = function_call_body.get('client_socket')

        # The second argument in the function_call_body for sending a file
        # is a stringified object that needs to be reloaded.
        file_info = json.loads(function_call_body.get(2))

        try:

            server_save_status = {
                'updated_directories': '',
                'file_save_failures': []
            }

            directories = file_info.get('directories_to_send')
            files = file_info.get('files_to_send')
            print("Files: ", files, "\n")
            directory_info = {}
            i = 0
            if len(directories) > 0:
                for dir in directories:
                    dir_files = os.walk(dir)

                    for root, dir_list, file_list in dir_files:

                        dir_of_files = {
                            'sub_directories': dir_list,
                            'files': file_list,
                            'path': root,
                        }
                        
                        for i in range(0, len(file_list)):
                            files.push(os.path.join(root, file_list[i]))

                        directory_info.update({root: dir_of_files})

            # Creates all directories remotely before attempting to
            # write files to them.
            body = {
                'directories': directory_info,
            }
            size_body = {
                'header': 'directory',
                'size': len(json.dumps(body).encode('UTF-8')),
                'base_path': file_info.get('base_path')
            }
            client_socket.sendall(json.dumps(size_body).encode('UTF-8'))            
            client_socket.sendall(json.dumps(body).encode('UTF-8'))

            response_size = json.loads(client_socket.recv(100).decode('UTF-8'))
            response = json.loads(client_socket.recv(response_size.get('size')).decode('UTF-8'))
            
            print("File Response: ", response, "\n")
            # If the server successfully created all directories
            if response.get('response') == 'success':

                # Send all files
                for file in files:
                    
                    file_size = os.path.getsize(file)
                    
                    file = open(file, 'rb')
                    file_bytes = file.read(file_size)
                    file.close()

                    body = {
                        'header': 'file',
                        'file_size': file_size,
                        'path': file,  
                        'current_directory': ''            
                    }

                    client_socket.sendall(json.dumps(body).encode('UTF-8'))
                    first_try = json.loads(client_socket.recv(1024).decode('UTF-8'))

                    # If the server successfully opened where the file is being sent to
                    # send the file.
                    #
                    # Else, try again. If that fails, the file was unable to be saved
                    updated_directories = ''
                    if first_try.get('response') == 'ready':
                        client_socket.sendall(file_bytes)
                        status, updated_directories = save_status(client_socket=client_socket)

                        if not status:
                            server_save_status.get('file_save_failures').append(file)
                    else:
                        client_socket.sendall(json.dumps(body).encode('UTF-8'))
                        second_try = json.loads(client_socket.recv(1024).decode('UTF-8'))
                        
                        if second_try.get('response') == 'ready':
                            client_socket.sendall(file_bytes)

                        status, updated_directories = save_status(client_socket=client_socket)
                        
                        if not status:
                            server_save_status.get('file_save_failure').append(file)
                        # else:
                            # print(second_try.get('response'))

                    # Get the server's directory information to maintain client accuracy
                    server_save_status.update({'updated_directories': updated_directories})

            return server_save_status
        except FileNotFoundError:
            print('File not found. Try again.')
            pass

def save_status(client_socket):
    response_size = json.loads(client_socket.recv(2000).decode('UTF-8'))
    status = json.loads(client_socket.recv(response_size.get('size')).decode('UTF-8'))

    if status.get('response') == 'File Saved':
        return True, status.get('updated_directories')
    else:
        return False, status.get('updated_directories')   