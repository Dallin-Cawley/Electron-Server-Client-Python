import json


class ClientSocket:

    def __init__(self, con_socket, user):
        self.con_socket = con_socket
        self.user = user

    def send(self, message):
        msg_json = json.dumps(message)

        size_body = {
            'size': len(msg_json.encode('UTF-8')),
            'user': self.user,
            'buffer': ''
        }
        
        # Make sure the size_body is the set length
        length = len(json.dumps(size_body).encode('UTF-8'))
        if length < 50:
            buffer = ' '
            while length < 50:
                size_body.update({'buffer': buffer})
                buffer += ' '
                length = len(json.dumps(size_body).encode('UTF-8'))

        self.con_socket.sendall(json.dumps(size_body).encode('UTF-8'))
        self.con_socket.sendall(msg_json.encode('UTF-8'))

    def response(self):

        resp_size_bytes = bytes()
        while len(resp_size_bytes) < 50:
            resp_size_bytes += self.con_socket.recv(50)
        resp_size = json.loads(resp_size_bytes.decode('UTF-8'))


        message_size = resp_size.get('size')
        message_bytes = bytes()
        while len(message_bytes) < message_size:
            message_bytes += self.con_socket.recv(message_size)
        message = json.loads(message_bytes.decode('UTF-8'))
        return message

    def close(self):
        self.con_socket.close()


class ServerSocket:
    def __init__(self, con_socket):
        self.con_socket = con_socket

    def send(self, message):
        msg_json = json.dumps(message)

        size_body = {
            'size': len(msg_json.encode('UTF-8')),
            'buffer': ''
        }

        # Make sure the size_body is the set length
        length = len(json.dumps(size_body).encode('UTF-8'))
        if length < 50:
            buffer = ' '
            while length < 50:
                size_body.update({'buffer': buffer})
                buffer += ' '
                length = len(json.dumps(size_body).encode('UTF-8'))

        self.con_socket.sendall(json.dumps(size_body).encode('UTF-8'))
        self.con_socket.sendall(msg_json.encode('UTF-8'))

    def request(self):
        
        # Recieve the size of the request.
           # The server will remain in this loop until a request is given
        resp_size_bytes = bytes()
        while len(resp_size_bytes) < 50:
            resp_size_bytes += self.con_socket.recv(50)

        resp_size = json.loads(resp_size_bytes.decode('UTF-8'))


        message_size = resp_size.get('size')
        message_bytes = bytes()

        while len(message_bytes) < message_size:
            message_bytes += self.con_socket.recv(message_size)

        message = json.loads(message_bytes.decode('UTF-8'))
        return message

    def close(self):
        self.con_socket.close()