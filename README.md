AffectCx
==============================

To compute the cognitive resonance score and its main components, we need 7 different models: 

* Body alignment (MediaPipe)
* Eye Gaze (MediaPipe)
* Face expression (FaceApi)
* Audio Transcription (Google speech-to-text)
* Voice pace (Heuristic)
* Speech emotion based on audio transcription (model HuggingFace EmoRoBERTa)
* Speech emotion based on audio signals (model SpeechBrain emotion-recognition-wav2vec2-IEMOCAP)

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

Currently using annyang library, which leverages google speech-to-text on chromium browsers and it is free. 

* Easy implementation on Javascript.
* Can be optimized for medical terms.

## SpeechBrain

* Performant and Open-Source conversational AI Toolkit.

Source: https://speechbrain.github.io/

## HuggingFace EmoRoBERTa

The RoBERTa model was proposed in RoBERTa: A Robustly Optimized BERT Pretraining Approach by Yinhan Liu, Myle Ott, Naman Goyal, Jingfei Du, Mandar Joshi, Danqi Chen, Omer Levy, Mike Lewis, Luke Zettlemoyer, Veselin Stoyanov. It is based on Google’s BERT model released in 2018.

RoBERTa builds on BERT’s language masking strategy and modifies key hyperparameters in BERT, including removing BERT’s next-sentence pretraining objective, and training with much larger mini-batches and learning rates. RoBERTa was also trained on an order of magnitude more data than BERT, for a longer amount of time. This allows RoBERTa representations to generalize even better to downstream tasks compared to BERT.

Source: https://huggingface.co/arpanghoshal/EmoRoBERTa

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