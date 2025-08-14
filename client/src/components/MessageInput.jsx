import { useState } from "react";
import EmojiPicker from "emoji-picker-react";
import { Paperclip, Smile } from "lucide-react";
import axios from "axios";

const MessageInput = ({ onSend, currentUser, selectedUser }) => {
  const [input, setInput] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [files, setFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isSending, setIsSending] = useState(false);

  console.log(currentUser);

  const handleEmojiClick = (emojiData) => {
    setInput((prev) => prev + emojiData.emoji);
  };

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed && files.length === 0) return;

    setIsSending(true);
    let uploadedFiles = [];

    try {
      if (files.length > 0) {
        const formData = new FormData();
        files.forEach((file) => formData.append("files", file));
        setIsUploading(true);

        const res = await axios.post(
          "https://localhost:5000/api/upload",
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" },
          }
        );
        uploadedFiles = res.data.files; // [{ name, url }]
      }

      onSend({
        text: trimmed,
        files: uploadedFiles,
      });

      setInput("");
      setFiles([]);
      setShowEmojiPicker(false);
    } catch (error) {
      console.error("File upload failed", error);
      alert("File upload failed");
    } finally {
      setIsUploading(false);
      setIsSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files);
    setFiles((prev) => [...prev, ...selected]);
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = Array.from(e.dataTransfer.files);
    setFiles((prev) => [...prev, ...dropped]);
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const isImageFile = (file) => file.type.startsWith("image/");

  return (
    <div
      className={`mt-2 space-y-2 relative p-2 rounded border-2 transition-colors ${
        isDragging ? "border-blue-400 bg-blue-50" : "border-transparent"
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        setIsDragging(false);
      }}
      onDrop={handleFileDrop}
    >
      {files.length > 0 && (
        <div className="space-y-1">
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between text-sm text-gray-700 bg-gray-100 p-2 rounded"
            >
              <div className="flex items-center gap-2">
                {isImageFile(file) && (
                  <img
                    src={URL.createObjectURL(file)}
                    alt={file.name}
                    className="w-10 h-10 object-cover rounded"
                  />
                )}
                <span>{file.name}</span>
              </div>
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="text-red-500 hover:text-red-700 font-bold"
              >
                ❌
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setShowEmojiPicker((prev) => !prev)}
        >
          <Smile className="text-gray-600 hover:text-blue-500" />
        </button>

        <label className="cursor-pointer">
          <Paperclip className="text-gray-600 hover:text-blue-500" />
          <input
            type="file"
            className="hidden"
            onChange={handleFileChange}
            multiple
          />
        </label>

        <input
          className="flex-1 border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          type="text"
          placeholder="Type a message or drag files..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyPress}
        />

        <button
          type="button"
          className={`px-4 py-2 rounded text-white ${
            isUploading || (!input.trim() && files.length === 0)
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-500 hover:bg-blue-600"
          }`}
          onClick={handleSend}
          disabled={isUploading || (!input.trim() && files.length === 0)}
        >
          {isUploading ? "Uploading..." : "Send"}
        </button>
      </div>

      {showEmojiPicker && (
        <div className="absolute bottom-full left-0 z-10">
          <EmojiPicker onEmojiClick={handleEmojiClick} />
        </div>
      )}
    </div>
  );
};

export default MessageInput;
