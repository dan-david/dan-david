let engine = undefined;
let data = undefined;
var user_id = undefined;
let userAgent = navigator.userAgent;
let browserName;
var final_transcript = '';
let word_count = 0;
let full_transcript = '';
let lastUrl = location.href;
let commands = GenerateTopics();
let current_minute = 0;
var keys = Object.keys(commands);

// Identify the current brownser
function BrownserIdentification() {
  if (userAgent.match(/chrome|chromium|crios/i)) {
    browserName = 'chrome';
  } else if (userAgent.match(/firefox|fxios/i)) {
    browserName = 'firefox';
  } else if (userAgent.match(/safari/i)) {
    browserName = 'safari';
  } else if (userAgent.match(/edg/i)) {
    browserName = 'edge';
  } else {
    browserName = 'No browser detection';
  }
  return browserName;
}

// Create the topics of interest on the html page
function GenerateTopics() {
  var keys = [
    'Type 1 diabetes',
    'Research background',
    'Clinical trial',
    'Heart failure',
    'Covid',
    'Melanoma',
    'Hair loss',
    'Allergies',
    'Glaucoma',
    'Glioblastoma',
  ];

  const commands = {};

  for (let i = 0; i < keys.length; i++) {
    var parent_session = document.getElementById('session_topics');
    var newtopic = document.createElement('div');
    newtopic.setAttribute('id', 'session_topic_' + i);
    newtopic.setAttribute('class', 'card_text');
    txt = document.createTextNode('\nTopic ' + (i + 1) + ': ' + keys[i]);
    newtopic.appendChild(txt);
    parent_session.appendChild(newtopic);

    commands[keys[i]] = function () {
      document.getElementById('session_topic_' + i).style.color = 'green';
      document.getElementById('session_topic_' + i).style.fontWeight = 'bold';
    };
  }
  return commands;
}

// Retrieve emotion predictions based on the transcription
function query(data, engine) {
  var url = 'http://127.0.0.1:8000/api_v1/speech_emotion_detection';

  var xhr = new XMLHttpRequest();
  xhr.open('POST', url);

  xhr.setRequestHeader('Accept', 'application/json');
  xhr.setRequestHeader('Content-Type', 'application/json');

  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4) {
      response = xhr.responseText;
      prediction = JSON.parse(response)['prediction'];

      for (let i = 0; i < prediction.length; i++) {
        emotion_label = prediction[i]['label'];
        emotion_score = prediction[i]['score'];
        document.getElementById(emotion_label).style.width =
          emotion_score * 100 + '%';
      }
    }
  };

  var payload = JSON.stringify({ features: data });

  xhr.send(payload);
}

// Generate html cards for different emotions
function GenerateBehaviorCards() {
  var keys = [
    'Cognitive Resonance',
    'Attention Economics',
    'Mood Induction',
    'Value Internalization',
    'Admiration',
    'Amusement',
    'Anger',
    'Annoyance',
    'Approval',
    'Caring',
    'Confusion',
    'Curiosity',
    'Desire',
    'Disappointment',
    'Disapproval',
    'Disgust',
    'Embarrassment',
    'Excitement',
    'Fear',
    'Gratitude',
    'Grief',
    'Joy',
    'Love',
    'Nervousness',
    'Optimism',
    'Pride',
    'Realization',
    'Relief',
    'Remorse',
    'Sadness',
    'Surprise',
    'Neutral',
  ];

  for (let i = 0; i < keys.length; i++) {
    if (i < 4) {
      parent_session = document.getElementById('behavior_cards_column_0');
    } else if (i < 14) {
      parent_session = document.getElementById('behavior_cards_column_1');
    } else if (i < 24) {
      parent_session = document.getElementById('behavior_cards_column_2');
    } else {
      parent_session = document.getElementById('behavior_cards_column_3');
    }

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

// Main function
async function main() {
  // Generate Behavior Cards
  GenerateBehaviorCards();

  browserName = BrownserIdentification();

  if (
    browserName == 'chrome' ||
    browserName == 'firefox' ||
    browserName == 'edge'
  ) {
    annyang.start();

    if (annyang) {
      annyang.addCallback('result', function (whatWasHeardArray) {
        var today = new Date();

        if (current_minute != today.getMinutes()) {
          current_minute = today.getMinutes();
          var time = today.getHours() + ':' + today.getMinutes();

          final_transcript +=
            '[' +
            word_count +
            ']' +
            ';' +
            '<br><br> ' +
            ' ' +
            time +
            ' ' +
            whatWasHeardArray[0] +
            '.';

          word_count = whatWasHeardArray[0].trim().split(/\s+/).length;
        } else {
          word_count += whatWasHeardArray[0].trim().split(/\s+/).length;
          final_transcript += whatWasHeardArray[0] + '.';
        }

        final_transcript = final_transcript.toUpperCase();
        final_transcript = final_transcript.replace('[0];', '');

        document.getElementById('transcript-full').innerHTML = final_transcript;

        for (let i = 0; i < keys.length; i++) {
          key = keys[i];
          if (final_transcript.includes(key.toUpperCase())) {
            keys.splice(i, 1);
            commands[key]();
          }
        }

        engine = 'http://127.0.0.1:8000/api_v1/speech_emotion_detection';
        data = whatWasHeardArray[0];

        query(data, engine);
      });
    }
  } else {
    console.log('Not supported');
  }
}

main();

// retrieve user ID (unique per meeting / identifies both host and guest)
new MutationObserver(() => {
  const url = location.href;
  url_id = url.split('/').slice(-1)[0];
  if (url_id.length == 36 && user_id == undefined) {
    lastUrl = url;
    user_id = url_id;
  }
}).observe(document, { subtree: true, childList: true });
