import socket
from _thread import start_new_thread, exit
import json
import ServerRequestHandler
import globals
from os import path, system
import tkinter
import tkinter.filedialog
from pathlib import Path

shut_down = False

def main():
    globals.init()
    print("Starting Server...")
    base_dir = start_up()
    print("Base directory recieved.")
    # Create a socket
    server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

    # Bind the socket to a port for use
    server_socket.bind(('', 10000))
    print("Server socket bount to", server_socket.getsockname())

    # Listen for a connection
    server_socket.listen()
    print("Listening to connections....")
    print("Base Directory:", base_dir)
    
    # Begin servicing client's
    # start_new_thread(handle_connections, (server_socket, base_dir))
    handle_connections(server_socket, base_dir)


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
    print("Handling Connections")
    global shut_down
 
    # Load user's info for authentication
    users_file = open('security/passwords.txt', 'r')
    globals.users = json.loads(str(users_file.read()))

    # Accept an incoming connection
    while True:
        if shut_down == True:
            print("Shutting Down")
            break
    
        connection, con_address = server_socket.accept()
        print("Connected to", con_address)
        start_new_thread(handle_client_connection, (connection, base_dir))

    system('cd ../bash_scripts; bash update_server.sh')

    server_socket.close()


def handle_client_connection(client_connection, base_dir):
    global shut_down
    # Handle the connection
    client_connection.sendall(json.dumps({'response': 'Connection Accepted'}).encode('UTF-8'))
    request_handler = ServerRequestHandler.ServerRequestHandlerSwitch()
    while True:
        try:
            # Get request from client
            request_body = json.loads(client_connection.recv(2000).decode('UTF-8'))
            print("Request Body: ", request_body, "\n\n")

            if request_body.get('header') == 'update':
                print("Updating Shut_Down")
                shut_down = True
                break


            # Add the client_socket to the request body for later use
            request_body.update({'client_connection': client_connection})
            request_body.update({'base_dir': base_dir})
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

    if shut_down == True:
        print("Shut down is true")
    else:
        print("Shut down is false")

    client_connection.close()
    exit()


if __name__ == '__main__':
    main()
