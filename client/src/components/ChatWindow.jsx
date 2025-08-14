import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import { socket } from "../socket";
import MessageInput from "./MessageInput";

const ChatWindow = ({ selectedUser, currentUser }) => {
  const [messages, setMessages] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [chatId, setChatId] = useState(null);
  const [calling, setCalling] = useState(false);
  const [callAccepted, setCallAccepted] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);
  const [callEnded, setCallEnded] = useState(false);
  // const [remoteStream, setRemoteStream] = useState(null);
  const [localStream, setLocalStream] = useState(null);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const messagesEndRef = useRef(null);
  const pendingCandidates = useRef([]);
  const timerRef = useRef(null);

  const servers = {
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
  };

  if (!selectedUser || !selectedUser.email) {
    return <div className="p-4 text-gray-500">No user selected</div>;
  }

  const getRoomId = (user1, user2) => [user1, user2].sort().join("-");
  const roomId = getRoomId(currentUser.email, selectedUser.email);

  useEffect(() => {
    const fetchChatAndMessages = async () => {
      if (!selectedUser || !currentUser) return;

      try {
        // ✅ Get or create chat
        const { data: chat } = await axios.post(
          "https://localhost:5000/api/chats",
          {
            participants: [currentUser.email, selectedUser.email],
          }
        );

        setChatId(chat._id);

        // ✅ Fetch messages
        const res = await axios.get(
          `https://localhost:5000/api/messages/${chat._id}`
        );
        setMessages(res.data);
      } catch (err) {
        console.error("Error fetching messages:", err);
      }
    };

    fetchChatAndMessages();
    socket.emit("join_chat", {
      senderEmail: currentUser.email,
      receiverEmail: selectedUser.email,
    });

    const handleReceive = (incomingMsg) => {
      setMessages((prev) => {
        const alreadyExists = prev.some(
          (msg) =>
            (msg._id && msg._id === incomingMsg._id) ||
            (msg.localId && msg.localId === incomingMsg.localId)
        );

        if (alreadyExists) return prev;
        return [...prev, incomingMsg];
      });
    };

    socket.on("receive_message", handleReceive);

    const handleOffer = ({ signal, from }) => {
      console.log("📞 Incoming call detected!", from);
      setIncomingCall({ offer: signal, from });
    };

    const handleAnswer = async ({ signal }) => {
      if (!peerConnectionRef.current) {
        console.warn("⚠️ PeerConnection doesn't exist in handleAnswer");
        return;
      }

      try {
        await peerConnectionRef.current.setRemoteDescription(
          new RTCSessionDescription(signal)
        );

        for (const candidate of pendingCandidates.current) {
          try {
            await peerConnectionRef.current.addIceCandidate(
              new RTCIceCandidate(candidate)
            );
          } catch (err) {
            console.error("❌ Error adding pending candidate (answer):", err);
          }
        }

        pendingCandidates.current = [];
      } catch (error) {
        console.error("❌ Error in handleAnswer:", error);
      }
    };

    const handleCandidate = async ({ candidate }) => {
      try {
        if (
          peerConnectionRef.current &&
          peerConnectionRef.current.remoteDescription
        ) {
          await peerConnectionRef.current.addIceCandidate(
            new RTCIceCandidate(candidate)
          );
        } else {
          pendingCandidates.current.push(candidate);
        }
      } catch (error) {
        console.error("Failed to add ICE candidate", error);
      }
    };

    const handleRejected = ({ from }) => {
      alert(`${from} rejected your call.`);
      endCall();
    };

    const handleCallEnded = () => {
      console.log("📞 Call ended by remote user");
      endCall(false);
    };

    socket.on("call-made", handleOffer);
    socket.on("answer-made", handleAnswer);
    socket.on("ice-candidate", handleCandidate);
    socket.on("call-rejected", handleRejected);
    socket.on("end-call", handleCallEnded);

    return () => {
      socket.off("receive_message", handleReceive);
      socket.off("call-made", handleOffer);
      socket.off("answer-made", handleAnswer);
      socket.off("ice-candidate", handleCandidate);
      socket.off("call-rejected", handleRejected);
      socket.off("end-call", handleCallEnded);
      socket.emit("leave_chat", {
        senderEmail: currentUser.email,
        receiverEmail: selectedUser.email,
      });
    };
  }, [selectedUser, currentUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async ({ text, files }) => {
    const timestamp = new Date().toISOString();
    const localId = uuidv4(); // unique id to track message

    const roomId = getRoomId(currentUser.email, selectedUser.email);

    const message = {
      senderEmail: currentUser.email,
      receiverEmail: selectedUser.email,
      text,
      chatId,
      files,
      timestamp,
      roomId,
      localId,
    };

    try {
      // Step 1: Immediately add message to chat (Optimistic UI)
      setMessages((prev) => [...prev, message]);

      // Step 2: Send to backend
      const { data: savedMessage } = await axios.post(
        "https://localhost:5000/api/messages",
        message
      );

      // Step 3: Emit to socket (receiver will handle adding)
      socket.emit("send_message", { ...savedMessage, localId, roomId });
    } catch (err) {
      console.error("Send failed:", err);
    }
  };

  const startCall = async () => {
    setCalling(true);
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    localVideoRef.current.srcObject = stream;

    const pc = new RTCPeerConnection(servers);
    peerConnectionRef.current = pc;

    stream.getTracks().forEach((track) => pc.addTrack(track, stream));

    pc.ontrack = (event) => {
      remoteVideoRef.current.srcObject = event.streams[0];
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("ice-candidate", {
          to: selectedUser.email,
          candidate: event.candidate,
        });
      }
    };

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    socket.emit("call-user", {
      to: selectedUser.email,
      signal: offer,
      from: currentUser.email,
      name: currentUser.name,
    });
  };

  const acceptCall = async () => {
    setCalling(true);
    const { offer, from } = incomingCall;
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });

    const pc = new RTCPeerConnection(servers);
    peerConnectionRef.current = pc;

    // ✅ Set local video
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
    }

    stream.getTracks().forEach((track) => pc.addTrack(track, stream));

    pc.ontrack = (event) => {
      const remoteStream = event.streams[0];
      const trySettingRemoteVideo = () => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream;
        } else {
          setTimeout(trySettingRemoteVideo, 100); // Retry till it's available
        }
      };

      trySettingRemoteVideo();
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("ice-candidate", {
          to: from,
          candidate: event.candidate,
        });
      }
    };

    try {
      await pc.setRemoteDescription(new RTCSessionDescription(offer));

      if (pc.signalingState === "have-remote-offer") {
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socket.emit("make-answer", {
          to: incomingCall.from,
          signal: answer,
          from: currentUser.email,
        });
      } else {
        console.warn("Wrong signaling state:", pc.signalingState);
      }

      for (const candidate of pendingCandidates.current) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.error("Error adding pending candidate (offer):", err);
        }
      }
      pendingCandidates.current = [];

      setCallAccepted(true);
      setIncomingCall(null);
    } catch (err) {
      console.error("❌ Error accepting call:", err);
    }
  };

  const rejectCall = () => {
    if (incomingCall?.from) {
      socket.emit("call-rejected", { to: incomingCall.from });
    }
    setIncomingCall(null);
  };

  const endCall = (shouldEmit = true) => {
    try {
      if (shouldEmit) {
        socket.emit("end-call", {
          to: selectedUser.email,
          from: currentUser.email,
        });
      }
      // Stop all tracks from peer connection
      if (peerConnectionRef.current) {
        peerConnectionRef.current.getSenders().forEach((sender) => {
          if (sender.track) sender.track.stop();
        });
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }

      // Stop local video stream
      if (localVideoRef.current?.srcObject) {
        localVideoRef.current.srcObject
          .getTracks()
          .forEach((track) => track.stop());
        localVideoRef.current.srcObject = null;
      }

      // Stop remote video stream
      if (remoteVideoRef.current?.srcObject) {
        remoteVideoRef.current.srcObject
          .getTracks()
          .forEach((track) => track.stop());
        remoteVideoRef.current.srcObject = null;
      }
    } catch (err) {
      console.error("Error ending call:", err);
    }

    // Reset all states
    setCalling(false);
    setCallAccepted(false);
    setCallEnded(true);
    setIncomingCall(null);

    clearTimeout(timerRef.current);
  };

  const isImageFile = (fileName) => /\.(jpe?g|png|gif|webp)$/i.test(fileName);

  /* const formatTime = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }; */

  function formatMessageDate(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();

    const isToday = date.toDateString() === now.toDateString();

    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();

    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (isToday) {
      // Show time like 10:45 AM
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (isYesterday) {
      return "Yesterday";
    } else if (diffDays < 7) {
      // Show weekday like Monday, Tuesday...
      return date.toLocaleDateString([], { weekday: "long" });
    } else {
      // Show date like 12/05/2025
      return date.toLocaleDateString();
    }
  }

  return (
    <div className="flex flex-col h-screen bg-white">
      <div className="p-4 bg-gray-200 shadow-sm flex justify-between items-center">
        <div className="font-semibold text-lg">
          Chat with: {selectedUser.name}
        </div>
        <div>
          {!calling ? (
            <button
              className="bg-green-500 px-3 py-1 rounded text-white"
              onClick={startCall}
            >
              📞 Start Call
            </button>
          ) : (
            <button
              className="bg-red-500 px-3 py-1 rounded text-white"
              onClick={endCall}
            >
              ❌ End Call
            </button>
          )}
        </div>
      </div>

      {incomingCall && (
        <div className="bg-yellow-200 p-4 text-black text-center">
          Incoming Call from <b>{incomingCall.from}</b>
          <div className="mt-2 flex justify-center gap-4">
            <button
              className="bg-green-600 text-white px-4 py-1 rounded"
              onClick={acceptCall}
            >
              ✅ Accept
            </button>
            <button
              className="bg-red-600 text-white px-4 py-1 rounded"
              onClick={rejectCall}
            >
              ❌ Reject
            </button>
          </div>
        </div>
      )}

      {calling && (
        <div className="flex gap-2 justify-center bg-black p-2">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className={`w-1/2 rounded border ${!calling ? "hidden" : ""}`}
          />
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className={`w-1/2 rounded border ${!calling ? "hidden" : ""}`}
          />
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((msg) => {
          const isMe = msg.senderEmail === currentUser.email;
          const senderName =
            msg.senderName || (isMe ? currentUser.name : selectedUser.name);

          return (
            <div
              key={msg._id || msg.localId}
              className={`flex ${isMe ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-xs p-3 rounded-xl shadow-md text-sm ${
                  isMe
                    ? "bg-blue-600 text-white rounded-br-none"
                    : "bg-gray-300 text-black rounded-bl-none"
                }`}
              >
                <div className="flex justify-between items-center mb-1 text-xs">
                  <span className="font-bold">{senderName}</span>
                  <span className="ml-4">
                    {formatMessageDate(msg.timestamp)}
                  </span>
                </div>

                {msg.text && <p className="mb-1">{msg.text}</p>}

                {msg.files?.length > 0 &&
                  msg.files.map((file, idx) => {
                    const fileName =
                      file.name || file.url?.split("/").pop() || "file";
                    return (
                      <div key={idx} className="mt-1">
                        {isImageFile(file.name) ? (
                          <img
                            src={file.url}
                            alt={fileName}
                            className="max-w-xs max-h-60 rounded"
                          />
                        ) : (
                          <a
                            key={idx}
                            href={file.url}
                            download={fileName}
                            className="text-xs underline"
                            title={fileName}
                          >
                            📎 {fileName}
                          </a>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t bg-white">
        <MessageInput
          onSend={handleSend}
          messages={messages}
          setMessages={setMessages}
          selectedFiles={selectedFiles}
          setSelectedFiles={setSelectedFiles}
          currentUser={currentUser}
          selectedUser={selectedUser}
        />
      </div>
    </div>
  );
};

export default ChatWindow;
