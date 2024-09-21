<template>
    <div class="container-fluid text-center">
      <h1>Simple WebRTC Signalling Server</h1>
      <div class="col-lg-12 mb-3">
        <div class="mb-3">User: {{ localUserName }} @ Room #{{ localRoom }}</div>
        <div class="col-lg-12 mb-3">
          <div class="d-flex justify-content-around mb-3">
            <div id="buttons" class="row">
              <div class="btn-group mr-2" role="group">
                <div class="mr-2" data-toggle="buttons">
                  <label class="btn btn-outline-success" @click="toggleVideo(true)">
                    <input type="radio" name="options" style="display:none" autocomplete="off">Video On
                  </label>
                  <label class="btn btn-outline-warning active" @click="toggleVideo(false)">
                    <input type="radio" name="options" style="display:none" autocomplete="off" checked>Video Off
                  </label>
                </div>
                <div class="mr-2" data-toggle="buttons">
                  <label class="btn btn-outline-success" @click="toggleAudio(true)">
                    <input type="radio" name="options" style="display:none" autocomplete="off">Audio On
                  </label>
                  <label class="btn btn-outline-warning active" @click="toggleAudio(false)">
                    <input type="radio" name="options" style="display:none" autocomplete="off" checked>Audio Off
                  </label>
                </div>
              </div>
              <button type="button" class="btn btn-outline-danger" @click="exitRoom">Exit Room</button>
            </div>
          </div>
        </div>
  
        <div class="row justify-content-around mb-3">
          <div class="col-lg-6 mb-3">
            <video id="local_video" ref="localVideo" autoplay playsinline></video>
          </div>
          <div class="col-lg-6 mb-3">
            <video id="remote_video" ref="remoteVideo" autoplay playsinline></video>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    props: ['sid', 'uuid'],
    data() {
      return {
        localStream: null,
        localVideoTracks: null,
        myPeerConnection: null,
        localRoom: this.sid,
        localUserName: localStorage.getItem("uuid"),
        socket: null
      };
    },
    mounted() {
      this.startWebSocketConnection();
    },
    methods: {
      startWebSocketConnection() {
        this.socket = new WebSocket(`ws://${window.location.host}/signal`);
  
        this.socket.onmessage = (msg) => {
          let message = JSON.parse(msg.data);
          switch (message.type) {
            case "text":
              this.log(`Text message from ${message.from} received: ${message.data}`);
              break;
            case "offer":
              this.handleOfferMessage(message);
              break;
            case "answer":
              this.handleAnswerMessage(message);
              break;
            case "ice":
              this.handleNewICECandidateMessage(message);
              break;
            case "join":
              console.log('Client is starting to ' + (message.data === "true)" ? 'negotiate' : 'wait for a peer'));
              this.handlePeerConnection(message);
              break;
            default:
              this.handleErrorMessage('Wrong type message received from server');
          }
        };
  
        this.socket.onopen = () => {
          this.log(`WebSocket connection opened to Room: #${this.localRoom}`);
          this.sendToServer({
            from: this.localUserName,
            type: 'join',
            data: this.localRoom
          });
        };
  
        this.socket.onclose = () => {
          this.log('Socket has been closed');
        };
  
        this.socket.onerror = (message) => {
          this.handleErrorMessage(`Error: ${message}`);
        };
      },
  
      sendToServer(msg) {
        this.socket.send(JSON.stringify(msg));
      },
  
      log(message) {
        console.log(message);
      },
  
      handleErrorMessage(message) {
        console.error(message);
      },
  
      exitRoom() {
        this.stop();
      },
  
      stop() {
        this.log("Send 'leave' message to server");
        this.sendToServer({
          from: this.localUserName,
          type: 'leave',
          data: this.localRoom
        });
  
        if (this.myPeerConnection) {
          this.log('Close the RTCPeerConnection');
          this.closePeerConnection();
        }
      },
  
      closePeerConnection() {
        if (this.myPeerConnection) {
          if (this.$refs.remoteVideo.srcObject) {
            this.$refs.remoteVideo.srcObject.getTracks().forEach(track => track.stop());
          }
          if (this.$refs.localVideo.srcObject) {
            this.$refs.localVideo.srcObject.getTracks().forEach(track => track.stop());
          }
          this.myPeerConnection.close();
          this.myPeerConnection = null;
          this.log('Close the socket');
          if (this.socket) {
            this.socket.close();
          }
        }
      },
  
      toggleVideo(turnOn) {
        this.localVideoTracks = this.localStream.getVideoTracks();
        if (turnOn) {
          this.localVideoTracks.forEach(track => this.localStream.addTrack(track));
          this.$refs.localVideo.style.display = 'inline';
          this.log('Video On');
        } else {
          this.localVideoTracks.forEach(track => this.localStream.removeTrack(track));
          this.$refs.localVideo.style.display = 'none';
          this.log('Video Off');
        }
      },
  
      toggleAudio(turnOn) {
        this.$refs.localVideo.muted = !turnOn;
        this.log(turnOn ? 'Audio On' : 'Audio Off');
      },
  
      handleOfferMessage(message) {
        this.log('Accepting Offer Message');
        let desc = new RTCSessionDescription(message.sdp);
        if (desc && message.sdp) {
          this.myPeerConnection.setRemoteDescription(desc)
            .then(() => navigator.mediaDevices.getUserMedia({ audio: true, video: true }))
            .then(stream => {
              this.localStream = stream;
              this.$refs.localVideo.srcObject = stream;
              this.localStream.getTracks().forEach(track => this.myPeerConnection.addTrack(track, this.localStream));
            })
            .then(() => this.myPeerConnection.createAnswer())
            .then(answer => this.myPeerConnection.setLocalDescription(answer))
            .then(() => this.sendToServer({
              from: this.localUserName,
              type: 'answer',
              sdp: this.myPeerConnection.localDescription
            }))
            .catch(this.handleErrorMessage);
        }
      },
  
      handleAnswerMessage(message) {
        this.log("The peer has accepted the request");
        this.myPeerConnection.setRemoteDescription(new RTCSessionDescription(message.sdp)).catch(this.handleErrorMessage);
      },
  
      handleNewICECandidateMessage(message) {
        let candidate = new RTCIceCandidate(message.candidate);
        this.log(`Adding received ICE candidate: ${JSON.stringify(candidate)}`);
        this.myPeerConnection.addIceCandidate(candidate).catch(this.handleErrorMessage);
      },
  
      handlePeerConnection() {
        this.createPeerConnection();
        navigator.mediaDevices.getUserMedia({ audio: true, video: true })
          .then(stream => {
            this.localStream = stream;
            this.$refs.localVideo.srcObject = stream;
            stream.getTracks().forEach(track => this.myPeerConnection.addTrack(track, this.localStream));
          });
      },
  
      createPeerConnection() {
        const peerConnectionConfig = {
          iceServers: [
            { urls: 'stun:stun.stunprotocol.org:3478' },
            { urls: 'stun:stun.l.google.com:19302' }
          ]
        };
        this.myPeerConnection = new RTCPeerConnection(peerConnectionConfig);
        this.myPeerConnection.onicecandidate = (event) => {
          if (event.candidate) {
            this.sendToServer({
              from: this.localUserName,
              type: 'ice',
              candidate: event.candidate
            });
          }
        };
        this.myPeerConnection.ontrack = (event) => {
          this.$refs.remoteVideo.srcObject = event.streams[0];
        };
      }
    }
  };
  </script>
  
  <style scoped>
  .btn.active {
    display: none;
  }
  
  .btn span:nth-of-type(1) {
    display: none;
  }
  
  .btn span:last-child {
    display: block;
  }
  
  .btn.active span:nth-of-type(1) {
    display: block;
  }
  
  .btn.active span:last-child {
    display: none;
  }
  </style>