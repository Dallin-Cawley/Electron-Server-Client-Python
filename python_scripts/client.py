import os
import socket
import json
import sys
import FunctionCallHandler

user = ""
login_success = False


def main():
    client_socket = socket.socket()
    
    # Connect to remote host
    client_socket.connect((socket.gethostname(), 8001))
    print(json.loads(client_socket.recv(1024).decode('UTF-8')).get('response'))

    header = sys.argv[1]
    entry_boxes = {
        'client_socket': client_socket
    }
    i = 0
    for arg in sys.argv:
        entry_boxes.update({i: arg})
        i += 1


    print(json.dumps(FunctionCallHandler.FunctionCallHandlerSwitch().handle_function_call(header, entry_boxes)))



def send_file(client_socket, file_name):
    try:
        file_path = os.path.abspath(file_name)
        file_size = os.path.getsize(file_path)

        body = {
            'header': 'file',
            'file_type': os.path.splitext(file_path)[1],
            'file_name': os.path.basename(file_path),
            'file_size': file_size,
            'directory': user

        }

        file = open(file_path, 'rb')

        file_bytes = file.read(file_size)
        file.close()

        client_socket.sendall(json.dumps(body).encode('UTF-8'))
        client_socket.sendall(file_bytes)

        print(json.loads(client_socket.recv(1024).decode('UTF-8')).get('response'))
    except FileNotFoundError:
        print('File not found. Try again.')
        pass


if __name__ == '__main__':
    main()
