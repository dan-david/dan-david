from fastapi import FastAPI
from pydantic import BaseModel
from ray import serve
from transformers import RobertaTokenizerFast, TFRobertaForSequenceClassification, pipeline
from fastapi.middleware.cors import CORSMiddleware

#Create an object of class FastAPI
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_headers=["*"],
    allow_credentials=True,
    allow_methods=["POST", "GET"],
)

class RequestSchema(BaseModel):
    '''In fast-api this class is created just for documentation purposes'''
    features: str

class ResponseSchema(BaseModel):
    '''In fast-api this class is created just for documentation purposes'''
    prediction: str

@serve.deployment(route_prefix="/api_v1")
@serve.ingress(app)
class AffectCxAPI_v1:

    def __init__(self):

        tokenizer = RobertaTokenizerFast.from_pretrained("arpanghoshal/EmoRoBERTa")
        model = TFRobertaForSequenceClassification.from_pretrained("arpanghoshal/EmoRoBERTa")
        self.emotion = pipeline('sentiment-analysis', model='arpanghoshal/EmoRoBERTa', return_all_scores= True)

    @app.get("/")
    def root(self):
        return "Hello World!"

    @app.post("/speech_emotion_detection")
    def face_detection(self, request: RequestSchema):
        try:
            parsing = dict(request)['features']
            emotion = self.emotion(parsing)
            return {"prediction": emotion[0]}
        except Exception as error:
            return {"prediction": str(error)}
