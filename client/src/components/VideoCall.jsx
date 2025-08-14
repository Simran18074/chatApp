import React, { useEffect, useRef, useState } from "react";
import { socket } from "../socket"; // your socket

const VideoCall = ({ currentUser, selectedUser }) => {
  const localVideo = useRef();
  const remoteVideo = useRef();
  const peerConnection = useRef(null);

  const [callAccepted, setCallAccepted] = useState(false);
  const [inCall, setInCall] = useState(false);

  const servers = {
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
  };

  const startCall = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    localVideo.current.srcObject = stream;

    const pc = new RTCPeerConnection(servers);
    stream.getTracks().forEach((track) => pc.addTrack(track, stream));

    pc.ontrack = (event) => {
      remoteVideo.current.srcObject = event.streams[0];
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("call-user", {
          to: selectedUser.socketId,
          from: socket.id,
          name: currentUser.name,
          signal: event.candidate,
        });
      }
    };

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    socket.emit("call-user", {
      to: selectedUser.socketId,
      from: socket.id,
      name: currentUser.name,
      signal: offer,
    });

    peerConnection.current = pc;
    setInCall(true);
  };

  const answerCall = async (incomingSignal) => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    localVideo.current.srcObject = stream;

    const pc = new RTCPeerConnection(servers);
    stream.getTracks().forEach((track) => pc.addTrack(track, stream));

    pc.ontrack = (event) => {
      remoteVideo.current.srcObject = event.streams[0];
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("make-answer", {
          to: selectedUser.socketId,
          from: socket.id,
          signal: event.candidate,
        });
      }
    };

    await pc.setRemoteDescription(new RTCSessionDescription(incomingSignal));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    socket.emit("make-answer", {
      to: selectedUser.socketId,
      from: socket.id,
      signal: answer,
    });

    peerConnection.current = pc;
    setCallAccepted(true);
    setInCall(true);
  };

  useEffect(() => {
    socket.on("call-made", async (data) => {
      const accept = window.confirm(`${data.name} is calling. Accept?`);
      if (accept) {
        await answerCall(data.signal);
      }
    });

    socket.on("answer-made", async (data) => {
      await peerConnection.current.setRemoteDescription(
        new RTCSessionDescription(data.signal)
      );
    });

    socket.on("call-ended", () => {
      endCall();
    });

    return () => {
      socket.off("call-made");
      socket.off("answer-made");
      socket.off("call-ended");
    };
  }, []);

  const endCall = () => {
    peerConnection.current?.close();
    setInCall(false);
    socket.emit("end-call", selectedUser.socketId);
  };

  return (
    <div className="p-4">
      <div className="flex space-x-4">
        <video
          ref={localVideo}
          autoPlay
          playsInline
          muted
          className="w-1/2 border"
        />
        <video
          ref={remoteVideo}
          autoPlay
          playsInline
          className="w-1/2 border"
        />
      </div>
      {!inCall ? (
        <button
          onClick={startCall}
          className="mt-4 bg-blue-500 text-white p-2 rounded"
        >
          Start Call
        </button>
      ) : (
        <button
          onClick={endCall}
          className="mt-4 bg-red-500 text-white p-2 rounded"
        >
          End Call
        </button>
      )}
    </div>
  );
};

export default VideoCall;
