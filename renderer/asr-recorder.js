// 语音录音与 SenseVoice 识别控制器

export function encodeWAV(samples, sampleRate) {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  const writeString = (v, off, str) => {
    for (let i = 0; i < str.length; i++) v.setUint8(off + i, str.charCodeAt(i));
  };

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, 'data');
  view.setUint32(40, samples.length * 2, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }

  return new Blob([view], { type: 'audio/wav' });
}

export function createAsrController({ getMicBtn, showBubble, hideBubble, input, autoGrowInput, isBusy, unlockSpeech }) {
  let micStream = null;
  let micAudioCtx = null;
  let micSource = null;
  let micProcessor = null;
  let micBuffers = [];
  let isRecording = false;

  async function startRecording() {
    if (isRecording) return;
    unlockSpeech();
    try {
      micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
    } catch (err) {
      console.error('[mic] 获取麦克风失败:', err);
      showBubble('无法访问麦克风，请检查系统设置与权限');
      return;
    }

    micAudioCtx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
    micSource = micAudioCtx.createMediaStreamSource(micStream);
    micProcessor = micAudioCtx.createScriptProcessor(4096, 1, 1);
    micBuffers = [];

    micProcessor.onaudioprocess = (e) => {
      if (!isRecording) return;
      micBuffers.push(new Float32Array(e.inputBuffer.getChannelData(0)));
    };

    micSource.connect(micProcessor);
    micProcessor.connect(micAudioCtx.destination);
    isRecording = true;

    getMicBtn()?.classList.add('recording');
    showBubble('🎙️ 正在倾听主人说话…（再次点击结束并识别）');
  }

  async function stopRecording() {
    if (!isRecording) return null;
    isRecording = false;

    getMicBtn()?.classList.remove('recording');

    if (micProcessor) {
      try { micProcessor.disconnect(); } catch {}
      micProcessor.onaudioprocess = null;
      micProcessor = null;
    }
    if (micSource) {
      try { micSource.disconnect(); } catch {}
      micSource = null;
    }
    const sampleRate = micAudioCtx ? micAudioCtx.sampleRate : 16000;
    if (micAudioCtx) {
      try { await micAudioCtx.close(); } catch {}
      micAudioCtx = null;
    }
    if (micStream) {
      micStream.getTracks().forEach((t) => t.stop());
      micStream = null;
    }

    const totalLength = micBuffers.reduce((acc, b) => acc + b.length, 0);
    if (totalLength === 0) return null;

    const merged = new Float32Array(totalLength);
    let offset = 0;
    for (const b of micBuffers) {
      merged.set(b, offset);
      offset += b.length;
    }
    micBuffers = [];

    return { blob: encodeWAV(merged, sampleRate), duration: totalLength / sampleRate };
  }

  async function handleMicToggle() {
    if (isRecording) {
      const result = await stopRecording();
      if (!result || result.duration < 0.4) {
        showBubble('录音时间太短了哦');
        setTimeout(() => { if (!isBusy()) hideBubble(); }, 2500);
        return;
      }
      showBubble('识别语音中…');
      try {
        const res = await fetch('/api/asr', {
          method: 'POST',
          headers: { 'Content-Type': 'audio/wav' },
          body: result.blob,
        });
        const data = await res.json();
        if (data && data.ok && data.text && data.text.trim()) {
          const text = data.text.trim();
          input.value = input.value ? (input.value + ' ' + text) : text;
          autoGrowInput();
          input.focus();
          hideBubble();
        } else {
          showBubble('没听清主人说了什么呢，再试一次吧~');
          setTimeout(() => { if (!isBusy()) hideBubble(); }, 3000);
        }
      } catch (err) {
        console.error('[asr] 识别请求失败:', err);
        showBubble('语音识别失败: ' + (err.message || '网络或服务异常'));
        setTimeout(() => { if (!isBusy()) hideBubble(); }, 4000);
      }
    } else {
      if (isBusy()) {
        showBubble('正在忙碌中，请稍候…');
        return;
      }
      await startRecording();
    }
  }

  return { handleMicToggle };
}
