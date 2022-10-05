const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
let ctx;
let videoWidth, videoHeight;
var model_emotion = undefined;

function drawPath(ctx, points, closePath) {
  const region = new Path2D();
  region.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) {
    const point = points[i];
    region.lineTo(point[0], point[1]);
  }

  if (closePath) {
    region.closePath();
  }
  ctx.stroke(region);
}

// Check if webcam access is supported.
function getUserMediaSupported() {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}

// Turn webcam on
async function setupCamera() {
  if (getUserMediaSupported()) {
    const videoConfig = {
      audio: false,
      video: {
        // facingMode: 'environment',
        // Only setting the video to a specified size for large screen, on
        // mobile devices accept the default size.
        width: 640,
        height: 475,
        frameRate: {
          ideal: 30,
        },
      },
    };
    const stream = await navigator.mediaDevices.getUserMedia(videoConfig);
    video.srcObject = stream;
    return new Promise((resolve) => {
      video.onloadedmetadata = () => {
        videoWidth = video.videoWidth;
        videoHeight = video.videoHeight;
        video.width = videoWidth;
        video.height = videoHeight;
        resolve(video);
      };
    });
  } else {
    console.warn('getUserMedia() is not supported by your browser');
  }
}

async function setupCanvas() {
  canvas.width = 400;
  canvas.height = 300;

  ctx = canvas.getContext('2d');
  ctx.translate(canvas.width, 0);
  ctx.scale(-1, 1);

  ctx.fillStyle = 'green';
}

async function loadFaceLandmarkDetectionModel() {
  return faceLandmarksDetection.load(
    faceLandmarksDetection.SupportedPackages.mediapipeFacemesh,
    { maxFaces: 1 }
  );
}

// Eye marks
let eyesBlinkedCounter = 0;
let eyesClosed = 0;
let eyesRight = 0;
let eyesLeft = 0;
var init_lr = undefined;
var init_ud = undefined;

function detectBlinkingEyes(keypoints) {
  const rightEyeUpperY = keypoints[159][1];
  const rightEyeLowerY = keypoints[145][1];
  const leftEyeUpperY = keypoints[386][1];
  const leftEyeLowerY = keypoints[374][1];

  const eyeOutlinePoints = rightEyeUpperY.concat(
    rightEyeLowerY,
    leftEyeUpperY,
    leftEyeLowerY
  );

  let rightEyeCenterPointDistance = Math.abs(
    rightEyeUpperY[3][1] - rightEyeLowerY[4][1]
  );
  let leftEyeCenterPointDistance = Math.abs(
    leftEyeUpperY[3][1] - leftEyeLowerY[4][1]
  );

  if (rightEyeCenterPointDistance < 7 || leftEyeCenterPointDistance < 7) {
    eyesClosed = 1;
  }

  if (
    eyesClosed == 1 &&
    (rightEyeCenterPointDistance > 9 || leftEyeCenterPointDistance > 9)
  ) {
    eyesClosed = 0;
  }
}

function cross_normalised(x, y) {
  cross = [
    x[1] * y[2] - x[2] * y[1],
    x[2] * y[0] - x[0] * y[2],
    x[0] * y[1] - x[1] * y[0],
  ];
  norm = Math.sqrt(cross[0] ** 2 + cross[1] ** 2 + cross[2] ** 2);
  return [cross[0] / norm, cross[1] / norm, cross[2] / norm];
}

function detectHeadDirection(prediction) {
  left_cheek = prediction['annotations']['leftCheek'][0];
  right_cheek = prediction['annotations']['rightCheek'][0];

  lips_lower_inner = [0, 0, 0];
  lips_coords = prediction['annotations']['lipsLowerInner'];
  for (i = 0; i < lips_coords.length; i++) {
    for (j = 0; j < 3; j++) {
      lips_lower_inner[j] += lips_coords[i][j];
    }
  }
  for (j = 0; j < 3; j++) {
    lips_lower_inner[j] = lips_lower_inner[j] / lips_coords.length;
  }

  left_diff = [];
  right_diff = [];
  for (i = 0; i < 3; i++) {
    left_diff.push(left_cheek[i] - lips_lower_inner[i]);
    right_diff.push(right_cheek[i] - lips_lower_inner[i]);
  }

  cross = cross_normalised(left_diff, right_diff);

  lr = cross[0];
  ud = cross[1];
  if (init_lr === undefined) {
    init_lr = lr;
  }
  if (init_ud === undefined) {
    init_ud = ud;
  }

  tol = 0.2;
  if (lr - init_lr > tol) {
    direction = 'left';
  } else if (lr - init_lr < -tol) {
    direction = 'right';
  } else if (ud - init_ud > tol) {
    direction = 'down';
  } else if (ud - init_ud < -tol) {
    direction = 'up';
  } else {
    direction = 'center';
  }

  return direction;
}

function detectEyesDirection(keypoints) {
  const rightEyeCenterX = keypoints[133][0];
  const rightIrisCenterX = keypoints[473][0];
  const rightEyeOuterX = keypoints[33][0];

  const leftEyeCenterX = keypoints[362][0];
  const leftIrisCenterX = keypoints[468][0];
  const leftEyeOuterX = keypoints[263][0];

  let rightEyeCenterPointDistance =
    Math.abs(rightEyeCenterX - rightIrisCenterX) /
    Math.abs(rightEyeOuterX - rightEyeCenterX);
  let leftEyeCenterPointDistance =
    Math.abs(leftEyeOuterX - leftIrisCenterX) /
    Math.abs(leftEyeOuterX - leftEyeCenterX);

  direction = 'center';

  if (rightEyeCenterPointDistance < 0.45 || leftEyeCenterPointDistance < 0.45) {
    direction = 'left';
  }

  if (
    direction == 'left' &&
    (rightEyeCenterPointDistance > 0.45 || leftEyeCenterPointDistance > 0.45)
  ) {
    direction = 'center';
  }

  if (rightEyeCenterPointDistance > 0.55 || leftEyeCenterPointDistance > 0.55) {
    direction = 'right';
  }

  if (
    direction == 'right' &&
    (rightEyeCenterPointDistance < 0.55 || leftEyeCenterPointDistance < 0.55)
  ) {
    direction = 'center';
  }

  return direction;
}

async function renderPrediction() {
  const predictions = await model.estimateFaces({
    input: video,
    returnTensors: false,
    flipHorizontal: false,
    predictIrises: true,
  });

  ctx.drawImage(
    video,
    0,
    0,
    video.width,
    video.height,
    0,
    0,
    canvas.width,
    canvas.height
  );

  window.requestAnimationFrame(renderPrediction);

  if (predictions.length > 0) {
    predictions.forEach((prediction) => {
      const ratio_canvas_w = video.width / canvas.width;
      const ratio_canvas_h = video.height / canvas.height;
      const bbox = prediction.boundingBox;
      const xMin = (bbox.topLeft[0] / ratio_canvas_w) >> 0;
      const xMax = (bbox.bottomRight[0] / ratio_canvas_w) >> 0;
      const yMin = (bbox.topLeft[1] / ratio_canvas_h) >> 0;
      const yMax = (bbox.bottomRight[1] / ratio_canvas_h) >> 0;
      drawPath(
        ctx,
        [
          [xMin, yMin],
          [xMax, yMin],
          [xMax, yMax],
          [xMin, yMax],
        ],
        true
      );

      //ctx.drawImage(video, xMin, yMin, xMax - xMin, yMax - yMin, 0, 0, 640, 475);})
      const faceImage = ctx.getImageData(xMin, yMin, xMax - xMin, yMax - yMin);

      const keypoints = prediction.scaledMesh;

      HeadDirection = detectHeadDirection(prediction);
      EyesDirection = detectEyesDirection(keypoints);

      document
        .getElementById('head_direction')
        .setAttribute('class', HeadDirection);
      document
        .getElementById('eyes_direction')
        .setAttribute('class', EyesDirection);
    });
  }
}

async function EmoNetPrediction(faceImage) {
  _expressions = {
    0: 'neutral',
    1: 'happy',
    2: 'sad',
    3: 'surprise',
    4: 'anger',
  };

  inputTensor = tf.browser
    .fromPixels(faceImage)
    .resizeBilinear([256, 256])
    .reshape([-1, 3, 256, 256]);
  inputTensorNormalize = inputTensor.div(tf.scalar(255));
  output = await EmoNetEngine.executeAsync((inputs = inputTensorNormalize));
  console.log(_expressions[tf.argMax(output[1], (axis = 1)).arraySync()]);
  console.log(output[2].arraySync());
  console.log(output[3].arraySync());
  inputTensor.dispose();
  inputTensorNormalize.dispose();
  output.forEach((l) => l.dispose());
}

async function faceEmotion() {
  const detection = await faceapi
    .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
    .withFaceExpressions();

  if (detection.length > 0) {
    document.getElementById('faceangry').style.width =
      100 * detection[0]['expressions']['angry'] + '%';
    document.getElementById('facedisgust').style.width =
      100 * detection[0]['expressions']['disgusted'] + '%';
    document.getElementById('facefear').style.width =
      100 * detection[0]['expressions']['fearful'] + '%';
    document.getElementById('facehappy').style.width =
      100 * detection[0]['expressions']['happy'] + '%';
    document.getElementById('facesad').style.width =
      100 * detection[0]['expressions']['sad'] + '%';
    document.getElementById('facesurprise').style.width =
      100 * detection[0]['expressions']['surprised'] + '%';
    document.getElementById('faceneutral').style.width =
      100 * detection[0]['expressions']['neutral'] + '%';
  }

  if (user_id) {
    modelVersion = 1;

    facialAngry = parseInt(
      document.getElementById('faceangry').style.width,
      10
    );
    facialDisgust = parseInt(
      document.getElementById('facedisgust').style.width,
      10
    );
    facialFear = parseInt(document.getElementById('facefear').style.width, 10);
    facialHappy = parseInt(
      document.getElementById('facehappy').style.width,
      10
    );
    facialSad = parseInt(document.getElementById('facesad').style.width, 10);
    facialSurprise = parseInt(
      document.getElementById('facesurprise').style.width,
      10
    );
    facialNeutral = parseInt(
      document.getElementById('faceneutral').style.width,
      10
    );

    speechAdmiration = parseInt(
      document.getElementById('admiration').style.width,
      10
    );
    speechAmusement = parseInt(
      document.getElementById('amusement').style.width,
      10
    );
    speechAnger = parseInt(document.getElementById('anger').style.width, 10);
    speechAnnoyance = parseInt(
      document.getElementById('annoyance').style.width,
      10
    );
    speechApproval = parseInt(
      document.getElementById('approval').style.width,
      10
    );
    speechCaring = parseInt(document.getElementById('caring').style.width, 10);
    speechConfusion = parseInt(
      document.getElementById('confusion').style.width,
      10
    );
    speechCuriosity = parseInt(
      document.getElementById('curiosity').style.width,
      10
    );
    speechDesire = parseInt(document.getElementById('desire').style.width, 10);
    speechDisappointment = parseInt(
      document.getElementById('disappointment').style.width,
      10
    );
    speechDisapproval = parseInt(
      document.getElementById('disapproval').style.width,
      10
    );
    speechDisgust = parseInt(
      document.getElementById('disgust').style.width,
      10
    );
    speechEmbarrassment = parseInt(
      document.getElementById('embarrassment').style.width,
      10
    );
    speechExcitement = parseInt(
      document.getElementById('excitement').style.width,
      10
    );
    speechFear = parseInt(document.getElementById('fear').style.width, 10);
    speechGratitude = parseInt(
      document.getElementById('gratitude').style.width,
      10
    );
    speechGrief = parseInt(document.getElementById('grief').style.width, 10);
    speechJoy = parseInt(document.getElementById('joy').style.width, 10);
    speechLove = parseInt(document.getElementById('love').style.width, 10);
    speechNervousness = parseInt(
      document.getElementById('nervousness').style.width,
      10
    );
    speechOptimism = parseInt(
      document.getElementById('optimism').style.width,
      10
    );
    speechPride = parseInt(document.getElementById('pride').style.width, 10);
    speechRealization = parseInt(
      document.getElementById('realization').style.width,
      10
    );
    speechRelief = parseInt(document.getElementById('relief').style.width, 10);
    speechRemorse = parseInt(
      document.getElementById('remorse').style.width,
      10
    );
    speechSadness = parseInt(
      document.getElementById('sadness').style.width,
      10
    );
    speechSurprise = parseInt(
      document.getElementById('surprise').style.width,
      10
    );
    speechNeutral = parseInt(
      document.getElementById('neutral').style.width,
      10
    );

    const url_get =
      `http://localhost:3000/behavior/` +
      `${user_id}?` +
      `modelVersion=${modelVersion}` +
      `&facialAngry=${facialAngry}` +
      `&facialDisgust=${facialDisgust}` +
      `&facialFear=${facialFear}` +
      `&facialHappy=${facialHappy}` +
      `&facialSad=${facialSad}` +
      `&facialSurprise=${facialSurprise}` +
      `&facialNeutral=${facialNeutral}` +
      `&speechAdmiration=${speechAdmiration}` +
      `&speechAmusement=${speechAmusement}` +
      `&speechAnger=${speechAnger}` +
      `&speechAnnoyance=${speechAnnoyance}` +
      `&speechApproval=${speechApproval}` +
      `&speechCaring=${speechCaring}` +
      `&speechConfusion=${speechConfusion}` +
      `&speechCuriosity=${speechCuriosity}` +
      `&speechDesire=${speechDesire}` +
      `&speechDisappointment=${speechDisappointment}` +
      `&speechDisapproval=${speechDisapproval}` +
      `&speechDisgust=${speechDisgust}` +
      `&speechEmbarrassment=${speechEmbarrassment}` +
      `&speechExcitement=${speechExcitement}` +
      `&speechFear=${speechFear}` +
      `&speechGratitude=${speechGratitude}` +
      `&speechGrief=${speechGrief}` +
      `&speechJoy=${speechJoy}` +
      `&speechLove=${speechLove}` +
      `&speechNervousness=${speechNervousness}` +
      `&speechOptimism=${speechOptimism}` +
      `&speechPride=${speechPride}` +
      `&speechRealization=${speechRealization}` +
      `&speechRelief=${speechRelief}` +
      `&speechRemorse=${speechRemorse}` +
      `&speechSadness=${speechSadness}` +
      `&speechSurprise=${speechSurprise}` +
      `&speechNeutral=${speechNeutral}`;

    fetch(url_get, {
      mode: 'no-cors',
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Origin: 'http://localhost:9000',
      },
    });
  }

  window.requestAnimationFrame(faceEmotion);
}

function holisticBehavior() {
  score = 100;

  if (
    document.getElementById('head_direction') &&
    document.getElementById('eyes_direction')
  ) {
    HeadDirection = document.getElementById('head_direction').className;
    EyesDirection = document.getElementById('eyes_direction').className;

    angry = parseInt(document.getElementById('faceangry').style.width, 10);
    disgust = parseInt(document.getElementById('facedisgust').style.width, 10);
    fear = parseInt(document.getElementById('facefear').style.width, 10);
    happy = parseInt(document.getElementById('facehappy').style.width, 10);
    sad = parseInt(document.getElementById('facesad').style.width, 10);
    surprise = parseInt(
      document.getElementById('facesurprise').style.width,
      10
    );
    neutral = parseInt(document.getElementById('faceneutral').style.width, 10);

    if (HeadDirection != 'center') {
      score -= 15;
    }
    if (EyesDirection != 'center') {
      score -= 15;
    }
    if (angry > 25 || disgust > 25) {
      score = 25;
    }
    if (happy > 50 || surprise > 50) {
      score = 100;
    }
  }

  score = Math.max(0, score);

  document.getElementById('cognitive resonance').style.width = score + '%';
  document.getElementById('attention economics').style.width = score + '%';
  document.getElementById('mood induction').style.width = score + '%';
  document.getElementById('value internalization').style.width = score + '%';

  window.requestAnimationFrame(holisticBehavior);
}

function GenerateEmotionCards() {
  var keys = [
    'FaceAngry',
    'FaceDisgust',
    'FaceFear',
    'FaceHappy',
    'FaceSad',
    'FaceSurprise',
    'FaceNeutral',
  ];

  var parent_session = document.getElementById('emotion_cards');

  for (let i = 0; i < keys.length; i++) {
    newbar = document.createElement('div');
    newbar.setAttribute('class', 'cam_bar');

    newbartxt = document.createElement('div');
    newbartxt.setAttribute('class', 'card_text');
    txt = document.createTextNode('\n' + keys[i]);
    newbartxt.appendChild(txt);

    newbarmain = document.createElement('div');
    newbarmain.setAttribute('class', 'cam_bar_main');

    newbarsub = document.createElement('div');
    newbarsub.setAttribute('id', keys[i].toLowerCase());
    newbarsub.setAttribute('class', 'cam_bar_sub');
    newbarmain.appendChild(newbarsub);

    newbar.appendChild(newbartxt);
    newbar.appendChild(newbarmain);
    parent_session.appendChild(newbar);
  }
}

function normalize(data) {
  const dataMax = data.max();
  const dataMin = data.min();
  return data.sub(dataMin).div(dataMax.sub(dataMin));
}

async function main() {
  //Set up camera
  await setupCamera();

  //Set up canvas
  await setupCanvas();

  //Load the model
  model = await loadFaceLandmarkDetectionModel();

  //EmoNetEngine = await EmoNet();

  //Render Face Mesh Prediction
  await renderPrediction();

  //Render Face Emotion Prediction
  await faceEmotion();

  holisticBehavior();
}

// Generate Emotion Cards
GenerateEmotionCards();

const MODEL_URL = 'models/faceAPI/';
Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
  faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
  faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
  faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
]).then(main());
