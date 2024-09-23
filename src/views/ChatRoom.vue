<template>
  <div class="text-center">
    <h1>Simple WebRTC Signalling Server</h1>
    <div class="col-lg-12 mb-3">
      <div class="mb-3">
        User: {{ uuid }} @ Room #{{ sid }}
      </div>
      <div class="col-lg-12 mb-3">
        <div class="d-flex justify-content-around mb-3">
          <div id="buttons" class="row">
            <button type="button" class="btn btn-outline-danger" @click="exitRoom">
              Exit Room
            </button>
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
      this.socket = new WebSocket(`wss://server.todak.site/signal`);
      // this.socket = new WebSocket(`ws://localhost:8080/signal`);

      this.socket.onopen = () => {
        console.log(`WebSocket connection opened to Room: #${this.localRoom}`);
        this.sendToServer({
          from: this.localUserName,
          type: 'join',
          data: this.localRoom
        });
      }
      this.socket.onclose = () => {
        console.log('Socket has been closed');
        this.reconnectWebSocket();
      };

      this.socket.onerror = (message) => {
        this.handleErrorMessage(`Error: ${message}`);
      };
      this.socket.onmessage = (msg) => {
        let message = JSON.parse(msg.data);
        console.log(message);
        switch (message.type) {
          case "text":
            console.log(`Text message from ${message.from} received: ${message.data}`);
            break;
          case "offer":
            console.log('Signal OFFER received');
            this.handleOfferMessage(message);
            break;
          case "answer":
            console.log('Signal ANSWER received');
            this.handleAnswerMessage(message);
            break;
          case "ice":
            console.log('Signal ICE Candidate received');
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
    },
    reconnectWebSocket() {
      console.log('Attempting to reconnect WebSocket...');
      setTimeout(() => {
        this.startWebSocketConnection();  // 5초 후 재연결 시도
      }, 5000);
    },
    handleOfferMessage(message) {
      console.log('Accepting Offer Message');
      let desc = new RTCSessionDescription(message.sdp);
      if (desc && message.sdp) {
        console.log('RTC Signalling state: ' + this.myPeerConnection.signalingState);
        this.myPeerConnection.setRemoteDescription(desc)
          .then(() => navigator.mediaDevices.getUserMedia({ audio: true, video: true }))
          .then(stream => {
            this.localStream = stream;
            this.$refs.localVideo.srcObject = stream;  // localVideo에 stream 연결
            this.localStream.getTracks().forEach(track => this.myPeerConnection.addTrack(track, this.localStream));
          })
          .then(() => this.myPeerConnection.createAnswer())  // answer 생성
          .then(answer => this.myPeerConnection.setLocalDescription(answer))
          .then(() => this.sendToServer({
            from: this.localUserName,
            type: 'answer',
            sdp: this.myPeerConnection.localDescription
          }))
          .catch(this.handleErrorMessage);
      }
    },
    handlePeerConnection(message) {
      this.createPeerConnection();
      navigator.mediaDevices.getUserMedia({ audio: true, video: true })
        .then(stream => {
          this.localStream = stream;
          this.$refs.localVideo.srcObject = stream;
          stream.getTracks().forEach(track => this.myPeerConnection.addTrack(track, this.localStream));
        });
      if (message.data) {
        this.myPeerConnection.onnegotiationneeded = this.handleNegotiationNeededEvent;
      }
    },
    handleNegotiationNeededEvent() {
      this.myPeerConnection.createOffer()
        .then(offer => {
          return this.myPeerConnection.setLocalDescription(offer);
        })
        .then(() => {
          this.sendToServer({
            from: this.localUserName,
            type: 'offer',
            sdp: this.myPeerConnection.localDescription
          });
          console.log('Negotiation Needed Event: SDP offer sent');
        })
        .catch(reason => {
          // an error occurred, so handle the failure to connect
          console.log(reason);
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
    },
    handleAnswerMessage(message) {
      console.log("The peer has accepted the request");
      this.myPeerConnection.setRemoteDescription(new RTCSessionDescription(message.sdp)).catch(this.handleErrorMessage);
    },
    handleNewICECandidateMessage(message) {
      let candidate = new RTCIceCandidate(message.candidate);
      console.log(`Adding received ICE candidate: ${JSON.stringify(candidate)}`);
      this.myPeerConnection.addIceCandidate(candidate).catch(this.handleErrorMessage);
    },

    sendToServer(msg) {
      if (this.socket.readyState === WebSocket.OPEN) {
        this.socket.send(JSON.stringify(msg));
      } else {
        console.warn('WebSocket is not open. Current state:', this.socket.readyState);
      }
    },

    exitRoom() {
      // WebRTC 연결 종료 및 방 나가기 로직 추가
    },
    handleErrorMessage(message) {
      console.error(message);
    }
  },
};
</script>

<style scoped>
.btn.active {
  display: none;
}
</style>