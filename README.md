AffectCx
==============================

To compute the cognitive resonance score and its main components, we need 7 different models: 

* Body alignment (MediaPipe)
* Eye Gaze (MediaPipe)
* Face expression (FaceApi)
* Audio Transcription (Google speech-to-text)
* Voice pace (Heuristic)
* Speech emotion based on audio transcription (HuggingFace model)
* Speech emotion based on audio signals (HuggingFace model)

## MediaPipe

* Performant (robust when compared to other publicly available models)
* Runs on Javascript (runs on client side to avoid latency)
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

OS - Container running Debian GNU/Linux 11
Python 3.10

Install the src folder as a package

```
pip install -e . # install the src code as a package <br> 
```

Install requirements.txt. Then, make sure no ray clusters are running with:

```
ray stop
```

Open a terminal and run:

```
ray start --head --node-ip-address 127.0.0.1 --port 6379 --dashboard-host 0.0.0.0 --dashboard-port 8265
```

Then open a second terminal, find the folder that contains api-launch.py and run:

```
python launch-api.py
```

You now might access the ray dashboard at http://127.0.0.1:8265/#/node and the api link at http://127.0.0.1:8000/-/routes

You can then replace the API link to the one used in production if you deploy using the ray platform.

To stop all ray processes, run 

```
ray stop
```

# How to run the Notebook

OS - Container running Debian GNU/Linux 11
Python 3.10

Install ffmpeg

```
sudo apt install ffmpeg
```

Install requirements.txt.


# How to run the APP

Once the API is running, you just have to run a local serve, serving index.html