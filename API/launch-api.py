
import src
import os
from src.api.app import *
from ray import serve
import ray

runtime_env = {"py_modules": [src]}
ray.init(runtime_env = runtime_env)

# ray.init(
#    address= "ray://18.230.8.88:10001",
#    log_to_driver=False,
#    runtime_env = runtime_env,
#    ignore_reinit_error=True,
#)

print("Connected to ray cluster!")

serve.start(detached=True)
print("Server started!")

AffectCxAPI_v1.deploy()
print("API deployed!")