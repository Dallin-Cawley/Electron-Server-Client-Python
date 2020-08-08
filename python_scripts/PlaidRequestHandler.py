import plaid

class PlaidRequestHandler:

    def __init__(self, con_socket):
        self.con_socket = con_socket

        self.client = plaid.Client(
                client_id='5f0de1225f640500125e6943',
                secret='ee35c6647b372ddde984771b4a1129',
                environment='sandbox',
                api_version='2018-05-22',
                public_key='91999e67d179ebcadfd577c952ede4')

    def handle_request(self, header, request_body):
        if " " in header:
            header = header.replace(" ", "_")

        header = header.replace("plaid_", '')

        method_name = 'handle_' + header
        handler = getattr(self, method_name, lambda: "Unable to complete Request")

        return handler(request_body=request_body)
    
    
    def handle_exchange_public_token(self, request_body):
        return self.client.Item.public_token.exchange(request_body.get('public_token'))

    def handle_get_balances(self, request_body):
        return self.client.Accounts.balance.get(request_body.get('access_token'))