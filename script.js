const socket = io();
const videoGrid = document.getElementById('video-grid');
const roomSelection = document.getElementById('room-selection');
const controlsBar = document.getElementById('controls-bar');
const roomInput = document.getElementById('room-input');
const joinBtn = document.getElementById('join-btn');

let myPeer;
let myVideoStream;
const peers = {};

const myVideo = document.createElement('video');
myVideo.muted = true; // खुद की आवाज़ म्यूट रखें ताकि गूँजे नहीं

navigator.mediaDevices.getUserMedia({
  video: true,
  audio: true
}).then(stream => {
  myVideoStream = stream;
  addVideoStream(myVideo, stream);

  // जब कोई दूसरा यूजर कॉल करेगा
  myPeer.on('call', call => {
    call.answer(stream);
    const video = document.createElement('video');
    call.on('stream', userVideoStream => {
      addVideoStream(video, userVideoStream);
    });
  });

  socket.on('user-connected', userId => {
    // थोड़ा इंतज़ार करके नए यूजर को कॉल कनेक्ट करें
    setTimeout(() => {
      connectToNewUser(userId, stream);
    }, 1000);
  });
}).catch(err => {
  console.error("कैमरा या माइक एक्सेस करने में समस्या:", err);
  alert("कृपया कैमरा और माइक की अनुमति (Permission) दें!");
});

socket.on('user-disconnected', userId => {
  if (peers[userId]) peers[userId].close();
});

// Join बटन पर क्लिक करने पर
joinBtn.addEventListener('click', () => {
  const roomName = roomInput.value.trim();
  if (!roomName) {
    alert("कृपया कोई रूम नाम दर्ज करें!");
    return;
  }

  // PeerJS सर्वर इनिशियलाइज करें
  myPeer = new Peer(undefined, {
    host: 'peerjs-server.herokuapp.com',
    secure: true,
    port: 443
  });

  myPeer.on('open', id => {
    socket.emit('join-room', roomName, id);
    roomSelection.style.display = 'none';
    controlsBar.style.display = 'flex';
  });
});

function connectToNewUser(userId, stream) {
  const call = myPeer.call(userId, stream);
  const video = document.createElement('video');
  call.on('stream', userVideoStream => {
    addVideoStream(video, userVideoStream);
  });
  call.on('close', () => {
    video.remove();
  });
  peers[userId] = call;
}

function addVideoStream(video, stream) {
  video.srcObject = stream;
  video.addEventListener('loadedmetadata', () => {
    video.play();
  });
  videoGrid.append(video);
}

// माइक म्यूट/अनम्यूट फीचर
function toggleAudio() {
  const enabled = myVideoStream.getAudioTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getAudioTracks()[0].enabled = false;
    document.getElementById('mic-btn').innerText = "Mic Unmute";
    document.getElementById('mic-btn').classList.add('active');
  } else {
    myVideoStream.getAudioTracks()[0].enabled = true;
    document.getElementById('mic-btn').innerText = "Mic Mute";
    document.getElementById('mic-btn').classList.remove('active');
  }
}

// वीडियो ऑन/ऑफ फीचर
function toggleVideo() {
  const enabled = myVideoStream.getVideoTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getVideoTracks()[0].enabled = false;
    document.getElementById('video-btn').innerText = "Video On";
    document.getElementById('video-btn').classList.add('active');
  } else {
    myVideoStream.getVideoTracks()[0].enabled = true;
    document.getElementById('video-btn').innerText = "Video Off";
    document.getElementById('video-btn').classList.remove('active');
  }
}