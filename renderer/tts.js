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

export function createTtsController({ ttsUrl, ttsRef, speech, touchTurnActivity }) {
  let gsvDownUntil = 0;

  async function speakSegment(seg, signal) {
    touchTurnActivity();
    if (Date.now() < gsvDownUntil) { rlog('tts-skip-down', Math.round((gsvDownUntil - Date.now()) / 1000) + 's left'); return; }
    rlog('tts-start', seg.slice(0, 30));
    const ctrl = new AbortController();
    const onAbort = () => { try { ctrl.abort(); } catch {} };
    if (signal) {
      if (signal.aborted) return;
      signal.addEventListener('abort', onAbort, { once: true });
    }
    const timer = setTimeout(onAbort, 120000);
    try {
      const res = await fetch(ttsUrl, {
        method: 'POST',
        signal: ctrl.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: seg,
          text_lang: 'zh',
          prompt_lang: 'zh',
          text_split_method: 'cut5',
          media_type: 'wav',
          streaming_mode: false,
          temperature: 0.4,
          top_P: 0.7,
          top_K: 3,
          ...ttsRef,
        }),
      });
      touchTurnActivity();
      if (res.status === 502 || res.status === 503 || res.status === 504) {
        gsvDownUntil = Date.now() + 60000;
        rlog('tts-upstream-' + res.status, 'silent 60s');
        return;
      }
      if (!res.ok) throw new Error('TTS HTTP ' + res.status);
      const blob = await res.blob();
      touchTurnActivity();
      rlog('tts-ok', blob.size + 'B');
      speech.say(blob);
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
      let blob = null;
      try {
        const res = await fetch(ttsUrl, {
          method: 'POST', signal,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: seg, text_lang: 'zh', prompt_lang: 'zh', text_split_method: 'cut5',
            media_type: 'wav', streaming_mode: false, temperature: 0.4, top_P: 0.7, top_K: 3, ...ttsRef,
          }),
        });
        if (res.ok) blob = await res.blob();
        else { fails += 1; console.warn('TTS HTTP ' + res.status); }
      } catch (e) {
        if (signal && signal.aborted) return;
        fails += 1; console.warn('TTS 失败：' + String(e && e.message || e));
      }
      if (blob) { speech.say(blob); fails = 0; }
      if (fails >= 3) return;
    }
  }

  return { speakSegment, speak };
}
