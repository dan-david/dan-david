
import src
import os
from src.api.app import *
from ray import serve
import ray

runtime_env = {"py_modules": [src]}
ray.shutdown()
serve.shutdown()