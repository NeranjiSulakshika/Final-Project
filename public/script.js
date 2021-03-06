const socket = io("/");
const videoGrid = document.getElementById("video-grid");
const myVideo = document.createElement("video");
const showChat = document.querySelector("#showChat");
const backBtn = document.querySelector(".header__back");
myVideo.muted = true;

backBtn.addEventListener("click", () => {
  document.querySelector(".main__left").style.display = "flex";
  document.querySelector(".main__left").style.flex = "1";
  document.querySelector(".main__right").style.display = "none";
  document.querySelector(".header__back").style.display = "none";
});

showChat.addEventListener("click", () => {
  document.querySelector(".main__right").style.display = "flex";
  document.querySelector(".main__right").style.flex = "1";
  document.querySelector(".main__left").style.display = "none";
  document.querySelector(".header__back").style.display = "block";
});
document.addEventListener("load", () => {
  faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
    faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
    faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
    faceapi.nets.faceExpressionNet.loadFromUri("/models");
});

const user = prompt("Enter your name");

var peer = new Peer(undefined, {
  path: "/peerjs",
  host: "/",
  port: "443",
});

const peers = {};
socket.on("user-disconnected", (userId, count) => {
  if (peers[userId]) {
      peers[userId].close();
      delete peers[userId];
      changeCount(count);
  }
});

let myVideoStream;
var myVideoTrack;

navigator.mediaDevices
  .getUserMedia({
    audio: true,
    video: true,
  })
  .then((stream) => {
    myVideoStream = stream;
    addVideoStream(myVideo, stream);

    peer.on("call", (call) => {
      call.answer(stream);
      call.on("stream", (userVideoStream) => {
        addVideoStream(myVideo, userVideoStream);
      });
    });

  //   socket.on("user-connected", (userId) => {
  //     connectToNewUser(userId, stream);
  //   });
  // });
  socket.on("user-connected", (userId, count) => {
    socket.emit("user-callback");
    connectToNewUser(userId, stream);
    changeCount(count);
  });
});

const changeCount = (count) => {
  const counter = document.getElementById("user-number");
  counter.innerHTML = count;
};

const connectToNewUser = (userId, stream) => {
  const call = peer.call(userId, stream);
  const video = document.createElement("video");

  call.on("stream", (userVideoStream) => {
    addVideoStream(video, userVideoStream);

  });
};

// const meetingToggleBtn = document.getElementById("meeting-toggle");
// meetingToggleBtn.addEventListener("click", (e) => {
//     const currentElement = e.target;
//     const counter = document.getElementById("user-number");
//     const count = Number(counter.innerText) + 1;
//     if (currentElement.classList.contains("call-button")) {
//         changeCount(count);
//         currentElement.classList.remove("call-button");
//         currentElement.classList.add("call-end-button");
//         currentElement.classList.add("tooltip-danger");
//         currentElement.setAttribute("tool_tip", "Leave the Meeting");
//         socket.emit(
//             "join-room",
//             ROOM_ID,
//             Peer_ID,
//             USER_ID,
//             name,
//             myVideoStream.getAudioTracks()[0].enabled,
//             myVideoStream.getVideoTracks()[0].enabled
//         );
//     } else location.replace(`/`);
// });

peer.on("open", (id) => {
  socket.emit("join-room", ROOM_ID, id, user);
});

const addVideoStream = (video, stream) => {
  video.srcObject = stream;
  video.addEventListener("loadedmetadata", () => {
    video.play();
    videoGrid.append(video);
  });
  
  Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
    faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
    faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
    faceapi.nets.faceExpressionNet.loadFromUri("/models"),
  ]).then(() => {
    const canvas = faceapi.createCanvasFromMedia(video);
    videoGrid.append(canvas);
    const displaySize = { width: 400, height:300 }
    faceapi.matchDimensions(canvas, displaySize)
    setInterval(async () => {
      const detections = await faceapi
        .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceExpressions();
      const resizedDetections = faceapi.resizeResults(
        detections,
        displaySize
      );
      ctx=canvas.getContext("2d")
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      faceapi.draw.drawDetections(canvas, resizedDetections);
      faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
       faceapi.draw.drawFaceExpressions(canvas, resizedDetections);
    }, 100);
  });
};

let text = document.querySelector("#chat_message");
let send = document.getElementById("send");
let messages = document.querySelector(".messages");

send.addEventListener("click", (e) => {
  if (text.value.length !== 0) {
    socket.emit("message", text.value);
    text.value = "";
  }
});

text.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && text.value.length !== 0) {
    socket.emit("message", text.value);
    text.value = "";
  }
});

const inviteButton = document.querySelector("#inviteButton");
const muteButton = document.querySelector("#muteButton");
const stopVideo = document.querySelector("#stopVideo");
muteButton.addEventListener("click", () => {
  const enabled = myVideoStream.getAudioTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getAudioTracks()[0].enabled = false;
    html = `<i class="fas fa-microphone-slash"></i>`;
    muteButton.classList.toggle("background__red");
    muteButton.innerHTML = html;
  } else {
    myVideoStream.getAudioTracks()[0].enabled = true;
    html = `<i class="fas fa-microphone"></i>`;
    muteButton.classList.toggle("background__red");
    muteButton.innerHTML = html;
  }
});

stopVideo.addEventListener("click", () => {
  const enabled = myVideoStream.getVideoTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getVideoTracks()[0].enabled = false;
    html = `<i class="fas fa-video-slash"></i>`;
    stopVideo.classList.toggle("background__red");
    stopVideo.innerHTML = html;
  } else {
    myVideoStream.getVideoTracks()[0].enabled = true;
    html = `<i class="fas fa-video"></i>`;
    stopVideo.classList.toggle("background__red");
    stopVideo.innerHTML = html;
  }
});

inviteButton.addEventListener("click", (e) => {
  prompt(
    "Copy this link and send it to people you want to meet with",
    window.location.href
  );
});

socket.on("createMessage", (message, userName) => {
  messages.innerHTML =
    messages.innerHTML +
    `<div class="message">
        <b><i class="far fa-user-circle"></i> <span> ${
          userName === user ? "me" : userName
        }</span> </b>
        <span>${message}</span>
    </div>`;
});

// share screen
const shareScreenBtn = document.getElementById("share-screen");
shareScreenBtn.addEventListener("click", (e) => {
    if (e.target.classList.contains("true")) return;
    e.target.setAttribute("tool_tip", "You are already presenting screen");
    e.target.classList.add("true");
    navigator.mediaDevices
        .getDisplayMedia({
            video: true,
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                sampleRate: 44100,
            },
        })
        .then((stream) => {
            var videoTrack = stream.getVideoTracks()[0];
            myVideoTrack = myVideoStream.getVideoTracks()[0];
            replaceVideoTrack(myVideoStream, videoTrack);
            for (peer in peers) {
                let sender = peers[peer].peerConnection
                    .getSenders()
                    .find(function (s) {
                        return s.track.kind == videoTrack.kind;
                    });
                sender.replaceTrack(videoTrack);
            }
            const elementsWrapper = document.querySelector(".elements-wrapper");
            const stopBtn = document.createElement("button");
            stopBtn.classList.add("video-element");
            stopBtn.classList.add("stop-presenting-button");
            stopBtn.innerHTML = "Stop Sharing";
            elementsWrapper.classList.add("screen-share");
            elementsWrapper.appendChild(stopBtn);
            videoTrack.onended = () => {
                elementsWrapper.classList.remove("screen-share");
                stopBtn.remove();
                stopPresenting(videoTrack);
            };
            stopBtn.onclick = () => {
                videoTrack.stop();
                elementsWrapper.classList.remove("screen-share");
                stopBtn.remove();
                stopPresenting(videoTrack);
            };
        });
});

const stopPresenting = (videoTrack) => {
  shareScreenBtn.classList.remove("true");
  shareScreenBtn.setAttribute("tool_tip", "Present Screen");
  for (peer in peers) {
      let sender = peers[peer].peerConnection.getSenders().find(function (s) {
          return s.track.kind == videoTrack.kind;
      });
      sender.replaceTrack(myVideoTrack);
  }
  replaceVideoTrack(myVideoStream, videoTrack);
};

const replaceVideoTrack = (myVideoStream, videoTrack) => {
  myVideoStream.removeTrack(myVideoStream.getVideoTracks()[0]);
  myVideoStream.addTrack(videoTrack);  
};