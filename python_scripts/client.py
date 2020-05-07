import os
import socket
import json
import sys
import ClientRequestHandler

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

    print(json.dumps(ClientRequestHandler.ClientRequestHandlerSwitch().handle_function_call(header, entry_boxes)), flush=True)

    quit = {
        'header': 'quit'
    }
    
    client_socket.sendall(json.dumps(quit).encode('UTF-8'))
    print(json.dumps(client_socket.recv(1024).decode('UTF-8')), flush=True)

    client_socket.close()


if __name__ == '__main__':
    main()
