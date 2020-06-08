import os
import socket
import json
import sys
import tkinter
import tkinter.filedialog

from ClientRequestHandler import ClientRequestHandlerSwitch
from net_socket import ClientSocket


def main():
    client_socket = socket.socket()
    # Testing comment
    # Connect to remote host
    # client_socket.connect(('73.6.148.194', 10000))
    client_socket.connect(('127.0.0.1', 10000))

    cmd_arg = {}
    i = 0
    for arg in sys.argv:
        cmd_arg.update({i: arg})
        i += 1

    connection = ClientSocket(con_socket=client_socket, user=cmd_arg.get(2))

    # Determines of the connection was accepted or not
    response = connection.response()
    print(response)
    request_handler = ClientRequestHandlerSwitch(connection)
    print(json.dumps(request_handler.handle_function_call(cmd_arg.get(1), cmd_arg)), flush=True)
    return

    quit = {
        'header': 'quit'
    }
    
    # The Server sends a final 'Connection Terminating' message after recieving
    # a message with 'header' = 'quit'
    connection.send(quit)
    print(connection.response(), flush=True)

    client_socket.close()

if __name__ == '__main__':
    main()
