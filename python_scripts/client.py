import os
import socket
from pip._vendor.distlib.compat import raw_input
import json
import tkinter
import sys

user = ""
login_success = False
client_socket = socket.socket()


def main():


    sys.stdout.flush()
    entry_boxes = {
        'username': sys.argv[1],
        'password': sys.argv[2]
    }

    authenticated, client_socket = login(entry_boxes)
    if (authenticated):
        print('true')
    else:
        print('false')
sys.stdout.flush()




def login(entry_boxes):
    global login_success
    global user
    global client_socket
    body = {
        'header': 'login',
        'username': entry_boxes.get('username'),
        'password': entry_boxes.get('password')
    }

    # Connect to remote host
    client_socket.connect((socket.gethostname(), 8001))
    print(json.loads(client_socket.recv(1024).decode('UTF-8')).get('response'), '\n')

    client_socket.sendall(json.dumps(body).encode('UTF-8'))
    response = json.loads(client_socket.recv(1024).decode('UTF-8'))

    if response.get('response') == 'true':
        user = response.get('user')
        login_success = True
        return True, client_socket
    else:
        return login_success, False


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


def handle_file_view(client_socket, requested_directory):
    body = {
        'header': 'ls',
        'current_directory': requested_directory
    }

    client_socket.sendall(json.dumps(body).encode('UTF-8'))
    current_directory_list = client_socket.recv(1024).decode('UTF-8')
    print(current_directory_list)


if __name__ == '__main__':
    main()
