// OmniTools AI Frontend JavaScript Controller
// Author: PreatomYT (c) 2026

document.addEventListener("DOMContentLoaded", () => {
  // Tab Switching
  const tabs = document.querySelectorAll(".tool-tab");
  const panels = document.querySelectorAll(".tool-panel");

  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("active"));
      panels.forEach(p => p.classList.remove("active"));

      tab.classList.add("active");
      const toolId = tab.getAttribute("data-tool");
      const activePanel = document.getElementById(`panel-${toolId}`);
      if (activePanel) activePanel.classList.add("active");
    });
  });

  // Global Loader Helper
  const loader = document.getElementById("global-loader");
  const loaderText = document.getElementById("loader-status-text");

  function showLoader(msg = "Processing locally...") {
    if (loaderText) loaderText.textContent = msg;
    if (loader) loader.classList.remove("hidden");
  }

  function hideLoader() {
    if (loader) loader.classList.add("hidden");
  }

  // --- 1. Image Upscale Logic ---
  const upscaleInput = document.getElementById("upscale-file-input");
  const upscaleDropzone = document.getElementById("upscale-dropzone");
  const upscalePreviewBox = document.getElementById("upscale-preview-box");
  const upscalePreviewImg = document.getElementById("upscale-preview-img");
  const btnProcessUpscale = document.getElementById("btn-process-upscale");
  const upscaleResultBox = document.getElementById("upscale-result-box");
  const upscaleResultImg = document.getElementById("upscale-result-img");
  const upscaleDownloadBtn = document.getElementById("upscale-download-btn");

  let upscaleFile = null;

  if (upscaleDropzone && upscaleInput) {
    upscaleDropzone.addEventListener("click", () => upscaleInput.click());
    upscaleInput.addEventListener("change", (e) => {
      if (e.target.files && e.target.files[0]) {
        upscaleFile = e.target.files[0];
        const reader = new FileReader();
        reader.onload = (re) => {
          upscalePreviewImg.src = re.target.result;
          upscalePreviewBox.classList.remove("hidden");
        };
        reader.readAsDataURL(upscaleFile);
      }
    });
  }

  if (btnProcessUpscale) {
    btnProcessUpscale.addEventListener("click", async () => {
      if (!upscaleFile) {
        alert("Please upload an image first.");
        return;
      }

      const selectedScale = document.querySelector('input[name="upscale-scale"]:checked')?.value || "4";
      showLoader(`Applying RealESRGAN ${selectedScale}x Super-Resolution...`);

      const formData = new FormData();
      formData.append("file", upscaleFile);
      formData.append("scale", selectedScale);

      try {
        const res = await fetch("/api/upscale", {
          method: "POST",
          body: formData
        });
        const data = await res.json();
        if (data.success && (data.base64Image || data.outputUrl)) {
          upscaleResultImg.src = data.base64Image || data.outputUrl;
          upscaleDownloadBtn.href = data.outputUrl || data.base64Image;
          upscaleDownloadBtn.download = data.filename || "upscaled.png";
          upscaleResultBox.classList.remove("hidden");
        } else {
          alert("Upscale failed: " + (data.error || "Unknown error"));
        }
      } catch (err) {
        alert("Error connecting to local engine: " + err.message);
      } finally {
        hideLoader();
      }
    });
  }

  // --- 2. Watermark Remover Logic ---
  const wmInput = document.getElementById("watermark-file-input");
  const wmDropzone = document.getElementById("watermark-dropzone");
  const btnProcessWm = document.getElementById("btn-process-watermark");
  const wmResultBox = document.getElementById("watermark-result-box");
  const wmResultImg = document.getElementById("watermark-result-img");
  const wmDownloadBtn = document.getElementById("watermark-download-btn");

  let wmFile = null;

  if (wmDropzone && wmInput) {
    wmDropzone.addEventListener("click", () => wmInput.click());
    wmInput.addEventListener("change", (e) => {
      if (e.target.files && e.target.files[0]) {
        wmFile = e.target.files[0];
        alert(`Loaded image: ${wmFile.name}. Specify X, Y, Width, Height and click Remove Watermark.`);
      }
    });
  }

  if (btnProcessWm) {
    btnProcessWm.addEventListener("click", async () => {
      if (!wmFile) {
        alert("Please upload an image first.");
        return;
      }
      showLoader("Inpainting watermark with local OpenCV synthesis...");

      const formData = new FormData();
      formData.append("file", wmFile);
      formData.append("x", document.getElementById("wm-x").value || "50");
      formData.append("y", document.getElementById("wm-y").value || "50");
      formData.append("w", document.getElementById("wm-w").value || "140");
      formData.append("h", document.getElementById("wm-h").value || "60");

      try {
        const res = await fetch("/api/remove-watermark", {
          method: "POST",
          body: formData
        });
        const data = await res.json();
        if (data.success) {
          wmResultImg.src = data.base64Image || data.outputUrl;
          wmDownloadBtn.href = data.outputUrl || data.base64Image;
          wmDownloadBtn.download = data.filename || "cleaned.png";
          wmResultBox.classList.remove("hidden");
        } else {
          alert("Watermark removal failed: " + (data.error || "Unknown error"));
        }
      } catch (err) {
        alert("Error: " + err.message);
      } finally {
        hideLoader();
      }
    });
  }

  // --- 3. Object Remover Logic ---
  const objInput = document.getElementById("object-file-input");
  const objDropzone = document.getElementById("object-dropzone");
  const btnProcessObj = document.getElementById("btn-process-object");
  const objResultBox = document.getElementById("object-result-box");
  const objResultImg = document.getElementById("object-result-img");
  const objDownloadBtn = document.getElementById("object-download-btn");

  let objFile = null;

  if (objDropzone && objInput) {
    objDropzone.addEventListener("click", () => objInput.click());
    objInput.addEventListener("change", (e) => {
      if (e.target.files && e.target.files[0]) {
        objFile = e.target.files[0];
        alert(`Loaded image: ${objFile.name}. Specify bounding box coordinates to erase.`);
      }
    });
  }

  if (btnProcessObj) {
    btnProcessObj.addEventListener("click", async () => {
      if (!objFile) {
        alert("Please upload an image first.");
        return;
      }
      showLoader("Synthesizing background texture to erase object...");

      const formData = new FormData();
      formData.append("file", objFile);
      formData.append("x", document.getElementById("obj-x").value || "100");
      formData.append("y", document.getElementById("obj-y").value || "100");
      formData.append("w", document.getElementById("obj-w").value || "160");
      formData.append("h", document.getElementById("obj-h").value || "160");

      try {
        const res = await fetch("/api/remove-object", {
          method: "POST",
          body: formData
        });
        const data = await res.json();
        if (data.success) {
          objResultImg.src = data.base64Image || data.outputUrl;
          objDownloadBtn.href = data.outputUrl || data.base64Image;
          objDownloadBtn.download = data.filename || "erased.png";
          objResultBox.classList.remove("hidden");
        } else {
          alert("Object removal failed: " + (data.error || "Unknown error"));
        }
      } catch (err) {
        alert("Error: " + err.message);
      } finally {
        hideLoader();
      }
    });
  }

  // --- 4. Video to MP3 Logic ---
  const vmp3Input = document.getElementById("video-mp3-file-input");
  const vmp3Dropzone = document.getElementById("video-mp3-dropzone");
  const vmp3Filename = document.getElementById("video-mp3-filename");
  const btnProcessVmp3 = document.getElementById("btn-process-video-mp3");
  const vmp3ResultBox = document.getElementById("video-mp3-result-box");
  const audioPlayer = document.getElementById("audio-player");
  const mp3DownloadBtn = document.getElementById("mp3-download-btn");

  let vmp3File = null;

  if (vmp3Dropzone && vmp3Input) {
    vmp3Dropzone.addEventListener("click", () => vmp3Input.click());
    vmp3Input.addEventListener("change", (e) => {
      if (e.target.files && e.target.files[0]) {
        vmp3File = e.target.files[0];
        vmp3Filename.textContent = `Selected video: ${vmp3File.name} (${(vmp3File.size / 1024 / 1024).toFixed(2)} MB)`;
      }
    });
  }

  if (btnProcessVmp3) {
    btnProcessVmp3.addEventListener("click", async () => {
      if (!vmp3File) {
        alert("Please upload a video file first.");
        return;
      }
      const bitrate = document.getElementById("audio-bitrate-select").value || "320k";
      showLoader(`Extracting ${bitrate} audio track via local FFmpeg...`);

      const formData = new FormData();
      formData.append("file", vmp3File);
      formData.append("bitrate", bitrate);

      try {
        const res = await fetch("/api/video-mp3", {
          method: "POST",
          body: formData
        });
        const data = await res.json();
        if (data.success) {
          audioPlayer.src = data.outputUrl || data.base64Audio;
          mp3DownloadBtn.href = data.outputUrl || data.base64Audio;
          mp3DownloadBtn.download = data.filename || "audio.mp3";
          vmp3ResultBox.classList.remove("hidden");
        } else {
          alert("Audio extraction failed: " + (data.error || "Unknown error"));
        }
      } catch (err) {
        alert("Error: " + err.message);
      } finally {
        hideLoader();
      }
    });
  }

  // --- 5. Video Trim Logic ---
  const vtrimInput = document.getElementById("video-trim-file-input");
  const vtrimDropzone = document.getElementById("video-trim-dropzone");
  const vtrimFilename = document.getElementById("video-trim-filename");
  const btnProcessVtrim = document.getElementById("btn-process-video-trim");
  const vtrimResultBox = document.getElementById("video-trim-result-box");
  const trimmedVideoPlayer = document.getElementById("trimmed-video-player");
  const trimDownloadBtn = document.getElementById("trim-download-btn");

  let vtrimFile = null;

  if (vtrimDropzone && vtrimInput) {
    vtrimDropzone.addEventListener("click", () => vtrimInput.click());
    vtrimInput.addEventListener("change", (e) => {
      if (e.target.files && e.target.files[0]) {
        vtrimFile = e.target.files[0];
        vtrimFilename.textContent = `Selected video: ${vtrimFile.name} (${(vtrimFile.size / 1024 / 1024).toFixed(2)} MB)`;
      }
    });
  }

  if (btnProcessVtrim) {
    btnProcessVtrim.addEventListener("click", async () => {
      if (!vtrimFile) {
        alert("Please upload a video to trim.");
        return;
      }
      const start = document.getElementById("trim-start").value || "0";
      const end = document.getElementById("trim-end").value || "10";
      showLoader(`Trimming video segment (${start}s - ${end}s)...`);

      const formData = new FormData();
      formData.append("file", vtrimFile);
      formData.append("start", start);
      formData.append("end", end);

      try {
        const res = await fetch("/api/trim-video", {
          method: "POST",
          body: formData
        });
        const data = await res.json();
        if (data.success) {
          trimmedVideoPlayer.src = data.outputUrl;
          trimDownloadBtn.href = data.outputUrl;
          trimDownloadBtn.download = data.filename || "trimmed.mp4";
          vtrimResultBox.classList.remove("hidden");
        } else {
          alert("Video trimming failed: " + (data.error || "Unknown error"));
        }
      } catch (err) {
        alert("Error: " + err.message);
      } finally {
        hideLoader();
      }
    });
  }

  // --- Personal LLM Chat Logic ---
  const chatInput = document.getElementById("chat-input");
  const chatSendBtn = document.getElementById("chat-send-btn");
  const chatMessages = document.getElementById("chat-messages");

  async function sendChatMessage() {
    const text = chatInput.value.trim();
    if (!text) return;

    // Append user message
    const userDiv = document.createElement("div");
    userDiv.className = "message user-message";
    userDiv.textContent = text;
    chatMessages.appendChild(userDiv);
    chatInput.value = "";
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // Send to local endpoint
    try {
      const res = await fetch("/api/llm-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: text })
      });
      const data = await res.json();

      const aiDiv = document.createElement("div");
      aiDiv.className = "message system-message";
      aiDiv.innerHTML = `<strong>${data.model || "OmniLocal AI"}:</strong> ${data.response || "No response"}`;
      chatMessages.appendChild(aiDiv);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    } catch (err) {
      const errDiv = document.createElement("div");
      errDiv.className = "message system-message";
      errDiv.textContent = "Error: Unable to connect to local LLM core.";
      chatMessages.appendChild(errDiv);
    }
  }

  if (chatSendBtn) chatSendBtn.addEventListener("click", sendChatMessage);
  if (chatInput) {
    chatInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") sendChatMessage();
    });
  }
});
