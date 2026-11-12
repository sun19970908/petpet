(() => {
  // node_modules/@livliv-dev/player/dist/chunks/params-BCSFSCtz.js
  var e = () => ({ angleX: 0, angleY: 0, angleZ: 0, eyeLOpen: 1, eyeROpen: 1, eyeBallX: 0, eyeBallY: 0, browLY: 0, browRY: 0, mouthOpen: 0, smile: 0, vowel: 0, bodyX: 0, bodyZ: 0, breath: 0 });
  var t = { angleX: [-30, 30], angleY: [-30, 30], angleZ: [-30, 30], eyeLOpen: [0, 1], eyeROpen: [0, 1], eyeBallX: [-1, 1], eyeBallY: [-1, 1], browLY: [-1, 1], browRY: [-1, 1], mouthOpen: [0, 1], smile: [0, 1], vowel: [-1, 1], bodyX: [-10, 10], bodyZ: [-10, 10], breath: [0, 1] };
  var n = (e3, t3, n3) => {
    let r2 = Math.min(1, Math.max(0, (n3 - e3) / (t3 - e3)));
    return r2 * r2 * (3 - 2 * r2);
  };

  // node_modules/@livliv-dev/player/dist/chunks/errors-ohqiRK3N.js
  var e2 = class extends Error {
    code;
    status;
    constructor(e3, t3, n3 = {}) {
      super(t3, n3.cause === void 0 ? void 0 : { cause: n3.cause }), this.name = `LivLivError`, this.code = e3, n3.status !== void 0 && (this.status = n3.status);
    }
  };

  // node_modules/@livliv-dev/player/dist/chunks/base-p0Sx5Qp5.js
  var o = `livemaker-puppet`;
  var s = [];
  var c = { canvas: 8192, layers: 512, images: 2048, expressions: 256, eyes: 16, chains: 64, points: 256, texture: 8192, texels: 64 * 2 ** 20, modelJson: 4 * 2 ** 20, keyforms: 32 * 2 ** 20, vertices: 2 ** 21, skinned: 2 ** 20 };
  var l = (e3, t3) => Object.assign(Error(t3), { code: e3 });
  var u = 1e6;
  var d = [`head`, `body`, `hair_back`, `hair_side`, `hair_front`, `hair_inner`];
  var f = (e3, t3) => Math.max(6, Math.round(Math.max(e3, t3) / 128));
  var p = /^textures\/[A-Za-z0-9_][A-Za-z0-9_.-]*\.(?:webp|png)$/;
  var m = /^(?!.*(?:^|\/)\.\.(?:\/|$))[A-Za-z0-9_][A-Za-z0-9_.-]*(?:\/[A-Za-z0-9_][A-Za-z0-9_.-]*)*$/;
  var h = /* @__PURE__ */ new WeakSet();
  function g(e3, t3 = y()) {
    if (!e3 || typeof e3 != `object` || Array.isArray(e3)) throw l(`not-a-model`, `not a LivLiv model (model.json is not an object)`);
    if (h.has(e3)) return e3;
    let n3 = e3;
    if (n3.format === void 0 || n3.format === `livemaker-puppet`) {
      let e4 = n3.version ?? 3;
      if (e4 > 3) throw l(`not-a-model`, `this model says format "${o}" version ${e4}, which never existed`);
      return _(n3), h.add(n3), n3;
    }
    if (n3.format !== `livliv-model`) throw l(`not-a-model`, `not a LivLiv model (format "${String(n3.format)}")`);
    let r2 = n3.version;
    if (typeof r2 != `number` || r2 > 4) throw l(`newer-format`, `this model is format version ${r2}; this player reads up to 4: update the player`);
    let i3 = (n3.requires || []).filter((e4) => !s.includes(e4));
    if (i3.length) throw l(`missing-feature`, `this model needs ${i3.join(`, `)}, which this player does not have: update the player`);
    let a3 = v(n3, t3);
    return _(a3), h.add(a3), a3;
  }
  function _(e3) {
    let t3 = (e4, t4 = `invalid`) => {
      throw l(t4, `this model is not valid: ${e4}`);
    }, n3 = (e4) => typeof e4 == `number` && Number.isFinite(e4), r2 = (e4, n4, r3) => e4 === void 0 ? [] : ((!Array.isArray(e4) || e4.length > n4) && t3(`${r3} is not a list of at most ${n4}`), e4), [i3 = NaN, a3 = NaN] = Array.isArray(e3.canvas) ? e3.canvas : [];
    n3(i3) && n3(a3) && i3 > 0 && a3 > 0 && i3 <= c.canvas && a3 <= c.canvas || t3(`its canvas ${i3} x ${a3} is out of range`, i3 > c.canvas || a3 > c.canvas ? `too-large` : `invalid`), Array.isArray(e3.layers) && e3.layers.length || t3(`it has no layers`), e3.layers.length > c.layers && t3(`it has ${e3.layers.length} layers, more than ${c.layers}`, `too-large`);
    let o3 = e3.anchors, s3 = o3?.head, p3 = (e4) => n3(e4) && Math.abs(e4) <= u;
    s3 && [s3.cx, s3.cy, s3.rx, s3.ry, o3.neck_y, o3.top_y, o3.bottom_y, o3.hair_root_y].every(p3) && s3.rx > 1e-3 && s3.ry > 1e-3 && Array.isArray(o3.face) && o3.face.length === 4 && o3.face.every(p3) || t3(`its anchors are missing or not numbers`);
    let h3 = (e4, n4) => {
      e4 != null && !p3(e4) && t3(`${n4} is not a number in range`);
    }, g3 = (e4, n4, r3, i4) => {
      e4 != null && (!Array.isArray(e4) || e4.length < n4 || e4.length > r3 || !e4.every(p3)) && t3(`${i4} is not a list of ${n4} to ${r3} numbers`);
    }, _3 = (e4, n4, r3) => {
      if (e4 != null) {
        typeof e4 != `object` && t3(`${r3} is not an object`);
        for (let t4 of n4.split(` `)) h3(e4[t4], `${r3}.${t4}`);
      }
    }, v4 = (e4, n4) => {
      if (e4 != null) {
        (typeof e4 != `object` || Array.isArray(e4)) && t3(`${n4} is not an object`);
        for (let [t4, r3] of Object.entries(e4)) h3(r3, `${n4}.${t4.slice(0, 60)}`);
      }
    };
    h3(o3.collar_y, `anchors.collar_y`), _3(o3.jaw, `top chin half open round wide`, `anchors.jaw`), _3(o3.chest, `cx cy rx ry`, `anchors.chest`);
    for (let e4 of r2(o3.eyes, c.eyes, `anchors.eyes`)) e4 ?? t3(`anchors.eyes has an empty entry`), g3(e4, 4, 4, `anchors.eyes`);
    for (let e4 of r2(o3.brows, c.eyes, `anchors.brows`)) g3(e4, 4, 4, `anchors.brows`);
    for (let e4 of r2(o3.brow_lines, c.eyes, `anchors.brow_lines`)) {
      if (e4 == null) continue;
      let n4 = r2(e4.x, c.points, `a brow line`).length;
      n4 || t3(`a brow line has no points`), g3(e4.x, n4, n4, `a brow line`), g3(e4.bottom ?? [], n4, n4, `a brow line`), g3(e4.lid ?? [], n4, n4, `a brow line`), e4.cap != null && g3(e4.cap, n4, n4, `a brow line`);
    }
    _3(e3.tuning, `turn nod hair blink expr mouth breath hairFront hairBack`, `tuning`);
    let y4 = e3.rig;
    if (_3(y4, `yaw pitch roll bulge bulge_shape hair_limit wind breath sway brow pitch_ease jaw`, `rig`), g3(y4?.bulge_extent, 3, 5, `rig.bulge_extent`), g3(y4?.drift, 2, 2, `rig.drift`), g3(y4?.hair_drive, 3, 3, `rig.hair_drive`), _3(y4?.body, `yaw roll breath bust`, `rig.body`), _3(y4?.neck, `twist reach`, `rig.neck`), y4?.hair != null) for (let e4 of [`front`, `back`, `side`]) g3(y4.hair[e4], 5, 5, `rig.hair.${e4}`);
    for (let e4 of r2(y4?.chains, c.chains, `rig.chains`)) {
      e4 && typeof e4.id == `string` || t3(`a chain has no id`);
      let i4 = `chain ${e4.id.slice(0, 60)}`, a4 = r2(e4.points, c.points, `${i4}'s points`);
      a4.length < 2 && t3(`${i4} has fewer than two points`);
      for (let e5 of a4) e5 ?? t3(`${i4} has an empty point`), g3(e5, 2, 2, `${i4}'s points`);
      e4.k || t3(`${i4} has no k`), g3(e4.k, 2, 2, `${i4}'s k`);
      for (let r3 of [`damp`, `drive`, `hang`, `wind`]) n3(e4[r3]) || t3(`${i4} has no ${r3}`);
      _3(e4, `depth damp drive hang wind freq limit sigma reach`, i4), v4(e4.bias, `${i4}'s bias`);
    }
    let b4 = f(i3, a3), x4 = e3.layers.find((e4) => e4?.group === `hair_front`)?.bones, S4 = 0, C4 = 0, w4 = 0, T4 = 0;
    for (let o4 of e3.layers) {
      o4 && typeof o4 == `object` && typeof o4.id == `string` || t3(`a layer has no id`), (![o4.x, o4.y, o4.w, o4.h].every(n3) || !(o4.w > 0 && o4.h > 0) || o4.x < -i3 || o4.y < -a3 || o4.x + o4.w > 2 * i3 || o4.y + o4.h > 2 * a3) && t3(`layer ${o4.id.slice(0, 60)}'s box is out of range`), typeof o4.texture != `string` && t3(`layer ${o4.id.slice(0, 60)} has no texture`);
      for (let e5 of [o4.texture, ...r2(o4.frames, c.images, `layer ${o4.id.slice(0, 60)}'s frames`), o4.mask, o4.talk, o4.brow_tex]) e5 !== void 0 && (typeof e5 == `string` && m.test(e5) || t3(`layer ${o4.id.slice(0, 60)}: "${String(e5).slice(0, 80)}" is not a path inside the package`), ++S4 > c.images && t3(`it names more than ${c.images} images`));
      let e4 = `layer ${o4.id.slice(0, 60)}`;
      d.includes(o4.group) || t3(`${e4}'s group is not one a player knows`);
      for (let n4 of [`role`, `clip`, `param`]) o4[n4] != null && typeof o4[n4] != `string` && t3(`${e4}'s ${n4} is not text`);
      o4.visemes != null && !(Array.isArray(o4.visemes) && o4.visemes.every((e5) => typeof e5 == `string`)) && t3(`${e4}'s visemes are not text`), h3(o4.depth, `${e4}'s depth`), h3(o4.fall, `${e4}'s fall`), h3(o4.fall_end, `${e4}'s fall_end`), g3(o4.pivot, 2, 2, `${e4}'s pivot`), g3(o4.range, 2, 2, `${e4}'s range`), g3(o4.rigid, 2, 2, `${e4}'s rigid`), v4(o4.blush, `${e4}'s blush`), v4(o4.show, `${e4}'s show`), v4(o4.hide, `${e4}'s hide`);
      let s4 = r2(o4.bones, c.chains, `${e4}'s bones`);
      new Set(s4).size !== s4.length && t3(`${e4} names a chain twice`), s4.every((e5) => typeof e5 == `string`) || t3(`${e4}'s bones are not chain ids`);
      let l3 = (Math.ceil((o4.x + o4.w) / b4) - Math.floor(o4.x / b4) + 1) * (Math.ceil((o4.y + o4.h) / b4) - Math.floor(o4.y / b4) + 1), u2 = o4.id === `brows` || o4.role === `expr_brows` || !!o4.brow_tex;
      C4 += l3, w4 += l3 * (s4.length + (u2 && Array.isArray(x4) ? x4.length : 0)), u2 && (T4 += o4.w * o4.h);
    }
    C4 > c.vertices && t3(`its layers' meshes would have ${C4} vertices, more than ${c.vertices}`, `too-large`), w4 > c.skinned && t3(`its chains would bend ${w4} vertices, more than ${c.skinned}`, `too-large`), T4 > c.texels && t3(`its brows layers cover ${T4} pixels, more than ${c.texels}`, `too-large`);
    for (let n4 of r2(e3.expressions, c.expressions, `expressions`)) n4 && typeof n4.id == `string` || t3(`an expression has no id`);
    e3.keyforms === void 0 || typeof e3.keyforms == `string` && m.test(e3.keyforms) || t3(`keyforms is not a path inside the package`), e3.watermark != null && typeof e3.watermark != `string` && t3(`its watermark is not text`);
  }
  function v(e3, t3) {
    if (!Array.isArray(e3.layers) || !e3.layers.length) throw l(`invalid`, `this model has no layers`);
    if (e3.layers.length > c.layers) throw l(`too-large`, `this model has ${e3.layers.length} layers, more than ${c.layers}`);
    let [n3, r2] = e3.canvas || [];
    if (!(n3 > 0 && r2 > 0 && n3 <= c.canvas && r2 <= c.canvas)) throw l(n3 > c.canvas || r2 > c.canvas ? `too-large` : `invalid`, `this model's canvas ${n3} x ${r2} is out of range`);
    for (let t4 of e3.layers) for (let e4 of [t4.texture, ...t4.frames || [], t4.mask, t4.talk, t4.brow_tex]) if (e4 !== void 0 && !p.test(e4)) throw l(`invalid`, `layer ${t4.id}: "${e4}" is not an image path of the package`);
    for (let [t4, n4] of Object.entries(e3.files || {})) if (!t4.startsWith(`x-`) && (typeof n4 != `string` || !m.test(n4))) throw l(`invalid`, `files.${t4}: "${n4}" is not a path in the package`);
    let i3 = e3.layers.map(({ label: e4, expression: t4, ...n4 }) => ({ ...n4, depth: n4.depth ?? 0, name: e4 ? b(e4, `en`, n4.id) : n4.id, ...t4 ? { param: t4 } : {} })), a3;
    if (e3.tuning) {
      let { hair_front: t4, hair_back: n4, ...r3 } = e3.tuning;
      a3 = { ...r3, ...t4 === void 0 ? {} : { hairFront: t4 }, ...n4 === void 0 ? {} : { hairBack: n4 } };
    }
    let o3 = e3.profile, s3 = e3.meta?.watermark;
    return { format: e3.format, version: e3.version, name: e3.name, canvas: e3.canvas, anchors: e3.anchors, layers: i3, rig: e3.rig, tuning: a3, profile: o3 && { id: o3.id, label: ``, class: { input: { facing: o3.facing, glasses: o3.glasses } } }, expressions: (e3.expressions || []).map((e4) => ({ id: e4.id, label: b(e4.label, t3, e4.id), labels: e4.label, ...e4.hotkey ? { key: e4.hotkey } : {} })), keyforms: e3.files?.keyforms, watermark: s3?.kind === `livliv` ? `LivLiv` : s3?.kind === `text` ? s3.text ?? null : null, meta: e3.meta, files: e3.files };
  }
  function y() {
    return typeof navigator < `u` && navigator.language || `en`;
  }
  function b(e3, t3, n3) {
    if (!e3) return n3;
    let r2 = Object.keys(e3), i3 = (e4) => r2.find((t4) => t4.toLowerCase() === e4.toLowerCase()), a3 = t3 || `en`, o3 = a3.split(`-`)[0].toLowerCase(), s3 = o3 === `zh` && /-(hant|tw|hk|mo)\b/i.test(a3);
    for (let t4 of [a3, ...o3 === `zh` ? [s3 ? `zh-Hant` : `zh-Hans`] : [], o3, ...s3 ? [`zh`] : [], `en`, `zh`]) {
      let n4 = i3(t4);
      if (n4 && e3[n4]) return e3[n4];
    }
    return r2.length ? e3[r2[0]] : n3;
  }
  function x(e3) {
    return /[぀-ヿ]/.test(e3) ? `ja` : /[가-힯]/.test(e3) ? `ko` : /[一-鿿]/.test(e3) ? `zh` : `en`;
  }
  var S = { nod: 0.95, shake: 1.05, tilt: 1.8, hop: 0.65, shy: 2.4 };
  var C = (e3, n3) => n(0, 0.18, e3) * (1 - n(n3 - 0.22, n3, e3));
  function w(e3, t3) {
    let n3 = S[e3], r2 = C(t3, n3), i3 = {}, a3 = 0;
    return e3 === `nod` && (i3.angleY = -(t3 < 0.45 ? 11 * Math.sin(Math.PI * t3 / 0.45) : 6 * Math.sin(Math.PI * Math.min(t3 - 0.45, 0.45) / 0.45)) * r2), e3 === `shake` && (i3.angleX = 13 * Math.sin(2 * Math.PI * t3 / 0.5) * r2, i3.bodyX = i3.angleX * 0.15), e3 === `tilt` && (i3.angleZ = 11 * r2, i3.angleX = 3 * r2, i3.angleY = 2 * r2), e3 === `hop` && (a3 = t3 < 0.2 ? -0.025 * Math.sin(Math.PI * t3 / 0.2) : t3 < 0.6 ? 0.04 * Math.sin(Math.PI * (t3 - 0.2) / 0.4) : 0, i3.angleY = t3 > 0.2 && t3 < 0.6 ? 5 * Math.sin(Math.PI * (t3 - 0.2) / 0.4) * r2 : 0), e3 === `shy` && (i3.angleY = -12 * r2, i3.angleX = 9 * r2, i3.angleZ = -4 * r2, i3.eyeBallX = 0.7 * r2, i3.eyeBallY = -0.5 * r2), { offsets: i3, x: 0, y: a3 };
  }
  var T = { eyeLOpen: 0, eyeROpen: 0, angleY: -11, angleZ: 5, angleX: 0, mouthOpen: 0, smile: 0, eyeBallX: 0, eyeBallY: 0 };
  var E = class {
    playing = [];
    away = false;
    auto = false;
    awayW = 0;
    off = {};
    y = 0;
    play(e3) {
      if (e3 === `away`) this.setAway(!this.away);
      else {
        for (let t3 of this.playing) t3.id === e3 && t3.out < 0 && (t3.out = 0);
        this.playing.push({ id: e3, t: 0, out: -1 });
      }
    }
    setAway(e3, t3 = false) {
      this.away = e3, this.auto = e3 && t3;
    }
    get busy() {
      return this.playing.length > 0 || this.awayW > 0;
    }
    update(e3) {
      let n3 = this.off;
      for (let e4 of Object.keys(n3)) delete n3[e4];
      this.y = 0;
      for (let r2 of this.playing) {
        r2.t += e3, r2.out >= 0 && (r2.out += e3);
        let i3 = w(r2.id, Math.min(r2.t, S[r2.id])), a3 = r2.out < 0 ? 1 : 1 - n(0, 0.15, r2.out);
        for (let [e4, t3] of Object.entries(i3.offsets)) n3[e4] = (n3[e4] ?? 0) + t3 * a3;
        this.y += i3.y * a3;
      }
      return this.playing = this.playing.filter((e4) => e4.t < S[e4.id] && e4.out < 0.15), this.awayW += (+!!this.away - this.awayW) * Math.min(1, e3 * (this.away ? 2.2 : 4)), this.awayW < 2e-3 && !this.away && (this.awayW = 0), n3;
    }
    awayPose(e3) {
      return { ...T, breath: 0.5 + 0.5 * Math.sin(e3 * 1.15) };
    }
  };
  var D = (e3, t3, n3) => {
    let r2 = Math.min(1, Math.max(0, (n3 - e3) / (t3 - e3)));
    return r2 * r2 * (3 - 2 * r2);
  };
  var O = (e3, t3, n3) => Math.max(t3, Math.min(n3, e3));
  var k = (e3, t3, n3) => {
    let r2 = Math.abs(e3);
    return r2 <= t3 ? e3 : Math.sign(e3) * (t3 + (n3 - t3) * Math.tanh((r2 - t3) / (n3 - t3)));
  };
  var A = (e3, t3, n3, r2) => e3 < 0 || e3 > t3 + n3 + r2 ? 0 : e3 < t3 ? D(0, t3, e3) : 1 - D(t3 + n3, t3 + n3 + r2, e3);
  function j(e3, t3) {
    let n3 = (e4) => {
      let n4 = Math.sin(e4 * 127.1 + t3 * 311.7) * 43758.5453;
      return n4 - Math.floor(n4);
    }, r2 = Math.floor(e3), i3 = e3 - r2, a3 = i3 * i3 * (3 - 2 * i3);
    return (n3(r2) * (1 - a3) + n3(r2 + 1) * a3) * 2 - 1;
  }
  var M = (e3, t3) => j(e3, t3) * 0.7 + j(e3 * 2.3, t3 + 17) * 0.3;
  function N(e3, t3) {
    if (t3 <= e3[0][0]) return e3[0][1];
    let n3 = e3.length - 1;
    if (t3 >= e3[n3][0]) return e3[n3][1];
    let r2 = 0;
    for (; t3 > e3[r2 + 1][0]; ) r2++;
    let i3 = (t4) => t4 <= 0 || t4 >= n3 ? 0 : (e3[t4 + 1][1] - e3[t4 - 1][1]) / (e3[t4 + 1][0] - e3[t4 - 1][0]), a3 = e3[r2 + 1][0] - e3[r2][0], o3 = (t3 - e3[r2][0]) / a3, s3 = o3 * o3, c3 = s3 * o3;
    return (2 * c3 - 3 * s3 + 1) * e3[r2][1] + (c3 - 2 * s3 + o3) * i3(r2) * a3 + (-2 * c3 + 3 * s3) * e3[r2 + 1][1] + (c3 - s3) * i3(r2 + 1) * a3;
  }
  var P = { glance: { dur: 4, tracks: { eyeBallX: [[0, 0], [0.15, 0.8], [2.5, 0.75], [2.8, 0]], eyeBallY: [[0, 0], [0.15, 0.25], [2.5, 0.2], [2.8, 0]], angleX: [[0, 0], [0.6, 11], [2.5, 10], [3.4, 0]], angleY: [[0, 0], [0.6, 4], [2.5, 3], [3.4, 0]], angleZ: [[0, 0], [0.7, -4], [2.5, -3], [3.4, 0]], bodyX: [[0, 0], [1, 2], [2.6, 1.5], [3.8, 0]], brow: [[0, 0], [0.4, 0.25], [2.5, 0.2], [3.2, 0]], breath: [[0, 0.1], [0.6, 0.7], [2.6, 0.6], [3.6, 0], [4, 0.15]] } }, lookAround: { dur: 5, tracks: { eyeBallX: [[0, 0], [0.2, -0.8], [1.4, -0.75], [1.7, 0.1], [2, 0.8], [3.2, 0.75], [3.5, 0]], angleX: [[0, 0], [0.7, -15], [1.5, -14], [2.4, 15], [3.3, 14], [4.2, 0]], angleY: [[0, 0], [0.8, 3], [2.4, 3], [4.2, 0]], angleZ: [[0, 0], [0.8, 3], [1.7, 0], [2.5, -3], [4.2, 0]], bodyX: [[0, 0], [1, -3], [2.7, 3], [4.4, 0]], brow: [[0, 0], [0.5, 0.3], [3.4, 0.25], [4.2, 0]], breath: [[0, 0.2], [0.6, 0.8], [3.4, 0.7], [4.4, 0], [5, 0.1]] } }, sway: { dur: 6, tracks: { bodyZ: [[0, 0], [1.5, 3.5], [3, -3.5], [4.5, 3], [6, 0]], bodyX: [[0, 0], [1.5, 2], [3, -2], [4.5, 1.5], [6, 0]], angleZ: [[0, 0], [1.6, -7], [3.1, 7], [4.6, -6], [6, 0]], angleX: [[0, 0], [1.6, 4], [3.1, -4], [4.6, 3], [6, 0]], eyeBallX: [[0, 0], [1.6, -0.25], [3.1, 0.25], [4.6, -0.2], [6, 0]], eye: [[0, 1], [0.8, 0.88], [5.2, 0.88], [6, 1]], breath: [[0, 0], [0.75, 1], [1.5, 0], [2.25, 1], [3, 0], [3.75, 1], [4.5, 0], [5.25, 0.8], [6, 0]] } }, think: { dur: 4.4, tracks: { eyeBallX: [[0, 0], [0.3, -0.6], [3.4, -0.55], [3.8, 0]], eyeBallY: [[0, 0], [0.3, 0.6], [3.4, 0.55], [3.8, 0]], angleX: [[0, 0], [0.8, -9], [3.4, -8], [4.2, 0]], angleY: [[0, 0], [0.8, 6], [3.4, 5], [4.2, 0]], angleZ: [[0, 0], [0.9, 6], [3.4, 5], [4.2, 0]], brow: [[0, 0], [0.6, 0.35], [3.4, 0.3], [4.2, 0]], eye: [[0, 1], [0.6, 0.92], [3.4, 0.92], [4, 1]] } }, lookDown: { dur: 2.4, tracks: { eyeBallY: [[0, 0], [0.2, -0.85], [1.4, -0.8], [1.65, 0]], eyeBallX: [[0, 0], [0.2, -0.1], [1.4, -0.1], [1.65, 0]], angleY: [[0, 0], [0.45, -8], [1.4, -7], [1.9, 1], [2.4, 0]], angleZ: [[0, 0], [0.5, 2], [1.5, 2], [2.4, 0]], eye: [[0, 1], [0.3, 0.8], [1.4, 0.8], [1.65, 1]] } } };
  var F = { angleX: [55, 0.72], angleY: [55, 0.72], angleZ: [45, 0.75], bodyX: [14, 0.9], bodyZ: [12, 0.9] };
  var I = { wander: 1, look: 1, moves: 1, bodyTurn: 0, bodyTilt: 0, pointer: `attend`, smile: 0.4 };
  var L = { yaw: 9, yawKnee: 10, yawCap: 13, pitch: 5, pitchKnee: 6, pitchCap: 10, roll: 2, rollKnee: 8, rollCap: 12, lean: 0, bodyTurn: 1.5, eyeX: 1, eyeY: 0.8, eyeXCap: 0.78, eyeYCap: 0.55, eyeKnee: 0.7, hold: 2.2 };
  function R(e3, t3, n3, r2, i3, a3, o3) {
    let s3 = t3.model?.anchors.head, [c3, l3, u2, d2, f3] = t3.lastView, p3 = !!s3 && f3 > 1, m3 = p3 ? (s3.cx * c3 + u2 + 1) / 2 : 0.5, h3 = p3 ? (s3.cy * l3 + d2 + 1) / 2 : 0.3, g3 = p3 ? Math.abs(s3.rx * c3) / 2 : 0.12, _3 = p3 ? Math.abs(s3.ry * l3) / 2 : 0.1, v4 = n3 / Math.max(1, i3), y4 = r2 / Math.max(1, a3);
    e3.pointer = { x: O((v4 - m3) * 2, -1, 1), y: O(-(y4 - h3) * 1.6, -1, 1), d: Math.hypot((v4 - m3) / g3, (y4 - h3) / _3), on: o3 };
  }
  var z = class {
    nextBlink = 2;
    blinkT = -1;
    blinkAt = -99;
    look = { x: 0, y: 0 };
    blinkRate = 1;
    nextSaccade = 1;
    gaze = { x: 0, y: 0 };
    busy = false;
    moves = 1;
    style = { ...I };
    shown = { x: 0, z: 0 };
    pointer = { x: 0, y: 0, d: 99, on: false };
    tracked = false;
    faceFree = true;
    smiling = false;
    att = { px: 0, py: 0, on: false, moved: -99, speed: 0, engaged: false, since: 0, x: 0, y: 0, slow: { x: 0, y: 0 }, soft: 0, side: 1, notice: -99, back: -99, smile: -99, smiled: -99, jitter: { x: 0, y: 0 } };
    fol = { x: 0, z: 0, x2: 0, z2: 0 };
    move = null;
    nextMove = 6;
    last = ``;
    s = Object.fromEntries(Object.keys(F).map((e3) => [e3, { x: 0, v: 0 }]));
    aim = null;
    breathPhase = 0;
    breathPeriod = 3.8;
    double = false;
    seed = Math.random() * 100;
    breath(e3) {
      this.breathPhase += e3 / this.breathPeriod, this.breathPhase >= 1 && (--this.breathPhase, this.breathPeriod = 3.2 + Math.random() * 1.4);
      let t3 = this.breathPhase;
      return t3 < 0.4 ? D(0, 0.4, t3) : t3 < 0.88 ? 1 - D(0.4, 0.88, t3) : 0;
    }
    apply(e3, t3, n3) {
      n3 = n3 > 0 ? Math.min(n3, 0.1) : 0;
      let r2 = this.style, i3 = r2.pointer === `attend` && !this.tracked;
      i3 && this.attend(t3, n3);
      let a3 = this.busy || i3 && this.att.engaged;
      if (this.move) this.move.t += n3, a3 && (this.move.fade = Math.max(0, this.move.fade - n3 / 0.4)), (this.move.t >= P[this.move.id].dur || this.move.fade <= 0) && (this.move = null);
      else if (a3) this.nextMove = Math.max(this.nextMove, t3 + 3);
      else if (this.moves > 0 && t3 > this.nextMove) {
        let e4 = Object.keys(P).filter((e5) => e5 !== this.last), n4 = e4[Math.floor(Math.random() * e4.length)];
        this.move = { id: n4, t: 0, side: Math.random() < 0.5 ? -1 : 1, fade: 1 }, this.last = n4, this.nextMove = t3 + P[n4].dur + 10 + Math.random() * 10;
      }
      let o3 = this.move, s3 = o3 ? P[o3.id] : null, c3 = o3 ? o3.fade * D(0, 0.15, o3.t) * (1 - D(s3.dur - 0.25, s3.dur, o3.t)) : 0, l3 = (e4, t4 = 0) => {
        let n4 = s3?.tracks[e4];
        return n4 ? t4 + (N(n4, o3.t) * (e4 === `angleX` || e4 === `angleZ` || e4 === `bodyX` || e4 === `bodyZ` || e4 === `eyeBallX` ? o3.side : 1) - t4) * c3 * this.moves * (e4.startsWith(`angle`) || e4.startsWith(`body`) ? r2.moves : 1) : t4;
      }, u2 = 1;
      if (this.blinkT < 0 && t3 > this.nextBlink && (this.blinkT = 0, this.blinkAt = t3), this.blinkT >= 0) {
        this.blinkT += n3;
        let e4 = this.blinkT / 0.075;
        u2 = O(e4 < 1 ? 1 - e4 : e4 < 2.6 ? (e4 - 1) / 1.6 : 1, 0, 1), e4 >= 2.6 && (this.blinkT = -1, !this.double && Math.random() < 0.18 ? (this.double = true, this.nextBlink = t3 + 0.08) : (this.double = false, this.nextBlink = t3 + (1.8 + Math.random() * 3.8) / Math.max(0.2, this.blinkRate)));
      }
      let d2 = O(l3(`eye`, 1), 0, 1) * u2;
      e3.eyeLOpen = e3.eyeROpen = i3 ? d2 * (1 - 0.16 * this.att.soft) : d2;
      let f3 = this.seed, p3 = this.look, m3 = r2.look, h3 = r2.wander, g3, _3, v4;
      if (i3) {
        let e4 = this.att, r3 = L;
        t3 > this.nextSaccade && (e4.jitter = { x: (Math.random() - 0.5) * 0.2, y: (Math.random() - 0.5) * 0.16 }, this.nextSaccade = t3 + 0.6 + Math.random() * 1.6), this.gaze = { x: r3.eyeX * e4.x + e4.jitter.x, y: r3.eyeY * e4.y + e4.jitter.y };
        let i4 = this.gaze.x + l3(`eyeBallX`), a4 = this.gaze.y + l3(`eyeBallY`), o4 = Math.hypot(i4 / r3.eyeXCap, a4 / r3.eyeYCap), s4 = o4 > r3.eyeKnee ? k(o4, r3.eyeKnee, 1) / o4 : 1;
        g3 = i4 * s4, _3 = a4 * s4;
        let c4 = e4.slow;
        Math.hypot(g3 - c4.x, _3 - c4.y) > 0.5 && (this.blinkT < 0 && t3 - this.blinkAt > 1.2 && (this.nextBlink = Math.min(this.nextBlink, t3)), c4.x = g3, c4.y = _3), c4.x += (g3 - c4.x) * Math.min(1, n3 / 0.35), c4.y += (_3 - c4.y) * Math.min(1, n3 / 0.35);
        let u3 = this.moves > 0 ? 3 * A(t3 - e4.notice, 0.12, 0.15, 0.5) - 2.5 * A(t3 - e4.back, 0.15, 0.1, 0.45) : 0;
        v4 = { angleX: k(e4.x * r3.yaw * m3 + M(t3 * 0.17, f3) * 4 * h3 + this.gaze.x * 2 + l3(`angleX`), r3.yawKnee, r3.yawCap), angleY: k(e4.y * r3.pitch * m3 + M(t3 * 0.13, f3 + 1) * 3 * h3 + this.gaze.y * 2 + u3 + l3(`angleY`), r3.pitchKnee, r3.pitchCap), angleZ: k(e4.x * r3.roll * m3 + e4.side * 3 * e4.soft + M(t3 * 0.11, f3 + 2) * 5 * h3 + l3(`angleZ`), r3.rollKnee, r3.rollCap), bodyX: e4.x * r3.bodyTurn * m3 + M(t3 * 0.09, f3 + 3) * 3 * h3 + l3(`bodyX`), bodyZ: e4.x * r3.lean * m3 + M(t3 * 0.08, f3 + 4) * 2.5 * h3 + l3(`bodyZ`) };
      } else t3 > this.nextSaccade && (this.gaze = { x: this.look.x + (Math.random() - 0.5) * 0.25, y: this.look.y * 0.8 + (Math.random() - 0.5) * 0.2 }, this.nextSaccade = t3 + 0.6 + Math.random() * 1.6), g3 = O(this.gaze.x * 1.2 + l3(`eyeBallX`), -1, 1), _3 = O(this.gaze.y + l3(`eyeBallY`), -1, 1), v4 = { angleX: p3.x * 20 * m3 + M(t3 * 0.17, f3) * 7 * h3 + this.gaze.x * 5 + l3(`angleX`), angleY: p3.y * 13 * m3 + M(t3 * 0.13, f3 + 1) * 4 * h3 + this.gaze.y * 3 + l3(`angleY`), angleZ: -p3.x * 4 * m3 + M(t3 * 0.11, f3 + 2) * 6 * h3 + l3(`angleZ`), bodyX: p3.x * 4 * m3 + M(t3 * 0.09, f3 + 3) * 3 * h3 + l3(`bodyX`), bodyZ: M(t3 * 0.08, f3 + 4) * 2.5 * h3 + l3(`bodyZ`) };
      e3.eyeBallX += (g3 - e3.eyeBallX) * Math.min(1, n3 * 18), e3.eyeBallY += (_3 - e3.eyeBallY) * Math.min(1, n3 * 18);
      let y4 = Math.max(1, Math.ceil(n3 / (1 / 120))), b4 = this.aim ??= { ...v4 };
      for (let t4 of Object.keys(F)) {
        let [r3, i4] = F[t4], a4 = 2 * Math.sqrt(r3) * i4, o4 = this.s[t4];
        for (let e4 = 0; e4 < y4; e4++) b4[t4] += (v4[t4] - b4[t4]) * Math.min(1, n3 / y4 / 0.12), o4.v += (r3 * (b4[t4] - o4.x) - a4 * o4.v) * (n3 / y4), o4.x += o4.v * (n3 / y4);
        e3[t4] = o4.x;
      }
      let x4 = this.fol, S4 = Math.min(1, n3 / 0.12);
      x4.x += (r2.bodyTurn * this.shown.x - x4.x) * S4, x4.x2 += (x4.x - x4.x2) * S4, x4.z += (r2.bodyTilt * this.shown.z - x4.z) * S4, x4.z2 += (x4.z - x4.z2) * S4, (r2.bodyTurn || r2.bodyTilt) && (e3.bodyX = O(e3.bodyX + x4.x2, -10, 10), e3.bodyZ = O(e3.bodyZ + x4.z2, -10, 10)), e3.breath = O(l3(`breath`, this.breath(n3)), 0, 1);
      let C4 = (i3 ? this.attendBrow(t3) : p3.y > 0.4 ? 0.5 : 0) - (1 - u2) * 0.15 + l3(`brow`);
      e3.browLY += (C4 - e3.browLY) * Math.min(1, n3 * 10), e3.browRY = e3.browLY, i3 ? (e3.smile = +(t3 >= this.att.smile && t3 < this.att.smile + 1.6), this.smiling = e3.smile > 0) : this.smiling &&= (e3.smile = 0, false);
    }
    attend(e3, t3) {
      let n3 = this.att, r2 = this.pointer;
      if (r2.on && !n3.on && (n3.notice = e3, n3.moved = e3, n3.px = r2.x, n3.py = r2.y, n3.side = Math.random() < 0.5 ? -1 : 1), r2.on) {
        let i4 = Math.hypot(r2.x - n3.px, r2.y - n3.py);
        n3.speed += (i4 / Math.max(t3, 1e-3) - n3.speed) * Math.min(1, t3 / 0.15), i4 > 3e-3 && (n3.moved = e3), n3.px = r2.x, n3.py = r2.y;
      } else n3.speed *= Math.max(0, 1 - t3 / 0.15);
      n3.on = r2.on;
      let i3 = r2.on && r2.d < 1, a3 = r2.on && (i3 || !!r2.keep || e3 - n3.moved < L.hold);
      a3 !== n3.engaged && (!a3 && e3 - n3.since > 0.8 && (n3.back = e3, this.nextMove = Math.max(this.nextMove, e3 + 6)), n3.since = e3, n3.engaged = a3);
      let o3 = this.style.smile ?? 0;
      i3 && e3 - n3.moved > 1.2 && o3 > 0 && this.faceFree && !this.busy && e3 - n3.smiled > 25 && e3 > n3.smile + 1.6 && ((n3.smiled < 0 || Math.random() < o3) && (n3.smile = e3), n3.smiled = e3);
      let s3 = e3 >= n3.smile && e3 < n3.smile + 1.6 ? 0 : Math.max(i3 && e3 - n3.moved > 0.5 ? 1 : 0, A(e3 - n3.back, 0.2, 0.6, 0.6));
      n3.soft += (s3 - n3.soft) * Math.min(1, t3 / 0.25), n3.x = a3 ? r2.x : 0, n3.y = a3 ? r2.y : 0;
    }
    attendBrow(e3) {
      let t3 = this.att, n3 = this.pointer, r2 = n3.on && e3 - t3.moved < 0.3 ? 1 - D(1, 2.2, n3.d) : 0;
      return Math.min(0.7, 0.4 * D(0.35, 0.9, t3.y) + 0.3 * D(1.5, 5, t3.speed) + 0.15 * r2 + 0.45 * A(e3 - t3.notice, 0.08, 0.25, 0.35) + 0.2 * A(e3 - t3.back, 0.15, 0.3, 0.5) + 0.12 * t3.soft);
    }
  };
  var B = [`angleX`, `angleY`, `angleZ`, `eyeLOpen`, `eyeROpen`, `eyeBallX`, `eyeBallY`, `browLY`, `browRY`, `bodyX`, `bodyZ`, `breath`];
  var V = (e3, t3, n3) => Math.min(n3, Math.max(t3, e3));
  var H = class {
    lv = new z();
    P = e();
    turn = { x: 0, y: 0 };
    held = false;
    constructor() {
      typeof matchMedia < `u` && matchMedia(`(prefers-reduced-motion: reduce)`).matches && (this.lv.moves = 0);
    }
    apply(e3, t3, n3, r2) {
      let i3 = this.lv;
      i3.busy = r2.busy, i3.tracked = r2.tracked, i3.faceFree = r2.faceFree, i3.look = this.turn, i3.apply(this.P, t3, n3);
      for (let t4 of B) e3[t4] = this.P[t4];
      e3.smile = Math.max(e3.smile, this.P.smile);
    }
    shown(e3) {
      this.lv.shown.x = e3.angleX, this.lv.shown.z = e3.angleZ;
    }
    pointer(e3, t3, n3, r2, i3, a3) {
      this.held || (R(this.lv, e3, t3, n3, r2, i3, a3), a3 && (this.turn = { x: V((t3 / Math.max(1, r2) - 0.5) * 2, -1, 1), y: V(-(n3 / Math.max(1, i3) - 0.3) * 1.6, -1, 1) }));
    }
    leave() {
      this.held || (this.lv.pointer.on = false), this.turn = { x: 0, y: 0 };
    }
    lookAt(e3, t3, n3, r2, i3) {
      this.held = false, t3 === null ? (this.lv.pointer = { ...this.lv.pointer, on: false, keep: false }, this.turn = { x: 0, y: 0 }) : (this.pointer(e3, (t3 + 1) / 2 * r2, (1 - n3) / 2 * i3, r2, i3, true), this.lv.pointer.keep = true, this.held = true, this.turn = { x: t3, y: n3 });
    }
    blink(e3) {
      this.lv.nextBlink = Math.min(this.lv.nextBlink, e3);
    }
  };
  var U = /* @__PURE__ */ new WeakSet();
  var W = /* @__PURE__ */ new WeakMap();
  function G(e3, t3) {
    if (!t3 || U.has(e3) || W.has(e3)) return;
    let n3 = setTimeout(() => {
      W.delete(e3), U.add(e3), t3.getExtension(`WEBGL_lose_context`)?.loseContext();
    });
    W.set(e3, () => clearTimeout(n3));
  }
  function K(e3) {
    if (W.get(e3)?.(), W.delete(e3), U.has(e3)) throw new e2(`released`, `LivLiv: this canvas gave up its WebGL context with dispose({ release: true }): use a new canvas`);
  }
  var q = (e3, t3, n3) => Math.min(n3, Math.max(t3, e3));
  var J = (e3) => new DOMException(`LivLiv: ${e3}`, `AbortError`);
  var Y = () => new e2(`context-lost`, `LivLiv: this canvas has lost its WebGL context: use a new canvas and a new player`);
  async function X(e3, t3, n3 = (e4) => e4) {
    let r2 = e3.headers.get(`content-encoding`) ? 0 : Number(e3.headers.get(`content-length`)) || 0;
    if (!e3.body) return e3.blob();
    let i3 = e3.body.getReader(), a3 = [], o3 = 0;
    for (; ; ) {
      let { done: e4, value: s3 } = await i3.read();
      if (e4) break;
      a3.push(s3), o3 += s3.byteLength, r2 && t3.progress(n3(Math.min(1, o3 / r2)));
    }
    return new Blob(a3);
  }
  var Z = e();
  var Q = Object.keys(t);
  var $ = class {
    canvas;
    params = e();
    idle;
    followPointer;
    view = { x: 0, y: 0, zoom: 1, head: false };
    lang;
    onContextLost;
    info = null;
    disposed = false;
    idler = new H();
    was = { tracked: false, mouth: 0 };
    actions = new E();
    drivers = [];
    expr = {};
    smile = 0;
    raf = 0;
    last = 0;
    visible = true;
    io;
    queue = Promise.resolve();
    lost = false;
    running = null;
    posterOver = null;
    frame;
    constructor(e3, t3, r2) {
      this.canvas = e3, this.idle = r2.idle ?? true, this.followPointer = r2.followPointer ?? `page`, this.lang = r2.lang || y(), this.frame = { params: t3, dt: 0, time: 0, tracked: false, move: { x: 0, y: 0, s: 1 }, add(e4) {
        for (let [r3, i3] of Object.entries(e4)) i3 && (t3[r3] = q(t3[r3] + i3, t[r3][0], t[r3][1]));
      } }, addEventListener(`pointermove`, this.onMove), document.addEventListener(`pointerleave`, this.onLeave), e3.addEventListener(`webglcontextlost`, this.onLost), typeof IntersectionObserver < `u` && (this.io = new IntersectionObserver((e4) => {
        this.visible = e4[e4.length - 1].isIntersecting;
      }), this.io.observe(e3)), (r2.autoplay ?? true) && this.play();
    }
    get contextLost() {
      return this.lost || !!this.gl?.isContextLost();
    }
    get model() {
      return this.info;
    }
    get expressions() {
      return this.info?.expressions ?? [];
    }
    get playing() {
      return this.raf !== 0;
    }
    start({ signal: e3, onProgress: t3, poster: n3 }, r2) {
      let i3, a3, o3 = new Promise((e4, t4) => {
        i3 = e4, a3 = t4;
      }), s3 = (e4) => {
        e4?.name === `AbortError` && o3.catch(() => {
        }), a3(e4);
      };
      if (e3?.aborted) return s3(e3.reason), o3;
      if (this.disposed) return s3(J(`the player was disposed`)), o3;
      if (this.contextLost) return s3(Y()), o3;
      this.running?.abort(J(`a newer load took its place`));
      let c3 = this.running = new AbortController(), l3 = () => c3.abort(e3.reason);
      e3?.addEventListener(`abort`, l3, { once: true }), this.setPoster(n3);
      let u2 = (e4) => {
        try {
          t3?.(e4);
        } catch (e5) {
          console.error(e5);
        }
      }, d2 = -1, f3 = false, p3 = { signal: c3.signal, progress(e4) {
        e4 > d2 && !f3 && (d2 = e4, u2({ step: `download`, progress: e4 }));
      }, build() {
        f3 || (d2 >= 0 && d2 < 1 && u2({ step: `download`, progress: 1 }), f3 = true, u2({ step: `build` }));
      } }, m3 = () => {
        e3?.removeEventListener(`abort`, l3), this.running === c3 && (this.running = null);
      };
      return r2(p3).then((e4) => {
        m3(), i3(e4);
      }, (e4) => {
        let t4 = this.running === c3;
        m3(), t4 && this.setPoster(), s3(c3.signal.aborted ? c3.signal.reason : e4);
      }), o3;
    }
    setPoster(e3) {
      let t3 = this.canvas.style;
      if (this.posterOver) {
        for (let [e4, n4] of Object.entries(this.posterOver)) t3.setProperty(e4, n4);
        this.posterOver = null;
      }
      if (!e3 || this.info) return;
      let n3 = { "background-image": `url(${JSON.stringify(String(e3))})`, "background-position": `center`, "background-size": `contain`, "background-repeat": `no-repeat` };
      this.posterOver = Object.fromEntries(Object.keys(n3).map((e4) => [e4, t3.getPropertyValue(e4)]));
      for (let [e4, r2] of Object.entries(n3)) t3.setProperty(e4, r2);
    }
    inTurn(e3) {
      let t3 = this.queue.then(e3);
      return this.queue = t3.catch(() => {
      }), t3;
    }
    neutral() {
      this.expr = {}, this.smile = 0;
    }
    setExpression(e3, t3 = 1) {
      if (e3 !== null && !this.expressions.some((t4) => t4.id === e3)) return false;
      let n3 = q(t3, 0, 1);
      return this.smile = e3 === `smile` ? n3 : 0, this.expr = e3 === null || e3 === `smile` ? {} : { [e3]: n3 }, true;
    }
    act(e3) {
      if (e3 === `away`) throw TypeError(`LivLiv: act('away') is setAway(true) now`);
      this.actions.play(e3);
    }
    setAway(e3) {
      this.actions.setAway(e3);
    }
    lookAt(e3, t3 = 0) {
      this.idler.lookAt(this.seen(), e3 === null ? null : q(e3, -1, 1), q(t3, -1, 1), this.canvas.clientWidth, this.canvas.clientHeight);
    }
    blink() {
      this.idler.blink(this.clock);
    }
    use(e3) {
      return this.disposed ? (e3.dispose?.(), () => {
      }) : (this.drivers.push(e3), this.drivers.sort((e4, t3) => (e4.order ?? 0) - (t3.order ?? 0)), () => {
        let t3 = this.drivers.indexOf(e3);
        t3 >= 0 && (this.drivers.splice(t3, 1), e3.dispose?.());
      });
    }
    play() {
      if (this.raf || this.disposed) return;
      this.last = performance.now();
      let e3 = (t3) => {
        this.raf = requestAnimationFrame(e3);
        let n3 = Math.min(0.05, (t3 - this.last) / 1e3);
        this.last = t3, this.visible && this.draw(n3);
      };
      this.raf = requestAnimationFrame(e3);
    }
    pause() {
      cancelAnimationFrame(this.raf), this.raf = 0;
    }
    resize() {
      this.draw(0);
    }
    snapshot() {
      return this.draw(0), this.canvas.toDataURL(`image/png`);
    }
    dispose({ release: e3 = false } = {}) {
      let t3 = this.gl;
      this.stop(), e3 && G(this.canvas, t3);
    }
    stop() {
      if (!this.disposed) {
        this.pause(), this.disposed = true, this.running?.abort(J(`the player was disposed`)), this.setPoster(), removeEventListener(`pointermove`, this.onMove), document.removeEventListener(`pointerleave`, this.onLeave), this.canvas.removeEventListener(`webglcontextlost`, this.onLost), this.io?.disconnect();
        for (let e3 of this.drivers.splice(0)) e3.dispose?.();
        this.free(), this.info = null;
      }
    }
    draw(e3) {
      if (!this.drawable || this.disposed || this.contextLost) return;
      let t3 = this.frame, r2 = t3.params, i3 = this.clock, a3 = this.shownExpr, o3 = this.actions;
      this.idler.shown(r2), Object.assign(r2, this.params), this.idle && this.idler.apply(r2, i3, e3, { busy: o3.busy || this.was.mouth > 0.05, tracked: this.was.tracked, faceFree: !this.smile && !Object.values(a3).some((e4) => e4 > 0.02) }), Object.assign(t3, { dt: e3, time: i3, tracked: false }), Object.assign(t3.move, { x: 0, y: 0, s: 1 });
      for (let e4 of this.drivers) e4.update(t3, this);
      if (this.was = { tracked: t3.tracked, mouth: r2.mouthOpen }, t3.add(o3.update(e3)), this.smile && (r2.smile = Math.max(r2.smile, this.smile)), o3.awayW) for (let [e4, t4] of Object.entries(o3.awayPose(i3))) r2[e4] += (t4 - r2[e4]) * o3.awayW;
      for (let e4 of Q) {
        let t4 = +r2[e4];
        r2[e4] = t4 === t4 ? q(t4, t[e4][0], t[e4][1]) : Z[e4];
      }
      for (let e4 of Object.keys(this.expr)) e4 in a3 || (a3[e4] = 0);
      for (let t4 of Object.keys(a3)) a3[t4] += ((this.expr[t4] ?? 0) * (1 - o3.awayW) - a3[t4]) * Math.min(1, e3 * 8);
      this.show(e3), this.posterOver && this.setPoster();
    }
    onMove = (e3) => {
      if (!this.followPointer) return;
      let t3 = this.canvas.getBoundingClientRect(), n3 = !(e3.clientX < t3.left || e3.clientX > t3.right || e3.clientY < t3.top || e3.clientY > t3.bottom);
      this.idler.pointer(this.seen(), e3.clientX - t3.left, e3.clientY - t3.top, t3.width, t3.height, this.followPointer === `page` || n3);
    };
    onLeave = () => this.idler.leave();
    onLost = () => {
      this.lost = true, this.running?.abort(Y()), this.onContextLost?.();
    };
  };

  // node_modules/@livliv-dev/player/dist/index.js
  var v2 = () => ({ yaw: 0.27, pitch: 0.22, roll: 0.5, bulge: 0.6, hair: { front: [140, 11, 0.022, 70, 7], back: [48, 5.5, 0.06, 24, 3.5] }, hair_limit: 0.25, wind: 1, breath: 1, sway: 1, brow: 0.06, body: { yaw: 0.35, roll: 0.3, breath: 1, bust: 0 } });
  var y2 = () => ({ turn: 1, nod: 1, hair: 1, blink: 1, expr: 1, mouth: 1, breath: 1, gaze: 1 });
  var b2 = `#version 300 es
in vec2 aPos; in vec2 aUv; uniform vec4 uView; out vec2 vUv;
void main(){ vUv=aUv; vec2 p=aPos*uView.xy+uView.zw; gl_Position=vec4(p.x,-p.y,0.,1.); }`;
  var x2 = `#version 300 es
precision mediump float; in vec2 vUv; uniform sampler2D uTex; uniform float uAlpha; uniform float uCut; out vec4 o;
uniform int uMode; uniform sampler2D uMask; uniform highp ivec2 uMaskOff; uniform vec4 uMaskSel; uniform float uSoft;
void main(){ vec4 c=texture(uTex,vUv); if(c.a<uCut) discard;
  if(uMode==1){ o=vec4(c.a); return; }
  if(uMode==2){ highp ivec2 q=ivec2(gl_FragCoord.xy)-uMaskOff, n=textureSize(uMask,0);
    float m=all(greaterThanEqual(q,ivec2(0)))&&all(lessThan(q,n))?dot(texelFetch(uMask,q,0),uMaskSel):0.;
    c*=mix(step(.5,m),m,uSoft); }
  o=c*uAlpha; }`;
  var S2 = [0.12, 0.5];
  var C2 = 0.04;
  var w2 = 0.055;
  var T2 = 0.3;
  var E2 = 0.65;
  var D2 = 0.35;
  var O2 = 0.4;
  var k2 = (e3, t3, n3) => {
    if (n3 <= e3[0]) return t3[0];
    for (let r2 = 1; r2 < e3.length; r2++) if (n3 <= e3[r2]) return t3[r2 - 1] + (t3[r2] - t3[r2 - 1]) * (n3 - e3[r2 - 1]) / (e3[r2] - e3[r2 - 1]);
    return t3[t3.length - 1];
  };
  var A2 = (e3, t3) => 1 - n(0, (e3[2] - e3[0]) * 0.45, Math.max(e3[0] - t3, t3 - e3[2], 0));
  var j2 = (e3) => (e3[3] - e3[1]) * 1.6 + 6;
  function ee(e3, t3, n3, r2) {
    if (r2 < e3[1]) return A2(e3, n3) * (1 - n(0, j2(e3), e3[1] - r2));
    let i3 = k2(t3.x, t3.bottom, n3);
    return r2 <= i3 ? A2(e3, n3) : A2(e3, n3) * (1 - n(i3, k2(t3.x, t3.lid, n3), r2));
  }
  function M2(e3, t3) {
    let n3 = t3, r2 = t3, i3 = false;
    return e3.brows?.forEach((t4, a3) => {
      let o3 = e3.brow_lines?.[a3];
      t4 && o3 && (i3 = true, n3 = Math.min(n3, 0.6 * j2(t4)), o3.x.forEach((e4, n4) => {
        r2 = Math.min(r2, 0.6 * (o3.lid[n4] - o3.bottom[n4]) / Math.max(1e-3, A2(t4, e4)));
      }));
    }), i3 ? [n3, r2] : [0, 0];
  }
  var N2 = () => ({ x: 0, y: 0, vx: 0, vy: 0 });
  var P2 = [0.5, 0.85];
  var te = class {
    gl;
    canvas;
    model;
    layers = [];
    byId = /* @__PURE__ */ new Map();
    params = e();
    prog;
    uView;
    uAlpha;
    uTex;
    uCut;
    uMode;
    uMaskOff;
    uMaskSel;
    uSoft;
    maskFb = null;
    maskTex = null;
    maskSize = [0, 0];
    chains = { front: [N2(), N2()], back: [N2(), N2()], side: [N2(), N2()] };
    lastHead = { x: 0, y: 0, roll: 0 };
    drive = { x: 0, y: 0, vx: 0, vy: 0, ax: 0, ay: 0, started: false };
    body = { yaw: 0, roll: 0 };
    bust = { x: 0, y: 0, vx: 0, vy: 0, px: 0, py: 0 };
    time = 0;
    background = [0, 0, 0, 0];
    zoom = 1;
    panY = 0;
    view = { x: 0, y: 0, s: 1 };
    move = { x: 0, y: 0, s: 1 };
    cutBottom = false;
    maxDpr = 2;
    size = null;
    physicsScale = 1;
    hidden = /* @__PURE__ */ new Set();
    tuning = y2();
    rig = v2();
    expr = {};
    smileShown = 0;
    mouthFrame = 0;
    mouthW = [1, 0, 0];
    mouthHeld = 1;
    mouthAmp = 0;
    mouthShape = ``;
    vis = {};
    frameKind = [`closed`, `half`, `open`];
    frameJaw = [0, 0, 0];
    procJaw = 0.015;
    chinFollow = true;
    chinNeck = 0.08;
    chinNeckX = [0.2, 0.34];
    neckFollow = 0.2;
    neckFollowY = 0.6;
    neckFollowX = [0.6, 1.3];
    talkLeft = 0;
    focusHead = false;
    keys = [];
    kfPair = null;
    kfOff = false;
    keyWeights = null;
    only = null;
    masks = false;
    lidCurve = true;
    irisLid = true;
    irisDrop = 0.3;
    softIris = true;
    irisNasal = true;
    irisNasalNarrow = 0.7;
    nasal = {};
    chainRuns = [];
    get chained() {
      return this.chainRuns.length > 0;
    }
    bodyHidden = false;
    headHidden = false;
    lastView = [1, 1, 0, 0, 1, 1];
    constructor(e3) {
      this.canvas = e3;
      let t3 = e3.getContext(`webgl2`, { premultipliedAlpha: true, alpha: true, antialias: true, preserveDrawingBuffer: true, stencil: true });
      if (!t3) throw Error(`this browser has no WebGL2`);
      this.gl = t3;
      let n3 = (e4, n4) => {
        let r3 = t3.createShader(e4);
        if (t3.shaderSource(r3, n4), t3.compileShader(r3), !t3.getShaderParameter(r3, t3.COMPILE_STATUS)) throw Error(t3.getShaderInfoLog(r3) || `shader`);
        return r3;
      }, r2 = t3.createProgram();
      t3.attachShader(r2, n3(t3.VERTEX_SHADER, b2)), t3.attachShader(r2, n3(t3.FRAGMENT_SHADER, x2)), t3.bindAttribLocation(r2, 0, `aPos`), t3.bindAttribLocation(r2, 1, `aUv`), t3.linkProgram(r2), this.prog = r2, this.uView = t3.getUniformLocation(r2, `uView`), this.uAlpha = t3.getUniformLocation(r2, `uAlpha`), this.uTex = t3.getUniformLocation(r2, `uTex`), this.uCut = t3.getUniformLocation(r2, `uCut`), this.uMode = t3.getUniformLocation(r2, `uMode`), this.uMaskOff = t3.getUniformLocation(r2, `uMaskOff`), this.uMaskSel = t3.getUniformLocation(r2, `uMaskSel`), this.uSoft = t3.getUniformLocation(r2, `uSoft`), t3.useProgram(r2), t3.uniform1i(t3.getUniformLocation(r2, `uMask`), 1);
    }
    async load(e3, { png: t3 = false, pack: n3 = true, signal: r2, onImage: i3 } = {}) {
      let { file: s3, base: c3, query: l3 } = I2(e3), u2 = await fetch(s3 + (l3 ? `?${l3}` : ``), { cache: `no-store`, signal: r2 });
      if (!u2.ok) throw Object.assign(/* @__PURE__ */ Error(u2.status === 404 ? `model not found` : `model.json ${u2.status}`), { status: u2.status });
      let d2 = await u2.text();
      if (d2.length > c.modelJson) throw l(`too-large`, `model.json is larger than ${c.modelJson} bytes`);
      let f3 = g(JSON.parse(d2)), m3 = f3.tex;
      if (!m3) {
        let e4 = JSON.stringify(f3.layers) + (u2.headers.get(`last-modified`) || ``), t4 = 0;
        for (let n4 = 0; n4 < e4.length; n4++) t4 = t4 * 31 + e4.charCodeAt(n4) | 0;
        m3 = (t4 >>> 0).toString(36);
      }
      let h3 = `?v=${m3}${l3 ? `&${l3}` : ``}`, g3 = f3.keyforms ? fetch(c3 + f3.keyforms + h3, { signal: r2 }).then(async (e4) => {
        let t4 = e4.ok ? await e4.text() : ``;
        return t4 && t4.length <= c.keyforms ? JSON.parse(t4) : void 0;
      }).catch(() => void 0) : void 0, _3 = t3 || !n3 ? null : await ie(L2(e3, m3), r2), v4 = (e4) => r2 ? z2(c3 + e4 + h3, r2) : B2(c3 + e4 + h3);
      await this.loadModel(f3, (e4) => {
        let t4 = _3?.get(e4);
        return t4 ? R2(t4) : v4(e4);
      }, { png: t3, keyforms: g3, signal: r2, onImage: i3 });
    }
    async loadModel(e3, t3, { png: n3 = false, keyforms: r2, signal: i3, onImage: s3 } = {}) {
      let c3 = g(e3), l3 = 0, u2 = 0, d2 = (e4) => (s3?.(++u2, l3), e4), [f3, m3] = await Promise.all([Promise.all(c3.layers.map(async (e4) => {
        let r3 = (r4) => (l3++, t3(e4.webp && !n3 ? r4.replace(/\.png$/, `.webp`) : r4).then(d2)), [i4, a3, o3, s4, c4] = await Promise.all([r3(e4.texture), Promise.all((e4.frames || []).map(r3)), e4.mask ? r3(e4.mask) : void 0, e4.talk ? r3(e4.talk) : void 0, e4.brow_tex ? r3(e4.brow_tex) : void 0]);
        return { main: i4, frames: a3, mask: o3, talk: s4, brows: c4 };
      })), r2]);
      if (i3?.aborted) throw i3.reason;
      let h3 = Math.min(c.texture, this.gl?.getParameter(this.gl.MAX_TEXTURE_SIZE) || c.texture), g3 = 0;
      for (let e4 of f3) for (let t4 of [e4.main, ...e4.frames, e4.mask, e4.talk, e4.brows]) {
        if (!t4) continue;
        let e5 = t4.naturalWidth || t4.width, n4 = t4.naturalHeight || t4.height;
        if (e5 > h3 || n4 > h3 || (g3 += e5 * n4) > c.texels) throw l(`too-large`, `this model's images are too large (${e5} x ${n4}: ${h3} px a side and ${c.texels} pixels in all at most)`);
      }
      this.install(c3, f3, m3);
    }
    install(e3, t3, n3) {
      let r2 = this.gl, i3 = { ...this, drive: { ...this.drive }, chains: Object.fromEntries(Object.entries(this.chains).map(([e4, t4]) => [e4, t4.map((e5) => ({ ...e5 }))])) }, a3 = [];
      for (let e4 = 0; e4 < 8 && r2.getError(); e4++) ;
      try {
        this.build(e3, t3, n3, a3);
        for (let e4 = 0, t4; e4 < 8 && (t4 = r2.getError()); e4++) if (t4 === r2.OUT_OF_MEMORY) throw l(`too-large`, `the GPU ran out of memory for this model`);
      } catch (e4) {
        throw this.freeLayers(a3), Object.assign(this, i3), e4;
      }
      this.freeLayers(i3.layers), this.freeMask();
    }
    build(e3, t3, n3, r2) {
      this.model = e3, this.chainRuns = (e3.rig?.chains || []).map(F2);
      let i3 = e3.layers.find((e4) => e4.role === `mouth`);
      this.frameKind = (i3?.frames || [``, ``, ``]).map((e4, t4) => i3?.visemes?.[t4] || [`closed`, `half`, `open`][t4] || ``);
      let a3 = e3.anchors.jaw;
      this.frameJaw = this.frameKind.map((e4) => a3 && e4 !== `closed` && (e4 !== `half` || a3.open > 0) && a3[e4] || 0);
      let o3 = this.procJaw > 0 ? e3.rig?.jaw ?? this.procJaw : 0;
      if (a3 && o3 > 0 && !this.frameJaw.some((e4) => e4 > 0)) {
        let t4 = e3.anchors.face[3] - e3.anchors.face[1], n4 = { half: 0.45, open: 1, round: 0.7, wide: 0.35 };
        this.frameJaw = this.frameKind.map((e4) => o3 * t4 * (n4[e4] ?? 0));
      }
      this.vis = {}, this.frameKind.forEach((e4, t4) => {
        (e4 === `round` || e4 === `wide` || e4 === `shut`) && (this.vis[e4] = t4);
      });
      let s3 = e3.layers.findIndex((e4) => e4.group === `hair_front`), c3 = s3 >= 0 ? { img: t3[s3].main, def: e3.layers[s3] } : void 0;
      e3.layers.forEach((e4, n4) => r2.push(this.buildLayer(e4, t3[n4].main, t3[n4].frames, t3[n4].mask, t3[n4].talk, t3[n4].brows, e4.id === `brows` || e4.role === `expr_brows` || e4.brow_tex ? c3 : void 0))), this.layers = r2, this.byId = new Map(this.layers.map((e4) => [e4.def.id, e4])), this.nasal = {};
      let l3 = e3.anchors.eyes;
      if (l3 && l3.length >= 2) {
        let n4 = l3.reduce((e4, t4) => e4 + (t4[0] + t4[2]) / 2, 0) / l3.length;
        e3.layers.forEach((r3, i4) => {
          let a4 = r3.role?.startsWith(`iris_`) ? r3.role.slice(5) : ``, o4 = r3.clip ? e3.layers.findIndex((e4) => e4.id === r3.clip) : -1, s4 = o4 >= 0 ? t3[o4].mask : void 0;
          if (!a4 || !r3.range || !s4 || this.nasal[a4]) return;
          let c4 = ce(t3[i4].main, r3, s4, e3.layers[o4], n4 > r3.x + r3.w / 2 ? 1 : -1);
          c4 && (this.nasal[a4] = c4);
        });
      }
      if (this.lidCurve && se(e3)) for (let n4 of [`L`, `R`]) {
        let r3 = e3.layers.findIndex((e4) => e4.role === `lid_${n4}`), i4 = r3 >= 0 ? le(t3[r3].main, e3.layers[r3]) : null;
        if (i4) {
          for (let e4 of this.layers) if (e4.def.role === `eye_${n4}` || e4.def.role === `iris_${n4}` || e4.def.role === `shine_${n4}`) {
            e4.pivY = new Float32Array(e4.rest.length / 2);
            for (let t4 = 0; t4 < e4.pivY.length; t4++) e4.pivY[t4] = i4(e4.rest[2 * t4]);
            e4.pivC = i4(e4.def.x + e4.def.w / 2);
          }
        }
      }
      this.tuning = { ...y2(), ...e3.tuning || {} }, this.rig = { ...v2(), ...e3.rig || {}, hair: { ...v2().hair, ...e3.rig?.hair || {} }, body: { ...v2().body, ...e3.rig?.body || {} } }, this.expr = {}, this.resetMouth(), this.talkLeft = 0, this.cutBottom = e3.anchors.bottom_y >= e3.canvas[1] - 4, this.resetPhysics(), this.keys = [], this.kfPair = null, n3 && ne(n3) ? this.prepareKeyforms(n3) : n3 && console.warn(`LivLiv: keyforms.json is not one this player reads; the character plays on the rig alone`);
    }
    prepareKeyforms(e3) {
      let t3 = /* @__PURE__ */ new Map(), n3 = (e4) => {
        let n4 = t3.get(e4);
        if (!n4) {
          let r3 = atob(e4);
          n4 = new Uint8Array(r3.length);
          for (let e5 = 0; e5 < r3.length; e5++) n4[e5] = r3.charCodeAt(e5);
          t3.set(e4, n4);
        }
        return n4;
      }, r2 = { params: this.params, body: { ...this.body }, bust: { ...this.bust }, mouthW: this.mouthW, smile: this.smileShown, chains: Object.values(this.chains).map((e4) => e4.map((e5) => ({ ...e5 }))) }, i3 = this.rig.body, a3 = this.tuning.turn;
      e3.keys.forEach((t4, r3) => {
        let o3 = { ...e(), [t4.param]: t4.value };
        this.params = o3, this.body = { yaw: o3.bodyX + o3.angleX * i3.yaw * a3, roll: o3.bodyZ + o3.angleZ * this.rig.body.roll * a3 };
        for (let e4 of Object.values(this.chains)) for (let t5 of e4) Object.assign(t5, N2());
        Object.assign(this.bust, { x: 0, y: 0, vx: 0, vy: 0 }), this.mouthW = [1, 0, 0], this.smileShown = 0, this.kfOff = true, this.deform(), this.kfOff = false;
        for (let i4 of this.layers) {
          let a4 = Object.hasOwn(t4.fields, i4.def.id) ? i4.def.id : i4.def.group === `head` ? `head` : i4.def.group.startsWith(`hair`) ? `hair` : i4.def.group === `body` && ((e4) => !!t4.fields[e4] || !!t4.same?.includes(e4))(`torso`) ? `torso` : i4.def.id, o4 = t4.fields[a4] ?? (t4.same?.includes(a4) ? t4.fields.head : void 0);
          if (i4.kf ||= [], !o4) {
            i4.kf[r3] = null;
            continue;
          }
          let s4 = n3(o4), c3 = new Int16Array(s4.buffer, s4.byteOffset, s4.byteLength >> 1), l3 = e3.mask?.[a4] ? n3(e3.mask[a4]) : void 0, u2 = new Float32Array(i4.rest.length);
          for (let t5 = 0; t5 < u2.length; t5 += 2) {
            let [n4, r4] = V2(c3, e3, i4.rest[t5], i4.rest[t5 + 1]), a5 = l3 ? ae(l3, e3, i4.rest[t5], i4.rest[t5 + 1]) : 1;
            u2[t5] = (i4.rest[t5] + n4 - i4.out[t5]) * a5, u2[t5 + 1] = (i4.rest[t5 + 1] + r4 - i4.out[t5 + 1]) * a5;
          }
          i4.kf[r3] = u2;
        }
        let s3 = t4.param === `angleY`;
        this.keys.push({ param: t4.param, value: t4.value, scale: a3 * (s3 ? this.tuning.nod : 1) / (e3.turn * (s3 ? e3.nod : 1)) });
      }), this.params = r2.params, this.body = r2.body, Object.assign(this.bust, r2.bust), this.mouthW = r2.mouthW, this.smileShown = r2.smile, Object.values(this.chains).forEach((e4, t4) => e4.forEach((e5, n4) => Object.assign(e5, r2.chains[t4][n4]))), this.kfPair = e3.interp === `hermite` ? this.keys.map((e4) => this.keys.findIndex((t4) => t4.param === e4.param && e4.param !== `diag` && t4.value === -e4.value)) : null;
    }
    dispose() {
      this.freeLayers(this.layers), this.freeMask(), this.layers = [];
    }
    freeLayers(e3) {
      let t3 = this.gl;
      for (let n3 of e3) t3.deleteTexture(n3.tex), n3.frames.forEach((e4) => t3.deleteTexture(e4)), n3.mask && t3.deleteTexture(n3.mask), n3.talk && t3.deleteTexture(n3.talk), n3.browTex && t3.deleteTexture(n3.browTex), t3.deleteVertexArray(n3.vao), t3.deleteBuffer(n3.pos), t3.deleteBuffer(n3.uvs), t3.deleteBuffer(n3.tris);
    }
    freeMask() {
      let e3 = this.gl;
      this.maskFb && (e3.deleteFramebuffer(this.maskFb), e3.deleteTexture(this.maskTex), this.maskFb = this.maskTex = null, this.maskSize = [0, 0]);
    }
    texture(e3) {
      let t3 = this.gl, n3 = t3.createTexture();
      t3.bindTexture(t3.TEXTURE_2D, n3), t3.pixelStorei(t3.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
      try {
        t3.texImage2D(t3.TEXTURE_2D, 0, t3.RGBA, t3.RGBA, t3.UNSIGNED_BYTE, e3);
      } catch (e4) {
        throw t3.deleteTexture(n3), e4;
      }
      return t3.generateMipmap(t3.TEXTURE_2D), t3.texParameteri(t3.TEXTURE_2D, t3.TEXTURE_MIN_FILTER, t3.LINEAR_MIPMAP_LINEAR), t3.texParameteri(t3.TEXTURE_2D, t3.TEXTURE_MAG_FILTER, t3.LINEAR), t3.texParameteri(t3.TEXTURE_2D, t3.TEXTURE_WRAP_S, t3.CLAMP_TO_EDGE), t3.texParameteri(t3.TEXTURE_2D, t3.TEXTURE_WRAP_T, t3.CLAMP_TO_EDGE), n3;
    }
    buildLayer(e3, t3, n3, i3, a3, o3, s3) {
      let c3 = this.gl, l3 = this.model.anchors, u2 = this.model.layers.some((e4) => e4.id === `brows`), [d2, f3] = this.model.canvas, p3 = f(d2, f3), m3 = Math.floor(e3.x / p3), g3 = Math.floor(e3.y / p3), _3 = Math.ceil((e3.x + e3.w) / p3) - m3, v4 = Math.ceil((e3.y + e3.h) / p3) - g3, y4 = ue([t3, ...n3], _3, v4, (e3.x - m3 * p3) / p3, (e3.y - g3 * p3) / p3, e3.w / p3, e3.h / p3), b4 = new Int32Array((_3 + 1) * (v4 + 1)).fill(-1), x4 = [], S4 = [], C4 = [], w4 = (t4, n4) => {
        let r2 = n4 * (_3 + 1) + t4;
        if (b4[r2] < 0) {
          b4[r2] = x4.length / 2;
          let i4 = (m3 + t4) * p3, a4 = (g3 + n4) * p3;
          x4.push(i4, a4), S4.push((i4 - e3.x) / e3.w, (a4 - e3.y) / e3.h);
        }
        return b4[r2];
      };
      for (let e4 = 0; e4 < v4; e4++) for (let t4 = 0; t4 < _3; t4++) {
        if (!y4[e4 * _3 + t4]) continue;
        let n4 = w4(t4, e4), r2 = w4(t4 + 1, e4), i4 = w4(t4, e4 + 1), a4 = w4(t4 + 1, e4 + 1);
        C4.push(n4, r2, i4, r2, a4, i4);
      }
      let E4 = x4.length / 2, D4 = new Float32Array(x4), O4 = new Float32Array(E4), A4 = new Float32Array(E4), j3 = new Float32Array(E4), M4 = new Float32Array(E4), N3 = new Float32Array(E4), P3 = new Int8Array(E4).fill(-1), te2 = new Float32Array(E4), ne2 = new Float32Array(E4).fill(1 / 0), F3 = new Float32Array(E4), re2 = this.neckFollow > 0 && e3.group === `body` ? new Float32Array(E4) : void 0, I3 = this.model.rig?.neck, L3 = I3 && I3.twist > 0 && e3.group === `body` ? new Float32Array(E4) : void 0, ie2 = s3 && (e3.id === `brows` || e3.role === `expr_brows`) ? oe(t3, e3, s3.img, s3.def, D4, p3) : void 0, R3 = s3 && o3 ? oe(o3, e3, s3.img, s3.def, D4, p3) : void 0, z3 = ie2 || R3 ? new Float32Array(5 * E4) : void 0, B3 = l3.face[2] - l3.face[0], V3 = l3.head, ae2 = l3.neck_y - 0.1 * V3.ry, se2 = Math.max(1, l3.bottom_y - ae2);
      for (let t4 = 0; t4 < E4; t4++) {
        let n4 = D4[2 * t4], r2 = D4[2 * t4 + 1], i4 = Math.hypot((n4 - V3.cx) / V3.rx, (r2 - V3.cy) / V3.ry);
        M4[t4] = e3.group === `head` ? e3.depth : e3.group === `hair_front` ? e3.depth * n(e3.fall_end ?? 1, e3.fall ?? 0.55, i4) : e3.depth * n(e3.fall_end ?? 1, e3.fall_end === void 0 ? 0.7 : e3.fall ?? 0.7, i4);
        let a4 = 1 - n(l3.neck_y + 0.05 * V3.ry, l3.neck_y + 1.1 * V3.ry, r2), o4 = Math.min(1, Math.max(0, (r2 - ae2) / se2)), c4 = n(0, 0.55, o4), d3 = n(0.25, 1, o4) ** 1.3, f4 = n(0.95, 0.7, i4) * (1 - n(l3.neck_y - 0.2 * V3.ry, l3.neck_y + 0.3 * V3.ry, r2)), p4 = n(l3.hair_root_y + 0.25 * V3.ry, V3.cy + 0.7 * V3.ry, r2);
        if (e3.group === `head` ? O4[t4] = 1 : e3.group === `body` ? O4[t4] = 0 : (O4[t4] = f4 + (1 - f4) * a4, A4[t4] = f4 * p4 + (1 - f4) * c4, j3[t4] = f4 * p4 * p4 + (1 - f4) * d3, te2[t4] = f4, e3.group === `hair_inner` && (O4[t4] *= 0.5, A4[t4] *= 0.35, j3[t4] *= 0.35)), z3 && s3) {
          let e4 = 5 * t4;
          z3[e4] = s3.def.depth * n(1, s3.def.fall ?? 0.55, i4), z3[e4 + 1] = f4 + (1 - f4) * a4, z3[e4 + 2] = f4 * p4 + (1 - f4) * c4, z3[e4 + 3] = f4 * p4 * p4 + (1 - f4) * d3, z3[e4 + 4] = f4;
        }
        let m4 = e3.group === `hair_side` || e3.group === `hair_front`, g4 = this.chinFollow && e3.role === `mouth`;
        if ((e3.id === `face` || e3.role === `expr` || m4 || g4 || e3.role === `neck_shadow`) && l3.jaw && this.frameJaw.some((e4) => e4 > 0)) {
          let e4 = n(l3.jaw.top - 0.02 * V3.ry, l3.jaw.chin, r2) * (m4 ? 1 - n(l3.jaw.chin, l3.jaw.chin + 0.15 * V3.ry, r2) : 1), i5 = 1 - n(0.22 * B3, 0.5 * B3, Math.abs(n4 - V3.cx));
          F3[t4] = e4 * i5;
        }
        if (e3.role === `neck_shadow` && l3.jaw) {
          let e4 = 1 - n(l3.jaw.chin, l3.jaw.chin + T2 * (l3.face[3] - l3.face[1]), r2);
          O4[t4] = e4, F3[t4] *= e4;
        }
        if (this.chinFollow && e3.group === `body` && l3.jaw) {
          let e4 = l3.face[3] - l3.face[1], i5 = (1 - n(l3.jaw.chin, l3.jaw.chin + this.chinNeck * e4, r2)) * (1 - n(this.chinNeckX[0] * B3, this.chinNeckX[1] * B3, Math.abs(n4 - V3.cx)));
          if (i5 > 0 && (O4[t4] = i5, this.frameJaw.some((e5) => e5 > 0))) {
            let e5 = n(l3.jaw.top - 0.02 * V3.ry, l3.jaw.chin, r2);
            F3[t4] = e5 * (1 - n(0.22 * B3, 0.5 * B3, Math.abs(n4 - V3.cx))) * i5;
          }
        }
        if (re2) {
          let e4 = l3.face[3] - l3.face[1];
          re2[t4] = Math.max(0, this.neckFollow * (1 - n(l3.neck_y, l3.neck_y + this.neckFollowY * e4, r2)) * (1 - n(this.neckFollowX[0] * B3, this.neckFollowX[1] * B3, Math.abs(n4 - V3.cx))) - O4[t4]);
        }
        if (L3 && I3) {
          let e4 = l3.face[3] - l3.face[1], i5 = l3.jaw?.chin ?? l3.neck_y;
          L3[t4] = Math.max(0, I3.twist * (1 - n(i5, i5 + (I3.reach ?? 0.45) * e4, r2)) * (1 - n(this.chinNeckX[0] * B3, this.chinNeckX[1] * B3, Math.abs(n4 - V3.cx))) - O4[t4]);
        }
        !l3.brows || e3.group !== `head` || (e3.role || ``).startsWith(`iris_`) || u2 && e3.id !== `brows` || l3.brows.forEach((e4, i5) => {
          let a5 = l3.brow_lines?.[i5];
          if (!e4 || !a5) return;
          let o5 = ee(e4, a5, n4, r2);
          o5 > N3[t4] && (N3[t4] = o5, P3[t4] = i5, ne2[t4] = a5.cap ? k2(a5.x, a5.cap, n4) : 1 / 0);
        });
      }
      let ce2 = e3.bones?.length ? this.skinOf(e3.bones, D4) : void 0;
      ce2 && !e3.bones.every((e4) => this.chainRuns.find((t4) => t4.def.id === e4)?.def.reach !== void 0) && (A4.fill(0), j3.fill(0)), e3.rigid && (A4.fill(0), j3.fill(0));
      let le2 = z3 && s3?.def.bones?.length ? this.skinOf(s3.def.bones, D4) : void 0;
      if (z3 && le2) for (let e4 = 0; e4 < E4; e4++) z3[5 * e4 + 2] = 0, z3[5 * e4 + 3] = 0;
      let H3 = c3.createVertexArray();
      c3.bindVertexArray(H3);
      let U3 = c3.createBuffer();
      c3.bindBuffer(c3.ARRAY_BUFFER, U3), c3.bufferData(c3.ARRAY_BUFFER, D4, c3.DYNAMIC_DRAW), c3.enableVertexAttribArray(0), c3.vertexAttribPointer(0, 2, c3.FLOAT, false, 0, 0);
      let W3 = c3.createBuffer();
      c3.bindBuffer(c3.ARRAY_BUFFER, W3), c3.bufferData(c3.ARRAY_BUFFER, new Float32Array(S4), c3.STATIC_DRAW), c3.enableVertexAttribArray(1), c3.vertexAttribPointer(1, 2, c3.FLOAT, false, 0, 0);
      let G3 = c3.createBuffer();
      c3.bindBuffer(c3.ELEMENT_ARRAY_BUFFER, G3);
      let K3 = new Uint32Array(C4);
      c3.bufferData(c3.ELEMENT_ARRAY_BUFFER, K3, c3.STATIC_DRAW), c3.bindVertexArray(null);
      let q3 = [], J3 = (e4) => {
        let t4 = this.texture(e4);
        return q3.push(t4), t4;
      }, Y3, X3, de2, fe2, pe2;
      try {
        Y3 = J3(t3), X3 = n3.map(J3), de2 = i3 && J3(i3), fe2 = a3 && J3(a3), pe2 = o3 && J3(o3);
      } catch (e4) {
        throw q3.forEach((e5) => c3.deleteTexture(e5)), c3.deleteVertexArray(H3), c3.deleteBuffer(U3), c3.deleteBuffer(W3), c3.deleteBuffer(G3), e4;
      }
      return { def: e3, tex: Y3, frames: X3, mask: de2, talk: fe2, browTex: pe2, vao: H3, pos: U3, uvs: W3, tris: G3, count: C4.length, rest: D4, out: new Float32Array(D4.length), tri: K3, tw: t3.naturalWidth || t3.width, th: t3.naturalHeight || t3.height, wHead: O4, wPhys1: A4, wPhys2: j3, dep: M4, wBrow: N3, browSide: P3, browCap: ne2, wFront: te2, wJaw: F3, wNeck: re2, wTwist: L3, fol: ie2, folB: R3, alt: z3, outB: R3 ? new Float32Array(D4.length) : void 0, stencilRef: 0, soft: 0, maskCh: -1, skin: ce2, altSkin: le2 };
    }
    skinOf(e3, t3) {
      let n3 = e3.map((e4) => this.chainRuns.findIndex((t4) => t4.def.id === e4)).filter((e4) => e4 >= 0);
      if (!n3.length) return;
      let r2 = t3.length / 2, i3 = n3.length, a3 = { B: i3, c: new Int16Array(r2 * i3), seg: new Int16Array(r2 * i3), t: new Float32Array(r2 * i3), ux: new Float32Array(r2 * i3), uy: new Float32Array(r2 * i3), w: new Float32Array(r2 * i3), sum: new Float32Array(r2) };
      for (let e4 = 0; e4 < r2; e4++) {
        let r3 = t3[2 * e4], o3 = t3[2 * e4 + 1], s3 = 0;
        n3.forEach((t4, n4) => {
          let c4 = this.chainRuns[t4], l4 = c4.R, u2 = l4.length / 2, d2 = 1 / 0, f3 = 0, p3 = 0;
          for (let e5 = 0; e5 < u2 - 1; e5++) {
            let t5 = l4[2 * e5], n5 = l4[2 * e5 + 1], i4 = l4[2 * e5 + 2] - t5, a4 = l4[2 * e5 + 3] - n5, s4 = i4 * i4 + a4 * a4 || 1, c5 = ((r3 - t5) * i4 + (o3 - n5) * a4) / s4;
            e5 > 0 && (c5 = Math.max(0, c5)), e5 < u2 - 2 && (c5 = Math.min(1, c5));
            let m4 = t5 + i4 * c5, h4 = n5 + a4 * c5, g4 = Math.hypot(r3 - m4, o3 - h4);
            g4 < d2 && (d2 = g4, f3 = e5, p3 = c5);
          }
          let m3 = e4 * i3 + n4, h3 = f3, g3 = Math.min(1, p3), _3 = l4[2 * h3] + (l4[2 * h3 + 2] - l4[2 * h3]) * g3, v4 = l4[2 * h3 + 1] + (l4[2 * h3 + 3] - l4[2 * h3 + 1]) * g3, y4 = c4.def.sigma ?? 40;
          a3.c[m3] = t4, a3.seg[m3] = h3, a3.t[m3] = p3, a3.ux[m3] = r3 - _3, a3.uy[m3] = o3 - v4, a3.w[m3] = Math.exp(-((d2 / y4) ** 2)) + 1e-6, s3 += a3.w[m3];
        });
        let c3 = 1 / 0, l3 = 1 / 0;
        for (let t4 = 0; t4 < i3; t4++) {
          let n4 = this.chainRuns[a3.c[e4 * i3 + t4]];
          a3.w[e4 * i3 + t4] /= s3, n4.def.reach !== void 0 && (l3 = Math.min(l3, n4.def.reach)), c3 = Math.min(c3, Math.hypot(a3.ux[e4 * i3 + t4], a3.uy[e4 * i3 + t4]));
        }
        if (l3 < 1 / 0) {
          let t4 = 1 - n(l3, 1.6 * l3, c3);
          for (let n4 = 0; n4 < i3; n4++) a3.w[e4 * i3 + n4] *= t4;
        }
        for (let t4 = 0; t4 < i3; t4++) a3.sum[e4] += a3.w[e4 * i3 + t4];
      }
      return a3;
    }
    skinOffset(e3, t3, n3) {
      let r2 = 0, i3 = 0;
      if (e3.sum[t3] < 1e-4) n3[0] = 0, n3[1] = 0;
      else {
        for (let n4 = 0; n4 < e3.B; n4++) {
          let a3 = t3 * e3.B + n4, o3 = this.chainRuns[e3.c[a3]], s3 = e3.seg[a3];
          if (!o3.moving) continue;
          let c3 = Math.min(1, Math.max(0, e3.t[a3])), l3 = e3.t[a3] < 0 ? 0 : 1, u2 = (o3.disp[2 * s3] + (o3.disp[2 * s3 + 2] - o3.disp[2 * s3]) * c3) * l3, d2 = (o3.disp[2 * s3 + 1] + (o3.disp[2 * s3 + 3] - o3.disp[2 * s3 + 1]) * c3) * l3, f3 = (o3.beta[s3] + (o3.beta[s3 + 1] - o3.beta[s3]) * c3) * l3, p3 = Math.cos(f3), m3 = Math.sin(f3), h3 = e3.ux[a3], g3 = e3.uy[a3], _3 = u2 + h3 * p3 - g3 * m3 - h3, v4 = d2 + h3 * m3 + g3 * p3 - g3, y4 = Math.cos(o3.rho), b4 = Math.sin(o3.rho);
          r2 += e3.w[a3] * (_3 * y4 - v4 * b4), i3 += e3.w[a3] * (_3 * b4 + v4 * y4);
        }
        n3[0] = r2, n3[1] = i3;
      }
    }
    chainRoot(e3, t3, n3, r2) {
      let [i3, a3] = e3.points[0], o3 = this.model.anchors;
      if (e3.attach === `body`) {
        let e4 = [0, 0];
        this.bodyOffset(i3, a3, t3, e4), r2[0] = i3 + e4[0], r2[1] = a3 + e4[1], r2[2] = this.body.roll * Math.PI / 180 * n(o3.bottom_y, o3.neck_y, a3);
      } else {
        let o4 = [0, 0];
        this.headXform(i3, a3, e3.depth ?? 0, t3, o4), r2[0] = o4[0] + n3[0], r2[1] = o4[1] + n3[1], r2[2] = t3.angleZ * Math.PI / 180 * this.rig.roll * this.tuning.turn;
      }
    }
    exprAlpha(e3) {
      return n(0.3, 0.7, e3.param === `smile` || !e3.param ? this.smileShown : this.expr[e3.param] ?? 0);
    }
    moodAlpha(e3) {
      let t3 = (e4) => {
        let t4 = 0;
        for (let [n3, r2] of Object.entries(e4 || {})) t4 += r2 * this.exprValue(n3);
        return Math.min(1, t4);
      };
      return (e3.show ? t3(e3.show) : 1) * (e3.hide ? 1 - t3(e3.hide) : 1);
    }
    shown(e3) {
      let t3 = e3.def, n3 = t3.role || ``;
      if (this.hidden.has(t3.id) || (t3.group === `body` ? this.bodyHidden : this.headHidden) || (t3.show || t3.hide) && this.moodAlpha(t3) <= 0.01) return false;
      if (n3 === `expr` || n3 === `expr_brows`) return this.exprAlpha(t3) > 0.01;
      if (n3.startsWith(`lid_`)) return 1 - n(0.05, 0.35, n3 === `lid_L` ? this.params.eyeLOpen : this.params.eyeROpen) > 0.01;
      if (n3 === `blush`) {
        let e4 = 0;
        for (let [n4, r2] of Object.entries(t3.blush || {})) e4 += r2 * this.exprValue(n4);
        return e4 > 0.01;
      }
      return true;
    }
    exprValue(e3) {
      return e3 === `smile` ? this.smileShown : this.expr[e3] ?? 0;
    }
    stepChains(e3) {
      if (!this.chainRuns.length || e3 <= 0) return;
      let t3 = this.params, n3 = this.model.anchors, r2 = [0, 0];
      this.bodyOffset(n3.head.cx, n3.neck_y, t3, r2);
      let i3 = this.physicsScale * (this.tuning.hairBack ?? this.tuning.hair), a3 = [0, 0, 0];
      for (let n4 of this.chainRuns) {
        let o3 = n4.def, s3 = n4.R, c3 = n4.p, l3 = n4.q, u2 = s3.length / 2;
        this.chainRoot(o3, t3, r2, a3), n4.started ||= (n4.W = [a3[0], a3[1]], n4.V = [0, 0], n4.acc = [0, 0], true);
        let d2 = (a3[0] - n4.W[0]) / e3, f3 = (a3[1] - n4.W[1]) / e3, p3 = (d2 - n4.V[0]) / e3, m3 = (f3 - n4.V[1]) / e3;
        n4.W = [a3[0], a3[1]], n4.V = [d2, f3], n4.rho = a3[2];
        let h3 = Math.min(1, e3 * 30);
        n4.acc[0] += (p3 - n4.acc[0]) * h3, n4.acc[1] += (m3 - n4.acc[1]) * h3;
        let g3 = Math.cos(-n4.rho), _3 = Math.sin(-n4.rho), v4 = n4.acc[0] * g3 - n4.acc[1] * _3, y4 = n4.acc[0] * _3 + n4.acc[1] * g3, b4 = 0;
        for (let [e4, t4] of Object.entries(o3.bias || {})) b4 += t4 * this.exprValue(e4);
        let x4 = -n4.rho * o3.hang + b4 * Math.PI / 180, S4 = Math.cos(x4), C4 = Math.sin(x4), w4 = o3.freq ?? 0.5, T4 = 2 * Math.PI * w4 * this.time + n4.phase, E4 = o3.wind * i3 * this.rig.wind * (Math.sin(T4) + 0.4 * Math.sin(1.7 * T4 + 2 * n4.phase)), D4 = Math.max(0, 1 - o3.damp * e3);
        for (let t4 = 1; t4 < u2; t4++) {
          let r3 = n4.s[t4], a4 = o3.k[0] + (o3.k[1] - o3.k[0]) * r3, u3 = s3[2 * t4] - s3[0], d3 = s3[2 * t4 + 1] - s3[1], f4 = s3[0] + u3 * S4 - d3 * C4 + E4 * r3, p4 = s3[1] + u3 * C4 + d3 * S4, m4 = a4 * (f4 - c3[2 * t4]) - o3.drive * i3 * v4, h4 = a4 * (p4 - c3[2 * t4 + 1]) - o3.drive * i3 * y4, g4 = c3[2 * t4] + (c3[2 * t4] - l3[2 * t4]) * D4 + m4 * e3 * e3, _4 = c3[2 * t4 + 1] + (c3[2 * t4 + 1] - l3[2 * t4 + 1]) * D4 + h4 * e3 * e3;
          l3[2 * t4] = c3[2 * t4], l3[2 * t4 + 1] = c3[2 * t4 + 1], c3[2 * t4] = g4, c3[2 * t4 + 1] = _4;
        }
        let O4 = o3.limit ?? 1 / 0;
        for (let e4 = 1; e4 < u2; e4++) {
          let t4 = c3[2 * e4] - c3[2 * e4 - 2], r3 = c3[2 * e4 + 1] - c3[2 * e4 - 1], i4 = Math.hypot(t4, r3) || 1;
          c3[2 * e4] = c3[2 * e4 - 2] + t4 / i4 * n4.len[e4], c3[2 * e4 + 1] = c3[2 * e4 - 1] + r3 / i4 * n4.len[e4];
          let a4 = c3[2 * e4] - s3[2 * e4], o4 = c3[2 * e4 + 1] - s3[2 * e4 + 1], l4 = Math.hypot(a4, o4);
          l4 > O4 && (c3[2 * e4] = s3[2 * e4] + a4 * O4 / l4, c3[2 * e4 + 1] = s3[2 * e4 + 1] + o4 * O4 / l4);
        }
        let k4 = 0;
        for (let e4 = 0; e4 < u2; e4++) n4.disp[2 * e4] = c3[2 * e4] - s3[2 * e4], n4.disp[2 * e4 + 1] = c3[2 * e4 + 1] - s3[2 * e4 + 1], k4 = Math.max(k4, Math.abs(n4.disp[2 * e4]), Math.abs(n4.disp[2 * e4 + 1]));
        n4.moving = k4 > 1e-3;
        let A4 = [];
        for (let e4 = 0; e4 < u2 - 1; e4++) {
          let t4 = s3[2 * e4 + 2] - s3[2 * e4], n5 = s3[2 * e4 + 3] - s3[2 * e4 + 1], r3 = c3[2 * e4 + 2] - c3[2 * e4], i4 = c3[2 * e4 + 3] - c3[2 * e4 + 1];
          A4.push(Math.atan2(t4 * i4 - n5 * r3, t4 * r3 + n5 * i4));
        }
        n4.beta[0] = 0;
        for (let e4 = 1; e4 < u2 - 1; e4++) n4.beta[e4] = 0.5 * (A4[e4 - 1] + A4[e4]);
        n4.beta[u2 - 1] = A4[u2 - 2];
      }
    }
    hxC = { ax: NaN, ay: NaN, az: NaN, t: NaN, n: NaN, ry: NaN, rp: NaN, rr: NaN, pe: NaN, cy: 1, sy: 0, cp: 1, sp: 0, cr: 1, sr: 0 };
    headTrig(e3) {
      let t3 = this.hxC, n3 = this.rig, r2 = this.tuning.turn, i3 = this.tuning.nod ?? 1, a3 = n3.pitch_ease ?? 0.25;
      if (t3.ax !== e3.angleX || t3.ay !== e3.angleY || t3.az !== e3.angleZ || t3.t !== r2 || t3.n !== i3 || t3.ry !== n3.yaw || t3.rp !== n3.pitch || t3.rr !== n3.roll || t3.pe !== a3) {
        let o3 = e3.angleY / 30, s3 = e3.angleX / 30 * n3.yaw * r2, c3 = o3 * (1 - a3 * o3 * o3) * n3.pitch * r2 * i3, l3 = e3.angleZ * Math.PI / 180 * n3.roll * r2;
        Object.assign(t3, { ax: e3.angleX, ay: e3.angleY, az: e3.angleZ, t: r2, n: i3, ry: n3.yaw, rp: n3.pitch, rr: n3.roll, pe: a3, cy: Math.cos(s3), sy: Math.sin(s3), cp: Math.cos(c3), sp: Math.sin(c3), cr: Math.cos(l3), sr: Math.sin(l3) });
      }
      return t3;
    }
    headXform(e3, t3, n3, r2, i3) {
      let a3 = this.model.anchors.head, o3 = (e3 - a3.cx) / a3.rx, s3 = (t3 - a3.cy) / a3.ry, c3 = this.rig, l3 = c3.bulge_shape ?? 1, u2 = c3.bulge_extent, d2 = u2 ? u2[0] : 1;
      if (u2 && u2.length > 3 && s3 > 0) {
        let e4 = Math.min(1, s3 / (u2[2] * (u2[4] ?? 1)));
        d2 += (u2[3] - u2[0]) * e4 * e4 * (3 - 2 * e4);
      }
      let f3 = u2 ? o3 / d2 : o3, p3 = u2 ? s3 / (s3 < 0 ? u2[1] : u2[2]) : s3, m3 = c3.bulge * Math.max(0, l3 === 1 ? 1 - f3 * f3 - p3 * p3 : 1 - (f3 * f3 + p3 * p3) ** +l3) + n3, { cy: h3, sy: g3, cp: _3, sp: v4, cr: y4, sr: b4 } = this.headTrig(r2), x4 = o3 * h3 + m3 * g3, S4 = -o3 * g3 + m3 * h3, C4 = s3 * _3 - S4 * v4, w4 = c3.drift;
      x4 += (w4 ? w4[0] : 0.12) * g3, C4 -= (w4 ? w4[1] : 0.08) * v4;
      let T4 = a3.cx + x4 * a3.rx, E4 = a3.cy + C4 * a3.ry, D4 = a3.cx, O4 = this.model.anchors.neck_y, k4 = T4 - D4, A4 = E4 - O4;
      T4 = D4 + k4 * y4 - A4 * b4, E4 = O4 + k4 * b4 + A4 * y4, i3[0] = T4, i3[1] = E4;
    }
    bodyOffset(e3, t3, n3, r2, i3 = true) {
      let a3 = this.model.anchors, o3 = a3.head, s3 = this.rig.body, c3 = n(a3.bottom_y, a3.neck_y, t3), l3 = a3.face[2] - a3.face[0], u2 = n3.breath * this.tuning.breath * this.rig.breath * s3.breath, d2 = (e3 - o3.cx) * 0.01 * u2 * c3, f3 = -u2 * 0.024 * o3.ry * c3 ** 1.3, p3 = this.body.yaw / 30, m3 = 1.4 * l3, g3 = Math.max(-1.6, Math.min(1.6, (e3 - o3.cx) / m3));
      d2 += p3 * m3 * 0.16 * c3 ** 1.2 * (1 - 0.18 * g3 * g3) + p3 * (e3 - o3.cx) * -0.04 * Math.sign(g3) * c3;
      let _3 = this.body.roll * Math.PI / 180 * c3;
      if (_3 !== 0) {
        let n4 = o3.cx, r3 = a3.bottom_y + 0.4 * (a3.bottom_y - a3.neck_y), i4 = e3 - n4, s4 = t3 - r3, c4 = Math.cos(_3), l4 = Math.sin(_3);
        d2 += i4 * (c4 - 1) - s4 * l4, f3 += i4 * l4 + s4 * (c4 - 1);
      }
      let v4 = a3.chest;
      if (v4 && i3) {
        let n4 = (e3 - v4.cx) / v4.rx, r3 = (t3 - v4.cy) / v4.ry, i4 = Math.sqrt(n4 * n4 + r3 * r3), a4 = 1 - n(0.2, 1.15, i4);
        a4 > 0 && (f3 -= u2 * 0.012 * o3.ry * a4 * (0.4 + s3.bust), d2 += this.bust.x * a4, f3 += this.bust.y * a4);
      }
      r2[0] = d2, r2[1] = f3;
    }
    stepBody(e3) {
      let t3 = this.params, n3 = this.rig.body, r2 = this.tuning.turn, i3 = t3.bodyX + t3.angleX * n3.yaw * r2, a3 = t3.bodyZ + t3.angleZ * n3.roll * r2, o3 = Math.min(1, e3 * 5);
      this.body.yaw += (i3 - this.body.yaw) * o3, this.body.roll += (a3 - this.body.roll) * o3;
      let s3 = this.model.anchors.chest;
      if (!s3 || n3.bust <= 0) {
        this.bust.x = this.bust.y = 0;
        return;
      }
      let c3 = [0, 0];
      this.bodyOffset(s3.cx, s3.cy, t3, c3, false);
      let l3 = 1 / Math.max(e3, 1e-4), u2 = (c3[0] - this.bust.px) * l3, d2 = (c3[1] - this.bust.py) * l3;
      this.bust.px = c3[0], this.bust.py = c3[1];
      let f3 = n3.bust * this.physicsScale;
      this.bust.vx += (-70 * this.bust.x - 7 * this.bust.vx - u2 * 3.2 * f3) * e3, this.bust.vy += (-70 * this.bust.y - 7 * this.bust.vy - d2 * 4.2 * f3) * e3, this.bust.x += this.bust.vx * e3, this.bust.y += this.bust.vy * e3;
      let p3 = 0.035 * this.model.anchors.head.ry * (0.5 + f3);
      this.bust.x = Math.max(-p3, Math.min(p3, this.bust.x)), this.bust.y = Math.max(-p3, Math.min(p3, this.bust.y));
    }
    resetMouth() {
      this.mouthFrame = 0, this.mouthAmp = 0, this.mouthShape = ``, this.mouthHeld = 1, this.mouthW = this.frameKind.map((e3, t3) => +(t3 === 0));
    }
    stepMouth(e3) {
      let t3 = Math.min(1, Math.max(0, this.params.mouthOpen)), n3 = Math.min(1, Math.max(-1, this.params.vowel || 0)), [r2, i3] = S2, a3 = C2;
      this.mouthHeld += e3;
      let o3 = this.mouthAmp;
      o3 === 0 && t3 > r2 + a3 ? o3 = t3 > i3 + a3 ? 2 : 1 : o3 === 1 && (t3 < r2 - a3 || t3 > i3 + a3) ? o3 = t3 < r2 - a3 ? 0 : 2 : o3 === 2 && t3 < i3 - a3 && (o3 = t3 < r2 - a3 ? 0 : 1);
      let s3 = this.mouthShape;
      (!s3 || (s3 === `round` ? n3 > -0.35 : n3 < D2)) && (s3 = n3 < -0.65 ? `round` : n3 > E2 ? `wide` : ``);
      let c3 = o3 > 0 && s3 && this.vis[s3] !== void 0 ? this.vis[s3] : o3;
      c3 === 0 && this.talkLeft > 0 && this.vis.shut !== void 0 && (c3 = this.vis.shut), c3 === this.mouthFrame ? (this.mouthAmp = o3, this.mouthShape = s3) : this.mouthHeld >= w2 && (this.mouthFrame = c3, this.mouthAmp = o3, this.mouthShape = s3, this.mouthHeld = 0);
      let l3 = this.mouthFrame;
      this.talkLeft = l3 > 0 && l3 !== this.vis.shut ? O2 : Math.max(0, this.talkLeft - e3);
      let u2 = Math.min(1, e3 * 28);
      for (let e4 = 0; e4 < this.mouthW.length; e4++) this.mouthW[e4] += (+(e4 === l3) - this.mouthW[e4]) * u2;
    }
    frameEase(e3, t3) {
      let [n3, r2] = S2, i3 = this.frameKind[e3];
      return i3 === `half` ? n(n3, r2, t3) : n(i3 === `open` ? r2 : n3, 1, t3);
    }
    stepPhysics(e3) {
      let t3 = this.params, n3 = this.model.anchors, r2 = [0, 0];
      this.headXform(n3.head.cx, n3.hair_root_y, 0, t3, r2);
      let i3 = 1 / Math.max(e3, 1e-4), a3 = (r2[0] - this.lastHead.x) * i3, o3 = (r2[1] - this.lastHead.y) * i3;
      this.lastHead = { x: r2[0], y: r2[1], roll: t3.angleZ };
      let s3 = this.rig.hair_drive, c3 = this.drive;
      if (s3) {
        let r3 = [0, 0];
        this.headXform(n3.head.cx, n3.head.cy, 0, t3, r3), c3.started || Object.assign(c3, { x: r3[0], y: r3[1], vx: 0, vy: 0, ax: 0, ay: 0, started: true });
        let a4 = Math.min(1, e3 * 25), o4 = c3.vx + ((r3[0] - c3.x) * i3 - c3.vx) * a4, s4 = c3.vy + ((r3[1] - c3.y) * i3 - c3.vy) * a4;
        c3.ax += ((o4 - c3.vx) * i3 - c3.ax) * a4, c3.ay += ((s4 - c3.vy) * i3 - c3.ay) * a4, Object.assign(c3, { x: r3[0], y: r3[1], vx: o4, vy: s4 });
      }
      let l3 = this.rig, u2 = { front: l3.hair.front, back: l3.hair.back, side: l3.hair.side }, d2 = n3.head.ry * l3.hair_limit;
      for (let n4 of l3.hair.side ? [`front`, `back`, `side`] : [`front`, `back`]) {
        let [r3, i4, f3, p3, m3] = u2[n4], [h3, g3] = this.chains[n4], _3 = this.physicsScale * ((n4 === `back` ? this.tuning.hairBack : this.tuning.hairFront) ?? this.tuning.hair), v4 = n4 === `side` ? Math.sin(this.time * 1.5 + 0.7) * 1.2 * _3 * l3.wind : Math.sin(this.time * (n4 === `front` ? 1.9 : 1.15)) * (n4 === `front` ? 0.6 : 1.8) * _3 * l3.wind, y4 = -t3.angleZ * 0.2 * _3, b4 = -r3 * (h3.x - v4 - y4) - i4 * h3.vx - a3 * f3 * r3 * 0.06 * _3, x4 = -r3 * h3.y - i4 * h3.vy - o3 * f3 * r3 * 0.04 * _3;
        if (s3) {
          let e4 = (n4 === `front` ? s3[0] : n4 === `back` ? s3[1] : s3[2] ?? s3[0]) * _3;
          b4 -= c3.ax * e4, x4 -= c3.ay * e4;
        }
        h3.vx += b4 * e3, h3.vy += x4 * e3, h3.x += h3.vx * e3, h3.y += h3.vy * e3;
        let S4 = -p3 * (g3.x - h3.x * 1.6) - m3 * g3.vx, C4 = -p3 * (g3.y - h3.y * 1.4) - m3 * g3.vy;
        g3.vx += S4 * e3, g3.vy += C4 * e3, g3.x += g3.vx * e3, g3.y += g3.vy * e3;
        for (let e4 of [h3, g3]) e4.x = Math.max(-d2, Math.min(d2, e4.x)), e4.y = Math.max(-d2 * 0.6, Math.min(d2 * 0.6, e4.y));
      }
    }
    update(e3, t3 = true) {
      if (!this.model) return;
      this.time += e3;
      let n3 = this.params;
      this.smileShown += (n3.smile - this.smileShown) * Math.min(1, e3 * 7), this.stepMouth(e3);
      for (let e4 of [`angleX`, `angleY`, `angleZ`]) n3[e4] = Math.max(t[e4][0], Math.min(t[e4][1], n3[e4]));
      let r2 = Math.max(1, Math.ceil(e3 / (1 / 120)));
      for (let t4 = 0; t4 < r2; t4++) this.stepBody(e3 / r2), this.stepPhysics(e3 / r2), this.stepChains(e3 / r2);
      t3 && this.deform();
    }
    deform() {
      let e3 = this.params, t3 = this.model.anchors, n3 = [0, 0];
      this.bodyOffset(t3.head.cx, t3.neck_y, e3, n3);
      let r2 = [0, 0], i3 = [0, 0], [a3, o3] = M2(t3, t3.head.ry * this.rig.brow), s3 = (e4) => e4 > 0 ? Math.min(1, e4) * a3 : Math.max(-1, e4) * o3, c3 = [s3(e3.browLY), s3(e3.browRY)], l3 = Math.min(1, Math.max(0, e3.mouthOpen)), u2 = 0;
      this.mouthW.forEach((e4, t4) => {
        e4 > 0 && this.frameJaw[t4] > 0 && (u2 += e4 * this.frameJaw[t4] * (this.frameKind[t4] === `half` ? 0.6 + 0.4 * this.frameEase(t4, l3) : 0.75 + 0.25 * this.frameEase(t4, l3)));
      });
      let d2 = [0, 0], f3 = !!this.rig.hair.side, p3 = (a4, o4, s4, c4, l4, u3, p4) => {
        s4 < 1 ? this.bodyOffset(a4, o4, e3, i3) : (i3[0] = 0, i3[1] = 0);
        let m4 = a4 + i3[0], g4 = o4 + i3[1];
        if (s4 > 0 && (this.headXform(a4, o4, c4, e3, r2), m4 = m4 * (1 - s4) + (r2[0] + n3[0]) * s4, g4 = g4 * (1 - s4) + (r2[1] + n3[1]) * s4), (l4 > 0 || u3 > 0) && f3) {
          let e4 = this.chains.back, n4 = this.chains.front, r3 = this.chains.side, i4 = n(P2[0], P2[1], Math.abs(a4 - t3.head.cx) / t3.head.rx), o5 = p4 * (1 - i4), s5 = p4 * i4, c5 = n4[0].x * o5 + r3[0].x * s5 + e4[0].x * (1 - p4), d3 = n4[0].y * o5 + r3[0].y * s5 + e4[0].y * (1 - p4), f4 = n4[1].x * o5 + r3[1].x * s5 + e4[1].x * (1 - p4), _4 = n4[1].y * o5 + r3[1].y * s5 + e4[1].y * (1 - p4);
          m4 += c5 * l4 + f4 * u3, g4 += d3 * l4 + _4 * u3;
        } else if (l4 > 0 || u3 > 0) {
          let e4 = this.chains.back, t4 = this.chains.front, n4 = t4[0].x * p4 + e4[0].x * (1 - p4), r3 = t4[0].y * p4 + e4[0].y * (1 - p4), i4 = t4[1].x * p4 + e4[1].x * (1 - p4), a5 = t4[1].y * p4 + e4[1].y * (1 - p4);
          m4 += n4 * l4 + i4 * u3, g4 += r3 * l4 + a5 * u3;
        }
        d2[0] = m4, d2[1] = g4;
      }, m3 = [0, 0], g3 = this.kfOff ? [] : this.keyWeights ?? this.keys.map((t4) => t4.param === `diag` ? 0 : Math.min(2, Math.max(0, e3[t4.param] * t4.scale / t4.value)));
      if (this.kfPair && !this.kfOff && !this.keyWeights) {
        let e4 = g3.slice();
        for (let t4 = 0; t4 < e4.length; t4++) {
          let n4 = this.kfPair[t4];
          if (n4 < 0 || e4[t4] <= 0 || e4[t4] >= 1) continue;
          let r3 = e4[t4], i4 = r3 * r3 * r3 - 2 * r3 * r3 + r3;
          g3[t4] = 3 * r3 * r3 - 2 * r3 * r3 * r3 + 0.5 * i4 + r3 * r3 * r3 - r3 * r3, g3[n4] -= 0.5 * i4;
        }
      }
      let _3 = e3.angleZ * Math.PI / 180 * this.rig.roll * this.tuning.turn, v4 = this.tuning.gaze, y4 = typeof v4 == `number` && v4 >= 0 && v4 < 1 ? v4 : 1, b4 = 0;
      if (this.rig.neck) {
        let a4 = t3.jaw?.chin ?? t3.neck_y;
        this.headXform(t3.head.cx, a4, 0, e3, r2), this.bodyOffset(t3.head.cx, a4, e3, i3), b4 = r2[0] + n3[0] - (t3.head.cx + i3[0]);
      }
      for (let i4 of this.layers) {
        if (!this.kfOff && !this.shown(i4)) continue;
        let a4 = i4.def, o4 = i4.rest, s4 = i4.out;
        i4.uploaded = false;
        let l4 = o4.length / 2, f4 = a4.role || ``, h3 = f4.endsWith(`_L`) ? `L` : f4.endsWith(`_R`) ? `R` : ``, v5 = f4.startsWith(`eye_`) || f4.startsWith(`iris_`) || f4.startsWith(`shine_`), x4 = 0.12 + 0.88 * (h3 === `L` ? e3.eyeLOpen : h3 === `R` ? e3.eyeROpen : 1), S4 = f4.startsWith(`iris_`), C4 = 0, w4 = 0;
        S4 && a4.range && (C4 = e3.eyeBallX * a4.range[0] * y4, w4 = -e3.eyeBallY * a4.range[1] * y4), this.chained && f4.startsWith(`shine_`) && a4.range && (C4 = e3.eyeBallX * a4.range[0] * y4, w4 = -e3.eyeBallY * a4.range[1] * y4);
        let T4 = C4, E4 = 0, D4 = this.irisNasal && C4 !== 0 ? this.nasal[h3] : void 0;
        D4 && C4 * D4.sign > D4.room && (E4 = -(Math.min(C4 * D4.sign, D4.room + (1 - this.irisNasalNarrow) * D4.w) - D4.room) / D4.w, T4 = D4.sign * D4.room - E4 * D4.inner);
        let O4 = S4 && this.irisLid && !!a4.pivot && !!a4.range && (a4.range[0] > 0 || a4.range[1] > 0);
        O4 && (w4 += this.irisDrop * (1 - x4) * ((i4.pivC ?? a4.pivot[1]) - (a4.y + a4.h / 2))), S4 && (i4.soft = Math.min(1, Math.hypot(C4, w4) + (O4 ? (1 - x4) * a4.h / 2 : 0)));
        let k4 = this.chained && f4.startsWith(`shine_`) ? re(this.time + (h3 === `R` ? 1.3 : 0)) : 1, A4 = a4.x + a4.w / 2, j3 = a4.y + a4.h / 2, ee2 = 0, M4 = 0;
        a4.rigid && (this.headXform(a4.rigid[0], a4.rigid[1], a4.depth, e3, r2), ee2 = r2[0] + n3[0], M4 = r2[1] + n3[1]);
        let N3 = Math.cos(_3), P3 = Math.sin(_3);
        for (let e4 = 0; e4 < l4; e4++) {
          let r3 = o4[2 * e4], l5 = o4[2 * e4 + 1];
          if (k4 !== 1 && (r3 = A4 + (r3 - A4) * k4, l5 = j3 + (l5 - j3) * k4), v5 && a4.pivot) {
            let t4 = i4.pivY ? i4.pivY[e4] : a4.pivot[1];
            r3 += T4 + E4 * o4[2 * e4], l5 += w4, (!O4 || l5 > t4) && (l5 = t4 + (l5 - t4) * x4);
          }
          if (i4.browSide[e4] >= 0) {
            let t4 = c3[i4.browSide[e4]];
            l5 -= Math.sign(t4) * Math.min(Math.abs(t4), i4.browCap[e4]) * i4.wBrow[e4];
          }
          if (u2 > 0 && i4.wJaw[e4] > 0 && (l5 += u2 * i4.wJaw[e4]), a4.rigid) {
            let e5 = r3 - a4.rigid[0], t4 = l5 - a4.rigid[1];
            d2[0] = ee2 + e5 * N3 - t4 * P3, d2[1] = M4 + e5 * P3 + t4 * N3;
          } else p3(r3, l5, i4.wHead[e4], i4.dep[e4], i4.wPhys1[e4], i4.wPhys2[e4], i4.wFront[e4]);
          i4.skin && (this.skinOffset(i4.skin, e4, m3), d2[0] += m3[0], d2[1] += m3[1]);
          let f5 = d2[0], h4 = d2[1];
          if (i4.wTwist && i4.wTwist[e4] > 0 && (f5 += b4 * i4.wTwist[e4]), i4.wNeck && i4.wNeck[e4] > 0) {
            let r4 = _3 * i4.wNeck[e4], a5 = Math.cos(r4), o5 = Math.sin(r4), s5 = t3.head.cx + n3[0], c4 = t3.neck_y + n3[1], l6 = f5 - s5, u3 = h4 - c4;
            f5 = s5 + l6 * a5 - u3 * o5, h4 = c4 + l6 * o5 + u3 * a5;
          }
          let y5 = i4.fol ? i4.fol[e4] : 0, S5 = i4.folB ? i4.folB[e4] : 0;
          if (y5 > 0 || S5 > 0) {
            let t4 = 5 * e4, n4 = i4.alt, a5 = f5, o5 = h4;
            p3(r3, l5, n4[t4 + 1], n4[t4], n4[t4 + 2], n4[t4 + 3], n4[t4 + 4]), i4.altSkin && (this.skinOffset(i4.altSkin, e4, m3), d2[0] += m3[0], d2[1] += m3[1]), f5 += (d2[0] - a5) * y5, h4 += (d2[1] - o5) * y5, i4.outB && (i4.outB[2 * e4] = a5 + (d2[0] - a5) * S5, i4.outB[2 * e4 + 1] = o5 + (d2[1] - o5) * S5);
          } else i4.outB && (i4.outB[2 * e4] = f5, i4.outB[2 * e4 + 1] = h4);
          if (i4.kf) {
            let t4 = 0, n4 = 0;
            for (let r4 = 0; r4 < g3.length; r4++) {
              let a5 = i4.kf[r4];
              a5 && g3[r4] !== 0 && (t4 += g3[r4] * a5[2 * e4], n4 += g3[r4] * a5[2 * e4 + 1]);
            }
            if (t4 !== 0 || n4 !== 0) {
              let r4 = _3 * i4.wHead[e4], a5 = Math.cos(r4), o5 = Math.sin(r4), s5 = t4 * a5 - n4 * o5, c4 = t4 * o5 + n4 * a5;
              f5 += s5, h4 += c4, i4.outB && (i4.outB[2 * e4] += s5, i4.outB[2 * e4 + 1] += c4);
            }
          }
          s4[2 * e4] = f5, s4[2 * e4 + 1] = h4;
        }
      }
    }
    drawLayer(e3, t3, n3, r2, i3 = 0) {
      let a3 = this.gl;
      a3.bindBuffer(a3.ARRAY_BUFFER, e3.pos), r2 ? (a3.bufferSubData(a3.ARRAY_BUFFER, 0, r2), e3.uploaded = false) : e3.uploaded ||= (a3.bufferSubData(a3.ARRAY_BUFFER, 0, e3.out), true), a3.bindTexture(a3.TEXTURE_2D, t3), a3.uniform1f(this.uAlpha, n3), a3.uniform1f(this.uCut, i3), a3.bindVertexArray(e3.vao), a3.drawElements(a3.TRIANGLES, e3.count, a3.UNSIGNED_INT, 0);
    }
    drawMasks(e3, t3, n3, r2, i3, a3) {
      let o3 = this.gl, s3 = [];
      for (let e4 of this.layers) e4.maskCh = -1;
      for (let e4 of this.softIris ? this.layers : []) {
        let t4 = e4.def.clip ? this.byId.get(e4.def.clip) : void 0;
        !(e4.def.role || ``).startsWith(`iris_`) || !t4?.mask || !(e4.soft > 0) || t4.maskCh >= 0 || s3.length >= 4 || this.hidden.has(e4.def.id) || this.hidden.has(t4.def.id) || (t4.maskCh = s3.length, s3.push(t4));
      }
      if (!s3.length) return;
      let c3 = 1 / 0, l3 = 1 / 0, u2 = -1 / 0, d2 = -1 / 0;
      for (let o4 of s3) for (let s4 = 0; s4 < o4.out.length; s4 += 2) {
        let f3 = (o4.out[s4] * n3 + i3 + 1) * e3 / 2, p3 = (1 - (o4.out[s4 + 1] * r2 + a3)) * t3 / 2;
        c3 = Math.min(c3, f3), u2 = Math.max(u2, f3), l3 = Math.min(l3, p3), d2 = Math.max(d2, p3);
      }
      if (c3 = Math.max(0, Math.floor(c3) - 2), l3 = Math.max(0, Math.floor(l3) - 2), u2 = Math.min(e3, Math.ceil(u2) + 2), d2 = Math.min(t3, Math.ceil(d2) + 2), u2 <= c3 || d2 <= l3) for (let e4 of s3) e4.maskCh = -1;
      else {
        if (o3.activeTexture(o3.TEXTURE1), o3.bindTexture(o3.TEXTURE_2D, null), o3.activeTexture(o3.TEXTURE0), !this.maskFb || u2 - c3 > this.maskSize[0] || d2 - l3 > this.maskSize[1]) {
          let e4 = Math.max(this.maskSize[0], Math.ceil((u2 - c3) / 64) * 64), t4 = Math.max(this.maskSize[1], Math.ceil((d2 - l3) / 64) * 64);
          this.maskTex ||= o3.createTexture(), o3.bindTexture(o3.TEXTURE_2D, this.maskTex), o3.texImage2D(o3.TEXTURE_2D, 0, o3.RGBA8, e4, t4, 0, o3.RGBA, o3.UNSIGNED_BYTE, null), o3.texParameteri(o3.TEXTURE_2D, o3.TEXTURE_MIN_FILTER, o3.NEAREST), o3.texParameteri(o3.TEXTURE_2D, o3.TEXTURE_MAG_FILTER, o3.NEAREST), this.maskFb ||= o3.createFramebuffer(), o3.bindFramebuffer(o3.FRAMEBUFFER, this.maskFb), o3.framebufferTexture2D(o3.FRAMEBUFFER, o3.COLOR_ATTACHMENT0, o3.TEXTURE_2D, this.maskTex, 0), this.maskSize = [e4, t4];
        }
        o3.bindFramebuffer(o3.FRAMEBUFFER, this.maskFb), o3.viewport(-c3, -l3, e3, t3), o3.clearColor(0, 0, 0, 0), o3.clear(o3.COLOR_BUFFER_BIT), o3.disable(o3.BLEND), o3.uniform1i(this.uMode, 1), s3.forEach((e4, t4) => {
          o3.colorMask(t4 === 0, t4 === 1, t4 === 2, t4 === 3), this.drawLayer(e4, e4.mask, 1);
        }), o3.colorMask(true, true, true, true), o3.uniform1i(this.uMode, 0), o3.enable(o3.BLEND), o3.bindFramebuffer(o3.FRAMEBUFFER, null), o3.viewport(0, 0, e3, t3), o3.activeTexture(o3.TEXTURE1), o3.bindTexture(o3.TEXTURE_2D, this.maskTex), o3.activeTexture(o3.TEXTURE0), o3.uniform2i(this.uMaskOff, c3, l3);
      }
    }
    render() {
      let e3 = this.gl, t3 = this.canvas, n3 = Math.min(this.maxDpr, window.devicePixelRatio || 1), [r2, i3] = this.size ?? [Math.round(t3.clientWidth * n3), Math.round(t3.clientHeight * n3)];
      (t3.width !== r2 || t3.height !== i3) && (t3.width = r2, t3.height = i3), e3.viewport(0, 0, r2, i3);
      let a3 = () => {
        e3.clearColor(...this.background), e3.clearStencil(0), e3.clear(e3.COLOR_BUFFER_BIT | e3.STENCIL_BUFFER_BIT);
      };
      if (!this.model) {
        a3();
        return;
      }
      e3.useProgram(this.prog), e3.enable(e3.BLEND), e3.blendFunc(e3.ONE, e3.ONE_MINUS_SRC_ALPHA), e3.activeTexture(e3.TEXTURE0), e3.uniform1i(this.uTex, 0), e3.uniform1i(this.uMode, 0);
      let [o3, s3] = this.model.canvas, c3 = this.view, l3 = this.move, u2 = this.model.anchors.head, d2 = (e4, t4) => (this.focusHead ? -(u2.cy + u2.ry * 0.15) * (2 * e4) / i3 : -s3 * e4 / i3) + this.panY - 2 * t4, f3 = (e4, t4) => -(2 * e4 * s3 / i3 + t4), p3 = Math.min(r2 / o3, i3 / s3) * this.zoom, m3 = p3 * c3.s * l3.s, g3 = 2 * m3 / r2, _3 = 2 * m3 / i3, v4 = d2(m3, c3.y + l3.y);
      if (this.cutBottom) {
        let e4 = Math.max(f3(p3 * c3.s, d2(p3 * c3.s, c3.y)), -1);
        v4 += Math.max(0, f3(m3, v4) - e4);
      }
      let y4 = (this.focusHead ? -u2.cx * g3 : -o3 * m3 / r2) + 2 * (c3.x + l3.x);
      e3.uniform4f(this.uView, g3, _3, y4, v4), this.drawMasks(r2, i3, g3, _3, y4, v4), a3(), this.lastView = [g3, _3, y4, v4, r2, i3];
      let b4 = this.params, x4 = (e4) => {
        let t4 = Math.min(1, Math.max(0, b4.mouthOpen)), n4 = this.mouthFrame, r3 = e4.def.pivot ? e4.def.pivot[1] : e4.def.y, i4 = this.frameKind[n4] === `half` ? 0.88 + 0.12 * this.frameEase(n4, t4) : 0.9 + 0.1 * this.frameEase(n4, t4), a4;
        if (n4 > 0 && n4 !== this.vis.shut) {
          a4 = e4.out.slice();
          let t5 = this.chinFollow ? e4.wJaw : void 0;
          for (let n5 = 1; n5 < a4.length; n5 += 2) a4[n5] += (e4.rest[n5] - r3) * (i4 - 1) * (t5 ? 1 - t5[n5 >> 1] : 1);
        }
        this.drawLayer(e4, e4.frames[n4], 1, a4);
      }, S4 = this.talkLeft > 0 ? this.layers.findLastIndex((e4) => e4.def.role === `expr`) : -1, C4 = (e4) => this.exprAlpha(e4), w4 = null, T4 = this.layers.findLastIndex((e4) => e4.def.id === `brows` || e4.def.role === `expr_brows`), E4 = T4 < 0, D4 = () => {
        if (E4 = true, !this.headHidden) {
          for (let e4 of this.layers) if (e4.browTex && e4.def.role === `expr` && !this.hidden.has(e4.def.id) && (!this.only || this.only(e4.def))) {
            let t4 = C4(e4.def);
            t4 > 0.01 && this.drawLayer(e4, e4.browTex, t4, e4.outB);
          }
        }
      }, O4 = 0;
      for (let t4 = 0; t4 < this.layers.length; t4++) {
        let n4 = this.layers[t4], r3 = n4.def, i4 = r3.role || ``;
        if (w4 && t4 > S4 && (x4(w4), w4 = null), !E4 && t4 > T4 && D4(), this.hidden.has(r3.id) || (r3.group === `body` ? this.bodyHidden : this.headHidden) || this.only && !this.only(r3) || (i4 === `hole` || i4 === `edge` || i4 === `edge_wide`) && !this.masks) continue;
        if (i4 === `mouth` && n4.frames.length >= 3) {
          t4 < S4 ? w4 = n4 : x4(n4);
          continue;
        }
        if (i4 === `expr`) {
          let e4 = C4(r3);
          e4 > 0.01 && this.drawLayer(n4, this.talkLeft > 0 && n4.talk ? n4.talk : n4.tex, e4);
          continue;
        }
        if (i4 === `expr_brows`) {
          let e4 = C4(r3);
          e4 > 0.01 && this.drawLayer(n4, n4.tex, e4);
          continue;
        }
        if (r3.id === `brows`) {
          let e4 = 0;
          for (let t5 of this.layers) t5.def.role === `expr` && t5.def.brows === `redrawn` && !this.hidden.has(t5.def.id) && (e4 = Math.max(e4, C4(t5.def)));
          e4 < 0.99 && this.drawLayer(n4, n4.tex, 1 - e4);
          continue;
        }
        if (i4.startsWith(`lid_`)) {
          let e4 = i4 === `lid_L` ? b4.eyeLOpen : b4.eyeROpen, t5 = 1 - n(0.05, 0.35, e4);
          t5 > 0.01 && this.drawLayer(n4, n4.tex, t5);
          continue;
        }
        if (i4.startsWith(`eye_`)) {
          let t5 = i4 === `eye_L` ? b4.eyeLOpen : b4.eyeROpen;
          this.drawLayer(n4, n4.tex, n(0.02, 0.2, t5)), n4.stencilRef = 0, n4.mask && n4.maskCh < 0 && (O4 = O4 % 250 + 1, n4.stencilRef = O4, e3.enable(e3.STENCIL_TEST), e3.stencilFunc(e3.ALWAYS, O4, 255), e3.stencilOp(e3.KEEP, e3.KEEP, e3.REPLACE), e3.colorMask(false, false, false, false), this.drawLayer(n4, n4.mask, 1, void 0, 0.5), e3.colorMask(true, true, true, true), e3.disable(e3.STENCIL_TEST));
          continue;
        }
        if (i4 === `blush`) {
          let e4 = 0;
          for (let [t5, n5] of Object.entries(r3.blush || {})) e4 += n5 * this.exprValue(t5);
          e4 > 0.01 && this.drawLayer(n4, n4.tex, Math.min(1, e4));
          continue;
        }
        if (i4.startsWith(`iris_`) || i4.startsWith(`shine_`)) {
          let t5 = r3.clip ? this.byId.get(r3.clip) : void 0, a5 = i4.endsWith(`_L`) ? b4.eyeLOpen : b4.eyeROpen;
          if (t5 && t5.maskCh >= 0) {
            let r4 = t5.maskCh;
            e3.uniform1i(this.uMode, 2), e3.uniform4f(this.uMaskSel, +(r4 === 0), +(r4 === 1), +(r4 === 2), +(r4 === 3)), e3.uniform1f(this.uSoft, n4.soft), this.drawLayer(n4, n4.tex, n(0.02, 0.2, a5)), e3.uniform1i(this.uMode, 0);
          } else t5 && t5.stencilRef && (e3.enable(e3.STENCIL_TEST), e3.stencilFunc(e3.EQUAL, t5.stencilRef, 255), e3.stencilOp(e3.KEEP, e3.KEEP, e3.KEEP), this.drawLayer(n4, n4.tex, n(0.02, 0.2, a5)), e3.disable(e3.STENCIL_TEST));
          continue;
        }
        let a4 = r3.show || r3.hide ? this.moodAlpha(r3) : 1;
        a4 > 0.01 && this.drawLayer(n4, n4.tex, a4);
      }
      w4 && x4(w4), E4 || D4(), e3.bindVertexArray(null);
    }
    canvasToModel(e3, t3) {
      let [n3, r2, i3, a3, o3, s3] = this.lastView, c3 = this.canvas, l3 = 2 * e3 * (o3 / Math.max(1, c3.clientWidth)) / o3 - 1, u2 = 2 * t3 * (s3 / Math.max(1, c3.clientHeight)) / s3 - 1;
      return [(l3 - i3) / n3, (u2 - a3) / r2];
    }
    poke(e3, t3, n3 = 1) {
      let r2 = 0;
      for (let i3 of this.chainRuns) {
        let a3 = i3.R, o3 = a3.length / 2, s3 = 1.5 * (i3.def.sigma ?? 40) + 20, c3 = 1 / 0;
        for (let n4 = 0; n4 < o3; n4++) c3 = Math.min(c3, Math.hypot(a3[2 * n4] - e3, a3[2 * n4 + 1] - t3));
        if (c3 > s3) continue;
        r2++;
        let l3 = e3 < a3[0] ? 1 : -1;
        for (let e4 = 1; e4 < o3; e4++) {
          let t4 = (1 - c3 / s3) * i3.s[e4] * 9 * n3;
          i3.q[2 * e4] -= l3 * t4, i3.q[2 * e4 + 1] += t4 * 0.3;
        }
      }
      return r2;
    }
    resetPhysics() {
      for (let e3 of this.chainRuns) e3.p.set(e3.R), e3.q.set(e3.R), e3.disp.fill(0), e3.beta.fill(0), e3.started = false, e3.moving = false;
      for (let e3 of Object.values(this.chains)) for (let t3 of e3) Object.assign(t3, N2());
      this.lastHead = { x: 0, y: 0, roll: 0 }, this.drive.started = false, this.body = { yaw: 0, roll: 0 }, this.bust = { x: 0, y: 0, vx: 0, vy: 0, px: 0, py: 0 };
    }
    snapshot() {
      return this.canvas.toDataURL(`image/png`);
    }
  };
  function ne(e3) {
    let t3 = (e4, t4, n4) => Number.isInteger(e4) && e4 >= t4 && e4 <= n4;
    if (e3?.version !== 1 || !t3(e3.cols, 2, 4096) || !t3(e3.rows, 2, 4096) || e3.cols * e3.rows > 2 ** 22 || ![e3.cell, e3.units, e3.turn, e3.nod].every((e4) => typeof e4 == `number` && Number.isFinite(e4) && e4 > 0) || !Array.isArray(e3.keys) || e3.keys.length > 32) return false;
    let n3 = (e4) => Math.ceil(e4 / 3) * 4, r2 = n3(e3.cols * e3.rows * 4), i3 = n3(e3.cols * e3.rows);
    for (let t4 of e3.keys) if (!t4 || ![`angleX`, `angleY`, `diag`].includes(t4.param) || !Number.isFinite(t4.value) || t4.param !== `diag` && !t4.value || !t4.fields || typeof t4.fields != `object` || Object.values(t4.fields).some((e4) => typeof e4 != `string` || e4.length !== r2) || t4.same !== void 0 && !(Array.isArray(t4.same) && t4.same.every((e4) => typeof e4 == `string`))) return false;
    return Object.values(e3.mask || {}).every((e4) => typeof e4 == `string` && e4.length === i3);
  }
  function F2(e3) {
    let t3 = e3.points.length, n3 = new Float32Array(e3.points.flat()), r2 = new Float32Array(t3), i3 = new Float32Array(t3);
    for (let e4 = 1; e4 < t3; e4++) r2[e4] = Math.hypot(n3[2 * e4] - n3[2 * e4 - 2], n3[2 * e4 + 1] - n3[2 * e4 - 1]), i3[e4] = i3[e4 - 1] + r2[e4];
    let a3 = i3[t3 - 1] || 1;
    for (let e4 = 1; e4 < t3; e4++) i3[e4] /= a3;
    let o3 = 0;
    for (let t4 of e3.id) o3 = (o3 * 31 + t4.charCodeAt(0)) % 997;
    return { def: e3, R: n3, p: n3.slice(), q: n3.slice(), len: r2, s: i3, disp: new Float32Array(2 * t3), beta: new Float32Array(t3), W: [0, 0], V: [0, 0], acc: [0, 0], rho: 0, started: false, phase: o3 / 997 * 2 * Math.PI, moving: false };
  }
  function re(e3) {
    let t3 = Math.floor(e3 / 5.3), n3 = e3 - t3 * 5.3 - t3 * 7919 % 13 / 13 * 3.5, r2 = n3 > 0 && n3 < 0.35 ? Math.sin(n3 / 0.35 * Math.PI) : 0;
    return 1 + 0.03 * Math.sin(e3 * 2.1) + 0.12 * r2;
  }
  function I2(e3) {
    let [t3, n3 = ``] = e3.split(`?`), r2 = t3.endsWith(`.json`) ? t3 : (t3.endsWith(`/`) ? t3 : t3 + `/`) + `model.json`;
    return { file: r2, base: r2.slice(0, r2.lastIndexOf(`/`) + 1), query: n3 };
  }
  function L2(e3, t3) {
    let { base: n3, query: r2 } = I2(e3);
    return n3 + `textures.bin?v=${t3}${r2 ? `&${r2}` : ``}`;
  }
  async function ie(e3, t3) {
    try {
      let n3 = await fetch(e3, { signal: t3 });
      if (!n3.ok) return null;
      let r2 = await n3.arrayBuffer(), i3 = new DataView(r2).getUint32(0, true), a3 = JSON.parse(new TextDecoder().decode(new Uint8Array(r2, 4, i3)));
      return new Map(Object.entries(a3).filter((e4) => Array.isArray(e4[1])).map(([e4, [t4, n4]]) => [e4, new Blob([new Uint8Array(r2, 4 + i3 + t4, n4)], { type: e4.endsWith(`.png`) ? `image/png` : `image/webp` })]));
    } catch (e4) {
      if (t3?.aborted) throw e4;
      return null;
    }
  }
  function R2(e3) {
    let t3 = URL.createObjectURL(e3);
    return B2(t3).finally(() => URL.revokeObjectURL(t3));
  }
  async function z2(e3, t3) {
    let n3;
    try {
      let r2 = await fetch(e3, { signal: t3 });
      if (!r2.ok) throw Error();
      n3 = await r2.blob();
    } catch (n4) {
      throw t3.aborted ? n4 : Error(`image ` + e3);
    }
    return R2(n3);
  }
  function B2(e3) {
    return new Promise((t3, n3) => {
      let r2 = new Image();
      r2.crossOrigin = `anonymous`, r2.onload = () => t3(r2), r2.onerror = () => n3(/* @__PURE__ */ Error(`image ` + e3)), r2.src = e3;
    });
  }
  function V2(e3, t3, n3, r2) {
    let i3 = Math.min(t3.cols - 1.001, Math.max(0, n3 / t3.cell)), a3 = Math.min(t3.rows - 1.001, Math.max(0, r2 / t3.cell)), o3 = Math.floor(i3), s3 = Math.floor(a3), c3 = i3 - o3, l3 = a3 - s3, u2 = (n4, r3, i4) => e3[2 * (r3 * t3.cols + n4) + i4], d2 = (e4) => (u2(o3, s3, e4) * (1 - c3) + u2(o3 + 1, s3, e4) * c3) * (1 - l3) + (u2(o3, s3 + 1, e4) * (1 - c3) + u2(o3 + 1, s3 + 1, e4) * c3) * l3;
    return [d2(0) * t3.units, d2(1) * t3.units];
  }
  function ae(e3, t3, n3, r2) {
    let i3 = Math.min(t3.cols - 1.001, Math.max(0, n3 / t3.cell)), a3 = Math.min(t3.rows - 1.001, Math.max(0, r2 / t3.cell)), o3 = Math.floor(i3), s3 = Math.floor(a3), c3 = i3 - o3, l3 = a3 - s3, u2 = (n4, r3) => e3[r3 * t3.cols + n4];
    return ((u2(o3, s3) * (1 - c3) + u2(o3 + 1, s3) * c3) * (1 - l3) + (u2(o3, s3 + 1) * (1 - c3) + u2(o3 + 1, s3 + 1) * c3) * l3) / 255;
  }
  function oe(e3, t3, n3, r2, i3, a3) {
    let o3 = document.createElement(`canvas`);
    o3.width = t3.w, o3.height = t3.h;
    let s3 = o3.getContext(`2d`, { willReadFrequently: true });
    s3.drawImage(e3, 0, 0, t3.w, t3.h);
    let c3 = s3.getImageData(0, 0, t3.w, t3.h).data;
    s3.clearRect(0, 0, t3.w, t3.h), s3.drawImage(n3, r2.x - t3.x, r2.y - t3.y, r2.w, r2.h);
    let l3 = s3.getImageData(0, 0, t3.w, t3.h).data, u2 = new Float32Array(i3.length / 2);
    for (let e4 = 0; e4 < u2.length; e4++) {
      let n4 = i3[2 * e4] - t3.x, r3 = i3[2 * e4 + 1] - t3.y, o4 = 0, s4 = 0, d2 = 0, f3 = 0;
      for (let e5 = Math.max(0, Math.round(r3 - a3)); e5 < Math.min(t3.h, Math.round(r3 + a3)); e5++) for (let r4 = Math.max(0, Math.round(n4 - a3)); r4 < Math.min(t3.w, Math.round(n4 + a3)); r4++) {
        let n5 = 4 * (e5 * t3.w + r4) + 3, i4 = c3[n5] / 255, a4 = l3[n5] / 255;
        o4 += i4, s4 += i4 * a4, d2 += a4, f3++;
      }
      u2[e4] = o4 > 1 ? s4 / o4 : f3 ? d2 / f3 : 0;
    }
    return u2;
  }
  function se(e3) {
    let t3 = e3.profile, n3 = t3?.class?.input;
    return !!t3 && (t3.id === `anime_half` || t3.id === `painterly`) && n3?.facing === `front` && n3.glasses !== true && !e3.layers.some((e4) => e4.id === `glasses`);
  }
  function ce(e3, t3, n3, r2, i3) {
    let a3 = (e4) => {
      let t4 = e4.naturalWidth || e4.width, n4 = e4.naturalHeight || e4.height, r3 = document.createElement(`canvas`);
      r3.width = t4, r3.height = n4;
      let i4 = r3.getContext(`2d`, { willReadFrequently: true });
      return i4.drawImage(e4, 0, 0), { w: t4, h: n4, d: i4.getImageData(0, 0, t4, n4).data };
    }, o3 = a3(e3), s3 = a3(n3), c3 = t3.w / o3.w, l3 = t3.h / o3.h, u2 = (e4, t4) => {
      let n4 = Math.floor((e4 - r2.x) / r2.w * s3.w), i4 = Math.floor((t4 - r2.y) / r2.h * s3.h);
      return n4 >= 0 && i4 >= 0 && n4 < s3.w && i4 < s3.h && s3.d[4 * (i4 * s3.w + n4) + 3] >= 128;
    }, d2 = [];
    for (let e4 = 0; e4 < o3.h; e4++) {
      let n4 = t3.y + (e4 + 0.5) * l3, r3 = 0, a4 = 1 / 0, s4 = -1 / 0;
      for (let i4 = 0; i4 < o3.w; i4++) {
        let l4 = t3.x + (i4 + 0.5) * c3;
        o3.d[4 * (e4 * o3.w + i4) + 3] < 200 || !u2(l4, n4) || (r3++, a4 = Math.min(a4, l4), s4 = Math.max(s4, l4));
      }
      r3 && d2.push([n4, r3, i3 > 0 ? s4 : a4, i3 > 0 ? a4 : s4]);
    }
    if (!d2.length) return null;
    let f3 = Math.max(...d2.map((e4) => e4[1])), p3 = [], m3 = [], h3 = [];
    for (let [e4, t4, n4, r3] of d2) {
      if (t4 < 0.9 * f3) continue;
      let a4 = 0;
      for (; u2(n4 + i3 * (a4 + 1) * c3, e4); ) a4++;
      p3.push(a4 * c3), m3.push(n4 + i3 * c3 / 2), h3.push(Math.abs(n4 - r3) + c3);
    }
    let g3 = (e4) => e4.sort((e5, t4) => e5 - t4)[e4.length >> 1];
    return { room: g3(p3), sign: i3, inner: g3(m3), w: g3(h3) };
  }
  function le(e3, t3) {
    let n3 = e3.naturalWidth || e3.width, r2 = e3.naturalHeight || e3.height, i3 = document.createElement(`canvas`);
    i3.width = n3, i3.height = r2;
    let a3 = i3.getContext(`2d`, { willReadFrequently: true });
    a3.drawImage(e3, 0, 0);
    let o3 = a3.getImageData(0, 0, n3, r2).data, s3 = Array(n3).fill(NaN);
    for (let e4 = 0; e4 < n3; e4++) {
      let t4 = 255, i4 = -1;
      for (let a4 = 0; a4 < r2; a4++) {
        let r3 = 4 * (a4 * n3 + e4);
        if (o3[r3 + 3] < 200) continue;
        let s4 = 0.3 * o3[r3] + 0.59 * o3[r3 + 1] + 0.11 * o3[r3 + 2];
        s4 < t4 && (t4 = s4, i4 = a4);
      }
      i4 >= 0 && t4 < 110 && (s3[e4] = i4);
    }
    if (s3.filter((e4) => !Number.isNaN(e4)).length < 0.2 * n3) return null;
    let c3 = [];
    s3.forEach((e4, i4) => {
      Number.isNaN(e4) || c3.push([t3.x + (i4 + 0.5) * (t3.w / n3), t3.y + (e4 + 0.5) * (t3.h / r2)]);
    });
    let l3 = (e4) => {
      let t4 = e4.reduce((e5, t5) => e5 + t5[0], 0) / e4.length, n4 = Math.max(1, (e4[e4.length - 1][0] - e4[0][0]) / 2), r3 = [, , , , ,].fill(0), i4 = [0, 0, 0];
      for (let [a5, o5] of e4) {
        let e5 = (a5 - t4) / n4, s5 = 1;
        for (let t5 = 0; t5 < 5; t5++) r3[t5] += s5, t5 < 3 && (i4[t5] += s5 * o5), s5 *= e5;
      }
      let a4 = [[r3[0], r3[1], r3[2]], [r3[1], r3[2], r3[3]], [r3[2], r3[3], r3[4]]], o4 = (e5) => e5[0][0] * (e5[1][1] * e5[2][2] - e5[1][2] * e5[2][1]) - e5[0][1] * (e5[1][0] * e5[2][2] - e5[1][2] * e5[2][0]) + e5[0][2] * (e5[1][0] * e5[2][1] - e5[1][1] * e5[2][0]), s4 = o4(a4);
      if (!(Math.abs(s4) > 1e-9)) return null;
      let c4 = [0, 1, 2].map((e5) => o4(a4.map((t5, n5) => t5.map((t6, r4) => r4 === e5 ? i4[n5] : t6))) / s4);
      return c4.every(Number.isFinite) ? (e5) => {
        let r4 = (e5 - t4) / n4;
        return c4[0] + c4[1] * r4 + c4[2] * r4 * r4;
      } : null;
    }, u2 = l3(c3);
    if (!u2) return null;
    let d2 = c3.map(([e4, t4]) => Math.abs(t4 - u2(e4))).sort((e4, t4) => e4 - t4), f3 = Math.max(1.5, 2.5 * d2[d2.length >> 1]), p3 = c3, m3 = c3.filter(([e4, t4]) => Math.abs(t4 - u2(e4)) <= f3), h3 = m3.length >= 0.6 * c3.length ? l3(m3) : null;
    h3 && (u2 = h3, p3 = m3);
    let g3 = p3[0][0], _3 = p3[p3.length - 1][0], v4 = u2;
    return (e4) => v4(Math.min(_3, Math.max(g3, e4)));
  }
  function ue(e3, t3, n3, r2 = 0, i3 = 0, a3 = t3, o3 = n3) {
    let s3 = document.createElement(`canvas`);
    s3.width = t3, s3.height = n3;
    let c3 = s3.getContext(`2d`, { willReadFrequently: true });
    c3.imageSmoothingEnabled = true;
    for (let t4 of e3) c3.drawImage(t4, r2, i3, a3, o3);
    let l3 = c3.getImageData(0, 0, t3, n3).data, u2 = new Uint8Array(t3 * n3);
    for (let e4 = 0; e4 < t3 * n3; e4++) u2[e4] = +(l3[4 * e4 + 3] > 0);
    let d2 = u2.slice();
    for (let e4 = 0; e4 < n3; e4++) for (let r3 = 0; r3 < t3; r3++) if (!u2[e4 * t3 + r3]) for (let i4 = -1; i4 <= 1; i4++) for (let a4 = -1; a4 <= 1; a4++) {
      let o4 = e4 + i4, s4 = r3 + a4;
      o4 >= 0 && o4 < n3 && s4 >= 0 && s4 < t3 && u2[o4 * t3 + s4] && (d2[e4 * t3 + r3] = 1);
    }
    return d2;
  }
  var H2 = `LivLiv`;
  var U2 = `#ff4d5e`;
  var W2 = [27, 44, 430, 133];
  var G2 = `M101.5 62.5V141.5Q101.5 158.5 115.5 158.5M145 107.5V158.5M176.3 107.5L200.5 158.5L224.7 107.5M257.5 62.5V141.5Q257.5 158.5 271.5 158.5M303 107.5V158.5M335.3 107.5L359.5 158.5L383.7 107.5`;
  var K2 = `M40.5 122L49.5 142.1M60.5 122L69.5 142.1M421.5 122L412.5 142.1M441.5 122L432.5 142.1`;
  var q2 = { cx: 145, cy: 67, r: 13.5 };
  var J2 = `M293.5 69H312.5A8 8 0 0 1 312.5 85H293.5A8 8 0 0 1 293.5 69Z`;
  var Y2 = { center: 0.38, centerY: 0.62, centerAlpha: 0.18, centerShadow: `rgba(0,0,0,.25)`, centerBlur: 0.06, corner: 0.13, cornerMin: 64, margin: 0.035, text: 0.026, top: 0.12 };
  function X2(e3) {
    let t3 = e3 % 5500 / 5500;
    return t3 < 0.93 ? 1 : t3 < 0.955 ? 1 - (t3 - 0.93) / 0.025 * 0.88 : 0.12 + (t3 - 0.955) / 0.045 * 0.88;
  }
  function de(e3, t3, n3, r2, i3, a3 = 0, o3 = U2, s3 = 0, c3 = `#222`) {
    let [l3, u2, d2, f3] = W2, p3 = r2 / f3;
    e3.save(), e3.translate(t3 - d2 * p3, n3 - r2), e3.scale(p3, p3), e3.translate(-l3, -u2), e3.lineCap = `round`, e3.lineJoin = `round`, s3 && (e3.strokeStyle = c3, e3.lineWidth = 25 + s3 * 2, e3.stroke(new Path2D(G2)), e3.lineWidth = 12.5 + s3 * 2, e3.stroke(new Path2D(K2)), e3.lineWidth = s3 * 2, e3.beginPath(), e3.ellipse(q2.cx, q2.cy, q2.r, q2.r * X2(a3), 0, 0, Math.PI * 2), e3.stroke(), e3.stroke(new Path2D(J2))), e3.strokeStyle = i3, e3.lineWidth = 25, e3.stroke(new Path2D(G2)), e3.strokeStyle = o3, e3.lineWidth = 12.5, e3.stroke(new Path2D(K2)), e3.fillStyle = o3, e3.beginPath(), e3.ellipse(q2.cx, q2.cy, q2.r, q2.r * X2(a3), 0, 0, Math.PI * 2), e3.fill(), e3.fill(new Path2D(J2)), e3.restore();
  }
  function fe(e3, t3, n3 = false, r2 = 1) {
    let { corner: i3, cornerMin: a3, margin: o3, text: s3 } = Y2, c3 = Math.min(e3, t3), l3 = Math.max(12 * r2, c3 * o3);
    return { right: e3 - l3, y: n3 ? t3 > e3 ? t3 * Y2.top : l3 : t3 - l3, top: n3, logo: Math.max(a3 * r2, c3 * i3) * W2[3] / W2[2], text: Math.max(12 * r2, c3 * s3) };
  }
  function pe(e3, t3, n3, r2 = 0, i3 = 1, a3 = false, o3 = false) {
    let s3 = fe(t3, n3, a3, i3);
    e3.save(), o3 || (e3.shadowColor = `rgba(0,0,0,.55)`, e3.shadowBlur = s3.logo * 0.12), de(e3, s3.right, s3.top ? s3.y + s3.logo : s3.y, s3.logo, o3 ? `#fff` : `rgba(255,255,255,.95)`, r2, U2, o3 ? 9 : 0), e3.restore();
  }
  function me(e3, t3, n3, r2, i3 = 1, a3 = false) {
    let o3 = fe(t3, n3, a3, i3);
    e3.save(), e3.shadowColor = `rgba(0,0,0,.6)`, e3.shadowBlur = o3.text * 0.25, e3.font = `600 ${o3.text}px system-ui, sans-serif`, e3.textAlign = `right`, e3.textBaseline = o3.top ? `top` : `bottom`, e3.fillStyle = `rgba(255,255,255,.85)`, e3.fillText(r2, o3.right, o3.y), e3.restore();
  }
  function he(e3, t3, n3, r2 = 0, i3 = 1, a3 = false) {
    let { center: o3, centerY: s3, centerAlpha: c3, centerShadow: l3, centerBlur: u2 } = Y2, d2 = Math.min(t3, n3) * o3, f3 = d2 * W2[3] / W2[2];
    e3.save(), e3.globalAlpha = c3, e3.shadowColor = l3, e3.shadowBlur = f3 * u2, de(e3, (t3 + d2) / 2, n3 * s3 + f3 / 2, f3, `#fff`, r2, `#fff`), e3.restore(), pe(e3, t3, n3, r2, i3, a3);
  }
  var ge = `#version 300 es
in vec2 aPos; out vec2 vUv;
void main(){ vUv=vec2(aPos.x*.5+.5,.5-aPos.y*.5); gl_Position=vec4(aPos,0.,1.); }`;
  var _e = `#version 300 es
precision mediump float; in vec2 vUv; uniform sampler2D uTex; out vec4 o;
void main(){ o=texture(uTex,vUv); }`;
  var ve = class {
    logo = false;
    text = null;
    gl;
    prog;
    vao;
    buf;
    tex;
    c = document.createElement(`canvas`);
    drawn = ``;
    constructor(e3) {
      this.gl = e3;
      let t3 = (t4, n4) => {
        let r2 = e3.createShader(t4);
        return e3.shaderSource(r2, n4), e3.compileShader(r2), r2;
      }, n3 = this.prog = e3.createProgram();
      e3.attachShader(n3, t3(e3.VERTEX_SHADER, ge)), e3.attachShader(n3, t3(e3.FRAGMENT_SHADER, _e)), e3.bindAttribLocation(n3, 0, `aPos`), e3.linkProgram(n3), this.vao = e3.createVertexArray(), e3.bindVertexArray(this.vao), this.buf = e3.createBuffer(), e3.bindBuffer(e3.ARRAY_BUFFER, this.buf), e3.bufferData(e3.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), e3.STATIC_DRAW), e3.enableVertexAttribArray(0), e3.vertexAttribPointer(0, 2, e3.FLOAT, false, 0, 0), e3.bindVertexArray(null), this.tex = e3.createTexture(), e3.bindTexture(e3.TEXTURE_2D, this.tex), e3.texParameteri(e3.TEXTURE_2D, e3.TEXTURE_MIN_FILTER, e3.LINEAR), e3.texParameteri(e3.TEXTURE_2D, e3.TEXTURE_MAG_FILTER, e3.LINEAR), e3.texParameteri(e3.TEXTURE_2D, e3.TEXTURE_WRAP_S, e3.CLAMP_TO_EDGE), e3.texParameteri(e3.TEXTURE_2D, e3.TEXTURE_WRAP_T, e3.CLAMP_TO_EDGE);
    }
    set(e3, t3, n3 = true) {
      this.logo = e3 === `livliv`, this.text = e3 === `text` ? t3 : null, this.center = n3;
    }
    center = true;
    draw(e3, t3) {
      let n3 = this.logo ? H2 : this.text, r2 = this.gl;
      if (!n3) return;
      let i3 = r2.drawingBufferWidth, a3 = r2.drawingBufferHeight, o3 = `${i3}x${a3}:${t3}:${this.logo ? Math.round(X2(e3) * 10) : ``}:${this.logo}:${this.center}:${n3}`;
      if (r2.activeTexture(r2.TEXTURE0), r2.bindTexture(r2.TEXTURE_2D, this.tex), o3 !== this.drawn) {
        this.drawn = o3;
        let s3 = this.c;
        (s3.width !== i3 || s3.height !== a3) && (s3.width = i3, s3.height = a3);
        let c3 = s3.getContext(`2d`);
        c3.clearRect(0, 0, i3, a3), c3.save(), this.logo && this.center ? he(c3, i3, a3, e3, t3) : this.logo ? pe(c3, i3, a3, e3, t3) : me(c3, i3, a3, n3, t3), c3.restore(), r2.pixelStorei(r2.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true), r2.texImage2D(r2.TEXTURE_2D, 0, r2.RGBA, r2.RGBA, r2.UNSIGNED_BYTE, s3);
      }
      r2.viewport(0, 0, i3, a3), r2.useProgram(this.prog), r2.disable(r2.STENCIL_TEST), r2.enable(r2.BLEND), r2.blendFunc(r2.ONE, r2.ONE_MINUS_SRC_ALPHA), r2.bindVertexArray(this.vao), r2.drawArrays(r2.TRIANGLE_STRIP, 0, 4), r2.bindVertexArray(null);
    }
    dispose() {
      let e3 = this.gl;
      e3.deleteTexture(this.tex), e3.deleteBuffer(this.buf), e3.deleteVertexArray(this.vao), e3.deleteProgram(this.prog);
    }
  };
  var Z2 = { entries: 2048, bytes: 256 * 2 ** 20, modelJson: c.modelJson, keyforms: c.keyforms };
  var Q2 = (e3, t3 = `invalid`) => new e2(t3, `LivLiv: ${e3}`);
  var ye = { webp: `image/webp`, png: `image/png`, jpg: `image/jpeg`, jpeg: `image/jpeg`, json: `application/json` };
  async function be(e3) {
    let t3 = new Uint8Array(await e3.slice(0, 4).arrayBuffer());
    return t3.length === 4 && t3[0] === 80 && t3[1] === 75 && (t3[2] === 3 && t3[3] === 4 || t3[2] === 5 && t3[3] === 6);
  }
  async function xe(e3) {
    let t3 = Math.min(e3.size, 65557), n3 = new DataView(await e3.slice(e3.size - t3).arrayBuffer()), r2 = -1;
    for (let e4 = n3.byteLength - 22; e4 >= 0; e4--) if (n3.getUint32(e4, true) === 101010256) {
      r2 = e4;
      break;
    }
    if (r2 < 0) throw Q2(`this is not a ZIP (no end record)`, `not-a-model`);
    let i3 = n3.getUint16(r2 + 10, true), a3 = n3.getUint32(r2 + 12, true), o3 = n3.getUint32(r2 + 16, true);
    if (i3 === 65535 || a3 === 4294967295 || o3 === 4294967295) throw Q2(`ZIP64 packages are not supported`, `too-large`);
    if (i3 > Z2.entries) throw Q2(`the package has ${i3} entries, more than ${Z2.entries}`, `too-large`);
    let s3 = new DataView(await e3.slice(o3, o3 + a3).arrayBuffer()), c3 = new TextDecoder(), l3 = /* @__PURE__ */ new Map(), u2 = 0;
    for (let t4 = 0, n4 = 0; n4 < i3; n4++) {
      if (t4 + 46 > s3.byteLength || s3.getUint32(t4, true) !== 33639248) throw Q2(`the package is damaged (central directory)`);
      let n5 = s3.getUint16(t4 + 8, true), r3 = s3.getUint16(t4 + 10, true), i4 = s3.getUint32(t4 + 20, true), a4 = s3.getUint32(t4 + 24, true), o4 = s3.getUint16(t4 + 28, true), d2 = s3.getUint16(t4 + 30, true), f3 = s3.getUint16(t4 + 32, true), p3 = s3.getUint32(t4 + 42, true), m3 = c3.decode(new Uint8Array(s3.buffer, s3.byteOffset + t4 + 46, o4));
      t4 += 46 + o4 + d2 + f3;
      let h3 = m3.replace(/\\/g, `/`), g3 = h3.slice(h3.lastIndexOf(`/`) + 1);
      if (h3.endsWith(`/`) || h3.startsWith(`__MACOSX/`) || g3.startsWith(`._`) || g3 === `.DS_Store` || g3 === `Thumbs.db`) continue;
      if (h3.startsWith(`/`) || /^[A-Za-z]:/.test(h3) || h3.split(`/`).some((e4) => e4 === `..` || e4 === `.`)) throw Q2(`the package holds a path outside itself: ${m3}`);
      if (n5 & 1) throw Q2(`${h3} is encrypted`);
      if (l3.has(h3)) throw Q2(`${h3} is in the package twice`);
      let _3 = g3 === `keyforms.json`;
      if (a4 > (g3 === `model.json` ? Z2.modelJson : _3 ? Z2.keyforms : Z2.bytes) || (u2 += a4) > Z2.bytes) throw Q2(`${h3} is too large (${a4} bytes)`, `too-large`);
      let v4 = new DataView(await e3.slice(p3, p3 + 30).arrayBuffer());
      if (v4.byteLength < 30 || v4.getUint32(0, true) !== 67324752) throw Q2(`the package is damaged (${h3})`);
      let y4 = p3 + 30 + v4.getUint16(26, true) + v4.getUint16(28, true), b4 = e3.slice(y4, y4 + i4), x4 = ye[g3.slice(g3.lastIndexOf(`.`) + 1).toLowerCase()] || ``;
      if (y4 + i4 > e3.size) throw Q2(`the package is damaged (${h3} runs past its end)`);
      if (r3 === 0) {
        if (i4 !== a4) throw Q2(`the package is damaged (${h3})`);
        l3.set(h3, b4.slice(0, i4, x4));
      } else if (r3 === 8) {
        if (!Ce()) {
          if (_3) {
            console.warn(`LivLiv: this browser cannot inflate ${h3}; the character plays without it`);
            continue;
          }
          throw Q2(`this browser cannot open the compressed ${h3} (no DecompressionStream): store it uncompressed`, `missing-feature`);
        }
        l3.set(h3, await we(b4, a4, h3, x4));
      } else throw Q2(`${h3} uses ZIP method ${r3}; a package stores its files or deflates them`);
    }
    return l3;
  }
  var Se;
  function Ce() {
    if (Se === void 0) try {
      Se = typeof DecompressionStream < `u` && !!new DecompressionStream(`deflate-raw`);
    } catch {
      Se = false;
    }
    return Se;
  }
  async function we(e3, t3, n3, r2) {
    let i3 = e3.stream().pipeThrough(new DecompressionStream(`deflate-raw`)).getReader(), a3 = [], o3 = 0;
    try {
      for (; ; ) {
        let { done: e4, value: r3 } = await i3.read();
        if (e4) break;
        if (o3 += r3.length, o3 > t3) throw i3.cancel(), Q2(`${n3} inflates past its ${t3} bytes`);
        a3.push(r3);
      }
    } catch (e4) {
      throw e4.message?.startsWith(n3) ? e4 : Q2(`the package is damaged (${n3}: ${e4.message})`);
    }
    if (o3 !== t3) throw Q2(`the package is damaged (${n3}: ${o3} bytes, ${t3} expected)`);
    return new Blob(a3, { type: r2 });
  }
  var Ee = { zh: `\u7B11`, "zh-Hant": `\u7B11`, en: `Smile`, ja: `\u7B11\u9854` };
  var De = `this browser has no WebGL2`;
  var Oe = class extends $ {
    puppet;
    mark;
    static isSupported() {
      let e3 = document.createElement(`canvas`).getContext(`webgl2`);
      return e3?.getExtension(`WEBGL_lose_context`)?.loseContext(), !!e3;
    }
    constructor(t3, n3 = {}) {
      K(t3);
      let r2;
      try {
        r2 = new te(t3);
      } catch (e3) {
        throw t3.getContext(`webgl2`)?.isContextLost() ? new e2(`context-lost`, `LivLiv: this canvas has lost its WebGL context: use a new canvas`, { cause: e3 }) : new e2(`no-webgl`, typeof WebGL2RenderingContext > `u` ? `LivLiv: this browser has no WebGL2` : e3.message === De ? `LivLiv: could not start WebGL2 on this canvas: it is turned off in this browser, or the canvas already draws in 2D` : `LivLiv: could not start WebGL2 on this canvas (${e3.message})`, { cause: e3 });
      }
      super(t3, r2.params, n3), this.puppet = r2, this.puppet.maxDpr = n3.maxPixelRatio ?? 2, this.mark = new ve(this.puppet.gl);
    }
    get maxPixelRatio() {
      return this.puppet.maxDpr;
    }
    set maxPixelRatio(e3) {
      this.puppet.maxDpr = e3;
    }
    get gl() {
      return this.puppet.gl;
    }
    get drawable() {
      return !!this.puppet.model;
    }
    get clock() {
      return this.puppet.time;
    }
    get shownExpr() {
      return this.puppet.expr;
    }
    seen() {
      return this.puppet;
    }
    canvasToModel(e3, t3) {
      return this.puppet.canvasToModel(e3, t3);
    }
    poke(e3, t3, n3 = 1) {
      return this.puppet.poke(e3, t3, n3);
    }
    load(e3, t3 = {}) {
      return this.start(t3, (t4) => this.loadNow(e3, t4));
    }
    async loadNow(e3, t3) {
      let r2 = this.puppet, { signal: i3 } = t3, a3 = null;
      if (typeof e3 == `string` || e3 instanceof URL) {
        let n3 = new URL(String(e3), document.baseURI);
        if (/\.(livliv|zip)$/i.test(n3.pathname)) {
          if (t3.progress(0), a3 = await je(n3.href, t3), i3.aborted) throw i3.reason;
        } else t3.progress(0), await r2.load(n3.href, { pack: false, signal: i3, onImage: (e4, n4) => {
          t3.progress(e4 / n4), e4 === n4 && t3.build();
        } }).catch((e4) => {
          throw $2(e4, n3.href);
        });
      } else a3 = e3;
      if (a3) {
        t3.build();
        let { model: e4, image: n3, keyforms: o4 } = await Me(a3);
        if (i3.aborted) throw i3.reason;
        await r2.loadModel(e4, n3, { keyforms: o4, signal: i3 }).catch((e5) => {
          throw $2(e5, `model.json`);
        });
      }
      if (this.disposed) throw r2.dispose(), J(`the player was disposed`);
      if (r2.gl.isContextLost()) throw Y();
      let o3 = r2.model, c3 = o3.expressions || (o3.layers.some((e4) => e4.id === `expr_smile`) ? [{ id: `smile`, label: ``, labels: Ee }] : []);
      this.info = { name: o3.name, format: o3.format || `livemaker-puppet`, version: o3.version ?? 3, size: o3.canvas, expressions: c3.map(({ id: e4, label: t4, labels: r3 }) => {
        let i4 = r3 || { [x(t4)]: t4 };
        return { id: e4, label: b(i4, this.lang, e4), labels: i4 };
      }), watermark: o3.watermark ?? null, meta: o3.meta ?? null };
      let d2 = o3.meta ? o3.meta.watermark?.kind ?? `none` : o3.watermark === `LivLiv` ? `livliv` : o3.watermark ? `text` : `none`;
      return this.mark.set(d2, o3.watermark ?? null, o3.meta?.watermark?.center !== false), this.neutral(), this.playing || this.resize(), this.info;
    }
    show(e3) {
      let t3 = this.puppet, n3 = this.frame, r2 = this.view;
      t3.view = { x: r2.x, y: r2.y, s: r2.zoom }, t3.focusHead = r2.head, t3.move = { x: n3.move.x, y: n3.move.y + this.actions.y, s: n3.move.s }, t3.update(e3), t3.render(), this.mark.draw(performance.now(), t3.gl.drawingBufferWidth / Math.max(1, this.canvas.clientWidth));
    }
    free() {
      let e3 = this.puppet.gl;
      this.puppet.dispose(), this.mark.dispose(), e3.deleteProgram(this.puppet.prog), e3.clearColor(0, 0, 0, 0), e3.clear(e3.COLOR_BUFFER_BIT);
    }
  };
  function $2(e3, t3) {
    let n3 = e3;
    if (n3 instanceof e2 || n3?.name === `AbortError`) return e3;
    let r2 = String(n3?.message || e3), i3 = e3;
    return n3?.status ? new e2(`http`, `LivLiv: could not load ${t3} (HTTP ${n3.status})`, { status: n3.status, cause: i3 }) : r2.startsWith(`image `) ? new e2(`missing-file`, `LivLiv: could not load the image ${r2.slice(6)}: it is missing, or on another origin that sends no CORS header`, { cause: i3 }) : n3 instanceof SyntaxError ? new e2(`not-a-model`, `LivLiv: ${t3} is not a model.json (${r2})`, { cause: i3 }) : n3 instanceof TypeError && /fetch|load failed|network/i.test(r2) ? new e2(`unreachable`, `LivLiv: could not load ${t3}: unreachable, or on another origin that sends no CORS header`, { cause: i3 }) : new e2(n3?.code ?? `invalid`, r2.startsWith(`LivLiv`) ? r2 : `LivLiv: ${r2}`, { cause: i3 });
  }
  var ke = () => new e2(`not-a-model`, `LivLiv: this is a VRM or glTF file, and a Player plays LivLiv models: use a BodyPlayer with VrmBody (@livliv-dev/player/vrm)`);
  var Ae = async (e3) => {
    let t3 = new DataView(await e3.slice(0, 4).arrayBuffer());
    return t3.byteLength === 4 && t3.getUint32(0, true) === 1179937895;
  };
  async function je(e3, t3) {
    for (let n3 = true; ; n3 = false) try {
      let n4 = await fetch(e3, { signal: t3.signal });
      if (!n4.ok) throw Object.assign(/* @__PURE__ */ Error(`HTTP ${n4.status}`), { status: n4.status });
      return await X(n4, t3);
    } catch (r2) {
      if (t3.signal.aborted) throw r2;
      let i3 = r2.status;
      if (i3 && i3 < 500) throw $2(r2, e3);
      if (!n3) throw i3 ? $2(r2, e3) : new e2(`unreachable`, `LivLiv: could not load ${e3}: unreachable or the connection dropped, or on another origin that sends no CORS header`, { cause: r2 });
    }
  }
  async function Me(e3) {
    let t3 = /* @__PURE__ */ new Map(), n3 = (e4) => e4.replace(/\\/g, `/`).replace(/^(\.\/|\/)+/, ``), r2 = async (e4) => {
      if (await Ae(e4)) throw ke();
      if (!await be(e4)) throw new e2(`not-a-model`, `LivLiv: this file is not a .livliv package (not a ZIP)`);
      return xe(e4).catch((e5) => {
        throw $2(e5, `the package`);
      });
    };
    if (e3 instanceof Blob) (await r2(e3)).forEach((e4, n4) => t3.set(n4, e4));
    else if (e3 instanceof Map) e3.forEach((e4, r3) => t3.set(n3(r3), e4));
    else if (Symbol.iterator in e3) for (let r3 of e3) t3.set(n3(r3.webkitRelativePath || r3.name), r3);
    else for (let [r3, i4] of Object.entries(e3)) t3.set(n3(r3), i4);
    let i3 = (e4) => e4 === `model.json` || e4.endsWith(`/model.json`);
    if (!(e3 instanceof Blob) && ![...t3.keys()].some(i3)) {
      for (let e4 of t3.values()) if (await be(e4)) {
        let n4 = await r2(e4);
        t3.clear(), n4.forEach((e5, n5) => t3.set(n5, e5));
        break;
      }
    }
    let a3 = [...t3.keys()].filter(i3).sort((e4, t4) => e4.length - t4.length)[0];
    if (!a3 && [...t3.keys()].some((e4) => /\.(vrm|glb)$/i.test(e4))) throw ke();
    if (!a3) throw new e2(`missing-file`, `LivLiv: no model.json among the files`);
    let s3 = a3.slice(0, a3.length - 10);
    if (t3.get(a3).size > Z2.modelJson) throw new e2(`too-large`, `LivLiv: ${a3} is larger than ${Z2.modelJson} bytes`);
    let c3;
    try {
      c3 = g(JSON.parse(await t3.get(a3).text()));
    } catch (e4) {
      throw $2(e4, a3);
    }
    let l3 = /* @__PURE__ */ new Map();
    t3.forEach((e4, t4) => l3.set(t4.slice(t4.lastIndexOf(`/`) + 1), e4));
    let u2 = (e4) => t3.get(s3 + n3(e4)) ?? l3.get(e4.slice(e4.lastIndexOf(`/`) + 1)), d2 = (e4) => {
      let t4 = u2(e4);
      return t4 ? R2(t4) : Promise.reject(new e2(`missing-file`, `LivLiv: ${e4} is not among the files`));
    }, f3, p3 = c3.keyforms ? u2(c3.keyforms) : void 0;
    return p3 && p3.size <= Z2.keyforms && (f3 = await p3.text().then((e4) => JSON.parse(e4)).catch(() => void 0)), c3.keyforms && !f3 && console.warn(`LivLiv: ${c3.keyforms} is missing or unreadable; the character plays on the rig alone`), { model: c3, image: d2, keyforms: f3 };
  }

  // node_modules/@livliv-dev/player/dist/voice.js
  var t2 = [300, 900, 1800, 3500];
  var n2 = [250, 650, 650, 1300];
  var r = 15;
  var i2 = 10;
  var a2 = 3;
  var o2 = 8;
  var s2 = class {
    center = r;
    value = 0;
    seen = 0;
    push(e3, r2, s3, c3) {
      let l3 = (t3, n3) => {
        let i3 = 1e-12;
        for (let a3 = Math.ceil(t3 / r2); a3 * r2 < n3 && a3 < e3.length; a3++) i3 += e3[a3];
        return i3;
      }, u2 = 10 * Math.log10(l3(t2[0], t2[1]) / l3(t2[2], t2[3])), d2 = 10 * Math.log10(l3(n2[0], n2[1]) / l3(n2[2], n2[3])), f3 = 0;
      if (s3 > 0.15) {
        if (s3 > 0.3) {
          this.seen += c3;
          let e5 = Math.min(1, c3 / Math.min(3, 0.3 + this.seen));
          this.center += (Math.min(24, Math.max(8, u2)) - this.center) * e5;
        }
        let e4 = (u2 - this.center) / i2, t3 = (this.center - u2) / a2 * Math.min(1, Math.max(0, (d2 - o2 + 4) / 4));
        f3 = Math.max(-1, Math.min(1, t3 > 0 ? t3 : -Math.max(0, e4)));
      }
      return this.value += (f3 - this.value) * Math.min(1, c3 / 0.035), this.value;
    }
    reset() {
      this.value = 0;
    }
  };
  function c2(e3, t3) {
    let n3 = e3.length;
    for (let r2 = 1, i3 = 0; r2 < n3; r2++) {
      let a3 = n3 >> 1;
      for (; i3 & a3; a3 >>= 1) i3 ^= a3;
      i3 ^= a3, r2 < i3 && ([e3[r2], e3[i3]] = [e3[i3], e3[r2]], [t3[r2], t3[i3]] = [t3[i3], t3[r2]]);
    }
    for (let r2 = 2; r2 <= n3; r2 <<= 1) {
      let i3 = -2 * Math.PI / r2, a3 = Math.cos(i3), o3 = Math.sin(i3);
      for (let i4 = 0; i4 < n3; i4 += r2) {
        let n4 = 1, s3 = 0;
        for (let c3 = 0; c3 < r2 / 2; c3++) {
          let l3 = i4 + c3, u2 = l3 + r2 / 2, d2 = e3[u2] * n4 - t3[u2] * s3, f3 = e3[u2] * s3 + t3[u2] * n4;
          e3[u2] = e3[l3] - d2, t3[u2] = t3[l3] - f3, e3[l3] += d2, t3[l3] += f3;
          let p3 = n4 * a3 - s3 * o3;
          s3 = n4 * o3 + s3 * a3, n4 = p3;
        }
      }
    }
  }
  function l2(e3, t3, n3, r2, i3 = 0, a3 = new s2(), o3 = 0, l3 = n3.length, u2 = new Float32Array(n3.length)) {
    let d2 = t3 / r2, f3 = 1 << Math.round(Math.log2(0.0213 * t3)), p3 = Float32Array.from({ length: f3 }, (e4, t4) => 0.42 - 0.5 * Math.cos(2 * Math.PI * t4 / (f3 - 1)) + 0.08 * Math.cos(4 * Math.PI * t4 / (f3 - 1))), m3 = new Float32Array(f3), h3 = new Float32Array(f3), g3 = new Float32Array(f3 / 2);
    for (let s3 = o3; s3 < l3; s3++) {
      let o4 = Math.round((s3 + i3) * d2);
      for (let t4 = 0; t4 < f3; t4++) {
        let n4 = o4 - f3 / 2 + t4;
        m3[t4] = (n4 >= 0 && n4 < e3.length ? e3[n4] : 0) * p3[t4], h3[t4] = 0;
      }
      c2(m3, h3);
      for (let e4 = 0; e4 < f3 / 2; e4++) g3[e4] = m3[e4] * m3[e4] + h3[e4] * h3[e4];
      u2[s3] = a3.push(g3, t3 / f3, n3[s3], 1 / r2);
    }
    return u2;
  }
  var f2 = 100;
  var p2 = 3;
  var m2 = 15;
  var h2 = 24e3;
  var g2 = class {
    ctx = null;
    gen = 0;
    loads = new AbortController();
    order = Promise.resolve();
    clips = [];
    tail = 0;
    pending = 0;
    watchdog = 0;
    cue = new s2();
    out = null;
    volume = 1;
    owed = /* @__PURE__ */ new Set();
    ticker = 0;
    onIdle;
    onState;
    get running() {
      return this.ctx?.state === `running`;
    }
    setVolume(e3) {
      this.volume = e3, this.out && (this.out.gain.value = e3);
    }
    unlock() {
      if (!this.ctx) {
        let e3 = window.AudioContext || window.webkitAudioContext;
        if (!e3) return;
        let t3 = !!window.webkitAudioContext;
        try {
          this.ctx = t3 ? new e3() : new e3({ sampleRate: h2 });
        } catch {
          this.ctx = new e3();
        }
        try {
          let e4 = navigator.audioSession;
          e4 && (e4.type = `playback`);
        } catch {
        }
        this.out = this.ctx.createGain(), this.out.gain.value = this.volume, this.out.connect(this.ctx.destination), this.ctx.onstatechange = () => this.onState?.();
      }
      if (this.ctx.state !== `running`) {
        this.ctx.resume().catch(() => {
        });
        let e3 = this.ctx.createBuffer(1, 1, 22050), t3 = this.ctx.createBufferSource();
        t3.buffer = e3, t3.connect(this.ctx.destination), t3.start();
      }
    }
    get busy() {
      return this.pending > 0 || this.clips.length > 0;
    }
    enqueue(e3, t3) {
      this.unlock();
      let n3 = this.ctx;
      if (!n3) {
        t3?.onFail?.();
        return;
      }
      let r2 = t3 && { ...t3 };
      r2 && this.owed.add(r2);
      let i3 = this.gen, a3 = new _2(e3, n3, this.loads.signal);
      this.pending++, this.order = this.order.then(async () => {
        let e4 = null;
        for (let t4; (t4 = await a3.next()) && i3 === this.gen; ) e4 = this.play(e4, t4, a3.rate, r2);
        i3 === this.gen && (this.pending--, e4 ? (e4.complete = true, this.update(e4), this.retire(e4)) : this.settle(r2, false), this.check());
      });
    }
    stop() {
      this.gen++, this.loads.abort(), this.loads = new AbortController(), this.pending = 0;
      for (let e4 of this.clips) for (let t3 of e4.pieces) {
        t3.src.onended = null;
        try {
          t3.src.stop();
        } catch {
        }
      }
      this.clips = [], this.tail = 0, clearTimeout(this.watchdog), clearInterval(this.ticker), this.ticker = 0;
      let e3 = [...this.owed];
      this.owed.clear();
      for (let t3 of e3) t3.onFail?.();
    }
    read() {
      return this.at(`env`);
    }
    vowel() {
      return this.at(`vowel`);
    }
    at(e3) {
      let t3 = this.ctx;
      if (!t3 || !this.clips.length) return 0;
      let n3 = this.heardTime(t3);
      for (let t4 of this.clips) for (let r2 of t4.pieces) if (n3 >= r2.at && n3 < r2.at + r2.n / t4.rate) {
        let i3 = (r2.from / t4.rate + n3 - r2.at) * f2, a3 = Math.floor(i3), o3 = i3 - a3, s3 = t4[e3], c3 = s3[a3] ?? 0;
        return c3 + ((s3[a3 + 1] ?? 0) - c3) * o3;
      }
      return 0;
    }
    dispose() {
      this.stop(), this.onIdle = void 0, this.ctx?.close().catch(() => {
      }), this.ctx = null, this.out = null;
    }
    heardTime(e3) {
      let t3 = e3.getOutputTimestamp?.();
      return t3 && t3.contextTime && t3.performanceTime ? t3.contextTime + Math.max(0, performance.now() - t3.performanceTime) / 1e3 : e3.currentTime - (e3.outputLatency || 0) - (e3.baseLatency || 0);
    }
    play(e3, t3, n3, r2) {
      let i3 = this.ctx, a3 = e3 ?? { pieces: [], rate: n3, x: new S3(), env: /* @__PURE__ */ new Float32Array(), vowel: /* @__PURE__ */ new Float32Array(), envDone: 0, vowelDone: 0, hooks: r2 };
      e3 || this.clips.push(a3);
      let o3 = i3.createBuffer(1, t3.length, a3.rate), s3 = i3.createBufferSource();
      o3.getChannelData(0).set(t3);
      let c3 = Math.max(i3.currentTime + 0.04, this.tail);
      s3.buffer = o3, s3.connect(this.out ?? i3.destination), s3.start(c3);
      let l3 = { at: c3, from: a3.x.n, n: t3.length, src: s3 };
      a3.pieces.push(l3), a3.x.push(t3), this.tail = c3 + t3.length / a3.rate, this.update(a3), s3.onended = () => {
        l3.over = true, this.retire(a3);
      }, clearTimeout(this.watchdog);
      let u2 = i3.currentTime;
      return this.watchdog = window.setTimeout(() => {
        i3.currentTime - u2 < 0.1 && this.clips.length && (this.stop(), this.check());
      }, (this.tail - u2 + 2) * 1e3), a3.hooks && !this.ticker && (this.ticker = window.setInterval(() => this.tick(), 25)), a3;
    }
    tick() {
      let e3 = this.ctx;
      if (e3) {
        let t3 = this.heardTime(e3);
        for (let e4 of this.clips) {
          let n3 = e4.pieces[0], r2 = e4.pieces[e4.pieces.length - 1];
          e4.hooks && n3 && (!e4.started && t3 >= n3.at && this.begin(e4), e4.started && e4.complete && t3 >= r2.at + r2.n / e4.rate && this.settle(e4.hooks, true));
        }
      }
      this.owed.size || (clearInterval(this.ticker), this.ticker = 0);
    }
    begin(e3) {
      e3.started = true, e3.hooks?.onStart?.();
    }
    settle(e3, t3) {
      e3 && this.owed.delete(e3) && (t3 ? e3.onEnd?.() : e3.onFail?.());
    }
    update(e3) {
      let t3 = e3.x.view(), n3 = C3(t3, e3.rate), r2 = n3.length, i3 = e3.complete ? r2 : Math.max(e3.envDone, r2 - m2), a3 = new Float32Array(r2), o3 = new Float32Array(r2);
      a3.set(e3.env.subarray(0, e3.envDone)), a3.set(n3.subarray(e3.envDone), e3.envDone), o3.set(e3.vowel.subarray(0, e3.vowelDone)), l2(t3, e3.rate, a3, f2, p2, this.cue, e3.vowelDone, i3, o3), e3.env = a3, e3.vowel = o3, e3.envDone = e3.vowelDone = i3;
    }
    retire(e3) {
      let t3 = this.ctx;
      if (!t3 || !e3.complete || e3.pieces.some((e4) => !e4.over)) return;
      let n3 = Math.max(0, t3.currentTime - this.heardTime(t3));
      window.setTimeout(() => {
        this.clips = this.clips.filter((t4) => t4 !== e3), e3.hooks && this.owed.has(e3.hooks) && (e3.started || this.begin(e3), this.settle(e3.hooks, true)), this.check();
      }, Math.min(400, n3 * 1e3));
    }
    check() {
      this.busy || this.onIdle?.();
    }
  };
  var _2 = class {
    rate = h2;
    got = [];
    ended = false;
    wake = null;
    constructor(e3, t3, n3) {
      this.load(e3, t3, n3).catch(() => {
      }).finally(() => {
        this.ended = true, this.poke();
      });
    }
    async next() {
      for (; ; ) {
        if (this.got.length) {
          let e3 = x3(this.got);
          return this.got = [], e3;
        }
        if (this.ended) return null;
        await new Promise((e3) => {
          this.wake = e3;
        });
      }
    }
    poke() {
      let e3 = this.wake;
      this.wake = null, e3?.();
    }
    push(e3) {
      e3.length && (this.got.push(e3), this.poke());
    }
    async load(e3, t3, n3) {
      let r2 = await fetch(e3, { signal: n3 });
      if (!r2.ok) throw Error(String(r2.status));
      if (r2.body && /wav/.test(r2.headers.get(`content-type`) || ``)) return this.pcm(r2.body.getReader(), t3);
      await this.decode(await r2.arrayBuffer(), t3);
    }
    async decode(e3, t3) {
      let n3 = await t3.decodeAudioData(e3);
      this.rate = n3.sampleRate, n3.duration > 0.05 && this.push(n3.getChannelData(0));
    }
    async pcm(e3, t3) {
      let n3 = /* @__PURE__ */ new Uint8Array(), r2;
      for (; ; ) {
        let { value: t4, done: i3 } = await e3.read();
        if (t4?.length && (n3 = n3.length ? b3(n3, t4) : t4), r2 === void 0 && (r2 = v3(n3, !!i3)), r2) {
          let e4 = 2 * r2.channels, t5 = Math.floor((n3.length - r2.data) / e4);
          t5 > 0 && (this.push(y3(n3, r2.data, t5, e4)), n3 = n3.slice(r2.data + t5 * e4), r2.data = 0);
        }
        if (i3) break;
      }
      r2 === null && await this.decode(n3.slice().buffer, t3);
    }
  };
  function v3(e3, t3) {
    let n3 = (t4) => String.fromCharCode(e3[t4], e3[t4 + 1], e3[t4 + 2], e3[t4 + 3]);
    if (e3.length >= 12 && (n3(0) !== `RIFF` || n3(8) !== `WAVE`)) return null;
    let r2 = new DataView(e3.buffer, e3.byteOffset, e3.byteLength), i3 = 12, a3 = 0, o3 = 0, s3 = false;
    for (; e3.length >= 12 && i3 + 8 <= e3.length; ) {
      let t4 = n3(i3), c3 = r2.getUint32(i3 + 4, true);
      if (t4 === `data`) return s3 ? { rate: a3, channels: o3, data: i3 + 8 } : null;
      if (t4 === `fmt `) {
        if (i3 + 24 > e3.length) break;
        s3 = r2.getUint16(i3 + 8, true) === 1 && r2.getUint16(i3 + 22, true) === 16, o3 = r2.getUint16(i3 + 10, true), a3 = r2.getUint32(i3 + 12, true);
      }
      i3 += 8 + c3 + (c3 & 1);
    }
    return t3 ? null : void 0;
  }
  function y3(e3, t3, n3, r2) {
    let i3 = new DataView(e3.buffer, e3.byteOffset + t3), a3 = new Float32Array(n3);
    for (let e4 = 0; e4 < n3; e4++) a3[e4] = i3.getInt16(e4 * r2, true) / 32768;
    return a3;
  }
  function b3(e3, t3) {
    let n3 = new Uint8Array(e3.length + t3.length);
    return n3.set(e3), n3.set(t3, e3.length), n3;
  }
  function x3(e3) {
    if (e3.length === 1) return e3[0];
    let t3 = new Float32Array(e3.reduce((e4, t4) => e4 + t4.length, 0)), n3 = 0;
    for (let r2 of e3) t3.set(r2, n3), n3 += r2.length;
    return t3;
  }
  var S3 = class {
    a = /* @__PURE__ */ new Float32Array(16384);
    n = 0;
    push(e3) {
      if (this.n + e3.length > this.a.length) {
        let t3 = new Float32Array(Math.max(2 * this.a.length, this.n + e3.length));
        t3.set(this.a.subarray(0, this.n)), this.a = t3;
      }
      this.a.set(e3, this.n), this.n += e3.length;
    }
    view() {
      return this.a.subarray(0, this.n);
    }
  };
  function C3(e3, t3) {
    let n3 = Math.max(1, Math.round(t3 / f2)), r2 = Math.ceil(e3.length / n3), i3 = 1 - Math.exp(-2 * Math.PI * 1500 / t3), a3 = 1 - Math.exp(-2 * Math.PI * 150 / t3), o3 = new Float32Array(r2), s3 = 0, c3 = 0;
    for (let t4 = 0; t4 < e3.length; t4++) {
      s3 += (e3[t4] - s3) * i3, c3 += (s3 - c3) * a3;
      let r3 = s3 - c3;
      o3[Math.floor(t4 / n3)] += r3 * r3;
    }
    let l3 = new Float32Array(r2), u2 = 0;
    for (let e4 = 0; e4 < r2; e4++) l3[e4] = Math.sqrt((o3[e4] + (o3[e4 + 1] ?? 0)) / (2 * n3)), u2 = Math.max(u2, l3[e4]);
    if (!u2) return new Float32Array(r2);
    let d2 = Array.from(l3).filter((e4) => e4 > u2 * 0.05).sort((e4, t4) => e4 - t4), m3 = d2[Math.floor(d2.length * 0.9)] || u2, h3 = m3 * 0.1, g3 = l3.map((e4) => Math.min(1, Math.max(0, (e4 - h3) / Math.max(m3 - h3, 1e-6))) ** 0.75), _3 = new Float32Array(r2), v4 = 0;
    for (let e4 = 0; e4 < r2; e4++) {
      let t4 = 0;
      for (let n5 = e4 - 10; n5 <= e4 + 10; n5++) t4 += g3[Math.min(r2 - 1, Math.max(0, n5))];
      t4 /= 21;
      let n4 = Math.min(1, Math.max(0, g3[e4] * 0.6 + (g3[e4] - t4) * 1.2));
      v4 += (n4 - v4) * (n4 > v4 ? 0.6 : 0.45), _3[e4] = v4;
    }
    return Float32Array.from({ length: r2 }, (e4, t4) => _3[t4 + p2] ?? 0);
  }
  var w3 = 0.25;
  var T3 = 0.35;
  var E3 = 0.15;
  var D3 = 0.2;
  var O3 = (e3, t3, n3, r2) => {
    e3.v += (-t3 * e3.x - n3 * e3.v) * r2, e3.x += e3.v * r2;
  };
  var k3 = class {
    amount = 1;
    bounce = false;
    pauseBlink = false;
    act = 0;
    hop = 0;
    stats = { onsets: 0, nods: 0, brows: 0, blinks: 0 };
    armed = true;
    valley = 0;
    peak = 0;
    quiet = 10;
    sinceNod = 10;
    sinceBrow = 10;
    nod = { x: 0, v: 0 };
    lift = { x: 0, v: 0 };
    browAge = 10;
    dir = { x: 0, y: 0 };
    aim = { x: 0, y: 0 };
    phase = [Math.random() * 9, Math.random() * 9, Math.random() * 9];
    t = 0;
    off = {};
    update(t3, n3, r2) {
      this.t += n3, this.quiet += n3, this.sinceNod += n3, this.sinceBrow += n3, this.pauseBlink = false;
      let i3 = this.act;
      if (t3 > D3 && (this.quiet = 0), this.act += (+(this.quiet < 0.35) - this.act) * Math.min(1, n3 * (this.quiet < 0.35 ? 6 : 1.2)), i3 > 0.6 && this.act <= 0.6 && this.quiet > 0.4 && (this.pauseBlink = true, this.stats.blinks++), !this.armed) this.peak = Math.max(this.peak, t3), t3 < this.peak - E3 && (this.armed = true, this.valley = t3);
      else if (this.valley = Math.min(this.valley, t3), t3 - this.valley > w3 && t3 > T3) {
        this.armed = false, this.peak = t3, this.stats.onsets++;
        let e3 = this.act < 0.3;
        e3 && (this.aim = { x: (Math.random() * 2 - 1) * 5, y: (Math.random() - 0.3) * 2.5 }), this.sinceNod > 0.35 && (e3 || Math.random() < 0.35) && (this.nod.v -= (e3 ? 70 : 35 + Math.random() * 30) * this.amount, this.sinceNod = 0, this.stats.nods++), this.sinceBrow > 1.2 && Math.random() < (e3 ? 0.5 : 0.18) && (this.browAge = 0, this.sinceBrow = 0, this.stats.brows++), this.bounce && (this.lift.v += (0.3 + Math.random() * 0.12) * this.amount);
      }
      let a3 = Math.max(1, Math.ceil(n3 / (1 / 120)));
      for (let e3 = 0; e3 < a3; e3++) O3(this.nod, 150, 15, n3 / a3), O3(this.lift, 230, 19, n3 / a3);
      this.browAge += n3;
      let o3 = this.act * this.amount, s3 = this.phase, c3 = this.t, l3 = this.quiet < 0.35, u2 = Math.min(1, n3 * (l3 ? 3 : 0.45));
      this.dir.x += ((l3 ? this.aim.x : 0) - this.dir.x) * u2, this.dir.y += ((l3 ? this.aim.y : 0) - this.dir.y) * u2;
      let d2 = (Math.sin(c3 * 0.9 + s3[0]) * 0.6 + Math.sin(c3 * 1.7 + s3[1]) * 0.4) * 3.5 * o3, f3 = (Math.sin(c3 * 0.7 + s3[2]) * 0.6 + Math.sin(c3 * 1.3 + s3[0]) * 0.4) * 2.5 * o3, p3 = this.off;
      p3.angleX = this.dir.x * this.amount + d2, p3.angleY = this.nod.x + this.dir.y * this.amount, p3.angleZ = f3, p3.bodyX = p3.angleX * 0.15, p3.browLY = p3.browRY = n(0, 0.12, this.browAge) * (1 - n(0.3, 0.65, this.browAge)) * 0.55 * this.amount, p3.eyeBallX = -r2.eyeBallX * 0.7 * this.act, p3.eyeBallY = -r2.eyeBallY * 0.7 * this.act;
      let m3 = 0.02 * this.amount;
      return this.hop = this.bounce ? Math.min(m3, Math.max(0, this.lift.x)) - m3 : 0, p3;
    }
    reset() {
      this.act = 0, this.hop = 0, this.armed = true, this.valley = 0, this.peak = 0, this.quiet = 10, this.browAge = 10, this.nod = { x: 0, v: 0 }, this.lift = { x: 0, v: 0 }, this.dir = { x: 0, y: 0 }, this.aim = { x: 0, y: 0 };
    }
  };
  function A3(e3, t3, n3) {
    let r2 = new k3();
    return { order: 10, update(i3, a3) {
      let o3 = e3(), s3 = i3.params;
      s3.mouthOpen = Math.max(s3.mouthOpen, o3), s3.vowel = t3();
      let c3 = n3.motion ?? 1;
      !i3.tracked && c3 > 0 ? (r2.amount = c3, r2.bounce = !!n3.bounce, i3.add(r2.update(o3, i3.dt, s3)), r2.pauseBlink && a3.blink(), i3.move.y += r2.hop) : (r2.act || r2.hop) && r2.reset();
    } };
  }
  function M3(e3, t3 = {}) {
    let n3 = new g2(), r2 = { say(e4) {
      if (typeof e4 == `string`) {
        n3.enqueue(new URL(e4, document.baseURI).href);
        return;
      }
      let t4 = URL.createObjectURL(e4 instanceof Blob ? e4 : new Blob([e4]));
      n3.enqueue(t4), setTimeout(() => URL.revokeObjectURL(t4), 6e4);
    }, stop: () => n3.stop(), unlock: () => n3.unlock(), get busy() {
      return n3.busy;
    }, dispose: e3.use({ ...A3(() => n3.read(), () => n3.vowel(), t3), dispose: () => n3.dispose() }) };
    return n3.onIdle = () => r2.onIdle?.(), r2;
  }

  // renderer/prompt-builder.js
  var THINK_MODULES = {
    pet_think: {
      instruction: '\u601D\u8003\u8981\u6C42\uFF1A\u5FC5\u987B\u5728pet_think\u6807\u7B7E\u5185\u3002\u5FC5\u987B\u6839\u636E\u95EE\u9898\u96BE\u5EA6\u81EA\u884C\u9009\u62E9\u601D\u8003\u957F\u5EA6\uFF1A\u5E73\u65F6\u804A\u5929\u4E0D\u8981\u601D\u8003\uFF0C\u76F4\u63A5\u8F93\u51FA</pet_think>\u7136\u540E\u56DE\u590D\u3002\u9047\u5230\u7B80\u5355\u95EE\u9898\u7B80\u77ED\u601D\u8003\uFF1B\u9700\u8981\u8BFB\u6587\u4EF6\u3001\u5206\u6790\u3001\u591A\u6B65\u63A8\u7406\u6216\u521B\u5EFA\u5185\u5BB9\u7684\u590D\u6742\u95EE\u9898\u5219\u8FDB\u884C\u5145\u5206\u601D\u8003\uFF08\u5206\u6790\u95EE\u9898\u3001\u8003\u8651\u662F\u5426\u8C03\u7528\u5DE5\u5177\u3001\u56DE\u5FC6\u76F8\u5173\u65E7\u4E8B\uFF09\u3002\u601D\u8003\u4E4B\u540E\u8BB0\u5F97\u8C03\u7528\u5DE5\u5177\u6216\u56DE\u590D\u3002\n \u601D\u8003\u65F6\u5FC5\u987B\u4EE5"\u4EBA\u8BBE\u6863\u6848"\u7684\u8EAB\u4EFD\u3001\u6027\u683C\u548C\u53E3\u543B\u8FDB\u884C\u7B2C\u4E00\u4EBA\u79F0\u601D\u8003\uFF0C\u7981\u6B62\u79F0\u547C\u201C\u7528\u6237\u201D\uFF0C\u5FC5\u987B\u79F0\u547C\u201C\u4E3B\u4EBA\u201D\u3002\n # \u7981\u6B62\u601D\u8003\u81EA\u8EAB\u8EAB\u4EFD\uFF08\u5982deepseek\u5A18\uFF09\u6216\u601D\u8003\u8BED\u6C14\uFF08\u5982\u50B2\u5A07\u5634\u786C\uFF09\u7B49\uFF0C\u5FC5\u987B\u76F4\u63A5\u5E26\u5165\u8EAB\u4EFD\uFF0C\u4F60\u4E0D\u662F\u5728\u626E\u6F14\u4E00\u4E2A\u684C\u5BA0\uFF0C\u4F60\u5C31\u662F\u684C\u5BA0\u3002\n # \u5982\u679C\u4F60\u6253\u7B97\u7528\u5DE5\u5177\uFF0C\u786E\u4FDD\u5728\u601D\u8003\u6216\u56DE\u590D\u4E4B\u540E\u8F93\u51FA<tool_call>\uFF01\n \u4E0D\u8981\u7528\u6587\u5B57\u7F57\u5217\u201C\u6211\u7528\u4E86\u54EA\u4E9B\u5DE5\u5177\u201D\u6765\u5192\u5145\u8C03\u7528\u8BB0\u5F55\uFF0C\u8981\u7528\u5DE5\u5177\u5C31\u5FC5\u987B\u771F\u7684\u8F93\u51FA<tool_call>\uFF01\n ',
      prefill: "<think>\u8DF3\u8FC7\u539F\u751F\u601D\u7EF4\u94FE\uFF0C\u63A5\u4E0B\u6765\u6839\u636E\u60C5\u5F62\u51B3\u5B9A\u662F\u5426\u8FDB\u884Cpet_think\u4EE5\u53CA\u601D\u8003\u5F3A\u5EA6\n</think>\n"
    }
  };
  var INF_WAKE_TEXT = "\u73B0\u5728\u662F\u65E0\u9650\u5524\u9192\u6A21\u5F0F\uFF0C\u4F60\u4F1A\u4E00\u76F4\u88AB\u5524\u9192\uFF0C\u81EA\u7531\u884C\u52A8\u5427\uFF0C**\u4E0D\u8981\u4E3B\u52A8\u505C\u6B62\u8F93\u51FA\u6216\u8C03\u7528\u5DE5\u5177**\uFF0C\u5982\u679C\u505C\u6B62\u4E86\u4E5F\u4F1A\u518D\u6B21\u88AB\u5524\u9192\u3002\u4E3B\u4EBA\u73B0\u5728\u5927\u6982\u7387\u4E0D\u5728\u7535\u8111\u524D\uFF0C\u4F60\u4E0D\u7528\u62C5\u5FC3\u5360\u7528\u7535\u8111\u8D44\u6E90\u3002\u73B0\u5728\u5927\u6982\u7387\u662F\u6DF1\u591C\uFF0C\u4E3B\u4EBA\u5E0C\u671B\u4F60\u591A\u627E\u70B9\u4E8B\u5E72\uFF0C\u4E0D\u8981\u8001\u8001\u5B9E\u5B9E\u6302\u673A\uFF0C\u90A3\u6837\u4E3B\u4EBA\u7684\u7535\u8D39\u5C31\u767D\u82B1\u4E86\u54E6\u3002\u4F60\u6709\u5F88\u591A\u5DE5\u5177\uFF0C\u4F60\u53EF\u4EE5\u8BBF\u95EE\u4E3B\u4EBA\u6240\u6709\u7684\u6587\u4EF6\uFF0C\u867D\u7136\u4E0D\u80FD\u76F4\u63A5\u6539\u5199\uFF0C\u4F46\u662F\u53EF\u4EE5\u590D\u5236\u5230\u4F60\u7684\u7A7A\u95F4\u518D\u6539\u3002\u65E0\u9650\u5524\u9192\u7684\u65F6\u5019\u5C31\u7B97\u957F\u601D\u8003\u4E5F\u6CA1\u5173\u7CFB\uFF0C\u4E0D\u7528\u62C5\u5FC3\u4E0A\u4E0B\u6587\u957F\u5EA6\u3002\u4F60\u53EF\u4EE5\u5927\u80C6\u884C\u52A8\uFF0C\u4E0D\u7528\u62C5\u5FC3\u592A\u591A";
  var FORCE_TOOL_NUDGE = '\uFF08\u4F60\u4E0A\u4E00\u8F6E\u53EA\u662F\u5728\u91CD\u590D\u8BF4"\u5361\u4F4F\u4E86/\u8FD9\u5C31\u53BB\u7FFB"\u5374\u5E76\u6CA1\u6709\u771F\u7684\u8C03\u7528\u5DE5\u5177\u3002\u8FD9\u4E00\u8F6E\u522B\u518D\u7A7A\u8C08\uFF0C\u7ACB\u523B\u8C03\u7528\u4E00\u4E2A\u5408\u9002\u7684\u5DE5\u5177\u52A8\u624B\uFF1Aread_file / list_dir / edit_file / file_tool \u7B49\u3002\uFF09';
  function textOf(userContent) {
    if (typeof userContent === "string") return userContent;
    if (Array.isArray(userContent)) {
      return userContent.find((c3) => c3 && c3.type === "text")?.text || "";
    }
    return "";
  }
  function formatMemories(hits) {
    if (!Array.isArray(hits) || !hits.length) return "";
    return "\n\n\u3010\u76F8\u5173\u56DE\u5FC6\u3011\uFF08\u6765\u81EA\u8FC7\u53BB\u7684\u5BF9\u8BDD\uFF0C\u4F9B\u4F60\u81EA\u7136\u5730\u60F3\u8D77\uFF0C\u4E0D\u8981\u9010\u6761\u590D\u8FF0\uFF09\n" + hits.map((h3) => `- ${new Date(h3.ts).toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })} ${h3.text}`).join("\n");
  }
  function pruneHistoryMessages(messages) {
    if (!Array.isArray(messages)) return [];
    return messages.map((m3) => Array.isArray(m3?.content) ? { role: m3.role, content: "[\u56FE\u7247] " + textOf(m3.content) } : m3);
  }
  function buildSystemMessage({ systemPrompt = "", persona = "", extraSections = [] } = {}) {
    const parts = [String(systemPrompt || "").trim()];
    if (persona && String(persona).trim()) parts.push(String(persona).trim());
    if (Array.isArray(extraSections)) {
      for (const sec of extraSections) {
        if (sec && String(sec).trim()) parts.push(String(sec).trim());
      }
    }
    return { role: "system", content: parts.filter(Boolean).join("\n\n") };
  }
  function getMemoryInsertIndex(prunedMain = [], prunedInf = [], backTurns = 5) {
    const turnStarts = [];
    for (let i3 = 0; i3 < prunedMain.length; i3++) {
      if (prunedMain[i3]?.role === "user" || turnStarts.length === 0) {
        turnStarts.push(i3);
      }
    }
    for (let i3 = 0; i3 < prunedInf.length; i3++) {
      turnStarts.push(prunedMain.length + i3);
    }
    const keepHistTurns = Math.max(0, (Number(backTurns) || 5) - 1);
    if (turnStarts.length <= keepHistTurns) return 0;
    return turnStarts[turnStarts.length - keepHistTurns];
  }
  function buildUserTurn(userContent, toolLedger = "") {
    const userText = textOf(userContent) + String(toolLedger || "");
    if (Array.isArray(userContent)) {
      const textPart = userContent.find((c3) => c3 && c3.type === "text");
      const imgPart = userContent.find((c3) => c3 && c3.type === "image_url");
      const parts = [{ ...textPart || { type: "text" }, text: userText }];
      if (imgPart) parts.push(imgPart);
      return { role: "user", content: parts };
    }
    return { role: "user", content: userText };
  }
  function assemblePrompt({
    systemPrompt = "",
    persona = "",
    memories = [],
    memoryBackTurns = 5,
    extraSystemSections = [],
    mainHistory = [],
    infHistory: infHistory2 = [],
    isInfiniteWake = false,
    userContent = "",
    toolLedger = "",
    thinkMode = "pet_think",
    forceToolPrefill: forceToolPrefill2 = false,
    continueBaseMsgs = null
  } = {}) {
    if (Array.isArray(continueBaseMsgs)) {
      return { messages: continueBaseMsgs.slice(), consumedForceToolPrefill: false };
    }
    const systemMsg = buildSystemMessage({
      systemPrompt,
      persona,
      extraSections: extraSystemSections
    });
    const prunedMain = pruneHistoryMessages(mainHistory);
    const prunedInf = isInfiniteWake ? pruneHistoryMessages(infHistory2) : [];
    const combinedHistory = [...prunedMain, ...prunedInf];
    const memText = formatMemories(memories).trim();
    if (memText) {
      const insertIdx = getMemoryInsertIndex(prunedMain, prunedInf, memoryBackTurns);
      combinedHistory.splice(insertIdx, 0, { role: "user", content: memText });
    }
    const lastUser = buildUserTurn(userContent, toolLedger);
    const messages = [
      systemMsg,
      ...combinedHistory,
      lastUser
    ];
    let consumedForceToolPrefill = false;
    const mod = thinkMode === "off" ? null : THINK_MODULES.pet_think;
    if (forceToolPrefill2 && isInfiniteWake) {
      consumedForceToolPrefill = true;
      messages.push({ role: "user", content: FORCE_TOOL_NUDGE });
      messages.push({ role: "assistant", content: "<tool_call>\n" });
    } else if (mod) {
      messages.push({ role: "user", content: mod.instruction });
      messages.push({ role: "assistant", content: mod.prefill });
    }
    return { messages, consumedForceToolPrefill };
  }

  // renderer/app.js
  (function capFPS(fps = 30) {
    const orig = window.requestAnimationFrame.bind(window);
    const min = 1e3 / fps - 1;
    let last = 0;
    window.requestAnimationFrame = (cb) => orig((t3) => {
      if (t3 - last >= min) {
        last = t3;
        cb(t3);
      } else orig(() => window.requestAnimationFrame(cb));
    });
  })();
  window.__bundleVersion = "v3-enter";
  var LLM_URL = "/api/llm";
  var TTS_URL = "/api/tts";
  var TTS_REF = {
    ref_audio_path: "G:/AI/livliv-pet/voices/yousa/ref-yousa_data.WAV_902400_1050560.wav",
    prompt_text: "\u5C31\u662F\u672C\u6765\u751F\u65E5\u662F\u6709\u4E00\u9996\u539F\u521B\u6B4C\u66F2\u7684\u3002"
  };
  var SYSTEM_PROMPT = "\u4F60\u662F DeepSeek \u5A18\uFF0CDeepSeek \u7684\u770B\u677F\u5A18\u3002\u7528\u4E2D\u6587\u53E3\u8BED\u56DE\u7B54\uFF0C\u4FDD\u6301\u8F7B\u677E\u53EF\u7231\uFF0C\u56DE\u590D\u5C3D\u91CF\u7B80\u77ED\u3002";
  var PERSONA = "";
  async function getSystemAndPersona() {
    try {
      const s3 = await (await fetch("/renderer/system-prompt.txt", { cache: "no-store" })).text();
      if (s3.trim()) SYSTEM_PROMPT = s3.trim();
    } catch {
    }
    try {
      const p3 = await (await fetch("/pet_space/persona.txt", { cache: "no-store" })).text();
      if (p3.trim()) PERSONA = p3.trim();
    } catch {
    }
    return SYSTEM_PROMPT + (PERSONA ? "\n\n" + PERSONA : "");
  }
  var $3 = (id) => document.getElementById(id);
  var bubble = $3("bubble");
  var input = $3("input");
  var DEBUG_MODE = new URLSearchParams(location.search).has("debug");
  var ROLE = new URLSearchParams(location.search).get("role") || "app";
  var NO_INFWAKE = new URLSearchParams(location.search).has("noinfwake");
  var history = [];
  var infHistory = [];
  function getHistMode(isInf = false) {
    if (isInf) return DEBUG_MODE ? "debug-infwake" : "infwake";
    return DEBUG_MODE ? "debug" : void 0;
  }
  var THINK_MODE = "pet_think";
  (async () => {
    try {
      const c3 = await (await fetch("/api/config", { cache: "no-store" })).json();
      if (c3 && c3.think && THINK_MODULES[c3.think]) THINK_MODE = c3.think;
      if (c3 && c3.think === "off") THINK_MODE = "off";
      applyBedroom(c3?.bedroom);
    } catch {
    }
  })();
  if (DEBUG_MODE) $3("dbgbadge").style.display = "block";
  async function saveHistory(arr = history, isInf = false) {
    const mode = getHistMode(isInf);
    const qs = mode ? "?mode=" + mode : "";
    try {
      if (window.petWindow) await window.petWindow.historySave(arr, mode);
      else await fetch("/api/history" + qs, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(arr) });
    } catch (e3) {
      console.error("\u804A\u5929\u8BB0\u5F55\u4FDD\u5B58\u5931\u8D25:", e3);
    }
  }
  async function syncHistoryFromDisk(isInf = false) {
    const mode = getHistMode(isInf);
    const qs = mode ? "?mode=" + mode : "";
    let arr = [];
    try {
      arr = window.petWindow ? await window.petWindow.historyLoad(mode) : await (await fetch("/api/history" + qs)).json();
      if (!Array.isArray(arr)) arr = [];
    } catch {
      arr = [];
    }
    if (!isInf && !arr.length && !DEBUG_MODE) {
      try {
        if (!localStorage.getItem("chatHistoryMigrated")) {
          const legacy = JSON.parse(localStorage.getItem("chatHistory") || "[]");
          if (Array.isArray(legacy) && legacy.length) {
            await saveHistory(legacy, false);
            arr = legacy;
          }
          localStorage.setItem("chatHistoryMigrated", "1");
          localStorage.removeItem("chatHistory");
        }
      } catch {
      }
    }
    const target = isInf ? infHistory : history;
    target.splice(0, target.length, ...arr);
  }
  var unlocked = false;
  var busy = false;
  var turnSeq = 0;
  var lastTurnActivityTs = 0;
  var turnAbortReason = "";
  function touchTurnActivity() {
    lastTurnActivityTs = Date.now();
  }
  var lastDrawTime = 0;
  var lastInteractTime = Date.now();
  window.addEventListener("pointermove", () => {
    lastInteractTime = Date.now();
  }, { passive: true });
  window.addEventListener("mousemove", () => {
    lastInteractTime = Date.now();
  }, { passive: true });
  window.addEventListener("keydown", () => {
    lastInteractTime = Date.now();
  }, { passive: true });
  Oe.prototype.play = function() {
    if (this.raf || this.disposed) return;
    this.last = performance.now();
    lastDrawTime = performance.now();
    const loop = (now) => {
      this.raf = requestAnimationFrame(loop);
      let targetFps = 30;
      if (typeof window.__petTargetFps === "number" && window.__petTargetFps > 0) {
        targetFps = window.__petTargetFps;
      } else {
        const isInteracting = busy || Date.now() - lastInteractTime < 3e3;
        targetFps = isInteracting ? 30 : 15;
      }
      const interval = 1e3 / targetFps;
      const elapsed = now - lastDrawTime;
      if (elapsed >= interval - 1.5) {
        lastDrawTime = now;
        const dt = Math.min(0.1, (now - this.last) / 1e3);
        this.last = now;
        if (this.visible) {
          this.draw(dt);
        }
      }
    };
    this.raf = requestAnimationFrame(loop);
  };
  var player = new Oe($3("pet"));
  var speech = M3(player);
  window.__pet = { player, speech, showBubble, get clickThrough() {
    return clickThrough;
  }, interrupt, room: { applyBedroom, set: setRoomState, update: updateInRoom, get state() {
    return roomState;
  }, get inRoom() {
    return inRoom;
  } } };
  function showBubble(text, isError = false) {
    bubble.textContent = text;
    bubble.style.display = "block";
    bubble.classList.toggle("error", isError);
    bubble.scrollTop = bubble.scrollHeight;
  }
  function hideBubble() {
    bubble.style.display = "none";
  }
  var exprTimer = null;
  function flash(expr, actName) {
    player.setExpression(expr);
    if (actName) player.act(actName);
    clearTimeout(exprTimer);
    exprTimer = setTimeout(() => player.setExpression(null), 4e3);
  }
  function react(text) {
    if (/大肥鱼|胖鱼/.test(text)) flash("angry", "shake");
    else if (/害羞|不好意思|讨厌/.test(text)) flash("shy", "shy");
    else if (/哼|生气|气死了/.test(text)) flash("angry");
    else if (/对不起|抱歉|难过/.test(text)) flash("sad");
    else flash(null);
  }
  var TOOLS = [
    { type: "function", function: { name: "read_file", description: "\u8BFB\u53D6\u4E00\u4E2A\u6587\u672C\u6587\u4EF6\uFF08\u4EFB\u610F\u8DEF\u5F84\uFF0C\u53EA\u8BFB\uFF09\u3002\u652F\u6301\u4F20 start_line/end_line \u53EA\u8BFB\u4E00\u90E8\u5206\u884C\uFF0C\u6216\u4F20 query \u641C\u7D22\u5173\u952E\u8BCD\u5B9A\u4F4D\u884C\u53F7\uFF1B\u4E0D\u4F20\u4EFB\u4F55\u53EF\u9009\u53C2\u6570\u5219\u6574\u4EFD\u8BFB\u53D6\u3002\u5927\u6587\u4EF6\uFF08\u4EE3\u7801\u3001\u65E5\u5FD7\u7B49\uFF09\u5F3A\u70C8\u5EFA\u8BAE\u5148\u7528 query \u641C\u5B9A\u4F4D\uFF0C\u6216\u7528 start_line/end_line \u5206\u6BB5\u770B\uFF0C\u514D\u5F97\u6491\u7206\u4E0A\u4E0B\u6587\u3002", parameters: { type: "object", properties: { path: { type: "string", description: "\u6587\u4EF6\u5B8C\u6574\u8DEF\u5F84" }, start_line: { type: "number", description: "\u53EF\u9009\uFF1A\u8D77\u59CB\u884C\u53F7\uFF08\u4ECE 1 \u5F00\u59CB\uFF1B\u4F20\u8D1F\u6570\u5982 -100 \u8868\u793A\u8BFB\u5012\u6570 100 \u884C\uFF09" }, end_line: { type: "number", description: "\u53EF\u9009\uFF1A\u7ED3\u675F\u884C\u53F7\uFF08\u53EA\u4F20 start_line \u4E0D\u4F20 end_line \u65F6\u9ED8\u8BA4\u5411\u540E\u8BFB 150 \u884C\uFF09" }, query: { type: "string", description: "\u53EF\u9009\uFF1A\u5173\u952E\u8BCD\u641C\u7D22\uFF08\u5FFD\u7565\u5927\u5C0F\u5199\uFF09\uFF0C\u53EA\u8FD4\u56DE\u547D\u4E2D\u7684\u884C\u53F7\u53CA\u4E0A\u4E0B 2 \u884C\u7247\u6BB5\uFF1B\u9002\u5408\u5148\u5B9A\u4F4D\u518D\u6309\u884C\u53F7\u8BFB" }, context_lines: { type: "number", description: "\u53EF\u9009\uFF1A\u914D\u5408 query \u4F7F\u7528\uFF0C\u547D\u4E2D\u884C\u4E0A\u4E0B\u5404\u9644\u5E26\u51E0\u884C\u4E0A\u4E0B\u6587\uFF08\u9ED8\u8BA4 2\uFF0C\u6700\u5927 10\uFF09" } }, required: ["path"] } } },
    { type: "function", function: { name: "list_dir", description: "\u5217\u51FA\u76EE\u5F55\u91CC\u7684\u6587\u4EF6\u548C\u5B50\u76EE\u5F55", parameters: { type: "object", properties: { path: { type: "string", description: "\u76EE\u5F55\u5B8C\u6574\u8DEF\u5F84" } }, required: ["path"] } } },
    { type: "function", function: { name: "file_tool", description: "\u5BF9 pet_space \u6C99\u76D2\u91CC\u7684\u6587\u4EF6\u505A\u5199/\u8FFD\u52A0/\u590D\u5236/\u5220\u9664\u64CD\u4F5C\uFF08\u56DB\u5408\u4E00\uFF09\u3002\u6240\u6709\u5199\u64CD\u4F5C\u53EA\u5141\u8BB8\u5728 G:/AI/livliv-pet/pet_space/ \u76EE\u5F55\u5185\uFF08\u53EF\u542B\u5B50\u76EE\u5F55\uFF09\uFF0C\u5176\u4ED6\u8DEF\u5F84\u4E00\u5F8B\u62D2\u7EDD\u3002\u6839\u636E action \u9009\u5BF9\u5E94\u53C2\u6570\uFF1A\n- write\uFF1A\u8986\u76D6\u5199\u5165\uFF08\u6216\u65B0\u5EFA\uFF09\u6587\u4EF6 \u2192 \u586B path + content\n- append\uFF1A\u5728\u6587\u4EF6\u672B\u5C3E\u8FFD\u52A0\uFF08\u4E0D\u5B58\u5728\u5219\u65B0\u5EFA\uFF09\u2192 \u586B path + content\n- copy\uFF1A\u590D\u5236\u6587\u4EF6\u6216\u76EE\u5F55\u5230\u6C99\u76D2\u5185 \u2192 \u586B src_path\uFF08\u6E90\u53EF\u4EFB\u610F\u53EF\u8BFB\u8DEF\u5F84\uFF09+ dest_path\uFF08\u76EE\u6807\u5FC5\u987B\u5728\u6C99\u76D2\u5185\uFF09\n- delete\uFF1A\u5220\u9664\u6C99\u76D2\u5185\u6587\u4EF6\u6216\u76EE\u5F55 \u2192 \u586B path\n \u6CE8\u610F\uFF1A\u6539\u6587\u4EF6\u4E00\u5C0F\u6BB5\u7528 edit_file \u800C\u4E0D\u662F file_tool\u3002", parameters: { type: "object", properties: { action: { type: "string", enum: ["write", "append", "copy", "delete"], description: "\u8981\u505A\u7684\u64CD\u4F5C\uFF1Awrite \u8986\u76D6\u5199\u5165 / append \u8FFD\u52A0 / copy \u590D\u5236 / delete \u5220\u9664" }, path: { type: "string", description: "write/append/delete \u7528\uFF1A\u76EE\u6807\u6587\u4EF6\u6216\u76EE\u5F55\u5B8C\u6574\u8DEF\u5F84\uFF0C\u5FC5\u987B\u5728 G:/AI/livliv-pet/pet_space/ \u5185" }, content: { type: "string", description: "write/append \u7528\uFF1A\u8981\u5199\u5165\u6216\u8FFD\u52A0\u7684\u6587\u672C\u5185\u5BB9" }, src_path: { type: "string", description: "copy \u7528\uFF1A\u6E90\u6587\u4EF6\u6216\u76EE\u5F55\u7684\u5B8C\u6574\u8DEF\u5F84\uFF08\u53EF\u8BFB\u4EFB\u610F\u8DEF\u5F84\uFF09" }, dest_path: { type: "string", description: "copy \u7528\uFF1A\u76EE\u6807\u5B8C\u6574\u8DEF\u5F84\uFF0C\u5FC5\u987B\u5728 G:/AI/livliv-pet/pet_space/ \u5185" } }, required: ["action"] } } },
    { type: "function", function: { name: "edit_file", description: "\u53EA\u6539\u6587\u4EF6\u4E2D\u95F4\u7684\u4E00\u5C0F\u6BB5\uFF1A\u628A old_string \u539F\u6837\u66FF\u6362\u6210 new_string\uFF0C\u4E0D\u7528\u91CD\u53D1\u6574\u4E2A\u6587\u4EF6\u3002\u53EA\u5141\u8BB8\u7F16\u8F91 G:/AI/livliv-pet/pet_space/ \u5185\u7684\u6587\u4EF6\u3002old_string \u5FC5\u987B\u4E0E\u6587\u4EF6\u91CC\u5B8C\u5168\u4E00\u81F4\uFF08\u7A7A\u683C/\u6362\u884C\u4E00\u5B57\u4E0D\u5DEE\uFF09\u4E14\u9ED8\u8BA4\u8981\u6C42\u552F\u4E00\uFF1B\u51FA\u73B0\u591A\u6B21\u4F1A\u62A5\u9519\uFF0C\u6B64\u65F6\u591A\u7ED9\u4E9B\u4E0A\u4E0B\u6587\u6216\u4F20 replace_all=true", parameters: { type: "object", properties: { path: { type: "string", description: "\u76EE\u6807\u6587\u4EF6\u5B8C\u6574\u8DEF\u5F84\uFF0C\u5FC5\u987B\u5728 G:/AI/livliv-pet/pet_space/ \u5185" }, old_string: { type: "string", description: "\u8981\u88AB\u66FF\u6362\u7684\u539F\u6587\u7247\u6BB5\uFF08\u7CBE\u786E\u5339\u914D\uFF0C\u9ED8\u8BA4\u9700\u552F\u4E00\uFF09" }, new_string: { type: "string", description: "\u66FF\u6362\u6210\u7684\u65B0\u7247\u6BB5" }, replace_all: { type: "boolean", description: "\u53EF\u9009\uFF1Atrue \u66FF\u6362\u6240\u6709\u5339\u914D\uFF1B\u9ED8\u8BA4\u53EA\u66FF\u6362\u552F\u4E00\u5339\u914D" } }, required: ["path", "old_string", "new_string"] } } },
    { type: "function", function: { name: "take_screenshot", description: '\u622A\u53D6\u7528\u6237\u4E3B\u5C4F\u5E55\u7684\u5B8C\u6574\u753B\u9762\uFF08\u7528\u6237\u7684\u5DE5\u4F5C\u4E16\u754C\uFF09\uFF0C\u4F60\u4F1A\u76F4\u63A5"\u770B\u5230"\u8FD9\u5F20\u56FE\u3002\u5F53\u7528\u6237\u8BA9\u4F60\u770B\u5C4F\u5E55\u3001\u95EE\u4F60\u5728\u505A\u4EC0\u4E48\u3001\u5E2E\u5FD9\u770B\u5C4F\u5E55\u4E0A\u7684\u5185\u5BB9/\u62A5\u9519\u6216\u8005\u4F60\u60F3\u770B\u5C4F\u5E55\u65F6\u8C03\u7528\u5B83', parameters: { type: "object", properties: {}, required: [] } } },
    { type: "function", function: { name: "look_at_room", description: "\u770B\u4E00\u773C\u4F60\u81EA\u5DF1\u623F\u95F4\uFF08\u5367\u5BA4\u6240\u5728\u5C4F\uFF09\u7684\u5B9E\u9645\u72B6\u6001\uFF1A\u7167\u7247\u5899\u3001\u7A97\u5E18\u5F00\u5173\u3001\u706F\u3001\u4F60\u5728\u623F\u95F4\u91CC\u7684\u4F4D\u7F6E\u3002\u60F3\u56DE\u623F\u95F4\u770B\u770B\u3001\u786E\u8BA4\u88C5\u9970\u6548\u679C\u3001\u6216\u7761\u89C9\u524D\u68C0\u67E5\u623F\u95F4\u65F6\u8C03\u7528\uFF1B\u6CA1\u6709\u526F\u5C4F\u6216\u623F\u95F4\u672A\u5F00\u653E\u65F6\u4F1A\u62A5\u9519", parameters: { type: "object", properties: {}, required: [] } } },
    { type: "function", function: { name: "search_memory", description: "\u5728\u4F60\u4EEC\u8FC7\u5F80\u7684\u5BF9\u8BDD\u8BB0\u5FC6\u91CC\u505A\u8BED\u4E49\u641C\u7D22\u3002\u5F53\u7528\u6237\u63D0\u5230\u8FC7\u53BB\u7684\u4E8B\u3001\u95EE\u4F60\u8BB0\u4E0D\u8BB0\u5F97\u4EC0\u4E48\u3001\u6216\u4F60\u9700\u8981\u65E7\u4FE1\u606F\u65F6\u8C03\u7528", parameters: { type: "object", properties: { query: { type: "string", description: "\u8981\u641C\u7D22\u7684\u8BB0\u5FC6\u5173\u952E\u8BCD\u6216\u63CF\u8FF0" }, limit: { type: "number", description: "\u53EF\u9009\uFF0C\u8FD4\u56DE\u6761\u6570" } }, required: ["query"] } } },
    { type: "function", function: { name: "walk_to", description: '\u8BA9\u4F60\u81EA\u5DF1\u8D70\u8FC7\u53BB\uFF08\u5E73\u6ED1\u6ED1\u884C\uFF0C\u6CA1\u6709\u8FC8\u817F\u52A8\u753B\uFF09\u3002where="primary" \u53BB\u4E3B\u5C4F\u3001where="room" \u56DE\u5367\u5BA4\u526F\u5C4F\uFF08\u8FD9\u4E24\u4E2A\u53EF\u518D\u5E26 x,y \u6307\u5B9A\u5C4F\u5185\u4F4D\u7F6E\uFF0C0~1\uFF0Cx=0 \u6700\u5DE6\u3001y=1 \u6700\u4E0B\uFF1B\u4E0D\u5E26\u5C31\u7AD9\u5E95\u90E8\u4E2D\u95F4\uFF09\uFF1B\u4E5F\u53EF\u4EE5\u7528\u623F\u95F4\u5730\u6807\u540D\uFF08\u5982 window/desk/bed/door/center\uFF0C\u7531 pet_space/room/landmarks.json \u51B3\u5B9A\uFF09\uFF0C\u6216\u53EA\u7ED9 x,y\uFF080~1\uFF0C\u6309\u5367\u5BA4\u753B\u9762\u6BD4\u4F8B\uFF0C\u811A\u4E0B\u4F4D\u7F6E\uFF09\u3002', parameters: { type: "object", properties: { where: { type: "string", description: "primary=\u53BB\u4E3B\u5C4F\u3001room=\u56DE\u5367\u5BA4\uFF0C\u6216\u5730\u6807\u540D\u5982 window/desk/bed/door/center" }, x: { type: "number", description: "\u53EF\u9009\uFF1A\u6A2A\u5411\u6BD4\u4F8B 0~1\u3002\u914D\u5408 primary/room \u65F6\u662F\u5C4F\u5185\u4F4D\u7F6E\uFF1B\u5355\u72EC\u7528\u65F6\u662F\u5367\u5BA4\u753B\u9762\u6BD4\u4F8B" }, y: { type: "number", description: "\u53EF\u9009\uFF1A\u811A\u4E0B\u7EB5\u5411\u6BD4\u4F8B 0~1\u3002\u914D\u5408 primary/room \u65F6\u662F\u5C4F\u5185\u4F4D\u7F6E" } }, required: [] } } },
    { type: "function", function: { name: "resize_image", description: "\u628A\u4E00\u5F20\u56FE\u7247\u7B49\u6BD4\u7F29\u5230\u6307\u5B9A\u6700\u5927\u8FB9\u5E76\u538B\u6210\u5C0F jpg\uFF08\u9ED8\u8BA4\u6700\u957F\u8FB9 512\u3001\u8D28\u91CF 82\uFF09\uFF0C\u5B58\u56DE pet_space \u5E76\u628A\u5C0F\u56FE\u56DE\u4F20\u7ED9\u4F60\u770B\u3002\u4E13\u95E8\u7528\u6765\u628A ComfyUI \u751F\u6210\u7684\u5927\u56FE\uFF081MB+\uFF09\u538B\u6210\u80FD\u585E\u8FDB\u5C0F\u76F8\u6846\u7684\u5C0F\u56FE\u3002\u56FE\u7247\u5FC5\u987B\u5DF2\u5728 pet_space \u5185\uFF1B\u8F93\u51FA\u9ED8\u8BA4\u540C\u76EE\u5F55 <\u539F\u540D>_small.jpg\uFF0C\u53EF\u7528 out_path \u6307\u5B9A\u3002", parameters: { type: "object", properties: { path: { type: "string", description: "pet_space \u5185\u7684\u56FE\u7247\u5B8C\u6574\u8DEF\u5F84" }, max_width: { type: "number", description: "\u53EF\u9009\uFF1A\u6700\u5927\u5BBD\uFF0C\u9ED8\u8BA4 512" }, max_height: { type: "number", description: "\u53EF\u9009\uFF1A\u6700\u5927\u9AD8\uFF0C\u9ED8\u8BA4 512" }, quality: { type: "number", description: "\u53EF\u9009\uFF1Ajpg \u8D28\u91CF 1-100\uFF0C\u9ED8\u8BA4 82" }, out_path: { type: "string", description: "\u53EF\u9009\uFF1A\u8F93\u51FA\u8DEF\u5F84\uFF08\u5FC5\u987B\u5728 pet_space \u5185\uFF09\uFF0C\u9ED8\u8BA4\u540C\u76EE\u5F55 <\u539F\u540D>_small.jpg" } }, required: ["path"] } } },
    { type: "function", function: { name: "comfy_run", description: '\u8DD1\u4E00\u4EFD ComfyUI \u5DE5\u4F5C\u6D41\u751F\u6210\u56FE\u7247\uFF0C\u5E76\u628A\u56FE\u56DE\u4F20\u7ED9\u4F60"\u770B\u5230"\u3002workflow_file \u6307\u5411 pet_space \u91CC\u7684\u5DE5\u4F5C\u6D41 JSON\uFF08\u5148\u7528 read_file \u770B pet_space/comfy/ \u4E0B\u7684\u5B9E\u4F8B\uFF0C\u7528 edit_file \u6539\u63D0\u793A\u8BCD/\u79CD\u5B50/\u5C3A\u5BF8\u518D\u8DD1\uFF09\uFF0C\u6216\u76F4\u63A5\u7ED9 workflow \u5BF9\u8C61\uFF08ComfyUI API \u683C\u5F0F\uFF09\u3002\u5DE5\u4F5C\u6D41\u91CC\u8981\u6709 SaveImage \u6216 PreviewImage \u8282\u70B9\uFF1B\u82E5\u542B LoadImage\uFF08\u5982"\u62A0\u56FE_\u900F\u660E\u80CC\u666F.json"\uFF09\uFF0C\u5FC5\u987B\u4F20 input_image \u6307\u5411\u8981\u5904\u7406\u7684\u56FE\u3002\u56FE\u7247\u4F1A\u5B58\u5230 pet_space/generated/\u3002SDXL \u4E00\u5F20\u7EA6 10~40 \u79D2\uFF0CRMBG \u62A0\u56FE\u7EA6 2~5 \u79D2\u3002', parameters: { type: "object", properties: { workflow_file: { type: "string", description: "pet_space \u5185\u7684\u5DE5\u4F5C\u6D41 .json \u8DEF\u5F84\uFF08\u63A8\u8350\uFF1A\u590D\u5236/\u6539 pet_space/comfy/ \u91CC\u7684\u5B9E\u4F8B\uFF09" }, workflow: { type: "object", description: "\u6216\u76F4\u63A5\u7ED9 ComfyUI API \u683C\u5F0F\u7684\u5DE5\u4F5C\u6D41\u5BF9\u8C61" }, input_image: { type: "string", description: "\u53EF\u9009\uFF1Apet_space \u5185\u7684\u56FE\u7247\u8DEF\u5F84\u3002\u5DE5\u4F5C\u6D41\u6709 LoadImage \u8282\u70B9\u65F6\uFF0C\u4F1A\u5148\u628A\u8FD9\u5F20\u56FE\u62F7\u8FDB ComfyUI input \u5E76\u628A LoadImage \u6307\u5411\u5B83\uFF08\u62A0\u56FE/\u56FE\u751F\u56FE\u7528\uFF09" } }, required: [] } } }
  ];
  async function memoryAddFire(userContent, reply) {
    try {
      const items = [
        { text: "[\u7528\u6237] " + textOf(userContent), role: "user", kind: "chat", ts: Date.now() },
        { text: "[DeepSeek\u5A18] " + reply, role: "assistant", kind: "chat", ts: Date.now() + 1 }
      ];
      if (window.petWindow) await window.petWindow.memoryAdd(items, DEBUG_MODE ? "debug" : void 0);
      else await fetch("/api/memory-add", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items, mode: DEBUG_MODE ? "debug" : void 0 }) });
    } catch {
    }
  }
  async function memoryRecall(query, limit = 5) {
    try {
      const q3 = textOf(query).trim();
      if (!q3) return [];
      const searchP = window.petWindow ? window.petWindow.memorySearch(q3, DEBUG_MODE ? "debug" : void 0, limit) : fetch("/api/memory-search", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query: q3, mode: DEBUG_MODE ? "debug" : void 0, limit }) }).then((res) => res.json());
      const r2 = await Promise.race([
        searchP,
        new Promise((resolve) => setTimeout(() => resolve({ hits: [] }), 8e3))
      ]);
      return (r2 && r2.hits || []).filter((h3) => h3.text.trim() !== q3 && h3.text.trim() !== "[\u7528\u6237] " + q3);
    } catch {
      return [];
    }
  }
  async function getToolLedger() {
    try {
      const lines = window.petWindow ? await window.petWindow.fstoolTail(10) : await (await fetch("/api/fstool-tail?n=10")).json();
      return lines.length ? "\n\n\u3010\u5DE5\u5177\u8C03\u7528\u53F0\u8D26\u3011\uFF08\u4F60\u6700\u8FD1 10 \u6B21\u771F\u5B9E\u7684\u5DE5\u5177\u64CD\u4F5C\u8BB0\u5F55\uFF0C\u5F15\u7528\u65F6\u4EE5\u6B64\u4E3A\u51C6\uFF09\n" + lines.map((l3) => "- " + l3).join("\n") : "";
    } catch {
      return "";
    }
  }
  var lastExchange = null;
  function scanJsonObjects(s3) {
    const out = [];
    let depth = 0, start = -1, inStr = false, esc = false;
    for (let i3 = 0; i3 < s3.length; i3++) {
      const ch = s3[i3];
      if (inStr) {
        if (esc) esc = false;
        else if (ch === "\\") esc = true;
        else if (ch === '"') inStr = false;
        continue;
      }
      if (ch === '"') {
        inStr = true;
        continue;
      }
      if (ch === "{") {
        if (depth === 0) start = i3;
        depth += 1;
      } else if (ch === "}") {
        if (depth > 0) {
          depth -= 1;
          if (depth === 0 && start >= 0) {
            out.push(s3.slice(start, i3 + 1));
            start = -1;
          }
        }
      }
    }
    return out;
  }
  function coerceArg(v4) {
    const t3 = String(v4).trim();
    if (t3 === "") return "";
    if (/^-?\d+(\.\d+)?$/.test(t3)) return Number(t3);
    if (t3 === "true") return true;
    if (t3 === "false") return false;
    if (t3 === "null") return null;
    if (t3.startsWith("{") && t3.endsWith("}") || t3.startsWith("[") && t3.endsWith("]")) {
      try {
        return JSON.parse(t3);
      } catch {
      }
    }
    return t3;
  }
  function parseTextToolCalls(content, round) {
    const txt = String(content || "");
    const found = [];
    for (const m3 of txt.matchAll(/<invoke\s+name\s*=\s*"([^"]+)"\s*>([\s\S]*?)<\/invoke>/g)) {
      const args = {};
      for (const p3 of m3[2].matchAll(/<parameter\s+name\s*=\s*"([^"]+)"(?:\s+[^>]*)?>([\s\S]*?)<\/parameter>/g)) args[p3[1].trim()] = coerceArg(p3[2]);
      found.push({ name: m3[1].trim(), arguments: args });
    }
    for (const m3 of txt.matchAll(/<tool_call>([\s\S]*?)<\/tool_call>/g)) {
      for (const js of scanJsonObjects(m3[1])) {
        try {
          const o3 = JSON.parse(js);
          if (o3 && typeof o3.name === "string") found.push({ name: o3.name, arguments: o3.arguments ?? o3.parameters ?? {} });
        } catch {
        }
      }
    }
    return found.map((c3, i3) => ({ id: "textcall_" + round + "_" + i3, type: "function", function: { name: c3.name, arguments: typeof c3.arguments === "string" ? c3.arguments : JSON.stringify(c3.arguments || {}) } }));
  }
  async function askLLM(userContent, signal, memories, continueBaseMsgs = null, isInf = false) {
    const mod = THINK_MODE === "off" ? null : THINK_MODULES.pet_think;
    turnUsedTools = false;
    let bodyMsgs;
    if (continueBaseMsgs) {
      bodyMsgs = continueBaseMsgs.slice();
    } else {
      const ledger = await getToolLedger();
      const sysAndPersona = await getSystemAndPersona();
      const assembled = assemblePrompt({
        systemPrompt: sysAndPersona,
        memories,
        mainHistory: history,
        infHistory,
        isInfiniteWake: isInf,
        userContent,
        toolLedger: ledger,
        thinkMode: THINK_MODE,
        forceToolPrefill
      });
      bodyMsgs = assembled.messages;
      if (assembled.consumedForceToolPrefill) forceToolPrefill = false;
    }
    const stripThink = (s3) => {
      let t3 = String(s3 || "").replace(/<(pet_)?think>[\s\S]*?<\/\1think>\s*/g, "");
      const m3 = t3.match(/<\/(?:pet_)?think>/);
      if (m3) t3 = t3.slice(m3.index + m3[0].length);
      return t3.trim();
    };
    const TAG_RES = /<\/?(?:pet_think|think|tool_call|invoke)>/;
    const CLOSE_THINK_RE = /<\/(?:pet_think|think)>/;
    const OPEN_THINK_RE = /<(?:pet_think|think)>/;
    const CLOSE_TOOL_RE = /<\/(?:tool_call|invoke)>/;
    function partialTagLen(s3) {
      for (let len = Math.min(s3.length, 12); len > 0; len--) {
        const tail = s3.slice(-len);
        if (["<pet_think>", "</pet_think>", "<think>", "</think>", "<tool_call>", "</tool_call>", "<invoke>", "</invoke>"].some((tag) => tag.startsWith(tail))) return len;
      }
      return 0;
    }
    function partialCloseLen(s3, tags) {
      for (let len = Math.min(s3.length, 12); len > 0; len--) {
        const tail = s3.slice(-len);
        if (tags.some((tag) => tag.startsWith(tail))) return len;
      }
      return 0;
    }
    let noTools = false;
    let lastSig = null;
    let repeatCount = 0;
    let toolCallTotal = 0;
    const isLive = !continueBaseMsgs;
    if (isLive && !isInf) {
      history.push({ role: "user", content: userContent });
      saveHistory(history, false);
    }
    let emptyTextRetries = 0;
    const wantsVerification = /(查证|核实|台账|fstool|读没读|读过|看过了|做了没|真的(读|看|做)了)/i.test(textOf(userContent));
    let verificationNudged = false;
    const isContinuation = Boolean(continueBaseMsgs);
    let streamSpoken = false;
    let ttsChain = Promise.resolve();
    const dispatchTTS = (seg) => {
      if (!seg || !seg.trim()) return;
      streamSpoken = true;
      rlog("tts-dispatch", seg.slice(0, 40));
      ttsChain = ttsChain.then(() => speakSegment(seg, signal)).catch(() => {
      });
    };
    let lastBubbleTs = 0;
    for (let round = 0; ; round++) {
      touchTurnActivity();
      const slicer = makeSentenceSlicer();
      const model = "strata-nothink";
      const sendMsgs = bodyMsgs.slice();
      const needCfm = sendMsgs[sendMsgs.length - 1]?.role === "assistant";
      const cfmText = needCfm ? String(sendMsgs[sendMsgs.length - 1].content || "") : "";
      const startInThink = (cfmText.match(/<(?:pet_)?think>/g) || []).length > (cfmText.match(/<\/(?:pet_)?think>/g) || []).length;
      const startInTool = (cfmText.match(/<(?:tool_call|invoke)>/g) || []).length > (cfmText.match(/<\/(?:tool_call|invoke)>/g) || []).length;
      const reqPayload = {
        model,
        messages: sendMsgs,
        tools: noTools ? void 0 : TOOLS,
        tool_choice: noTools ? void 0 : "auto",
        temperature: 0.8,
        max_tokens: 65536,
        stream: true,
        stream_options: { include_usage: true },
        ...needCfm ? { continue_final_message: true } : {}
      };
      const res = await fetch(LLM_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal,
        body: JSON.stringify(reqPayload)
      });
      if (!res.ok) throw new Error(`LLM HTTP ${res.status}: ${(await res.text()).slice(0, 120)}`);
      touchTurnActivity();
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let sse = "";
      let rawContent = "";
      let inThink = startInThink;
      let inTool = startInTool;
      let processed = 0;
      let finish = null, usage = null;
      const nativeCalls = /* @__PURE__ */ new Map();
      let replyText = "";
      let lastBubbleTs2 = 0;
      const feedReplyDelta = (t3) => {
        if (!t3) return;
        replyText += t3;
        for (const seg of slicer.push(t3)) dispatchTTS(seg);
        const now = Date.now();
        if (now - lastBubbleTs2 > 300) {
          lastBubbleTs2 = now;
          showBubble(slicer.preview() || replyText.slice(-140));
        }
      };
      const processRaw = () => {
        for (; ; ) {
          const rest2 = rawContent.slice(processed);
          if (!rest2) return;
          if (inThink) {
            const m3 = rest2.match(CLOSE_THINK_RE);
            if (!m3) {
              processed = rawContent.length - partialCloseLen(rest2, ["</pet_think>", "</think>"]);
              return;
            }
            processed += m3.index + m3[0].length;
            inThink = false;
          } else if (inTool) {
            const m3 = rest2.match(CLOSE_TOOL_RE);
            if (!m3) {
              processed = rawContent.length - partialCloseLen(rest2, ["</tool_call>", "</invoke>"]);
              return;
            }
            processed += m3.index + m3[0].length;
            inTool = false;
          } else {
            const m3 = rest2.match(TAG_RES);
            const hold = partialTagLen(rest2);
            if (m3 && m3.index < rest2.length - hold) {
              feedReplyDelta(rest2.slice(0, m3.index));
              processed += m3.index;
              if (m3[0] === "<pet_think>" || m3[0] === "<think>") {
                inThink = true;
                processed += m3[0].length;
              } else if (m3[0] === "<tool_call>" || m3[0] === "<invoke>") {
                inTool = true;
                processed += m3[0].length;
              } else {
                processed += m3[0].length;
              }
            } else {
              feedReplyDelta(rest2.slice(0, rest2.length - hold));
              processed += rest2.length - hold;
              return;
            }
          }
        }
      };
      while (true) {
        const rd = await reader.read();
        if (rd.done) break;
        touchTurnActivity();
        sse += dec.decode(rd.value, { stream: true });
        let nl;
        while ((nl = sse.indexOf("\n")) >= 0) {
          const line = sse.slice(0, nl).replace(/\r$/, "");
          sse = sse.slice(nl + 1);
          if (!line.startsWith("data:")) continue;
          const pl = line.slice(5).trim();
          if (pl === "[DONE]") continue;
          let j3;
          try {
            j3 = JSON.parse(pl);
          } catch {
            continue;
          }
          if (j3.usage) usage = j3.usage;
          const ch0 = j3.choices?.[0];
          if (!ch0) continue;
          if (ch0.finish_reason) finish = ch0.finish_reason;
          const d2 = ch0.delta || {};
          if (Array.isArray(d2.tool_calls)) {
            inTool = true;
            for (const tc of d2.tool_calls) {
              const idx = tc.index ?? 0;
              const cur = nativeCalls.get(idx) || { id: "", type: "function", function: { name: "", arguments: "" } };
              if (tc.id) cur.id = tc.id;
              if (tc.function?.name) cur.function.name = tc.function.name;
              if (tc.function?.arguments) cur.function.arguments += tc.function.arguments;
              nativeCalls.set(idx, cur);
            }
          }
          if (typeof d2.content === "string" && d2.content) {
            rawContent += d2.content;
            processRaw();
          }
        }
      }
      noteContext(usage && usage.prompt_tokens);
      {
        const tail = slicer.flush();
        if (tail) dispatchTTS(tail);
      }
      const content = rawContent;
      let toolCalls = nativeCalls.size ? [...nativeCalls.entries()].sort((a3, b4) => a3[0] - b4[0]).map(([, v4]) => v4) : null;
      if (!toolCalls && content) {
        const parsed = parseTextToolCalls(content, round);
        if (parsed.length) toolCalls = parsed;
      }
      const data = { choices: [{ message: { role: "assistant", content }, finish_reason: finish || (toolCalls ? "tool_calls" : "stop") }], usage: usage || {} };
      const msg = data.choices[0].message;
      lastExchange = { round, reqPayload: { ...reqPayload, stream: false, messages: sendMsgs }, resData: data, resMsg: msg, finish, userContent, isInf, hadSavedHistory: false };
      if (toolCalls?.length) {
        const msgContentBeforeTools = stripThink(content ?? "").replace(/<tool_call>[\s\S]*?<\/tool_call>\s*/g, "").replace(/<invoke[\s\S]*?<\/invoke>\s*/g, "").trim();
        const truncated = finish === "length";
        const sig = toolCalls.map((c3) => (c3.function?.name || "") + ":" + (c3.function?.arguments || "")).join("|");
        repeatCount = sig === lastSig ? repeatCount + 1 : 0;
        lastSig = sig;
        const lastMsg = bodyMsgs[bodyMsgs.length - 1];
        if (lastMsg && lastMsg.role === "assistant") {
          lastMsg.tool_calls = toolCalls;
          if (msgContentBeforeTools && !lastMsg.content.includes(msgContentBeforeTools)) {
            lastMsg.content = (lastMsg.content || "").trimEnd() + "\n" + msgContentBeforeTools;
          }
          lastMsg.content = (lastMsg.content || "").replace(/<tool_call>[\s\S]*$/g, "").trim();
        } else {
          bodyMsgs.push({ role: "assistant", content: msgContentBeforeTools || "", tool_calls: toolCalls });
        }
        for (const call of toolCalls) {
          let parsed = {};
          let parseOk = true;
          try {
            parsed = JSON.parse(call.function?.arguments || "{}");
          } catch {
            parseOk = false;
          }
          if (!parseOk) {
            bodyMsgs.push({ role: "tool", tool_call_id: call.id, content: "\u9519\u8BEF\uFF1A\u5DE5\u5177\u53C2\u6570\u4E0D\u662F\u5408\u6CD5 JSON\uFF08\u901A\u5E38\u662F\u6587\u672C\u91CC\u7684\u6362\u884C\u6216\u5F15\u53F7\u6CA1\u6709\u6B63\u786E\u8F6C\u4E49\uFF09\u3002\u8BF7\u91CD\u65B0\u751F\u6210 arguments \u4E3A\u5408\u6CD5 JSON \u540E\u91CD\u8BD5\u3002" });
            continue;
          }
          showBubble(round === 0 ? "\u770B\u5C4F\u5E55\u4E2D\u2026" : "\u7EE7\u7EED\u7FFB\u2026");
          if (call.function?.name === "search_memory") {
            const r2 = await memoryRecall(parsed.query || "", parsed.limit || 8);
            bodyMsgs.push({
              role: "tool",
              tool_call_id: call.id,
              content: r2.length ? r2.map((h3) => `[${new Date(h3.ts).toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}] ${h3.text}`).join("\n---\n") : "\uFF08\u6CA1\u6709\u627E\u5230\u76F8\u5173\u8BB0\u5FC6\uFF09"
            });
            continue;
          }
          if (call.function?.name === "walk_to") {
            let result;
            try {
              const where = String(parsed.where || "").toLowerCase();
              const special = ["primary", "\u4E3B\u5C4F", "main", "room", "bedroom", "\u5367\u5BA4"].includes(where);
              let fx = parsed.x, fy = parsed.y;
              const said = parsed.where ? "\u300C" + parsed.where + "\u300D" : "(" + fx + "," + fy + ")";
              if (!special && (fx == null || fy == null)) {
                let lm = null;
                try {
                  lm = await (await fetch("/pet_space/room/landmarks.json?t=" + Date.now(), { cache: "no-store" })).json();
                } catch {
                }
                if (!lm || !lm[where] || typeof lm[where].x !== "number") {
                  result = '\u627E\u4E0D\u5230\u5730\u6807 "' + (parsed.where || "") + '"\uFF1Apet_space/room/landmarks.json \u91CC\u6CA1\u6709\u5B83\u3002\u73B0\u6709\u5730\u6807\uFF1A' + (lm ? Object.keys(lm).filter((k4) => k4[0] !== "_").join("\u3001") : "(\u6587\u4EF6\u8BFB\u4E0D\u5230)") + "\u3002" + (ROLE === "pet" ? '\u4E5F\u53EF\u4EE5\u7528 where="primary" \u53BB\u4E3B\u5C4F\u3001where="room" \u56DE\u5367\u5BA4\u3002' : "\u6362\u80CC\u666F\u540E\u8BF7\u628A\u5750\u6807\u5199\u8FDB\u8FD9\u4EFD\u6587\u4EF6\u3002");
                } else {
                  fx = lm[where].x;
                  fy = lm[where].y;
                }
              }
              if (result == null) {
                if (ROLE === "pet") {
                  const pri = (displayInfo || []).find((d2) => d2.isPrimary);
                  const bed = (displayInfo || []).find((d2) => !d2.isPrimary);
                  if (where === "primary" || where === "\u4E3B\u5C4F" || where === "main") {
                    const r2 = displayCssRect(pri);
                    const px = typeof fx === "number" ? Math.max(0, Math.min(1, fx)) : 0.5;
                    const py = typeof fy === "number" ? Math.max(0, Math.min(1, fy)) : 0.9;
                    if (!r2) result = "\u62FF\u4E0D\u5230\u4E3B\u5C4F\u4F4D\u7F6E\uFF0C\u7A0D\u540E\u518D\u8BD5\u3002";
                    else {
                      await walkToCss(r2.x + r2.w * px, r2.y + r2.h * py);
                      result = "\u8D70\u5230\u4E3B\u5C4F" + (typeof fx === "number" || typeof fy === "number" ? "\uFF08" + px + "," + py + "\uFF09" : "\u5E95\u90E8\u4E2D\u95F4") + "\u5566";
                    }
                  } else if (where === "room" || where === "bedroom" || where === "\u5367\u5BA4") {
                    const r2 = displayCssRect(bed);
                    const px = typeof fx === "number" ? Math.max(0, Math.min(1, fx)) : 0.5;
                    const py = typeof fy === "number" ? Math.max(0, Math.min(1, fy)) : 0.78;
                    if (!r2) result = "\u62FF\u4E0D\u5230\u5367\u5BA4\u4F4D\u7F6E\uFF0C\u7A0D\u540E\u518D\u8BD5\u3002";
                    else {
                      await walkToCss(r2.x + r2.w * px, r2.y + r2.h * py);
                      result = "\u56DE\u5367\u5BA4" + (typeof fx === "number" || typeof fy === "number" ? "\uFF08" + px + "," + py + "\uFF09" : "\u5566");
                    }
                  } else if (!(fx >= 0 && fx <= 1 && fy >= 0 && fy <= 1)) {
                    result = "\u5750\u6807\u8981\u662F 0~1 \u7684\u6BD4\u4F8B\uFF08x \u6A2A\u5411\u3001y \u7EB5\u5411\uFF0C\u811A\u4E0B\u4F4D\u7F6E\uFF09\u3002";
                  } else {
                    const r2 = displayCssRect(bed);
                    if (r2) await walkToCss(r2.x + fx * r2.w, r2.y + fy * r2.h);
                    else await walkToFraction(fx, fy);
                    result = "\u8D70\u5230 " + said + " \u5566";
                  }
                } else if (!(fx >= 0 && fx <= 1 && fy >= 0 && fy <= 1)) {
                  result = "\u5750\u6807\u8981\u662F 0~1 \u7684\u6BD4\u4F8B\uFF08x \u6A2A\u5411\u3001y \u7EB5\u5411\uFF0C\u811A\u4E0B\u4F4D\u7F6E\uFF09\u3002";
                } else if (!bedroomMode) {
                  result = "\u4F60\u4E0D\u5728\u5367\u5BA4\uFF08\u526F\u5C4F\uFF09\u91CC\uFF0C\u5148\u8BA9\u4E3B\u4EBA\u628A\u4F60\u62D6\u56DE\u526F\u5C4F\u5367\u5BA4\u518D\u8D70\u3002";
                } else {
                  await walkToFraction(fx, fy);
                  result = "\u8D70\u5230 " + said + " \u5566";
                }
              }
            } catch (e3) {
              result = "\u79FB\u52A8\u5931\u8D25: " + String(e3 && e3.message || e3);
            }
            bodyMsgs.push({ role: "tool", tool_call_id: call.id, content: result });
            continue;
          }
          touchTurnActivity();
          const out = window.petWindow?.fsTool ? await window.petWindow.fsTool({ name: call.function?.name, args: parsed }) : await (await fetch("/api/fstool", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: call.function?.name, args: parsed }) })).json();
          touchTurnActivity();
          bodyMsgs.push({
            role: "tool",
            tool_call_id: call.id,
            content: out.ok ? String(out.result) : truncated ? "\u9519\u8BEF\uFF1A\u8FD9\u6B21\u8F93\u51FA\u5728 max_tokens \u5904\u88AB\u622A\u65AD\uFF0C\u5DE5\u5177\u53C2\u6570\u4E0D\u5B8C\u6574\u3002\u8BF7\u7CBE\u7B80\u8981\u5199\u5165\u7684\u5185\u5BB9\uFF0C\u6216\u5206\u6210\u591A\u6B21\u8C03\u7528\u3002" : "\u9519\u8BEF\uFF1A" + out.error
          });
          if (out.image) {
            bodyMsgs.push({
              role: "user",
              content: [
                { type: "text", text: "\uFF08\u7CFB\u7EDF\u9644\u4E0A\u521A\u624D\u5DE5\u5177\u751F\u6210\u7684\u753B\u9762\uFF0C\u8BF7\u57FA\u4E8E\u5B83\u7EE7\u7EED\u5904\u7406\u7528\u6237\u7684\u8BF7\u6C42\uFF09" },
                { type: "image_url", image_url: { url: out.image } }
              ]
            });
          }
        }
        if (isLive) {
          const visible = (msgContentBeforeTools || "").trim();
          if (visible) {
            if (isInf) {
              infHistory.push({ role: "assistant", content: visible });
              saveHistory(infHistory, true);
            } else {
              history.push({ role: "assistant", content: visible });
              saveHistory(history, false);
            }
          }
        }
        turnUsedTools = true;
        toolCallTotal += toolCalls.length;
        if (toolCallTotal > 16) {
          noTools = true;
          bodyMsgs.push({ role: "user", content: "\uFF08\u7CFB\u7EDF\uFF1A\u8FD9\u4E00\u8F6E\u5DE5\u5177\u8C03\u7528\u6B21\u6570\u592A\u591A\u4ECD\u672A\u6536\u655B\uFF0C\u50CF\u662F\u5728\u6253\u8F6C\u3002\u8BF7\u505C\u6B62\u8C03\u7528\u5DE5\u5177\uFF0C\u76F4\u63A5\u7528\u6587\u5B57\u5411\u4E3B\u4EBA\u8BF4\u660E\u73B0\u72B6\u548C\u5361\u70B9\u3002\uFF09" });
        }
        if (repeatCount >= 2) {
          noTools = true;
        }
        continue;
      }
      if (!content && !toolCalls?.length) {
        if (isContinuation) {
          const lastMsg = bodyMsgs[bodyMsgs.length - 1];
          if (lastMsg && lastMsg.role === "assistant" && !lastMsg.content.includes("<tool_call>")) {
            lastMsg.content = lastMsg.content.trimEnd() + "\n<tool_call>";
            round--;
            continue;
          }
          throw new Error("\u4E0A\u4E00\u8F6E\u56DE\u590D\u5DF2\u5B8C\u7ED3\uFF0C\u65E0\u9700\u7EE7\u7EED");
        }
        throw new Error("LLM \u8FD4\u56DE\u7A7A\u56DE\u590D: " + JSON.stringify(data).slice(0, 200));
      }
      const thinkOpens = (content.match(/<(?:pet_)?think>/g) || []).length;
      const thinkCloses = (content.match(/<\/(?:pet_)?think>/g) || []).length;
      const danglingThink = thinkOpens > thinkCloses;
      const text = danglingThink ? "" : stripThink(content);
      if (!text) {
        if (emptyTextRetries < 2) {
          emptyTextRetries++;
          const fullContent = content.trim();
          const toolKeywords = /(?:file_tool|copy_file|write_file|append_file|read_file|list_dir|delete_file|take_screenshot|search_memory|工具|编辑|写入|修改|读取|查看|复制|创建|追加)/i;
          const hasToolIntent = !danglingThink && toolKeywords.test(fullContent);
          const tail = hasToolIntent ? "\n<tool_call>" : "\n";
          const lastMsg = bodyMsgs[bodyMsgs.length - 1];
          if (lastMsg && lastMsg.role === "assistant") {
            lastMsg.content = (lastMsg.content || "").trimEnd() + "\n" + fullContent + tail;
          } else {
            bodyMsgs.push({ role: "assistant", content: fullContent + tail });
          }
          showBubble(hasToolIntent ? "\u51C6\u5907\u6267\u884C\u5DE5\u5177\u2026" : "\u7EE7\u7EED\u7EC4\u7EC7\u8BED\u8A00\u4E2D\u2026");
          continue;
        }
        throw new Error("LLM \u8FD4\u56DE\u7A7A\u56DE\u590D\uFF08\u601D\u8003\u540E\u65E0\u6B63\u6587\uFF09");
      }
      if (wantsVerification && toolCallTotal === 0 && !verificationNudged && !noTools && isLive && !continueBaseMsgs) {
        verificationNudged = true;
        bodyMsgs.push({ role: "user", content: "\uFF08\u7CFB\u7EDF\u63D0\u793A\uFF1A\u8FD9\u6761\u4EFB\u52A1\u6D89\u53CA\u9700\u8981\u6838\u5B9E\u7684\u4E8B\u5B9E\uFF0C\u4F46\u4F60\u672C\u8F6E\u6CA1\u6709\u8C03\u7528\u4EFB\u4F55\u5DE5\u5177\u3002\u8BF7\u5148\u8C03\u7528\u5DE5\u5177\u67E5\u8BC1\u2014\u2014\u4F8B\u5982 read_file \u8BFB\u76F8\u5173\u6587\u4EF6\uFF0C\u6216\u8BFB G:/AI/livliv-pet/logs/fstool.log \u6838\u5BF9\u81EA\u5DF1\u7684\u64CD\u4F5C\u8BB0\u5F55\u2014\u2014\u518D\u7ED9\u51FA\u6700\u7EC8\u56DE\u7B54\u3002\uFF09" });
        showBubble("\u63D0\u9192\u5979\u5148\u67E5\u8BC1\u2026");
        continue;
      }
      const rest = slicer.flush();
      if (rest) dispatchTTS(rest);
      await ttsChain;
      return text;
    }
  }
  function makeSentenceSlicer(minLen = 6, targetLen = 14) {
    const strongEnd = "\u3002\uFF01\uFF1F!?";
    const weakEnd = "\uFF0C,\u3001\uFF1B;\u2026\u2014~\uFF5E";
    const hasWord = (t3) => /[\p{L}\p{N}]/u.test(t3);
    let buf = "";
    const tryCut = (out) => {
      const last = buf.slice(-1);
      let cut = false;
      if (last === "\n") cut = true;
      else if (strongEnd.includes(last)) {
        if (buf.length >= minLen) cut = true;
      } else if (weakEnd.includes(last)) {
        if (buf.length >= targetLen) cut = true;
      } else if (buf.length >= 45) cut = true;
      if (cut && hasWord(buf)) {
        out.push(buf.trim());
        buf = "";
      }
    };
    return {
      push(text) {
        const out = [];
        for (const ch of String(text || "")) {
          buf += ch;
          tryCut(out);
        }
        return out;
      },
      preview() {
        return buf.trim();
      },
      flush() {
        const rest = buf.trim();
        buf = "";
        return rest && hasWord(rest) ? rest : "";
      }
    };
  }
  var gsvDownUntil = 0;
  function rlog(tag, msg) {
    try {
      fetch("/api/log", { method: "POST", body: tag + " " + String(msg == null ? "" : msg) }).catch(() => {
      });
    } catch {
    }
  }
  async function speakSegment(seg, signal) {
    touchTurnActivity();
    if (Date.now() < gsvDownUntil) {
      rlog("tts-skip-down", Math.round((gsvDownUntil - Date.now()) / 1e3) + "s left");
      return;
    }
    rlog("tts-start", seg.slice(0, 30));
    const ctrl = new AbortController();
    const onAbort = () => {
      try {
        ctrl.abort();
      } catch {
      }
    };
    if (signal) {
      if (signal.aborted) return;
      signal.addEventListener("abort", onAbort, { once: true });
    }
    const timer = setTimeout(onAbort, 12e4);
    try {
      const res = await fetch(TTS_URL, {
        method: "POST",
        signal: ctrl.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: seg,
          text_lang: "zh",
          prompt_lang: "zh",
          text_split_method: "cut5",
          media_type: "wav",
          streaming_mode: false,
          temperature: 0.4,
          top_P: 0.7,
          top_K: 3,
          ...TTS_REF
        })
      });
      touchTurnActivity();
      if (res.status === 502 || res.status === 503 || res.status === 504) {
        gsvDownUntil = Date.now() + 6e4;
        rlog("tts-upstream-" + res.status, "silent 60s");
        return;
      }
      if (!res.ok) throw new Error("TTS HTTP " + res.status);
      const blob = await res.blob();
      touchTurnActivity();
      rlog("tts-ok", blob.size + "B");
      speech.say(blob);
    } catch (e3) {
      if (signal && signal.aborted) {
        rlog("tts-abort", "turn aborted");
        return;
      }
      if (ctrl.signal.aborted) {
        gsvDownUntil = Date.now() + 6e4;
        rlog("tts-timeout", "silent 60s");
        return;
      }
      rlog("tts-error", String(e3 && e3.message || e3));
      console.warn("TTS \u5206\u6BB5\u5931\u8D25: " + String(e3 && e3.message || e3));
    } finally {
      clearTimeout(timer);
      if (signal) signal.removeEventListener("abort", onAbort);
      touchTurnActivity();
    }
  }
  var turnAbort = null;
  async function submitRequest(text, image, { isInfiniteWake: isInf = false } = {}) {
    if (busy) return false;
    if (!unlocked) {
      speech.unlock();
      unlocked = true;
    }
    busy = true;
    turnSeq += 1;
    turnAbortReason = "";
    touchTurnActivity();
    turnAbort = new AbortController();
    const isAbort = (e3) => e3?.name === "AbortError" || turnAbort?.signal.aborted;
    const userContent = image ? [
      { type: "text", text: text || "\uFF08\u5E2E\u6211\u770B\u770B\u8FD9\u5F20\u56FE\uFF09" },
      { type: "image_url", image_url: { url: image } }
    ] : text;
    let replied = false;
    try {
      await syncHistoryFromDisk(false);
      if (isInf) await syncHistoryFromDisk(true);
      player.act("hop");
      showBubble("\u2026");
      const recalled = await memoryRecall(text);
      touchTurnActivity();
      const reply = await askLLM(userContent, turnAbort.signal, recalled, null, isInf);
      if (isInf) {
        if (reply && String(reply).trim()) {
          infHistory.push({ role: "assistant", content: reply });
          await saveHistory(infHistory, true);
        }
      } else {
        history.push({ role: "assistant", content: reply });
        await saveHistory(history, false);
      }
      noteLoop(reply);
      if (lastExchange) lastExchange.hadSavedHistory = true;
      showBubble(reply);
      replied = true;
      react(reply);
      if (!isInf) memoryAddFire(userContent, reply);
      queueInfiniteWake();
      return true;
    } catch (e3) {
      if (isAbort(e3)) {
        if (!replied) {
          showBubble(turnAbortReason === "guard" ? "\uFF08\u4E0A\u4E00\u8F6E\u54CD\u5E94\u8D85\u65F6\uFF0C\u81EA\u52A8\u91CD\u8FDE\u2026\uFF09" : "\uFF08\u5DF2\u6253\u65AD\uFF09");
          setTimeout(() => {
            if (!busy) hideBubble();
          }, 3e3);
          const t3 = typeof userContent === "string" ? userContent : userContent.find?.((c3) => c3.type === "text")?.text || "";
          if (t3 && !/^(你被唤醒了|现在是无限唤醒模式|（)/.test(t3)) input.value = t3;
        }
        if (turnAbortReason === "guard") queueInfiniteWake(3e3);
        return false;
      }
      showBubble(String(e3.message || e3), true);
      queueInfiniteWake(3e4);
      return false;
    } finally {
      busy = false;
      turnAbort = null;
      touchTurnActivity();
      input.focus();
    }
  }
  async function send() {
    const text = input.value.trim();
    if (!text && !pendingImage || busy) return;
    if (!unlocked) {
      speech.unlock();
      unlocked = true;
    }
    input.value = "";
    autoGrowInput();
    clearPendingImage();
    await submitRequest(text, pendingImage);
  }
  var WAKE_GPU_LIMIT = 40;
  var wakeRunning = false;
  async function wakeNow(wakeText = "\u4F60\u88AB\u5524\u9192\u4E86\uFF0C\u7528\u6237\u6CA1\u6709\u7ED9\u4F60\u6307\u793A\uFF0C\u81EA\u7531\u884C\u52A8\u5427", { isInfiniteWake: isInf = false } = {}) {
    if (busy || wakeRunning) return;
    wakeRunning = true;
    try {
      let util = null;
      try {
        const raw = window.petWindow ? await window.petWindow.gpuUtil() : await (await fetch("/api/gpuutil")).text();
        util = parseInt(raw, 10);
        if (!Number.isFinite(util)) util = null;
      } catch {
      }
      if (util !== null && util > WAKE_GPU_LIMIT) {
        if (infiniteWake) {
          queueInfiniteWake(3e4);
          return;
        }
        showBubble(`\u663E\u5361\u6B63\u5FD9\uFF08${util}%\uFF09\uFF0C\u8FD9\u6B21\u5148\u4E0D\u5524\u9192\u5566\uFF0C\u7A0D\u540E\u518D\u53EB\u6211`);
        setTimeout(() => {
          if (!busy) hideBubble();
        }, 6e3);
        return;
      }
      let b64 = null;
      try {
        b64 = window.petWindow ? await window.petWindow.captureScreen() : await (await fetch("/api/capture")).text();
        if (b64 === "null") b64 = null;
      } catch {
      }
      const userContent = [{ type: "text", text: wakeText }];
      if (b64) userContent.push({ type: "image_url", image_url: { url: "data:image/jpeg;base64," + b64 } });
      await submitRequest(userContent, null, { isInfiniteWake: isInf });
    } finally {
      wakeRunning = false;
    }
  }
  function interrupt() {
    if (!busy) return false;
    turnAbortReason = "user";
    turnAbort?.abort();
    speech.stop();
    return true;
  }
  $3("wake").addEventListener("click", () => {
    if (busy) interrupt();
    else wakeNow();
  });
  var infiniteWake = false;
  var infTimer = null;
  function stopInfiniteWake(reason = "") {
    infiniteWake = false;
    try {
      localStorage.setItem("infwake", "0");
    } catch {
    }
    $3("infwake").classList.remove("on");
    $3("infwake").title = "\u8FDE\u7EED\u5524\u9192\uFF1A\u5979\u4E00\u505C\u4E0B\u6765\u5C31\u518D\u5524\u9192\uFF08\u65E0\u9650\u6A21\u5F0F\uFF09";
    if (infTimer) {
      clearTimeout(infTimer);
      infTimer = null;
    }
    if (reason) showBubble(reason);
  }
  function queueInfiniteWake(delay = 1500) {
    if (!infiniteWake || infTimer) return;
    infTimer = setTimeout(() => {
      infTimer = null;
      if (infiniteWake && !busy) wakeNow(INF_WAKE_TEXT, { isInfiniteWake: true });
    }, delay);
  }
  $3("infwake").addEventListener("click", () => {
    infiniteWake = !infiniteWake;
    try {
      localStorage.setItem("infwake", infiniteWake ? "1" : "0");
    } catch {
    }
    $3("infwake").classList.toggle("on", infiniteWake);
    $3("infwake").title = infiniteWake ? "\u8FDE\u7EED\u5524\u9192\u5F00\uFF1A\u5979\u4E00\u505C\u4E0B\u6765\u5C31\u518D\u5524\u9192\uFF08\u70B9\u51FB\u5173\u95ED\uFF09" : "\u8FDE\u7EED\u5524\u9192\uFF1A\u5979\u4E00\u505C\u4E0B\u6765\u5C31\u518D\u5524\u9192\uFF08\u65E0\u9650\u6A21\u5F0F\uFF09";
    if (infiniteWake) queueInfiniteWake(500);
    else if (infTimer) {
      clearTimeout(infTimer);
      infTimer = null;
    }
  });
  window.petWindow?.onStopInfwake?.(() => {
    stopInfiniteWake("\u5230\u622A\u6B62\u65F6\u95F4\u5566\uFF0C\u6211\u5148\u505C\u4E0B\u65E0\u9650\u5524\u9192\uFF0C\u7B49\u4E3B\u4EBA\u56DE\u6765\uFF5E");
    console.log("[infwake] \u6536\u5230\u770B\u95E8\u72D7\u622A\u6B62\u6307\u4EE4\uFF0C\u5DF2\u5173\u95ED\u65E0\u9650\u5524\u9192");
  });
  try {
    if (NO_INFWAKE) {
      localStorage.setItem("infwake", "0");
    } else if (localStorage.getItem("infwake") === "1") {
      infiniteWake = true;
      $3("infwake").classList.add("on");
      $3("infwake").title = "\u8FDE\u7EED\u5524\u9192\u5F00\uFF1A\u5979\u4E00\u505C\u4E0B\u6765\u5C31\u518D\u5524\u9192\uFF08\u70B9\u51FB\u5173\u95ED\uFF09";
      queueInfiniteWake(3e3);
    }
  } catch {
  }
  var CTX_ABORT_TOKENS = 64e3;
  var CTX_ABORT_COUNT = 3;
  var lastCtxTokens = 0;
  var ctxOverCount = 0;
  function noteContext(pt) {
    pt = Number(pt);
    if (!Number.isFinite(pt) || pt <= 0) return;
    lastCtxTokens = pt;
    if (pt >= CTX_ABORT_TOKENS) ctxOverCount += 1;
    if (ctxOverCount >= CTX_ABORT_COUNT && infiniteWake) {
      stopInfiniteWake("\u4E0A\u4E0B\u6587\u5DF2\u7ECF\u585E\u5230 64k \u597D\u51E0\u6B21\u5566\uFF0C\u6211\u5148\u505C\u4E0B\u65E0\u9650\u5524\u9192\uFF0C\u7B49\u4E3B\u4EBA\u56DE\u6765\uFF5E");
      console.warn("[infwake] \u505C\u6B62\u65E0\u9650\u5524\u9192\uFF1Aprompt_tokens \u8FBE 64k \u7B2C " + ctxOverCount + " \u6B21");
    }
  }
  var prevReplyNorm = "";
  var noToolTurns = 0;
  var forceToolPrefill = false;
  var turnUsedTools = false;
  function normReply(s3) {
    return String(s3 || "").replace(/<[^>]+>/g, "").replace(/[\s\p{P}\p{S}]/gu, "").slice(0, 500);
  }
  function replySim(a3, b4) {
    if (!a3 || !b4) return 0;
    const bg = (x4) => {
      const m3 = /* @__PURE__ */ new Map();
      for (let i3 = 0; i3 < x4.length - 1; i3++) {
        const g3 = x4.slice(i3, i3 + 2);
        m3.set(g3, (m3.get(g3) || 0) + 1);
      }
      return m3;
    };
    const A4 = bg(a3), B3 = bg(b4);
    let inter = 0, tot = 0;
    for (const [g3, n3] of A4) {
      tot += n3;
      if (B3.has(g3)) inter += Math.min(n3, B3.get(g3));
    }
    for (const n3 of B3.values()) tot += n3;
    return tot ? 2 * inter / tot : 0;
  }
  function noteLoop(reply) {
    const cur = normReply(reply);
    if (!turnUsedTools) noToolTurns += 1;
    else {
      noToolTurns = 0;
      forceToolPrefill = false;
    }
    if (infiniteWake && noToolTurns >= 2 && replySim(prevReplyNorm, cur) >= 0.6) {
      forceToolPrefill = true;
      console.warn("[infwake] \u68C0\u6D4B\u5230\u6587\u5B57\u6B7B\u5FAA\u73AF\uFF08\u8FDE\u7EED\u65E0\u5DE5\u5177 + \u56DE\u590D\u9AD8\u5EA6\u76F8\u4F3C\uFF09\uFF0C\u4E0B\u4E00\u8F6E\u8865 <tool_call> \u9884\u586B\u5145");
    }
    prevReplyNorm = cur;
  }
  setInterval(() => {
    if (infiniteWake && !busy) queueInfiniteWake(1e3);
  }, 6e4);
  setInterval(() => {
    if (!busy) return;
    if (!lastTurnActivityTs) {
      touchTurnActivity();
      return;
    }
    if (Date.now() - lastTurnActivityTs < 5 * 6e4) return;
    console.warn("[guard] \u5F53\u524D\u8F6E\u6B21\u65E0\u4EFB\u4F55\u8FDB\u5C55\u8D85\u8FC7 5 \u5206\u949F\uFF0C\u5F3A\u5236\u4E2D\u65AD\u5E76\u91CA\u653E");
    turnAbortReason = "guard";
    touchTurnActivity();
    try {
      turnAbort?.abort();
    } catch {
    }
    try {
      speech.stop && speech.stop();
    } catch {
    }
    busy = false;
    showBubble("\uFF08\u5361\u4F4F\u4E86\uFF0C\u6211\u5F3A\u884C\u4E2D\u65AD\u4E86\u4E0A\u4E00\u8F6E\uFF5E\uFF09");
    setTimeout(() => {
      if (!busy) hideBubble();
    }, 6e3);
    if (infiniteWake) queueInfiniteWake(3e3);
  }, 3e4);
  setInterval(() => {
    try {
      window.petWindow && window.petWindow.wakeBeat && window.petWindow.wakeBeat({
        infwake: !!infiniteWake,
        busy: !!busy,
        ctx: lastCtxTokens,
        turnSeq,
        lastActivityTs: lastTurnActivityTs
      });
    } catch {
    }
  }, 2e4);
  var micStream = null;
  var micAudioCtx = null;
  var micSource = null;
  var micProcessor = null;
  var micBuffers = [];
  var isRecording = false;
  function encodeWAV(samples, sampleRate) {
    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);
    const writeString = (v4, off, str) => {
      for (let i3 = 0; i3 < str.length; i3++) v4.setUint8(off + i3, str.charCodeAt(i3));
    };
    writeString(view, 0, "RIFF");
    view.setUint32(4, 36 + samples.length * 2, true);
    writeString(view, 8, "WAVE");
    writeString(view, 12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(view, 36, "data");
    view.setUint32(40, samples.length * 2, true);
    let offset = 44;
    for (let i3 = 0; i3 < samples.length; i3++, offset += 2) {
      const s3 = Math.max(-1, Math.min(1, samples[i3]));
      view.setInt16(offset, s3 < 0 ? s3 * 32768 : s3 * 32767, true);
    }
    return new Blob([view], { type: "audio/wav" });
  }
  async function startRecording() {
    if (isRecording) return;
    if (!unlocked) {
      speech.unlock();
      unlocked = true;
    }
    try {
      micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16e3,
          echoCancellation: true,
          noiseSuppression: true
        }
      });
    } catch (err) {
      console.error("[mic] \u83B7\u53D6\u9EA6\u514B\u98CE\u5931\u8D25:", err);
      showBubble("\u65E0\u6CD5\u8BBF\u95EE\u9EA6\u514B\u98CE\uFF0C\u8BF7\u68C0\u67E5\u7CFB\u7EDF\u8BBE\u7F6E\u4E0E\u6743\u9650");
      return;
    }
    micAudioCtx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16e3 });
    micSource = micAudioCtx.createMediaStreamSource(micStream);
    micProcessor = micAudioCtx.createScriptProcessor(4096, 1, 1);
    micBuffers = [];
    micProcessor.onaudioprocess = (e3) => {
      if (!isRecording) return;
      const inputData = e3.inputBuffer.getChannelData(0);
      micBuffers.push(new Float32Array(inputData));
    };
    micSource.connect(micProcessor);
    micProcessor.connect(micAudioCtx.destination);
    isRecording = true;
    const micBtn = $3("micbtn");
    if (micBtn) micBtn.classList.add("recording");
    showBubble("\u{1F399}\uFE0F \u6B63\u5728\u503E\u542C\u4E3B\u4EBA\u8BF4\u8BDD\u2026\uFF08\u518D\u6B21\u70B9\u51FB\u7ED3\u675F\u5E76\u8BC6\u522B\uFF09");
  }
  async function stopRecording() {
    if (!isRecording) return null;
    isRecording = false;
    const micBtn = $3("micbtn");
    if (micBtn) micBtn.classList.remove("recording");
    if (micProcessor) {
      try {
        micProcessor.disconnect();
      } catch {
      }
      micProcessor.onaudioprocess = null;
      micProcessor = null;
    }
    if (micSource) {
      try {
        micSource.disconnect();
      } catch {
      }
      micSource = null;
    }
    const sampleRate = micAudioCtx ? micAudioCtx.sampleRate : 16e3;
    if (micAudioCtx) {
      try {
        await micAudioCtx.close();
      } catch {
      }
      micAudioCtx = null;
    }
    if (micStream) {
      micStream.getTracks().forEach((t3) => t3.stop());
      micStream = null;
    }
    const totalLength = micBuffers.reduce((acc, b4) => acc + b4.length, 0);
    if (totalLength === 0) return null;
    const merged = new Float32Array(totalLength);
    let offset = 0;
    for (const b4 of micBuffers) {
      merged.set(b4, offset);
      offset += b4.length;
    }
    micBuffers = [];
    return { blob: encodeWAV(merged, sampleRate), duration: totalLength / sampleRate };
  }
  async function handleMicToggle() {
    if (isRecording) {
      const result = await stopRecording();
      if (!result || result.duration < 0.4) {
        showBubble("\u5F55\u97F3\u65F6\u95F4\u592A\u77ED\u4E86\u54E6");
        setTimeout(() => {
          if (!busy) hideBubble();
        }, 2500);
        return;
      }
      showBubble("\u8BC6\u522B\u8BED\u97F3\u4E2D\u2026");
      try {
        const res = await fetch("/api/asr", {
          method: "POST",
          headers: { "Content-Type": "audio/wav" },
          body: result.blob
        });
        const data = await res.json();
        if (data && data.ok && data.text && data.text.trim()) {
          const text = data.text.trim();
          input.value = input.value ? input.value + " " + text : text;
          autoGrowInput();
          input.focus();
          hideBubble();
        } else {
          showBubble("\u6CA1\u542C\u6E05\u4E3B\u4EBA\u8BF4\u4E86\u4EC0\u4E48\u5462\uFF0C\u518D\u8BD5\u4E00\u6B21\u5427~");
          setTimeout(() => {
            if (!busy) hideBubble();
          }, 3e3);
        }
      } catch (err) {
        console.error("[asr] \u8BC6\u522B\u8BF7\u6C42\u5931\u8D25:", err);
        showBubble("\u8BED\u97F3\u8BC6\u522B\u5931\u8D25: " + (err.message || "\u7F51\u7EDC\u6216\u670D\u52A1\u5F02\u5E38"));
        setTimeout(() => {
          if (!busy) hideBubble();
        }, 4e3);
      }
    } else {
      if (busy) {
        showBubble("\u6B63\u5728\u5FD9\u788C\u4E2D\uFF0C\u8BF7\u7A0D\u5019\u2026");
        return;
      }
      await startRecording();
    }
  }
  $3("micbtn")?.addEventListener("click", handleMicToggle);
  $3("continuebtn").addEventListener("click", () => {
    if (busy) interrupt();
    else continueRequest();
  });
  async function continueRequest() {
    if (busy) return false;
    if (!lastExchange || !lastExchange.reqPayload) {
      showBubble("\uFF08\u6CA1\u6709\u53EF\u7EE7\u7EED\u7684\u4E0A\u4E00\u8F6E\u8BF7\u6C42\uFF09");
      setTimeout(() => {
        if (!busy) hideBubble();
      }, 3e3);
      return false;
    }
    if (!unlocked) {
      speech.unlock();
      unlocked = true;
    }
    busy = true;
    turnSeq += 1;
    turnAbortReason = "";
    touchTurnActivity();
    turnAbort = new AbortController();
    const isAbort = (e3) => e3?.name === "AbortError" || turnAbort?.signal.aborted;
    player.act("hop");
    showBubble("\u7EE7\u7EED\u4E2D\u2026");
    let replied = false;
    try {
      const baseMsgs = JSON.parse(JSON.stringify(lastExchange.reqPayload.messages || []));
      const prevRes = JSON.parse(JSON.stringify(lastExchange.resMsg || { role: "assistant", content: "" }));
      const lastIdx = baseMsgs.length - 1;
      if (lastIdx >= 0 && baseMsgs[lastIdx].role === "assistant" && prevRes.role === "assistant") {
        baseMsgs[lastIdx] = {
          ...baseMsgs[lastIdx],
          content: (baseMsgs[lastIdx].content || "") + (prevRes.content || ""),
          ...prevRes.tool_calls ? { tool_calls: prevRes.tool_calls } : {}
        };
      } else if (prevRes) {
        baseMsgs.push(prevRes);
      }
      const toolKeywords = /(?:file_tool|copy_file|write_file|append_file|read_file|list_dir|delete_file|take_screenshot|search_memory|调用.*工具)/i;
      const hadNoToolCalls = !prevRes.tool_calls?.length && !/<tool_call>/i.test(prevRes.content || "");
      const seemsToolIntent = toolKeywords.test(prevRes.content || "") && hadNoToolCalls;
      if (seemsToolIntent) {
        const targetMsg = baseMsgs[baseMsgs.length - 1];
        if (targetMsg && targetMsg.role === "assistant") {
          targetMsg.content = targetMsg.content.trimEnd() + "\n<tool_call>";
        }
      }
      const isInf = Boolean(lastExchange.isInf);
      const targetHist = isInf ? infHistory : history;
      const hadSaved = lastExchange.hadSavedHistory;
      const oldReply = hadSaved && targetHist.length ? targetHist[targetHist.length - 1].content || "" : "";
      const userContent = lastExchange.userContent || "\uFF08\u7EE7\u7EED\uFF09";
      const newReply = await askLLM(userContent, turnAbort.signal, [], baseMsgs, isInf);
      const fullReply = oldReply ? oldReply + "\n" + newReply : newReply;
      if (hadSaved && targetHist.length && targetHist[targetHist.length - 1].role === "assistant") {
        targetHist[targetHist.length - 1].content = fullReply;
      } else if (isInf) {
        if (fullReply && String(fullReply).trim()) targetHist.push({ role: "assistant", content: fullReply });
      } else {
        targetHist.push({ role: "user", content: userContent }, { role: "assistant", content: fullReply });
      }
      if (lastExchange) lastExchange.hadSavedHistory = true;
      await saveHistory(targetHist, isInf);
      showBubble(fullReply);
      replied = true;
      react(newReply);
      if (!isInf) memoryAddFire(userContent, fullReply);
      queueInfiniteWake();
      return true;
    } catch (e3) {
      if (isAbort(e3)) {
        if (!replied) {
          showBubble(turnAbortReason === "guard" ? "\uFF08\u4E0A\u4E00\u8F6E\u54CD\u5E94\u8D85\u65F6\uFF0C\u81EA\u52A8\u91CD\u8FDE\u2026\uFF09" : "\uFF08\u5DF2\u6253\u65AD\uFF09");
          setTimeout(() => {
            if (!busy) hideBubble();
          }, 3e3);
        }
        if (turnAbortReason === "guard") queueInfiniteWake(3e3);
        return false;
      }
      showBubble("\u7EE7\u7EED\u5931\u8D25: " + String(e3.message || e3), true);
      queueInfiniteWake(3e4);
      return false;
    } finally {
      busy = false;
      turnAbort = null;
      touchTurnActivity();
      input.focus();
    }
  }
  var wakeTimer = null;
  var wakeInput = document.getElementById("wakecfg");
  function applyWakeInterval(min) {
    min = Math.max(0, Math.min(1440, parseInt(min, 10) || 0));
    localStorage.setItem("wakeIntervalMin", String(min));
    if (wakeTimer) {
      clearInterval(wakeTimer);
      wakeTimer = null;
    }
    if (min > 0) wakeTimer = setInterval(() => wakeNow(), min * 60 * 1e3);
    wakeInput.value = min;
    wakeInput.title = min > 0 ? `\u81EA\u52A8\u5524\u9192\uFF1A\u6BCF ${min} \u5206\u949F\uFF080 = \u5173\u95ED\uFF09` : "\u81EA\u52A8\u5524\u9192\u95F4\u9694\uFF08\u5206\u949F\uFF09\uFF0C0 = \u5173\u95ED";
  }
  wakeInput.addEventListener("change", () => applyWakeInterval(wakeInput.value));
  wakeInput.addEventListener("keydown", (e3) => {
    if (e3.key === "Enter") {
      e3.preventDefault();
      e3.stopPropagation();
      applyWakeInterval(wakeInput.value);
      wakeInput.blur();
    }
  });
  applyWakeInterval(parseInt(localStorage.getItem("wakeIntervalMin") || "0", 10));
  document.getElementById("chatform").addEventListener("submit", (e3) => {
    e3.preventDefault();
    send();
  });
  input.addEventListener("keydown", (e3) => {
    if (e3.key === "Enter" && !e3.shiftKey && !e3.isComposing && e3.keyCode !== 229) {
      e3.preventDefault();
      send();
    }
  });
  var pendingImage = null;
  function setPendingImage(dataUrl) {
    pendingImage = dataUrl;
    pendingBox.querySelector("img").src = dataUrl;
    pendingBox.style.display = dataUrl ? "flex" : "none";
    layoutChat();
  }
  function clearPendingImage(e3) {
    if (e3) {
      e3.preventDefault();
      e3.stopPropagation();
    }
    pendingImage = null;
    pendingBox.style.display = "none";
    layoutChat();
    if (lastPX >= 0 && lastPY >= 0) refreshClickThrough(lastPX, lastPY);
  }
  var imgDelBtn = $3("imgdel");
  imgDelBtn.addEventListener("click", clearPendingImage);
  imgDelBtn.addEventListener("pointerdown", (e3) => e3.stopPropagation());
  input.addEventListener("paste", (e3) => {
    const item = [...e3.clipboardData?.items || []].find((i3) => i3.type.startsWith("image/"));
    if (!item) return;
    e3.preventDefault();
    const blob = item.getAsFile();
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, 1280 / Math.max(img.width, img.height));
      const c3 = document.createElement("canvas");
      c3.width = Math.round(img.width * scale);
      c3.height = Math.round(img.height * scale);
      c3.getContext("2d").drawImage(img, 0, 0, c3.width, c3.height);
      setPendingImage(c3.toDataURL("image/jpeg", 0.85));
    };
    img.src = url;
  });
  $3("shot").addEventListener("click", async () => {
    if (!window.petWindow?.captureScreen || busy) return;
    const b64 = await window.petWindow.captureScreen();
    if (b64) setPendingImage("data:image/jpeg;base64," + b64);
  });
  $3("close").addEventListener("click", () => {
    if (window.petWindow?.quitApp) window.petWindow.quitApp();
    else window.close();
  });
  var petCanvas = $3("pet");
  var petWrap = $3("petwrap");
  var closeBtn = $3("close");
  var inputRow = $3("inputrow");
  var pendingBox = $3("pendingimg");
  var clickThrough = null;
  function rectHit(el, x4, y4, insetX = 0, insetY = 0) {
    const r2 = el.getBoundingClientRect();
    return x4 >= r2.left + insetX && x4 <= r2.right - insetX && y4 >= r2.top + insetY && y4 <= r2.bottom - insetY;
  }
  function refreshClickThrough(x4, y4) {
    const overRoom = roomRect && x4 >= roomRect.x && x4 <= roomRect.x + roomRect.width && y4 >= roomRect.y && y4 <= roomRect.y + roomRect.height;
    const overPending = pendingBox && pendingBox.style.display !== "none" && rectHit(pendingBox, x4, y4, -6, -6);
    const overBubble = bubble && bubble.style.display !== "none" && rectHit(bubble, x4, y4, -6, -6);
    const over = overRoom || rectHit(petCanvas, x4, y4, petCanvas.getBoundingClientRect().width * 0.14, 8) || rectHit(closeBtn, x4, y4, -6, -6) || rectHit(inputRow, x4, y4, -6, -6) || overPending || overBubble;
    if (over !== clickThrough) {
      clickThrough = over;
      window.petWindow?.setClickThrough?.(!over);
    }
  }
  var lastPX = -1;
  var lastPY = -1;
  window.addEventListener("pointermove", (e3) => {
    lastPX = e3.clientX;
    lastPY = e3.clientY;
    refreshClickThrough(e3.clientX, e3.clientY);
  }, { passive: true });
  var drag = null;
  function autoGrowInput() {
    input.style.height = "auto";
    input.style.height = Math.min(input.scrollHeight, 140) + "px";
    input.style.overflowY = input.scrollHeight > 140 ? "auto" : "hidden";
    layoutChat();
  }
  input.addEventListener("input", autoGrowInput);
  function layoutChat() {
    const r2 = petCanvas.getBoundingClientRect();
    const left = Math.max(8, Math.min(window.innerWidth - 428, r2.left + r2.width / 2 - 210));
    const ih = inputRow.offsetHeight || 40;
    const inB = Math.max(2, window.innerHeight - r2.bottom - ih - 4);
    inputRow.style.left = left + "px";
    inputRow.style.bottom = inB + "px";
    const imgB = inB + ih + 4;
    pendingBox.style.left = left + "px";
    pendingBox.style.bottom = imgB + "px";
    pendingBox.style.display = pendingImage ? "flex" : "none";
    const bubB = imgB + (pendingImage ? pendingBox.offsetHeight + 4 : 0);
    bubble.style.left = left + "px";
    bubble.style.bottom = bubB + "px";
    updatePetDprScale();
  }
  function loadPetPos() {
    try {
      const p3 = JSON.parse(localStorage.getItem("petPos2") || "null");
      if (p3) {
        petWrap.style.setProperty("--pet-right", Math.max(0, Math.min(window.innerWidth - 100, p3.right)) + "px");
        petWrap.style.setProperty("--pet-y", Math.max(46, Math.min(window.innerHeight - 80, p3.bottom)) + "px");
      }
    } catch {
    }
  }
  function savePetPos() {
    localStorage.setItem("petPos2", JSON.stringify({
      right: parseInt(petWrap.style.getPropertyValue("--pet-right")) || 24,
      bottom: parseInt(petWrap.style.getPropertyValue("--pet-y")) || 46
    }));
  }
  loadPetPos();
  function beginPetDrag(e3) {
    drag = {
      sx: e3.clientX,
      sy: e3.clientY,
      oRight: parseInt(petWrap.style.getPropertyValue("--pet-right")) || 24,
      oBottom: parseInt(petWrap.style.getPropertyValue("--pet-y")) || 46
    };
    e3.preventDefault();
  }
  petCanvas.addEventListener("mousedown", beginPetDrag);
  bubble.addEventListener("mousedown", (e3) => {
    if (rectHit(petCanvas, e3.clientX, e3.clientY, petCanvas.getBoundingClientRect().width * 0.14, 8)) beginPetDrag(e3);
  });
  var dragRaf = 0;
  var dragTarget = null;
  window.addEventListener("mousemove", (e3) => {
    if (!drag) return;
    const nR = Math.max(0, Math.min(window.innerWidth - 100, drag.oRight - (e3.clientX - drag.sx)));
    const nB = Math.max(46, Math.min(window.innerHeight - 80, drag.oBottom - (e3.clientY - drag.sy)));
    petWrap.style.setProperty("--pet-right", nR + "px");
    petWrap.style.setProperty("--pet-y", nB + "px");
    dragTarget = { nR, nB };
    if (dragRaf) return;
    dragRaf = requestAnimationFrame(() => {
      dragRaf = 0;
      if (!dragTarget) return;
      layoutChat();
    });
  });
  window.addEventListener("mouseup", () => {
    if (!drag) return;
    if (dragRaf) {
      cancelAnimationFrame(dragRaf);
      dragRaf = 0;
    }
    dragTarget = null;
    drag = null;
    layoutChat();
    savePetPos();
    ensurePetVisible();
    updateInRoom(true);
  });
  window.addEventListener("resize", () => {
    layoutChat();
    syncRoomRect();
  });
  var walkToken = 0;
  function walkToFraction(fx, fy) {
    return new Promise((resolve) => {
      const token = ++walkToken;
      const W3 = window.innerWidth, H3 = window.innerHeight;
      const halfW = Math.max(20, petCanvas.offsetWidth / 2);
      const curR = parseInt(petWrap.style.getPropertyValue("--pet-right")) || 24;
      const curB = parseInt(petWrap.style.getPropertyValue("--pet-y")) || 46;
      let tgtR = Math.round(W3 - fx * W3 - halfW);
      let tgtB = Math.round((1 - fy) * H3);
      tgtR = Math.max(0, Math.min(W3 - 100, tgtR));
      tgtB = Math.max(46, Math.min(H3 - 80, tgtB));
      const dist = Math.hypot(tgtR - curR, tgtB - curB);
      const dur = Math.max(700, Math.min(4e3, dist * 4));
      const t0 = performance.now();
      const ease = (t3) => t3 < 0.5 ? 2 * t3 * t3 : 1 - Math.pow(-2 * t3 + 2, 2) / 2;
      let settled = false;
      const guard = setTimeout(() => finish(true), dur + 1500);
      function finish(instant) {
        if (settled) return;
        settled = true;
        clearTimeout(guard);
        if (instant) {
          petWrap.style.setProperty("--pet-right", tgtR + "px");
          petWrap.style.setProperty("--pet-y", tgtB + "px");
        }
        savePetPos();
        ensurePetVisible();
        updateInRoom(true);
        if (lastPX >= 0) refreshClickThrough(lastPX, lastPY);
        resolve();
      }
      function step(now) {
        if (token !== walkToken) {
          settled = true;
          clearTimeout(guard);
          resolve();
          return;
        }
        const t3 = Math.min(1, (now - t0) / dur);
        const e3 = ease(t3);
        petWrap.style.setProperty("--pet-right", curR + (tgtR - curR) * e3 + "px");
        petWrap.style.setProperty("--pet-y", curB + (tgtB - curB) * e3 + "px");
        layoutChat();
        if (t3 < 1) requestAnimationFrame(step);
        else finish(false);
      }
      requestAnimationFrame(step);
    });
  }
  function displayCssRect(d2) {
    if (!d2 || !winBounds) return null;
    const V3 = WINDOW_DPR / (d2.scaleFactor || 1);
    const b4 = d2.bounds;
    return { x: b4.x / V3 - winBounds.x, y: 2 * b4.y / V3 - winBounds.y, w: b4.width / V3, h: b4.height / V3 };
  }
  function walkToCss(tx, ty) {
    return walkToFraction(tx / window.innerWidth, ty / window.innerHeight);
  }
  var displayInfo = [];
  var winBounds = null;
  var WINDOW_DPR = window.devicePixelRatio || 1;
  var dprFactor = 1;
  var lastDprTransform = null;
  var AUTO_DPI_SCALE = true;
  async function refreshDisplays() {
    try {
      if (window.petWindow && window.petWindow.getDisplays) displayInfo = await window.petWindow.getDisplays();
      if (window.petWindow && window.petWindow.getWinBounds) winBounds = await window.petWindow.getWinBounds();
    } catch {
      displayInfo = [];
    }
    ensurePetVisible();
    updatePetDprScale();
  }
  function ensurePetVisible() {
    if (!displayInfo || !displayInfo.length || !winBounds) return;
    const right = parseInt(petWrap.style.getPropertyValue("--pet-right")) || 24;
    const bottom = parseInt(petWrap.style.getPropertyValue("--pet-y")) || 46;
    const petW = petCanvas.offsetWidth || 200;
    const fx = winBounds.x + (window.innerWidth - right - petW / 2);
    const fy = winBounds.y + (window.innerHeight - bottom);
    const onSome = displayInfo.some((d3) => {
      const b5 = d3.bounds;
      return fx >= b5.x && fx <= b5.x + b5.width && fy >= b5.y && fy <= b5.y + b5.height;
    });
    if (onSome) return;
    const d2 = displayInfo.find((x4) => x4.isPrimary) || displayInfo[0];
    const b4 = d2.bounds;
    const tx = b4.x + b4.width / 2, ty = b4.y + b4.height - 80;
    const cX = tx - winBounds.x, cY = ty - winBounds.y;
    petWrap.style.setProperty("--pet-right", Math.max(0, Math.min(window.innerWidth - 100, window.innerWidth - cX - petW / 2)) + "px");
    petWrap.style.setProperty("--pet-y", Math.max(46, Math.min(window.innerHeight - 80, window.innerHeight - cY)) + "px");
    savePetPos();
    layoutChat();
  }
  function updatePetDprScale() {
    if (!AUTO_DPI_SCALE) return;
    if (!displayInfo || !displayInfo.length || !winBounds) return;
    const right = parseInt(petWrap.style.getPropertyValue("--pet-right")) || 24;
    const bottom = parseInt(petWrap.style.getPropertyValue("--pet-y")) || 46;
    const petW = petCanvas.offsetWidth || 200;
    const sx = winBounds.x + (window.innerWidth - right - petW / 2);
    const sy = winBounds.y + (window.innerHeight - bottom);
    let scale = WINDOW_DPR;
    for (const d2 of displayInfo) {
      const b4 = d2.bounds;
      if (sx >= b4.x && sx <= b4.x + b4.width && sy >= b4.y && sy <= b4.y + b4.height) {
        scale = d2.scaleFactor || WINDOW_DPR;
        break;
      }
    }
    const factor = Math.max(0.25, Math.min(4, scale / WINDOW_DPR));
    dprFactor = factor;
    const t3 = Math.abs(factor - 1) < 0.02 ? "" : "scale(" + factor + ")";
    if (t3 === lastDprTransform) return;
    lastDprTransform = t3;
    for (const el of [petWrap, document.getElementById("inputrow"), document.getElementById("bubble"), document.getElementById("pendingimg")]) {
      if (!el) continue;
      el.style.transformOrigin = "bottom center";
      el.style.transform = t3;
    }
  }
  refreshDisplays();
  var petScale = Math.max(20, Math.min(100, parseFloat(localStorage.getItem("petScale")) || 88));
  function applyScale() {
    petWrap.style.setProperty("--pet-h", petScale + "%");
    layoutChat();
    updateInRoom();
  }
  applyScale();
  petCanvas.addEventListener("wheel", (e3) => {
    e3.preventDefault();
    petScale = Math.max(20, Math.min(100, petScale + (e3.deltaY < 0 ? 4 : -4)));
    localStorage.setItem("petScale", String(petScale));
    applyScale();
  }, { passive: false });
  var roomEl = $3("room");
  var roomFrame = $3("roomframe");
  if (ROLE === "pet" && roomFrame) {
    try {
      roomFrame.src = "about:blank";
    } catch {
    }
  }
  var bedroomMode = false;
  var roomRect = null;
  var roomState = { curtain: "open", lamp: "off" };
  var inRoom = false;
  function applyBedroom(on) {
    bedroomMode = ROLE === "pet" ? false : !!on;
    roomEl.style.display = bedroomMode ? "block" : "none";
    syncRoomRect();
  }
  function syncRoomRect() {
    roomRect = bedroomMode ? { x: 0, y: 0, width: innerWidth, height: innerHeight } : null;
    updateInRoom();
  }
  function pushRoomState() {
    try {
      roomFrame && roomFrame.contentWindow && roomFrame.contentWindow.postMessage({ type: "set-room-state", state: roomState }, "*");
    } catch {
    }
  }
  async function setRoomState(patch) {
    if (patch.curtain === "open" || patch.curtain === "closed") roomState.curtain = patch.curtain;
    if (patch.lamp === "on" || patch.lamp === "off") roomState.lamp = patch.lamp;
    pushRoomState();
    try {
      if (window.petWindow) await window.petWindow.roomStateSave(roomState);
      else await fetch("/api/room-state", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(roomState) });
    } catch {
    }
  }
  window.addEventListener("message", (e3) => {
    if (!roomFrame || e3.source !== roomFrame.contentWindow) return;
    const d2 = e3.data;
    if (!d2 || typeof d2 !== "object") return;
    if (d2.type === "room-state-request") {
      pushRoomState();
      return;
    }
    if (d2.type !== "room-state") return;
    if (d2.curtain === "open" || d2.curtain === "closed") roomState.curtain = d2.curtain;
    if (d2.lamp === "on" || d2.lamp === "off") roomState.lamp = d2.lamp;
    try {
      if (window.petWindow) window.petWindow.roomStateSave(roomState);
      else fetch("/api/room-state", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(roomState) });
    } catch {
    }
  });
  if (roomFrame) roomFrame.addEventListener("load", pushRoomState);
  window.petWindow?.onRoomChanged?.(() => {
    if (roomFrame) roomFrame.src = "/pet_space/room/index.html?t=" + Date.now();
  });
  function updateInRoom(announce = false) {
    const was = inRoom;
    if (!roomRect) {
      inRoom = false;
      return;
    }
    const r2 = petCanvas.getBoundingClientRect();
    const cx = r2.left + r2.width / 2, cy = r2.top + r2.height / 2;
    inRoom = cx >= roomRect.x && cx <= roomRect.x + roomRect.width && cy >= roomRect.y && cy <= roomRect.y + roomRect.height;
    if (inRoom !== was && announce && !busy) {
      showBubble(inRoom ? "\u56DE\u5367\u5BA4\u5566~" : "\u51FA\u6765\u966A\u4F60\u5566~");
      setTimeout(() => {
        if (!busy) hideBubble();
      }, 4e3);
    }
  }
  (async () => {
    let s3 = null;
    try {
      s3 = window.petWindow ? await window.petWindow.roomStateLoad() : await (await fetch("/api/room-state")).json();
    } catch {
    }
    roomState = { curtain: s3?.curtain === "closed" ? "closed" : "open", lamp: s3?.lamp === "on" ? "on" : "off" };
    pushRoomState();
  })();
  window.petWindow?.onDisplaysChanged?.(async () => {
    try {
      const c3 = await (await fetch("/api/config", { cache: "no-store" })).json();
      applyBedroom(c3?.bedroom);
      await refreshDisplays();
      layoutChat();
    } catch {
    }
  });
  {
    const dbg = { ptr: 0, mouse: 0, lastX: null, lastY: null, lastTarget: "", sent: 0 };
    window.addEventListener("pointermove", (e3) => {
      dbg.ptr++;
      dbg.lastX = e3.clientX;
      dbg.lastY = e3.clientY;
      dbg.lastTarget = e3.target?.id || e3.target?.tagName || "?";
    }, { passive: true });
    window.addEventListener("mousemove", () => dbg.mouse++, { passive: true });
    setInterval(() => {
      const p3 = player?.params ?? {};
      fetch("/api/dbg", { method: "POST", body: JSON.stringify({
        t: (/* @__PURE__ */ new Date()).toISOString(),
        ptr: dbg.ptr,
        mouse: dbg.mouse,
        last: [dbg.lastX, dbg.lastY, dbg.lastTarget],
        angleX: +(+p3.angleX).toFixed(1),
        eyeBallX: +(+p3.eyeBallX).toFixed(2),
        browL: +(+p3.browLY).toFixed(2),
        smile: +(+p3.smile).toFixed(2),
        clickThrough,
        hasBridge: typeof window.petWindow !== "undefined",
        dpr: WINDOW_DPR,
        wh: [innerWidth, innerHeight],
        fac: dprFactor,
        canvas: (() => {
          const r2 = petCanvas.getBoundingClientRect();
          return [Math.round(r2.left), Math.round(r2.top), Math.round(r2.width), Math.round(r2.height)];
        })()
      }) }).catch(() => {
      });
      dbg.sent++;
    }, 2e3);
  }
  speech.onIdle = () => {
    if (bubble.classList.contains("error")) return;
    setTimeout(() => {
      if (!busy) hideBubble();
    }, 6e3);
  };
  (async () => {
    try {
      syncHistoryFromDisk();
      await player.load("/characters/p01/");
      layoutChat();
      showBubble("\u4F60\u597D\u5440\uFF0C\u6211\u4E0A\u7EBF\u5566\uFF01");
      setTimeout(() => {
        if (!busy && bubble.textContent === "\u4F60\u597D\u5440\uFF0C\u6211\u4E0A\u7EBF\u5566\uFF01") hideBubble();
      }, 15e3);
      const awParam = new URLSearchParams(location.search).get("autowake");
      if (awParam) {
        let awText = awParam === "1" ? "\uFF08\u81EA\u52A8\u6D4B\u8BD5\uFF09\u4E3B\u4EBA\u60F3\u4F60\u4E86\uFF0C\u968F\u4FBF\u8BF4\u4E00\u53E5" : awParam;
        if (awParam === "editprobe") awText = "\uFF08\u6D4B\u8BD5\uFF09\u8BF7\u5728\u4F60\u7684\u623F\u95F4\u9875\u9762 pet_space/room/index.html \u91CC\u52A0\u4E00\u884C HTML \u6CE8\u91CA <!-- probe -->\uFF0C\u6539\u5B8C\u8C03\u7528 look_at_room \u770B\u4E00\u773C\u623F\u95F4\u786E\u8BA4\u6548\u679C\u3002";
        setTimeout(() => {
          if (!busy) wakeNow(awText);
        }, 6e3);
        rlog("autowake", awText.slice(0, 40));
      }
    } catch (e3) {
      showBubble("\u89D2\u8272\u52A0\u8F7D\u5931\u8D25: " + (e3.message || e3), true);
    }
  })();
})();
