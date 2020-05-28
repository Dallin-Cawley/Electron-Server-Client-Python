import socket
from _thread import start_new_thread
from pip._vendor.distlib.compat import raw_input
import json
import ServerRequestHandler
import globals
from os import path
import tkinter
import tkinter.filedialog
from pathlib import Path


def main():
    globals.init()

    base_dir = start_up()
    # Create a socket
    server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

    # Bind the socket to a port for use
    server_socket.bind(('', 8001))

    # Listen for a connection
    server_socket.listen()

    # Begin servicing client's
    start_new_thread(handle_connections, (server_socket, base_dir))

    while True:
        user_input = raw_input("Shut down: ")

        if user_input == 'yes':
            server_socket.close()
            break

def start_up():
    if path.exists('server_config.txt'):
        config_txt = open('server_config.txt', 'r')
        base_dir = config_txt.readline()
        base_dir = base_dir.replace("base_dir=", '')
        return Path(base_dir)
    else:
        config_txt = open('server_config.txt', 'w')
        root = tkinter.Tk()
        base_dir = tkinter.filedialog.askdirectory()
        config_txt.write("base_dir=")
        config_txt.write(base_dir)
        root.destroy()

        return Path(base_dir)

def handle_connections(server_socket, base_dir):
    # Load user's info for authentication
    users_file = open('security/passwords.txt', 'r')
    globals.users = json.loads(str(users_file.read()))

    # Accept an incoming connection
    while True:
        connection, con_address = server_socket.accept()
        start_new_thread(handle_client_connection, (connection, base_dir))


def handle_client_connection(client_connection, base_dir):
    # Handle the connection
    client_connection.sendall(json.dumps({'response': 'Connection Accepted'}).encode('UTF-8'))
    request_handler = ServerRequestHandler.ServerRequestHandlerSwitch()
    while True:
        try:
            # Get request from client
            request_body = json.loads(client_connection.recv(2000).decode('UTF-8'))


            # Add the client_socket to the request body for later use
            request_body.update({'client_connection': client_connection})
            request_body.update({'base_dir': base_dir})
            print("Request Body: ", request_body, "\n\n")
            header = request_body.get("header")

            # When the Client wishes to disconnect
            if header == 'quit':
                body = {
                    'response': 'Connection Terminating'
                }
                client_connection.sendall(json.dumps(body).encode('UTF-8'))
                break
            
            sending_json = request_handler.handle_request(header=header, request_body=request_body)
            
            body = {
                'size': len(sending_json.encode('UTF-8'))
            }

            print("Before sending first response")
            client_connection.sendall(json.dumps(body).encode('UTF-8'))
            print("Before sending second response", '\n')
            client_connection.sendall(sending_json.encode('UTF-8'))
        except ValueError:
            data = {
            'response': 'Unable to parse Json. Please try again'
            }
            continue

    client_connection.close()


if __name__ == '__main__':
    main()
