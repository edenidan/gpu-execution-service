import requests
from base64 import b64encode
import sys
import argparse


def post_gpu_program_to_service(server_url, program_exe):
    data = requests.post(
        server_url, json={"data": b64encode(program_exe).decode('ascii')})
    if data.status_code == 200:
        return data.text
    raise Exception("bad response")


def read_binary_file(path):
    with open(path, "rb") as f:
        return f.read()

def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument('-c')
    parser.add_argument('-e')
    args = parser.parse_args()

    if args.c and args.e:
        raise Exception('invalid arguments')

    if args.c:
        return 'source', args.c
    if args.e:
        return 'binary', args.e

    raise Exception('invalid arguments')


requestPath, filePath = parse_args()

gpu_program_data = read_binary_file(filePath)
reponse = post_gpu_program_to_service(
    f"http://localhost:3000/{requestPath}", gpu_program_data)
print(reponse)
