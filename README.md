AffectCx
==============================

To compute the cognitive resonance score and its main components, we need 6 different models: 

* Body alignment (MediaPipe)
* Eye Gaze (MediaPipe)
* Face expression (FaceApi)
* Audio Transcription (Annyang)
* Speech emotion based on audio transcription (model HuggingFace EmoRoBERTa)
* Speech emotion based on audio signals (model SpeechBrain emotion-recognition-wav2vec2-IEMOCAP)

## MediaPipe

* Performant (robust when compared to other publicly available models)
* Runs on Javascript (runs on client side to avoid latency)
* License: Apache-2.0 license

Source: https://github.com/google/mediapipe

## Face-API JS

* Lightweight (less than 1 mb)
* Runs on Javascript (runs on client side to avoid latency)
* Performant (robust when compared to other publicly available models)
* License: MIT license

Source: https://github.com/justadudewhohacks/face-recognition.js

## Annyang

Currently using annyang library, which leverages google speech-to-text on chromium browsers and it is open-source. 
This library is currently used just for test purposes, the production tool would use Google Speech-to-Text tools directly.

* Easy implementation on Javascript.
* Can be optimized for medical terms.
* License: MIT

Source annyang: https://cloud.google.com/speech-to-text

## SpeechBrain

* Performant and Open-Source conversational AI Toolkit.
* License: Apache-2.0 license

Source: https://github.com/speechbrain/speechbrain

## HuggingFace EmoRoBERTa

The RoBERTa model was proposed in RoBERTa: A Robustly Optimized BERT Pretraining Approach by Yinhan Liu, Myle Ott, Naman Goyal, Jingfei Du, Mandar Joshi, Danqi Chen, Omer Levy, Mike Lewis, Luke Zettlemoyer, Veselin Stoyanov. It is based on Google’s BERT model released in 2018.

RoBERTa builds on BERT’s language masking strategy and modifies key hyperparameters in BERT, including removing BERT’s next-sentence pretraining objective, and training with much larger mini-batches and learning rates. RoBERTa was also trained on an order of magnitude more data than BERT, for a longer amount of time. This allows RoBERTa representations to generalize even better to downstream tasks compared to BERT.

* License: MIT

Source: https://huggingface.co/arpanghoshal/EmoRoBERTa

# How to run the API 

The API is used to make real time inferences about the speech transcription. 

System requirements:

```
OS - Docker container running Debian GNU/Linux 11
Python 3.10
```

Install the src folder as a package

```
pip install -e . # install the src code as a package <br>
pip install -U "ray[default]" 
pip install -U "ray[serve]"
pip install tensorflow
pip install transformers
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

## Ray Core and Ray Serve

* Run both on AWS and Google infrastructure
* Easily scale AI and Python applications
* License: Apache-2.0 license

Source: https://github.com/ray-project/ray

## FastAPI

* Easy to deploy APIs
* License: MIT

Source: https://github.com/tiangolo/fastapi

# How to run the jupyter notebook

The notebook is used to make post analytics including:

* Processing audio files to get pitch emotion classes
* Computing Attention Economics
* Computing Mood Induction
* Computing Value Internalization
* Computing Cognitive Resonance Score

The main inputs are: 

* Logs with inferences made from the call
* Audio files from each speaker

How to run the notebook? 

System requirements:

```
OS - Docker container running Debian GNU/Linux 11
Python 3.10
```

Install ffmpeg and required packages

```
sudo apt install ffmpeg
pip install -r requirements.txt
```

# How to run the APP

Once the API is running, you just have to run a local serve, serving index.html. You should open it on Microsoft Edge if using MAC and Chrome if using Windows.