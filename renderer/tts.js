// 流式切句器与 GPT-SoVITS 语音合成队列（含网关失败静默与 2 分钟单段超时保护）

export function rlog(tag, msg) {
  try { fetch('/api/log', { method: 'POST', body: tag + ' ' + String(msg == null ? '' : msg) }).catch(() => {}); } catch {}
}

// 增量切句器：强标点(>=6字)即切、弱标点(>=14字)即切、换行恒切、45 字硬切
export function makeSentenceSlicer(minLen = 6, targetLen = 14) {
  const strongEnd = '。！？!?';
  const weakEnd = '，,、；;…—~～';
  const hasWord = (t) => /[\p{L}\p{N}]/u.test(t);
  let buf = '';
  const tryCut = (out) => {
    const last = buf.slice(-1);
    let cut = false;
    if (last === '\n') cut = true;
    else if (strongEnd.includes(last)) { if (buf.length >= minLen) cut = true; }
    else if (weakEnd.includes(last)) { if (buf.length >= targetLen) cut = true; }
    else if (buf.length >= 45) cut = true;
    if (cut && hasWord(buf)) { out.push(buf.trim()); buf = ''; }
  };
  return {
    push(text) {
      const out = [];
      for (const ch of String(text || '')) {
        buf += ch;
        tryCut(out);
      }
      return out;
    },
    preview() { return buf.trim(); },
    flush() {
      const rest = buf.trim();
      buf = '';
      return rest && hasWord(rest) ? rest : '';
    },
  };
}

export function splitForTTS(text, minLen = 6, targetLen = 14) {
  const s = String(text || '').replace(/\r/g, '').trim();
  if (!s) return [];
  const strongEnd = '。！？!?\n';
  const weakEnd = '，,、；;…—~～';
  const hasWord = (t) => /[\p{L}\p{N}]/u.test(t);
  const segs = [];
  let buf = '';
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    buf += ch;
    if (strongEnd.includes(ch) || weakEnd.includes(ch)) {
      while (i + 1 < s.length && (strongEnd.includes(s[i + 1]) || weakEnd.includes(s[i + 1]))) {
        buf += s[++i];
      }
    }
    const curLen = buf.length;
    let cut = false;
    if (ch === '\n') cut = true;
    else if (strongEnd.includes(ch)) { if (curLen >= minLen) cut = true; }
    else if (weakEnd.includes(ch)) { if (curLen >= targetLen) cut = true; }
    else if (curLen >= 45) cut = true;
    if (cut && hasWord(buf)) {
      segs.push(buf.trim());
      buf = '';
    }
  }
  if (hasWord(buf)) {
    const b = buf.trim();
    if (segs.length && b.length < minLen) segs[segs.length - 1] += b;
    else segs.push(b);
  }
  return segs.length ? segs : [s];
}

export function cleanForTTS(text) {
  let s = String(text || '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[`*~#]+/g, '')
    .replace(/(^|\s)(?:\.\.?[\\/])+/g, '$1')
    .replace(/\.{2,}/g, '，')
    .replace(/[\\/_]+/g, ' ')
    .replace(/(?<=[a-zA-Z0-9])-(?=[a-zA-Z0-9])/g, ' ');
  for (let i = 0; i < 3; i++) {
    s = s.replace(/([a-zA-Z0-9])\.([a-zA-Z])/g, '$1 点 $2');
  }
  return s.replace(/\s+/g, ' ').trim();
}

function parseWavHeader(buf) {
  if (buf.length < 12) return null;
  const tag = (o) => String.fromCharCode(buf[o], buf[o + 1], buf[o + 2], buf[o + 3]);
  if (tag(0) !== 'RIFF' || tag(8) !== 'WAVE') return null;
  const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  let sampleRate = 32000;
  let channels = 1;
  let pos = 12;
  while (pos + 8 <= buf.length) {
    const id = tag(pos);
    const sz = dv.getUint32(pos + 4, true);
    if (id === 'fmt ') {
      if (pos + 24 > buf.length) return null;
      channels = dv.getUint16(pos + 10, true) || 1;
      sampleRate = dv.getUint32(pos + 12, true) || 32000;
    } else if (id === 'data') {
      return { sampleRate, channels, dataOffset: pos + 8 };
    }
    pos += 8 + sz + (sz & 1);
  }
  return null;
}

export function createWavRunawayGuard(textLen) {
  const maxAudioSec = Math.max(12, Math.min(20, textLen * 0.45 + 6));
  const hdrChunks = [];
  let hdrBytes = 0;
  let totalStreamBytes = 0;
  let wav = null;
  let pcmBytes = 0;
  let hasLo = false;
  let loByte = 0;
  let sumSq = 0;
  let winCount = 0;
  let sawSpeech = false;
  let silentWindows = 0;

  return function inspect(chunk) {
    if (!wav && hdrBytes < 256) {
      hdrChunks.push(chunk);
      hdrBytes += chunk.byteLength;
      const merged = hdrChunks.length === 1 ? hdrChunks[0] : (() => {
        const out = new Uint8Array(hdrBytes);
        let o = 0;
        for (const c of hdrChunks) { out.set(c, o); o += c.byteLength; }
        return out;
      })();
      wav = parseWavHeader(merged);
      if (!wav && totalStreamBytes + chunk.byteLength >= 256) {
        wav = { sampleRate: 32000, channels: 1, dataOffset: 44 };
      }
    }
    const baseStreamPos = totalStreamBytes;
    totalStreamBytes += chunk.byteLength;
    if (!wav) return { cutByte: -1, reason: '' };

    const frameBytes = 2 * wav.channels;
    const maxPcmBytes = Math.floor(maxAudioSec * wav.sampleRate) * frameBytes;
    const winSamples = Math.max(1000, Math.round(wav.sampleRate * wav.channels * 0.25));
    const startOff = Math.max(0, wav.dataOffset - baseStreamPos);
    if (startOff >= chunk.byteLength) return { cutByte: -1, reason: '' };

    for (let i = startOff; i < chunk.byteLength; i++) {
      const b = chunk[i];
      if (!hasLo) {
        loByte = b;
        hasLo = true;
      } else {
        let v = loByte | (b << 8);
        if (v >= 32768) v -= 65536;
        hasLo = false;
        sumSq += v * v;
        winCount += 1;
        if (winCount >= winSamples) {
          const rms = Math.sqrt(sumSq / winCount);
          sumSq = 0;
          winCount = 0;
          if (rms >= 950) { sawSpeech = true; silentWindows = 0; }
          else if (sawSpeech && rms < 800) { silentWindows += 1; }
          if (silentWindows >= 10) {
            const alignedPcm = Math.floor((pcmBytes + 1) / frameBytes) * frameBytes;
            const cutByte = Math.max(startOff, startOff + alignedPcm - (pcmBytes - (i - startOff)));
            return { cutByte: Math.min(chunk.byteLength, cutByte), reason: 'eos-silence-tail' };
          }
        }
      }
      pcmBytes += 1;
      if (pcmBytes >= maxPcmBytes) {
        const excess = pcmBytes - maxPcmBytes;
        const cutByte = Math.max(startOff, Math.floor((i + 1 - excess) / frameBytes) * frameBytes);
        return { cutByte: Math.min(chunk.byteLength, cutByte), reason: `max-${Math.round(maxAudioSec)}s` };
      }
    }
    return { cutByte: -1, reason: '' };
  };
}

export function createTtsController({ ttsUrl, ttsRef, speech, touchTurnActivity }) {
  let gsvDownUntil = 0;

  function fetchTts(cleanText, signal) {
    return fetch(ttsUrl, {
      method: 'POST',
      signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: cleanText,
        text_lang: 'zh',
        prompt_lang: 'zh',
        text_split_method: cleanText.length <= 60 ? 'cut0' : 'cut5',
        media_type: 'wav',
        streaming_mode: 2,
        temperature: 0.4,
        top_P: 0.7,
        top_K: 3,
        ...ttsRef,
      }),
    });
  }

  async function sayResponse(res, label, textLen, signal) {
    const hooks = {
      onStart: () => rlog('tts-play-start', label),
      onEnd: () => rlog('tts-play-end', label),
      onFail: () => rlog('tts-play-fail', label),
    };
    if (!res.body) {
      const blob = await res.blob();
      touchTurnActivity();
      rlog('tts-ok', blob.size + 'B');
      speech.say(blob, hooks);
      return;
    }
    let totalBytes = 0;
    let firstChunk = false;
    let cutReason = '';
    const t0 = Date.now();
    const reader = res.body.getReader();
    let readableCtrl = null;
    let closed = false;
    const closeStream = () => {
      if (closed) return;
      closed = true;
      try { readableCtrl && readableCtrl.close(); } catch {}
    };
    const errorStream = (err) => {
      if (closed) return;
      closed = true;
      try { readableCtrl && readableCtrl.error(err); } catch {}
    };
    const readable = new ReadableStream({
      start(c) { readableCtrl = c; },
      cancel() { closed = true; reader.cancel().catch(() => {}); },
    });
    if (signal && signal.aborted) {
      try { await reader.cancel(signal.reason || 'aborted'); } catch {}
      try { reader.releaseLock(); } catch {}
      return;
    }
    const streamedRes = new Response(readable, { status: res.status, headers: res.headers });
    speech.say(streamedRes, hooks);
    let stallTimer = null;
    const armStall = () => {
      clearTimeout(stallTimer);
      stallTimer = setTimeout(() => {
        cutReason = 'chunk-stall-18s';
        reader.cancel(cutReason).catch(() => {});
      }, 18000);
    };
    const onAbort = () => { reader.cancel((signal && signal.reason) || 'aborted').catch(() => {}); };
    if (signal) signal.addEventListener('abort', onAbort, { once: true });
    const guard = createWavRunawayGuard(textLen);
    armStall();
    try {
      for (;;) {
        const { value: chunk, done } = await reader.read();
        if (done) break;
        armStall();
        if (!chunk || !chunk.byteLength) continue;
        const { cutByte, reason } = guard(chunk);
        const out = cutByte >= 0 ? chunk.subarray(0, cutByte) : chunk;
        totalBytes += out.byteLength;
        if (!firstChunk) {
          firstChunk = true;
          rlog('tts-first-chunk', `${label} in ${Date.now() - t0}ms (${out.byteLength}B)`);
        }
        touchTurnActivity();
        if (!closed && out.byteLength > 0) readableCtrl.enqueue(out);
        if (cutByte >= 0) {
          cutReason = reason;
          closeStream();
          await reader.cancel(reason).catch(() => {});
          break;
        }
      }
      closeStream();
      touchTurnActivity();
      if (cutReason) rlog('tts-eos-cut', `${label} (${cutReason}, ${totalBytes}B)`);
      else rlog('tts-stream-ok', totalBytes + 'B');
    } catch (e) {
      if (cutReason && !(signal && signal.aborted)) {
        closeStream();
        rlog('tts-eos-cut', `${label} (${cutReason}, ${totalBytes}B)`);
        return;
      }
      errorStream(e);
      throw e;
    } finally {
      clearTimeout(stallTimer);
      if (signal) signal.removeEventListener('abort', onAbort);
      try { reader.releaseLock(); } catch {}
    }
  }

  async function speakSegment(seg, signal) {
    touchTurnActivity();
    if (Date.now() < gsvDownUntil) { rlog('tts-skip-down', Math.round((gsvDownUntil - Date.now()) / 1000) + 's left'); return; }
    const clean = cleanForTTS(seg);
    if (!clean || !/[\p{L}\p{N}]/u.test(clean)) return;
    const label = seg.slice(0, 30);
    rlog('tts-start', label);
    const ctrl = new AbortController();
    const onAbort = () => { try { ctrl.abort(); } catch {} };
    if (signal) {
      if (signal.aborted) return;
      signal.addEventListener('abort', onAbort, { once: true });
    }
    const timer = setTimeout(onAbort, 120000);
    try {
      const res = await fetchTts(clean, ctrl.signal);
      touchTurnActivity();
      if (res.status === 502 || res.status === 503 || res.status === 504) {
        gsvDownUntil = Date.now() + 60000;
        rlog('tts-upstream-' + res.status, 'silent 60s');
        return;
      }
      if (!res.ok) throw new Error('TTS HTTP ' + res.status);
      await sayResponse(res, label, clean.length, ctrl.signal);
    } catch (e) {
      if (signal && signal.aborted) { rlog('tts-abort', 'turn aborted'); return; }
      if (ctrl.signal.aborted) { gsvDownUntil = Date.now() + 60000; rlog('tts-timeout', 'silent 60s'); return; }
      rlog('tts-error', String(e && e.message || e));
      console.warn('TTS 分段失败: ' + String(e && e.message || e));
    } finally {
      clearTimeout(timer);
      if (signal) signal.removeEventListener('abort', onAbort);
      touchTurnActivity();
    }
  }

  async function speak(text, signal) {
    const segs = splitForTTS(text);
    let fails = 0;
    for (const seg of segs) {
      if (signal && signal.aborted) return;
      if (Date.now() < gsvDownUntil) return;
      const clean = cleanForTTS(seg);
      if (!clean || !/[\p{L}\p{N}]/u.test(clean)) continue;
      try {
        const res = await fetchTts(clean, signal);
        if (!res.ok) { fails += 1; console.warn('TTS HTTP ' + res.status); }
        else { await sayResponse(res, seg.slice(0, 30), clean.length, signal); fails = 0; }
      } catch (e) {
        if (signal && signal.aborted) return;
        fails += 1; console.warn('TTS 失败：' + String(e && e.message || e));
      }
      if (fails >= 3) return;
    }
  }

  return { speakSegment, speak };
}
