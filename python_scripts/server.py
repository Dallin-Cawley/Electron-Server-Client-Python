import socket
import json
import globals
import tkinter
import tkinter.filedialog
import log

from _thread import start_new_thread, exit
from os import path, system
from pathlib import Path
from net_socket import ServerSocket
from ServerRequestHandler import ServerRequestHandlerSwitch
from PlaidRequestHandler import PlaidRequestHandler

shut_down = False

def main():
    globals.init()
    print("Starting Server...")
    base_dir = start_up()
    print("Base directory recieved.")
    # Create a socket
    server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)

    # Bind the socket to a port for use
    server_socket.bind(('0.0.0.0', 10000))
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
        connection_socket = ServerSocket(connection)
        start_new_thread(handle_client_connection, (connection_socket, base_dir))

    server_socket.close()
    system('cd ../bash_scripts; bash update_server.sh')
    shut_down = False


def handle_client_connection(connection, base_dir):
    global shut_down
    
    # Handle the connection
    connection.send({'response': 'Connection Accepted'})
    while True:
        try:
            # Get request from client
            request_body = connection.request()
            request_body.update({'base_dir': base_dir})
            print("\nRequest Body:", request_body, "\n")
            header = request_body.get("header")

            if header == 'update':
                print("Updating Shut_Down")
                shut_down = True
                break

            # When the Client wishes to disconnect
            if header == 'quit':
                body = {
                    'response': 'Connection Terminating'
                }
                connection.send(body)
                break

            print("Header: ", header)
            
            if 'plaid' in header:
                plaid_handler = PlaidRequestHandler(connection)
                json = plaid_handler.handle_request(header=header, request_body=request_body)
                print("Response", json)
                connection.send(json)
            else:
                request_handler = ServerRequestHandlerSwitch(connection)
                print("Sending response.")
                connection.send(request_handler.handle_request(header=header, request_body=request_body))

        except ValueError:
            data = {
            'response': 'Unable to parse Json. Please try again'
            }
            connection.send(data)
            continue

    connection.close()
    exit()


if __name__ == '__main__':
    main()
