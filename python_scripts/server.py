import socket
from _thread import start_new_thread
from pip._vendor.distlib.compat import raw_input
import json
import ServerRequestHandler
import globals


def main():
    globals.init()
    # Create a socket
    server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

    # Bind the socket to a port for use
    server_socket.bind(('localhost', 8001))

    # Listen for a connection
    server_socket.listen()

    # Begin servicing client's
    start_new_thread(handle_connections, (server_socket,))

    while True:
        user_input = raw_input("Shut down: ")

        if user_input == 'yes':
            server_socket.close()
            break


def handle_connections(server_socket):
    # Load user's info for authentication
    users_file = open('security/passwords.txt', 'r')
    globals.users = json.loads(str(users_file.read()))

    # Accept an incoming connection
    while True:
        connection, con_address = server_socket.accept()
        start_new_thread(handle_client_connection, (connection,))


def handle_client_connection(client_connection):
    # Handle the connection
    client_connection.sendall(json.dumps({'response': 'Connection Accepted'}).encode('UTF-8'))
    request_handler = ServerRequestHandler.ServerRequestHandlerSwitch()
    while True:
        try:
            # Get request from client
            data = client_connection.recv(1024)
            request_body = json.loads(data.decode('UTF-8'))
            print("Request Body: ", request_body, "\n\n")

            # Add the client_socket to the request body for later use
            request_body.update({'client_connection': client_connection})
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
