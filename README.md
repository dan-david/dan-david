AffectCx
==============================

To compute the cognitive resonance score and its main components, we need 8 different models: 

* Face expression (FaceApi)
* Audio Transcription (Google speech-to-text)
* Speech diarization (Google speech-to-text)
* Voice pace (heuristic)
* Speech emotion based on audio transcription (HuggingFace model)
* Speech emotion based on audio signals (HuggingFace model)

## Face-API JS

Source: https://github.com/justadudewhohacks/face-recognition.js
License: MIT license

* Lightweight (less than 1 mb)
* Runs on Javascript (runs on client side to avoid latency)
* Performant (robust when compared to other publicly available models)

## Google Speech-to-Text

Source: https://cloud.google.com/speech-to-text
License: paid service

* Optimized for medical
* Easy implementation on Javascript.

## Hugging face model

* Performant and publicly available model.

# How to run the API

Install the required libraries:

pip install -r requirements.txt

Open a terminal and run:

ray start --head --node-ip-address 127.0.0.1 --port 6379 --dashboard-host 0.0.0.0 --dashboard-port 8265

Then open a second terminal, find the folder that contains api-launch.py and run:

python api-launch.py

You now might access the ray dashboard at http://127.0.0.1:8265/#/node and the api link at http://127.0.0.1:8000/-/routes

You can then replace the API link to the one used in production if you deploy using the ray platform.

To stop process, run 

ray stop

Installing engine package from local folder (editable mode)
================

This installs the package in develop mode. Any changes you make to the code will immediately apply across the system.
The develop will not install the package but it will create a .egg-link in the deployment directory back to the project source code directory.
It is like installing but instead of copying to the site-packages it adds a symbolic link.
That way you can edit the source code and see the changes directly without having to reinstall every time that you make a little change.
This is useful when you are the developer of that project hence the name develop mode.
This is useful if you are the package developer and want to test changes. It also means you can't delete the folder without breaking the install.::

   # option 1: bash command that install package in the current folder
   pip install -e .

   # option 2: bash command
   python setup.py develop --user

If you are just installing someone else's package you should use install.