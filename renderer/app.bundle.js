(() => {
  // node_modules/@livliv-dev/player/dist/chunks/params-BCSFSCtz.js
  var e = () => ({ angleX: 0, angleY: 0, angleZ: 0, eyeLOpen: 1, eyeROpen: 1, eyeBallX: 0, eyeBallY: 0, browLY: 0, browRY: 0, mouthOpen: 0, smile: 0, vowel: 0, bodyX: 0, bodyZ: 0, breath: 0 });
  var t = { angleX: [-30, 30], angleY: [-30, 30], angleZ: [-30, 30], eyeLOpen: [0, 1], eyeROpen: [0, 1], eyeBallX: [-1, 1], eyeBallY: [-1, 1], browLY: [-1, 1], browRY: [-1, 1], mouthOpen: [0, 1], smile: [0, 1], vowel: [-1, 1], bodyX: [-10, 10], bodyZ: [-10, 10], breath: [0, 1] };
  var n = (e3, t5, n4) => {
    let r3 = Math.min(1, Math.max(0, (n4 - e3) / (t5 - e3)));
    return r3 * r3 * (3 - 2 * r3);
  };

  // node_modules/@livliv-dev/player/dist/chunks/errors-CnM7mtIA.js
  function e2(e3, t5, n4) {
    let r3 = t5[0] - e3[0], i3 = (t5[1] - e3[1]) * n4;
    return { x: e3[0], y: e3[1], rotation: Math.atan2(i3, r3), scale: Math.hypot(r3, i3) * 2 };
  }
  var t2 = class extends Error {
    code;
    status;
    constructor(e3, t5, n4 = {}) {
      super(t5, n4.cause === void 0 ? void 0 : { cause: n4.cause }), this.name = `LivLivError`, this.code = e3, n4.status !== void 0 && (this.status = n4.status);
    }
  };

  // node_modules/@livliv-dev/player/dist/chunks/profile-DZSVSujC.js
  var t3 = [`angleX`, `angleY`, `angleZ`, `eyeLOpen`, `eyeROpen`, `eyeBallX`, `eyeBallY`, `browLY`, `browRY`, `mouthOpen`, `smile`, `bodyX`];
  var n2 = (e3, t5, n4) => Math.max(t5, Math.min(n4, e3));
  function r(t5) {
    return { input: [...t[t5]], output: [...t[t5]], smoothing: 0, curve: 1 };
  }
  function i(i3) {
    if (!i3 || typeof i3 != `object` || Array.isArray(i3)) return {};
    let a4 = {};
    for (let o3 of t3) {
      let t5 = i3[o3];
      if (!t5 || typeof t5 != `object` || Array.isArray(t5)) continue;
      let s3 = t5, c3 = r(o3), [l3, u2] = t[o3], d2 = (e3) => Array.isArray(e3) && e3.length === 2 && e3.every((e4) => typeof e4 == `number` && Number.isFinite(e4)) ? [n2(e3[0], l3, u2), n2(e3[1], l3, u2)] : null, f3 = d2(s3.input), p3 = d2(s3.output);
      f3 && f3[1] - f3[0] > 1e-6 && (c3.input = f3), p3 && (c3.output = p3), typeof s3.smoothing == `number` && Number.isFinite(s3.smoothing) && (c3.smoothing = n2(s3.smoothing, 0, 1)), typeof s3.curve == `number` && Number.isFinite(s3.curve) && (c3.curve = n2(s3.curve, 0.2, 3)), a4[o3] = c3;
    }
    return a4;
  }
  var a = class {
    rules = {};
    previous = {};
    last = null;
    constructor(e3) {
      this.profile = e3 ?? {};
    }
    get profile() {
      return i(this.rules);
    }
    set profile(e3) {
      let n4 = i(e3);
      for (let e4 of t3) JSON.stringify(n4[e4]) !== JSON.stringify(this.rules[e4]) && delete this.previous[e4];
      this.rules = n4;
    }
    get sample() {
      return this.last && { input: { ...this.last.input }, output: { ...this.last.output } };
    }
    apply(e3, t5) {
      let r3 = { ...e3 };
      for (let i3 of Object.keys(this.rules)) {
        let a4 = this.rules[i3], [o3, s3] = a4.input, c3 = n2((e3[i3] - o3) / (s3 - o3), 0, 1);
        if (o3 < 0 && s3 > 0) {
          let e4 = -o3 / (s3 - o3);
          c3 = c3 < e4 ? e4 - e4 * ((e4 - c3) / e4) ** +a4.curve : e4 + (1 - e4) * ((c3 - e4) / (1 - e4)) ** a4.curve;
        } else c3 **= +a4.curve;
        let l3 = a4.output[0] + c3 * (a4.output[1] - a4.output[0]), u2 = this.previous[i3] ?? l3, d2 = a4.smoothing ? 1 - Math.exp(-Math.max(0, t5) / (0.5 * a4.smoothing)) : 1;
        r3[i3] = this.previous[i3] = u2 + (l3 - u2) * d2;
      }
      return this.last = { input: { ...e3 }, output: r3 }, r3;
    }
    reset() {
      this.previous = {}, this.last = null;
    }
  };

  // node_modules/@livliv-dev/player/dist/chunks/base-956WGJeV.js
  var a2 = [`hip_l`, `hip_r`, `ankle_l`, `ankle_r`, `knee_l`, `knee_r`, `shoulder_l`, `shoulder_r`, `elbow_l`, `elbow_r`, `wrist_l`, `wrist_r`, `neck`];
  var o = 0.5;
  var s = 0.7;
  var c = 0.5;
  var l = [0, 0.3];
  var u = 0.04;
  var d = 0.7;
  var f = 0.35;
  var p = 0.035;
  var m = 4.2;
  var h = 0.11;
  var g = 2.2 * Math.PI / 180;
  var _ = 0.5;
  var v = 0.4;
  var y = 3.2;
  var b = 0.018;
  var x = 0.3;
  function S(e3, t5) {
    let n4 = e3.body, r3 = Math.max(1, e3.face[2] - e3.face[0]), i3 = (n4.hip_l[0] + n4.hip_r[0]) / 2, a4 = (n4.hip_l[1] + n4.hip_r[1]) / 2, o3 = Math.max(a4 + 1, Math.min(n4.ankle_l[1], n4.ankle_r[1])), s3 = (n4.ankle_l[0] + n4.ankle_r[0]) / 2, c3 = (n4.ankle_l[1] + n4.ankle_r[1]) / 2, l3 = e3.frame ?? [0, 0, t5[0], t5[1]], u2 = [n4.knee_l, n4.knee_r].filter((e4) => !!e4 && e4[2] >= 0.3 && e4[1] > a4 && e4[1] < o3), d2 = u2.length ? u2.reduce((e4, t6) => e4 + t6[1], 0) / u2.length : a4 + 0.5 * (o3 - a4);
    return { hx: i3, hy: a4, ankleY: o3, ax: s3, ay: c3, groundY: n4.ground_y, fw: r3, uw: l3[2] - l3[0], uh: l3[3] - l3[1], kneeY: d2 };
  }
  function C(e3, t5, n4, r3) {
    let i3 = t5.frame;
    if (!i3 || e3 === `whole`) return null;
    if (e3 === `frame` || !r3) return i3;
    let a4 = i3[1], o3 = Math.min(n4[1], r3.kneeY + 0.18 * (r3.ankleY - r3.kneeY));
    if (!(o3 - a4 > i3[3] - i3[1])) return i3;
    let s3 = (i3[0] + i3[2]) / 2, c3 = (o3 - a4) * (i3[2] - i3[0]) / (i3[3] - i3[1]);
    return [s3 - c3 / 2, a4, s3 + c3 / 2, o3];
  }
  var w = `livemaker-puppet`;
  var ne = [`full_body`];
  var T = { canvas: 8192, layers: 512, images: 2048, expressions: 256, eyes: 16, chains: 64, points: 256, texture: 8192, texels: 64 * 2 ** 20, modelJson: 4 * 2 ** 20, keyforms: 32 * 2 ** 20, vertices: 2 ** 21, skinned: 2 ** 20 };
  var E = (e3, t5) => Object.assign(Error(t5), { code: e3 });
  var D = 1e6;
  var re = [`head`, `body`, `hair_back`, `hair_side`, `hair_front`, `hair_inner`];
  var ie = (e3, t5) => Math.max(6, Math.round(Math.max(e3, t5) / 128));
  var O = (e3) => e3.rig?.lattice ?? ie(e3.canvas[0], e3.canvas[1]);
  var ae = /^textures\/[A-Za-z0-9_][A-Za-z0-9_.-]*\.(?:webp|png)$/;
  var k = /^(?!.*(?:^|\/)\.\.(?:\/|$))[A-Za-z0-9_][A-Za-z0-9_.-]*(?:\/[A-Za-z0-9_][A-Za-z0-9_.-]*)*$/;
  var A = /* @__PURE__ */ new WeakSet();
  function j(e3, t5 = N()) {
    if (!e3 || typeof e3 != `object` || Array.isArray(e3)) throw E(`not-a-model`, `not a LivLiv model (model.json is not an object)`);
    if (A.has(e3)) return e3;
    let n4 = e3;
    if (n4.format === void 0 || n4.format === `livemaker-puppet`) {
      let e4 = n4.version ?? 3;
      if (e4 > 3) throw E(`not-a-model`, `this model says format "${w}" version ${e4}, which never existed`);
      return M(n4), A.add(n4), n4;
    }
    if (n4.format !== `livliv-model`) throw E(`not-a-model`, `not a LivLiv model (format "${String(n4.format)}")`);
    let r3 = n4.version;
    if (typeof r3 != `number` || r3 > 4) throw E(`newer-format`, `this model is format version ${r3}; this player reads up to 4: update the player`);
    let i3 = (n4.requires || []).filter((e4) => !ne.includes(e4));
    if (i3.length) throw E(`missing-feature`, `this model needs ${i3.join(`, `)}, which this player does not have: update the player`);
    let a4 = oe(n4, t5);
    return M(a4), A.add(a4), a4;
  }
  function M(e3) {
    let t5 = (e4, t6 = `invalid`) => {
      throw E(t6, `this model is not valid: ${e4}`);
    }, n4 = (e4) => typeof e4 == `number` && Number.isFinite(e4), r3 = (e4, n5, r4) => e4 === void 0 ? [] : ((!Array.isArray(e4) || e4.length > n5) && t5(`${r4} is not a list of at most ${n5}`), e4), [i3 = NaN, o3 = NaN] = Array.isArray(e3.canvas) ? e3.canvas : [];
    n4(i3) && n4(o3) && i3 > 0 && o3 > 0 && i3 <= T.canvas && o3 <= T.canvas || t5(`its canvas ${i3} x ${o3} is out of range`, i3 > T.canvas || o3 > T.canvas ? `too-large` : `invalid`), Array.isArray(e3.layers) && e3.layers.length || t5(`it has no layers`), e3.layers.length > T.layers && t5(`it has ${e3.layers.length} layers, more than ${T.layers}`, `too-large`);
    let s3 = e3.anchors, c3 = s3?.head, l3 = (e4) => n4(e4) && Math.abs(e4) <= D;
    c3 && [c3.cx, c3.cy, c3.rx, c3.ry, s3.neck_y, s3.top_y, s3.bottom_y, s3.hair_root_y].every(l3) && c3.rx > 1e-3 && c3.ry > 1e-3 && Array.isArray(s3.face) && s3.face.length === 4 && s3.face.every(l3) || t5(`its anchors are missing or not numbers`);
    let u2 = (e4, n5) => {
      e4 != null && !l3(e4) && t5(`${n5} is not a number in range`);
    }, d2 = (e4, n5, r4, i4) => {
      e4 != null && (!Array.isArray(e4) || e4.length < n5 || e4.length > r4 || !e4.every(l3)) && t5(`${i4} is not a list of ${n5} to ${r4} numbers`);
    }, f3 = (e4, n5, r4) => {
      if (e4 != null) {
        typeof e4 != `object` && t5(`${r4} is not an object`);
        for (let t6 of n5.split(` `)) u2(e4[t6], `${r4}.${t6}`);
      }
    }, p3 = (e4, n5) => {
      if (e4 != null) {
        (typeof e4 != `object` || Array.isArray(e4)) && t5(`${n5} is not an object`);
        for (let [t6, r4] of Object.entries(e4)) u2(r4, `${n5}.${t6.slice(0, 60)}`);
      }
    };
    if (u2(s3.collar_y, `anchors.collar_y`), s3.frame != null) {
      d2(s3.frame, 4, 4, `anchors.frame`);
      let [e4, n5, r4, a4] = s3.frame;
      e4 >= -i3 && n5 >= -o3 && r4 <= 2 * i3 && a4 <= 2 * o3 && r4 - e4 >= 16 && a4 - n5 >= 16 || t5(`anchors.frame is not a box on the canvas`);
    }
    if (u2(s3.hair_bottom_y, `anchors.hair_bottom_y`), s3.body != null) {
      let e4 = s3.body;
      (typeof e4 != `object` || Array.isArray(e4)) && t5(`anchors.body is not an object`), a2.forEach((n6, r4) => {
        (r4 < 4 || e4[n6] != null) && d2(e4[n6] ?? null, 3, 3, `anchors.body.${n6}`), r4 < 4 && e4[n6] == null && t5(`anchors.body has no ${n6}`);
      }), l3(e4.ground_y) || t5(`anchors.body.ground_y is not a number in range`), u2(e4.hem_y, `anchors.body.hem_y`), d2(e4.hem_x, 2, 2, `anchors.body.hem_x`);
      let n5 = s3.body;
      Math.max(n5.hip_l[1], n5.hip_r[1]) >= Math.min(n5.ankle_l[1], n5.ankle_r[1]) && t5(`anchors.body has its hips below its ankles`), Math.min(n5.hip_l[1], n5.hip_r[1]) <= s3.neck_y + 1 && t5(`anchors.body has its hips above its neck`), s3.face[2] > s3.face[0] || t5(`anchors.face has no width`), s3.frame ?? t5(`anchors.body comes without anchors.frame`);
    }
    f3(s3.jaw, `top chin half open round wide`, `anchors.jaw`), f3(s3.chest, `cx cy rx ry`, `anchors.chest`);
    for (let e4 of r3(s3.eyes, T.eyes, `anchors.eyes`)) e4 ?? t5(`anchors.eyes has an empty entry`), d2(e4, 4, 4, `anchors.eyes`);
    for (let e4 of r3(s3.brows, T.eyes, `anchors.brows`)) d2(e4, 4, 4, `anchors.brows`);
    for (let e4 of r3(s3.brow_lines, T.eyes, `anchors.brow_lines`)) {
      if (e4 == null) continue;
      let n5 = r3(e4.x, T.points, `a brow line`).length;
      n5 || t5(`a brow line has no points`), d2(e4.x, n5, n5, `a brow line`), d2(e4.bottom ?? [], n5, n5, `a brow line`), d2(e4.lid ?? [], n5, n5, `a brow line`), e4.cap != null && d2(e4.cap, n5, n5, `a brow line`);
    }
    f3(e3.tuning, `turn nod hair blink expr mouth breath hairFront hairBack fringe`, `tuning`);
    let m3 = e3.rig;
    if (f3(m3, `yaw pitch roll bulge bulge_shape hair_limit wind breath sway brow pitch_ease jaw`, `rig`), d2(m3?.bulge_extent, 3, 5, `rig.bulge_extent`), d2(m3?.drift, 2, 2, `rig.drift`), d2(m3?.hair_drive, 3, 3, `rig.hair_drive`), f3(m3?.body, `yaw roll breath bust`, `rig.body`), f3(m3?.neck, `twist reach`, `rig.neck`), m3?.lattice != null && !(Number.isInteger(m3.lattice) && m3.lattice >= 6 && m3.lattice <= 256) && t5(`rig.lattice is not a whole number from 6 to 256`), m3?.hair != null) for (let e4 of [`front`, `back`, `side`]) d2(m3.hair[e4], 5, 5, `rig.hair.${e4}`);
    for (let e4 of r3(m3?.chains, T.chains, `rig.chains`)) {
      e4 && typeof e4.id == `string` || t5(`a chain has no id`);
      let i4 = `chain ${e4.id.slice(0, 60)}`, a4 = r3(e4.points, T.points, `${i4}'s points`);
      a4.length < 2 && t5(`${i4} has fewer than two points`);
      for (let e5 of a4) e5 ?? t5(`${i4} has an empty point`), d2(e5, 2, 2, `${i4}'s points`);
      e4.k || t5(`${i4} has no k`), d2(e4.k, 2, 2, `${i4}'s k`);
      for (let r4 of [`damp`, `drive`, `hang`, `wind`]) n4(e4[r4]) || t5(`${i4} has no ${r4}`);
      f3(e4, `depth damp drive hang wind freq limit sigma reach`, i4), p3(e4.bias, `${i4}'s bias`);
    }
    let h3 = O(e3), g3 = e3.layers.find((e4) => e4?.group === `hair_front`)?.bones, _3 = 0, v3 = 0, y3 = 0, b3 = 0;
    for (let a4 of e3.layers) {
      a4 && typeof a4 == `object` && typeof a4.id == `string` || t5(`a layer has no id`), (![a4.x, a4.y, a4.w, a4.h].every(n4) || !(a4.w > 0 && a4.h > 0) || a4.x < -i3 || a4.y < -o3 || a4.x + a4.w > 2 * i3 || a4.y + a4.h > 2 * o3) && t5(`layer ${a4.id.slice(0, 60)}'s box is out of range`), typeof a4.texture != `string` && t5(`layer ${a4.id.slice(0, 60)} has no texture`);
      for (let e5 of [a4.texture, ...r3(a4.frames, T.images, `layer ${a4.id.slice(0, 60)}'s frames`), a4.mask, a4.talk, a4.brow_tex]) e5 !== void 0 && (typeof e5 == `string` && k.test(e5) || t5(`layer ${a4.id.slice(0, 60)}: "${String(e5).slice(0, 80)}" is not a path inside the package`), ++_3 > T.images && t5(`it names more than ${T.images} images`));
      let e4 = `layer ${a4.id.slice(0, 60)}`;
      re.includes(a4.group) || t5(`${e4}'s group is not one a player knows`);
      for (let n5 of [`role`, `clip`, `param`]) a4[n5] != null && typeof a4[n5] != `string` && t5(`${e4}'s ${n5} is not text`);
      a4.visemes != null && !(Array.isArray(a4.visemes) && a4.visemes.every((e5) => typeof e5 == `string`)) && t5(`${e4}'s visemes are not text`), u2(a4.depth, `${e4}'s depth`), u2(a4.fall, `${e4}'s fall`), u2(a4.fall_end, `${e4}'s fall_end`), d2(a4.pivot, 2, 2, `${e4}'s pivot`), d2(a4.range, 2, 2, `${e4}'s range`), d2(a4.rigid, 2, 2, `${e4}'s rigid`), p3(a4.blush, `${e4}'s blush`), p3(a4.show, `${e4}'s show`), p3(a4.hide, `${e4}'s hide`);
      let s4 = r3(a4.bones, T.chains, `${e4}'s bones`);
      new Set(s4).size !== s4.length && t5(`${e4} names a chain twice`), s4.every((e5) => typeof e5 == `string`) || t5(`${e4}'s bones are not chain ids`);
      let c4 = (Math.ceil((a4.x + a4.w) / h3) - Math.floor(a4.x / h3) + 1) * (Math.ceil((a4.y + a4.h) / h3) - Math.floor(a4.y / h3) + 1), l4 = a4.id === `brows` || a4.role === `expr_brows` || !!a4.brow_tex;
      v3 += c4, y3 += c4 * (s4.length + (l4 && Array.isArray(g3) ? g3.length : 0)), l4 && (b3 += a4.w * a4.h);
    }
    v3 > T.vertices && t5(`its layers' meshes would have ${v3} vertices, more than ${T.vertices}`, `too-large`), y3 > T.skinned && t5(`its chains would bend ${y3} vertices, more than ${T.skinned}`, `too-large`), b3 > T.texels && t5(`its brows layers cover ${b3} pixels, more than ${T.texels}`, `too-large`);
    for (let n5 of r3(e3.expressions, T.expressions, `expressions`)) n5 && typeof n5.id == `string` || t5(`an expression has no id`);
    e3.keyforms === void 0 || typeof e3.keyforms == `string` && k.test(e3.keyforms) || t5(`keyforms is not a path inside the package`), e3.watermark != null && typeof e3.watermark != `string` && t5(`its watermark is not text`);
  }
  function oe(e3, t5) {
    if (!Array.isArray(e3.layers) || !e3.layers.length) throw E(`invalid`, `this model has no layers`);
    if (e3.layers.length > T.layers) throw E(`too-large`, `this model has ${e3.layers.length} layers, more than ${T.layers}`);
    let [n4, r3] = e3.canvas || [];
    if (!(n4 > 0 && r3 > 0 && n4 <= T.canvas && r3 <= T.canvas)) throw E(n4 > T.canvas || r3 > T.canvas ? `too-large` : `invalid`, `this model's canvas ${n4} x ${r3} is out of range`);
    for (let t6 of e3.layers) for (let e4 of [t6.texture, ...t6.frames || [], t6.mask, t6.talk, t6.brow_tex]) if (e4 !== void 0 && !ae.test(e4)) throw E(`invalid`, `layer ${t6.id}: "${e4}" is not an image path of the package`);
    for (let [t6, n5] of Object.entries(e3.files || {})) if (!t6.startsWith(`x-`) && (typeof n5 != `string` || !k.test(n5))) throw E(`invalid`, `files.${t6}: "${n5}" is not a path in the package`);
    let i3 = e3.layers.map(({ label: e4, expression: t6, ...n5 }) => ({ ...n5, depth: n5.depth ?? 0, name: e4 ? P(e4, `en`, n5.id) : n5.id, ...t6 ? { param: t6 } : {} })), a4;
    if (e3.tuning) {
      let { hair_front: t6, hair_back: n5, ...r4 } = e3.tuning;
      a4 = { ...r4, ...t6 === void 0 ? {} : { hairFront: t6 }, ...n5 === void 0 ? {} : { hairBack: n5 } };
    }
    let o3 = e3.profile, s3 = e3.meta?.watermark;
    return { format: e3.format, version: e3.version, name: e3.name, canvas: e3.canvas, anchors: e3.anchors, layers: i3, rig: e3.rig, tuning: a4, profile: o3 && { id: o3.id, label: ``, class: { input: { facing: o3.facing, glasses: o3.glasses } } }, expressions: (e3.expressions || []).map((e4) => ({ id: e4.id, label: P(e4.label, t5, e4.id), labels: e4.label, ...e4.hotkey ? { key: e4.hotkey } : {} })), keyforms: e3.files?.keyforms, watermark: s3?.kind === `livliv` ? `LivLiv` : s3?.kind === `text` ? s3.text ?? null : null, meta: e3.meta, files: e3.files };
  }
  function N() {
    return typeof navigator < `u` && navigator.language || `en`;
  }
  function P(e3, t5, n4) {
    if (!e3) return n4;
    let r3 = Object.keys(e3), i3 = (e4) => r3.find((t6) => t6.toLowerCase() === e4.toLowerCase()), a4 = t5 || `en`, o3 = a4.split(`-`)[0].toLowerCase(), s3 = o3 === `zh` && /-(hant|tw|hk|mo)\b/i.test(a4);
    for (let t6 of [a4, ...o3 === `zh` ? [s3 ? `zh-Hant` : `zh-Hans`] : [], o3, ...s3 ? [`zh`] : [], `en`, `zh`]) {
      let n5 = i3(t6);
      if (n5 && e3[n5]) return e3[n5];
    }
    return r3.length ? e3[r3[0]] : n4;
  }
  function se(e3) {
    return /[぀-ヿ]/.test(e3) ? `ja` : /[가-힯]/.test(e3) ? `ko` : /[一-鿿]/.test(e3) ? `zh` : `en`;
  }
  var F = { nod: 0.95, shake: 1.05, tilt: 1.8, hop: 0.65, shy: 2.4 };
  var ce = (e3, n4) => n(0, 0.18, e3) * (1 - n(n4 - 0.22, n4, e3));
  function le(e3, t5, n4 = false) {
    let r3 = F[e3], i3 = ce(t5, r3), a4 = {}, o3 = 0;
    return e3 === `nod` && (a4.angleY = -(t5 < 0.45 ? 11 * Math.sin(Math.PI * t5 / 0.45) : 6 * Math.sin(Math.PI * Math.min(t5 - 0.45, 0.45) / 0.45)) * i3), e3 === `shake` && (a4.angleX = 13 * Math.sin(2 * Math.PI * t5 / 0.5) * i3, a4.bodyX = a4.angleX * 0.15), e3 === `tilt` && (a4.angleZ = 11 * i3, a4.angleX = 3 * i3, a4.angleY = 2 * i3), e3 === `hop` && (o3 = t5 < 0.2 ? -0.025 * Math.sin(Math.PI * t5 / 0.2) : t5 < 0.6 ? 0.04 * Math.sin(Math.PI * (t5 - 0.2) / 0.4) : n4 ? -0.012 * Math.sin(Math.PI * Math.min(t5 - 0.6, 0.05) / 0.05) : 0, a4.angleY = t5 > 0.2 && t5 < 0.6 ? 5 * Math.sin(Math.PI * (t5 - 0.2) / 0.4) * i3 : 0), e3 === `shy` && (a4.angleY = -12 * i3, a4.angleX = 9 * i3, a4.angleZ = -4 * i3, a4.eyeBallX = 0.7 * i3, a4.eyeBallY = -0.5 * i3), { offsets: a4, x: 0, y: o3 };
  }
  var ue = { eyeLOpen: 0, eyeROpen: 0, angleY: -11, angleZ: 5, angleX: 0, mouthOpen: 0, smile: 0, eyeBallX: 0, eyeBallY: 0 };
  var de = class {
    playing = [];
    away = false;
    auto = false;
    awayW = 0;
    off = {};
    y = 0;
    grounded = false;
    play(e3) {
      if (e3 === `away`) this.setAway(!this.away);
      else {
        for (let t5 of this.playing) t5.id === e3 && t5.out < 0 && (t5.out = 0);
        this.playing.push({ id: e3, t: 0, out: -1 });
      }
    }
    setAway(e3, t5 = false) {
      this.away = e3, this.auto = e3 && t5;
    }
    get busy() {
      return this.playing.length > 0 || this.awayW > 0;
    }
    update(e3) {
      let n4 = this.off;
      for (let e4 of Object.keys(n4)) delete n4[e4];
      this.y = 0;
      for (let r3 of this.playing) {
        r3.t += e3, r3.out >= 0 && (r3.out += e3);
        let i3 = le(r3.id, Math.min(r3.t, F[r3.id]), this.grounded), a4 = r3.out < 0 ? 1 : 1 - n(0, 0.15, r3.out);
        for (let [e4, t5] of Object.entries(i3.offsets)) n4[e4] = (n4[e4] ?? 0) + t5 * a4;
        this.y += i3.y * a4;
      }
      return this.playing = this.playing.filter((e4) => e4.t < F[e4.id] && e4.out < 0.15), this.awayW += (+!!this.away - this.awayW) * Math.min(1, e3 * (this.away ? 2.2 : 4)), this.awayW < 2e-3 && !this.away && (this.awayW = 0), n4;
    }
    awayPose(e3) {
      return { ...ue, breath: 0.5 + 0.5 * Math.sin(e3 * 1.15) };
    }
  };
  var I = (e3, t5, n4) => {
    let r3 = Math.min(1, Math.max(0, (n4 - e3) / (t5 - e3)));
    return r3 * r3 * (3 - 2 * r3);
  };
  var L = (e3, t5, n4) => Math.max(t5, Math.min(n4, e3));
  var R = (e3, t5, n4) => {
    let r3 = Math.abs(e3);
    return r3 <= t5 ? e3 : Math.sign(e3) * (t5 + (n4 - t5) * Math.tanh((r3 - t5) / (n4 - t5)));
  };
  var z = (e3, t5, n4, r3) => e3 < 0 || e3 > t5 + n4 + r3 ? 0 : e3 < t5 ? I(0, t5, e3) : 1 - I(t5 + n4, t5 + n4 + r3, e3);
  function B(e3, t5) {
    let n4 = (e4) => {
      let n5 = Math.sin(e4 * 127.1 + t5 * 311.7) * 43758.5453;
      return n5 - Math.floor(n5);
    }, r3 = Math.floor(e3), i3 = e3 - r3, a4 = i3 * i3 * (3 - 2 * i3);
    return (n4(r3) * (1 - a4) + n4(r3 + 1) * a4) * 2 - 1;
  }
  var V = (e3, t5) => B(e3, t5) * 0.7 + B(e3 * 2.3, t5 + 17) * 0.3;
  function fe(e3, t5) {
    if (t5 <= e3[0][0]) return e3[0][1];
    let n4 = e3.length - 1;
    if (t5 >= e3[n4][0]) return e3[n4][1];
    let r3 = 0;
    for (; t5 > e3[r3 + 1][0]; ) r3++;
    let i3 = (t6) => t6 <= 0 || t6 >= n4 ? 0 : (e3[t6 + 1][1] - e3[t6 - 1][1]) / (e3[t6 + 1][0] - e3[t6 - 1][0]), a4 = e3[r3 + 1][0] - e3[r3][0], o3 = (t5 - e3[r3][0]) / a4, s3 = o3 * o3, c3 = s3 * o3;
    return (2 * c3 - 3 * s3 + 1) * e3[r3][1] + (c3 - 2 * s3 + o3) * i3(r3) * a4 + (-2 * c3 + 3 * s3) * e3[r3 + 1][1] + (c3 - s3) * i3(r3 + 1) * a4;
  }
  var H = { glance: { dur: 4, tracks: { eyeBallX: [[0, 0], [0.15, 0.8], [2.5, 0.75], [2.8, 0]], eyeBallY: [[0, 0], [0.15, 0.25], [2.5, 0.2], [2.8, 0]], angleX: [[0, 0], [0.6, 11], [2.5, 10], [3.4, 0]], angleY: [[0, 0], [0.6, 4], [2.5, 3], [3.4, 0]], angleZ: [[0, 0], [0.7, -4], [2.5, -3], [3.4, 0]], bodyX: [[0, 0], [1, 2], [2.6, 1.5], [3.8, 0]], brow: [[0, 0], [0.4, 0.25], [2.5, 0.2], [3.2, 0]], breath: [[0, 0.1], [0.6, 0.7], [2.6, 0.6], [3.6, 0], [4, 0.15]] } }, lookAround: { dur: 5, tracks: { eyeBallX: [[0, 0], [0.2, -0.8], [1.4, -0.75], [1.7, 0.1], [2, 0.8], [3.2, 0.75], [3.5, 0]], angleX: [[0, 0], [0.7, -15], [1.5, -14], [2.4, 15], [3.3, 14], [4.2, 0]], angleY: [[0, 0], [0.8, 3], [2.4, 3], [4.2, 0]], angleZ: [[0, 0], [0.8, 3], [1.7, 0], [2.5, -3], [4.2, 0]], bodyX: [[0, 0], [1, -3], [2.7, 3], [4.4, 0]], brow: [[0, 0], [0.5, 0.3], [3.4, 0.25], [4.2, 0]], breath: [[0, 0.2], [0.6, 0.8], [3.4, 0.7], [4.4, 0], [5, 0.1]] } }, sway: { dur: 6, tracks: { bodyZ: [[0, 0], [1.5, 3.5], [3, -3.5], [4.5, 3], [6, 0]], bodyX: [[0, 0], [1.5, 2], [3, -2], [4.5, 1.5], [6, 0]], angleZ: [[0, 0], [1.6, -7], [3.1, 7], [4.6, -6], [6, 0]], angleX: [[0, 0], [1.6, 4], [3.1, -4], [4.6, 3], [6, 0]], eyeBallX: [[0, 0], [1.6, -0.25], [3.1, 0.25], [4.6, -0.2], [6, 0]], eye: [[0, 1], [0.8, 0.88], [5.2, 0.88], [6, 1]], breath: [[0, 0], [0.75, 1], [1.5, 0], [2.25, 1], [3, 0], [3.75, 1], [4.5, 0], [5.25, 0.8], [6, 0]] } }, think: { dur: 4.4, tracks: { eyeBallX: [[0, 0], [0.3, -0.6], [3.4, -0.55], [3.8, 0]], eyeBallY: [[0, 0], [0.3, 0.6], [3.4, 0.55], [3.8, 0]], angleX: [[0, 0], [0.8, -9], [3.4, -8], [4.2, 0]], angleY: [[0, 0], [0.8, 6], [3.4, 5], [4.2, 0]], angleZ: [[0, 0], [0.9, 6], [3.4, 5], [4.2, 0]], brow: [[0, 0], [0.6, 0.35], [3.4, 0.3], [4.2, 0]], eye: [[0, 1], [0.6, 0.92], [3.4, 0.92], [4, 1]] } }, lookDown: { dur: 2.4, tracks: { eyeBallY: [[0, 0], [0.2, -0.85], [1.4, -0.8], [1.65, 0]], eyeBallX: [[0, 0], [0.2, -0.1], [1.4, -0.1], [1.65, 0]], angleY: [[0, 0], [0.45, -8], [1.4, -7], [1.9, 1], [2.4, 0]], angleZ: [[0, 0], [0.5, 2], [1.5, 2], [2.4, 0]], eye: [[0, 1], [0.3, 0.8], [1.4, 0.8], [1.65, 1]] } } };
  var U = { angleX: [55, 0.72], angleY: [55, 0.72], angleZ: [45, 0.75], bodyX: [14, 0.9], bodyZ: [12, 0.9] };
  var pe = { wander: 1, look: 1, moves: 1, bodyTurn: 0, bodyTilt: 0, pointer: `attend`, smile: 0.4 };
  var W = { yaw: 9, yawKnee: 10, yawCap: 13, pitch: 5, pitchKnee: 6, pitchCap: 10, roll: 2, rollKnee: 8, rollCap: 12, lean: 0, bodyTurn: 1.5, eyeX: 1, eyeY: 0.8, eyeXCap: 0.78, eyeYCap: 0.55, eyeKnee: 0.7, hold: 2.2 };
  function me(e3, t5, n4, r3, i3, a4, o3) {
    let s3 = t5.model?.anchors.head, [c3, l3, u2, d2, f3] = t5.lastView, p3 = !!s3 && f3 > 1, m3 = p3 ? (s3.cx * c3 + u2 + 1) / 2 : 0.5, h3 = p3 ? (s3.cy * l3 + d2 + 1) / 2 : 0.3, g3 = p3 ? Math.abs(s3.rx * c3) / 2 : 0.12, _3 = p3 ? Math.abs(s3.ry * l3) / 2 : 0.1, v3 = n4 / Math.max(1, i3), y3 = r3 / Math.max(1, a4);
    e3.pointer = { x: L((v3 - m3) * 2, -1, 1), y: L(-(y3 - h3) * 1.6, -1, 1), d: Math.hypot((v3 - m3) / g3, (y3 - h3) / _3), on: o3 };
  }
  var he = class {
    nextBlink = 2;
    blinkT = -1;
    blinkAt = -99;
    look = { x: 0, y: 0 };
    blinkRate = 1;
    nextSaccade = 1;
    gaze = { x: 0, y: 0 };
    busy = false;
    moves = 1;
    style = { ...pe };
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
    s = Object.fromEntries(Object.keys(U).map((e3) => [e3, { x: 0, v: 0 }]));
    aim = null;
    breathPhase = 0;
    breathPeriod = 3.8;
    double = false;
    seed = Math.random() * 100;
    breath(e3) {
      this.breathPhase += e3 / this.breathPeriod, this.breathPhase >= 1 && (--this.breathPhase, this.breathPeriod = 3.2 + Math.random() * 1.4);
      let t5 = this.breathPhase;
      return t5 < 0.4 ? I(0, 0.4, t5) : t5 < 0.88 ? 1 - I(0.4, 0.88, t5) : 0;
    }
    apply(e3, t5, n4) {
      n4 = n4 > 0 ? Math.min(n4, 0.1) : 0;
      let r3 = this.style, i3 = r3.pointer === `attend` && !this.tracked;
      i3 && this.attend(t5, n4);
      let a4 = this.busy || i3 && this.att.engaged;
      if (this.move) this.move.t += n4, a4 && (this.move.fade = Math.max(0, this.move.fade - n4 / 0.4)), (this.move.t >= H[this.move.id].dur || this.move.fade <= 0) && (this.move = null);
      else if (a4) this.nextMove = Math.max(this.nextMove, t5 + 3);
      else if (this.moves > 0 && t5 > this.nextMove) {
        let e4 = Object.keys(H).filter((e5) => e5 !== this.last), n5 = e4[Math.floor(Math.random() * e4.length)];
        this.move = { id: n5, t: 0, side: Math.random() < 0.5 ? -1 : 1, fade: 1 }, this.last = n5, this.nextMove = t5 + H[n5].dur + 10 + Math.random() * 10;
      }
      let o3 = this.move, s3 = o3 ? H[o3.id] : null, c3 = o3 ? o3.fade * I(0, 0.15, o3.t) * (1 - I(s3.dur - 0.25, s3.dur, o3.t)) : 0, l3 = (e4, t6 = 0) => {
        let n5 = s3?.tracks[e4];
        return n5 ? t6 + (fe(n5, o3.t) * (e4 === `angleX` || e4 === `angleZ` || e4 === `bodyX` || e4 === `bodyZ` || e4 === `eyeBallX` ? o3.side : 1) - t6) * c3 * this.moves * (e4.startsWith(`angle`) || e4.startsWith(`body`) ? r3.moves : 1) : t6;
      }, u2 = 1;
      if (this.blinkT < 0 && t5 > this.nextBlink && (this.blinkT = 0, this.blinkAt = t5), this.blinkT >= 0) {
        this.blinkT += n4;
        let e4 = this.blinkT / 0.075;
        u2 = L(e4 < 1 ? 1 - e4 : e4 < 2.6 ? (e4 - 1) / 1.6 : 1, 0, 1), e4 >= 2.6 && (this.blinkT = -1, !this.double && Math.random() < 0.18 ? (this.double = true, this.nextBlink = t5 + 0.08) : (this.double = false, this.nextBlink = t5 + (1.8 + Math.random() * 3.8) / Math.max(0.2, this.blinkRate)));
      }
      let d2 = L(l3(`eye`, 1), 0, 1) * u2;
      e3.eyeLOpen = e3.eyeROpen = i3 ? d2 * (1 - 0.16 * this.att.soft) : d2;
      let f3 = this.seed, p3 = this.look, m3 = r3.look, h3 = r3.wander, g3, _3, v3;
      if (i3) {
        let e4 = this.att, r4 = W;
        t5 > this.nextSaccade && (e4.jitter = { x: (Math.random() - 0.5) * 0.2, y: (Math.random() - 0.5) * 0.16 }, this.nextSaccade = t5 + 0.6 + Math.random() * 1.6), this.gaze = { x: r4.eyeX * e4.x + e4.jitter.x, y: r4.eyeY * e4.y + e4.jitter.y };
        let i4 = this.gaze.x + l3(`eyeBallX`), a5 = this.gaze.y + l3(`eyeBallY`), o4 = Math.hypot(i4 / r4.eyeXCap, a5 / r4.eyeYCap), s4 = o4 > r4.eyeKnee ? R(o4, r4.eyeKnee, 1) / o4 : 1;
        g3 = i4 * s4, _3 = a5 * s4;
        let c4 = e4.slow;
        Math.hypot(g3 - c4.x, _3 - c4.y) > 0.5 && (this.blinkT < 0 && t5 - this.blinkAt > 1.2 && (this.nextBlink = Math.min(this.nextBlink, t5)), c4.x = g3, c4.y = _3), c4.x += (g3 - c4.x) * Math.min(1, n4 / 0.35), c4.y += (_3 - c4.y) * Math.min(1, n4 / 0.35);
        let u3 = this.moves > 0 ? 3 * z(t5 - e4.notice, 0.12, 0.15, 0.5) - 2.5 * z(t5 - e4.back, 0.15, 0.1, 0.45) : 0;
        v3 = { angleX: R(e4.x * r4.yaw * m3 + V(t5 * 0.17, f3) * 4 * h3 + this.gaze.x * 2 + l3(`angleX`), r4.yawKnee, r4.yawCap), angleY: R(e4.y * r4.pitch * m3 + V(t5 * 0.13, f3 + 1) * 3 * h3 + this.gaze.y * 2 + u3 + l3(`angleY`), r4.pitchKnee, r4.pitchCap), angleZ: R(e4.x * r4.roll * m3 + e4.side * 3 * e4.soft + V(t5 * 0.11, f3 + 2) * 5 * h3 + l3(`angleZ`), r4.rollKnee, r4.rollCap), bodyX: e4.x * r4.bodyTurn * m3 + V(t5 * 0.09, f3 + 3) * 3 * h3 + l3(`bodyX`), bodyZ: e4.x * r4.lean * m3 + V(t5 * 0.08, f3 + 4) * 2.5 * h3 + l3(`bodyZ`) };
      } else t5 > this.nextSaccade && (this.gaze = { x: this.look.x + (Math.random() - 0.5) * 0.25, y: this.look.y * 0.8 + (Math.random() - 0.5) * 0.2 }, this.nextSaccade = t5 + 0.6 + Math.random() * 1.6), g3 = L(this.gaze.x * 1.2 + l3(`eyeBallX`), -1, 1), _3 = L(this.gaze.y + l3(`eyeBallY`), -1, 1), v3 = { angleX: p3.x * 20 * m3 + V(t5 * 0.17, f3) * 7 * h3 + this.gaze.x * 5 + l3(`angleX`), angleY: p3.y * 13 * m3 + V(t5 * 0.13, f3 + 1) * 4 * h3 + this.gaze.y * 3 + l3(`angleY`), angleZ: -p3.x * 4 * m3 + V(t5 * 0.11, f3 + 2) * 6 * h3 + l3(`angleZ`), bodyX: p3.x * 4 * m3 + V(t5 * 0.09, f3 + 3) * 3 * h3 + l3(`bodyX`), bodyZ: V(t5 * 0.08, f3 + 4) * 2.5 * h3 + l3(`bodyZ`) };
      e3.eyeBallX += (g3 - e3.eyeBallX) * Math.min(1, n4 * 18), e3.eyeBallY += (_3 - e3.eyeBallY) * Math.min(1, n4 * 18);
      let y3 = Math.max(1, Math.ceil(n4 / (1 / 120))), b3 = this.aim ??= { ...v3 };
      for (let t6 of Object.keys(U)) {
        let [r4, i4] = U[t6], a5 = 2 * Math.sqrt(r4) * i4, o4 = this.s[t6];
        for (let e4 = 0; e4 < y3; e4++) b3[t6] += (v3[t6] - b3[t6]) * Math.min(1, n4 / y3 / 0.12), o4.v += (r4 * (b3[t6] - o4.x) - a5 * o4.v) * (n4 / y3), o4.x += o4.v * (n4 / y3);
        e3[t6] = o4.x;
      }
      let x3 = this.fol, S3 = Math.min(1, n4 / 0.12);
      x3.x += (r3.bodyTurn * this.shown.x - x3.x) * S3, x3.x2 += (x3.x - x3.x2) * S3, x3.z += (r3.bodyTilt * this.shown.z - x3.z) * S3, x3.z2 += (x3.z - x3.z2) * S3, (r3.bodyTurn || r3.bodyTilt) && (e3.bodyX = L(e3.bodyX + x3.x2, -10, 10), e3.bodyZ = L(e3.bodyZ + x3.z2, -10, 10)), e3.breath = L(l3(`breath`, this.breath(n4)), 0, 1);
      let C3 = (i3 ? this.attendBrow(t5) : p3.y > 0.4 ? 0.5 : 0) - (1 - u2) * 0.15 + l3(`brow`);
      e3.browLY += (C3 - e3.browLY) * Math.min(1, n4 * 10), e3.browRY = e3.browLY, i3 ? (e3.smile = +(t5 >= this.att.smile && t5 < this.att.smile + 1.6), this.smiling = e3.smile > 0) : this.smiling &&= (e3.smile = 0, false);
    }
    attend(e3, t5) {
      let n4 = this.att, r3 = this.pointer;
      if (r3.on && !n4.on && (n4.notice = e3, n4.moved = e3, n4.px = r3.x, n4.py = r3.y, n4.side = Math.random() < 0.5 ? -1 : 1), r3.on) {
        let i4 = Math.hypot(r3.x - n4.px, r3.y - n4.py);
        n4.speed += (i4 / Math.max(t5, 1e-3) - n4.speed) * Math.min(1, t5 / 0.15), i4 > 3e-3 && (n4.moved = e3), n4.px = r3.x, n4.py = r3.y;
      } else n4.speed *= Math.max(0, 1 - t5 / 0.15);
      n4.on = r3.on;
      let i3 = r3.on && r3.d < 1, a4 = r3.on && (i3 || !!r3.keep || e3 - n4.moved < W.hold);
      a4 !== n4.engaged && (!a4 && e3 - n4.since > 0.8 && (n4.back = e3, this.nextMove = Math.max(this.nextMove, e3 + 6)), n4.since = e3, n4.engaged = a4);
      let o3 = this.style.smile ?? 0;
      i3 && e3 - n4.moved > 1.2 && o3 > 0 && this.faceFree && !this.busy && e3 - n4.smiled > 25 && e3 > n4.smile + 1.6 && ((n4.smiled < 0 || Math.random() < o3) && (n4.smile = e3), n4.smiled = e3);
      let s3 = e3 >= n4.smile && e3 < n4.smile + 1.6 ? 0 : Math.max(i3 && e3 - n4.moved > 0.5 ? 1 : 0, z(e3 - n4.back, 0.2, 0.6, 0.6));
      n4.soft += (s3 - n4.soft) * Math.min(1, t5 / 0.25), n4.x = a4 ? r3.x : 0, n4.y = a4 ? r3.y : 0;
    }
    attendBrow(e3) {
      let t5 = this.att, n4 = this.pointer, r3 = n4.on && e3 - t5.moved < 0.3 ? 1 - I(1, 2.2, n4.d) : 0;
      return Math.min(0.7, 0.4 * I(0.35, 0.9, t5.y) + 0.3 * I(1.5, 5, t5.speed) + 0.15 * r3 + 0.45 * z(e3 - t5.notice, 0.08, 0.25, 0.35) + 0.2 * z(e3 - t5.back, 0.15, 0.3, 0.5) + 0.12 * t5.soft);
    }
  };
  var ge = [`angleX`, `angleY`, `angleZ`, `eyeLOpen`, `eyeROpen`, `eyeBallX`, `eyeBallY`, `browLY`, `browRY`, `bodyX`, `bodyZ`, `breath`];
  var G = (e3, t5, n4) => Math.min(n4, Math.max(t5, e3));
  var _e = class {
    lv = new he();
    P = e();
    turn = { x: 0, y: 0 };
    held = false;
    constructor() {
      typeof matchMedia < `u` && matchMedia(`(prefers-reduced-motion: reduce)`).matches && (this.lv.moves = 0);
    }
    apply(e3, t5, n4, r3) {
      let i3 = this.lv;
      i3.busy = r3.busy, i3.tracked = r3.tracked, i3.faceFree = r3.faceFree, i3.look = this.turn, i3.apply(this.P, t5, n4);
      for (let t6 of ge) e3[t6] = this.P[t6];
      e3.smile = Math.max(e3.smile, this.P.smile);
    }
    shown(e3) {
      this.lv.shown.x = e3.angleX, this.lv.shown.z = e3.angleZ;
    }
    pointer(e3, t5, n4, r3, i3, a4) {
      this.held || (me(this.lv, e3, t5, n4, r3, i3, a4), a4 && (this.turn = { x: G((t5 / Math.max(1, r3) - 0.5) * 2, -1, 1), y: G(-(n4 / Math.max(1, i3) - 0.3) * 1.6, -1, 1) }));
    }
    leave() {
      this.held || (this.lv.pointer.on = false), this.turn = { x: 0, y: 0 };
    }
    lookAt(e3, t5, n4, r3, i3) {
      this.held = false, t5 === null ? (this.lv.pointer = { ...this.lv.pointer, on: false, keep: false }, this.turn = { x: 0, y: 0 }) : (this.pointer(e3, (t5 + 1) / 2 * r3, (1 - n4) / 2 * i3, r3, i3, true), this.lv.pointer.keep = true, this.held = true, this.turn = { x: t5, y: n4 });
    }
    blink(e3) {
      this.lv.nextBlink = Math.min(this.lv.nextBlink, e3);
    }
  };
  var K = /* @__PURE__ */ new WeakSet();
  var q = /* @__PURE__ */ new WeakMap();
  function ve(e3, t5) {
    if (!t5 || K.has(e3) || q.has(e3)) return;
    let n4 = setTimeout(() => {
      q.delete(e3), K.add(e3), t5.getExtension(`WEBGL_lose_context`)?.loseContext();
    });
    q.set(e3, () => clearTimeout(n4));
  }
  function ye(e3) {
    if (q.get(e3)?.(), q.delete(e3), K.has(e3)) throw new t2(`released`, `LivLiv: this canvas gave up its WebGL context with dispose({ release: true }): use a new canvas`);
  }
  var J = (e3, t5, n4) => Math.min(n4, Math.max(t5, e3));
  var Y = (e3) => new DOMException(`LivLiv: ${e3}`, `AbortError`);
  var X = () => new t2(`context-lost`, `LivLiv: this canvas has lost its WebGL context: use a new canvas and a new player`);
  async function Z(e3, t5, n4 = (e4) => e4) {
    let r3 = e3.headers.get(`content-encoding`) ? 0 : Number(e3.headers.get(`content-length`)) || 0;
    if (!e3.body) return e3.blob();
    let i3 = e3.body.getReader(), a4 = [], o3 = 0;
    for (; ; ) {
      let { done: e4, value: s3 } = await i3.read();
      if (e4) break;
      a4.push(s3), o3 += s3.byteLength, r3 && t5.progress(n4(Math.min(1, o3 / r3)));
    }
    return new Blob(a4);
  }
  var be = e();
  var xe = Object.keys(t);
  function Q(e3) {
    for (let t5 of xe) {
      let r3 = +e3[t5];
      e3[t5] = r3 === r3 ? J(r3, t[t5][0], t[t5][1]) : be[t5];
    }
  }
  var $ = (e3, t5) => typeof e3 == `number` && Number.isFinite(e3) ? e3 : t5;
  var Se = [`frame`, `whole`, `knee`];
  var Ce = class {
    canvas;
    params = e();
    idle;
    followPointer;
    renderWhenHidden;
    view = { x: 0, y: 0, zoom: 1, head: false, fit: `frame` };
    lang;
    onContextLost;
    onFrame;
    replaying = false;
    replaySize = null;
    renderSize = null;
    info = null;
    disposed = false;
    idler = new _e();
    parameterFilter = new a();
    was = { tracked: false, mouth: 0 };
    actions = new de();
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
    ground = { crouch: 0, dip: 0, talk: 0 };
    constructor(e3, t5, r3) {
      this.canvas = e3, this.parameterProfile = r3.parameterProfile ?? {}, this.idle = r3.idle ?? true, this.followPointer = r3.followPointer ?? `page`, this.lang = r3.lang || N(), this.renderWhenHidden = r3.renderWhenHidden ?? false, this.frame = { params: t5, dt: 0, time: 0, tracked: false, move: { x: 0, y: 0, s: 1 }, talk: 0, grounded: false, add(e4) {
        for (let [r4, i3] of Object.entries(e4)) i3 && (t5[r4] = J(t5[r4] + i3, t[r4][0], t[r4][1]));
      } }, addEventListener(`pointermove`, this.onMove), document.addEventListener(`pointerleave`, this.onLeave), e3.addEventListener(`webglcontextlost`, this.onLost), typeof IntersectionObserver < `u` && (this.io = new IntersectionObserver((e4) => {
        this.visible = e4[e4.length - 1].isIntersecting;
      }), this.io.observe(e3)), (r3.autoplay ?? true) && this.play();
    }
    get grounded() {
      return false;
    }
    place(e3) {
      let t5 = this.frame;
      t5.move.y = t5.move.y + t5.talk + e3, this.ground.crouch = 0, this.ground.dip = 0, this.ground.talk = 0;
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
    start({ signal: e3, onProgress: t5, poster: n4 }, r3) {
      let i3, a4, o3 = new Promise((e4, t6) => {
        i3 = e4, a4 = t6;
      }), s3 = (e4) => {
        e4?.name === `AbortError` && o3.catch(() => {
        }), a4(e4);
      };
      if (e3?.aborted) return s3(e3.reason), o3;
      if (this.disposed) return s3(Y(`the player was disposed`)), o3;
      if (this.contextLost) return s3(X()), o3;
      this.running?.abort(Y(`a newer load took its place`));
      let c3 = this.running = new AbortController(), l3 = () => c3.abort(e3.reason);
      e3?.addEventListener(`abort`, l3, { once: true }), this.setPoster(n4);
      let u2 = (e4) => {
        try {
          t5?.(e4);
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
      return r3(p3).then((e4) => {
        m3(), i3(e4);
      }, (e4) => {
        let t6 = this.running === c3;
        m3(), t6 && this.setPoster(), s3(c3.signal.aborted ? c3.signal.reason : e4);
      }), o3;
    }
    setPoster(e3) {
      let t5 = this.canvas.style;
      if (this.posterOver) {
        for (let [e4, n5] of Object.entries(this.posterOver)) t5.setProperty(e4, n5);
        this.posterOver = null;
      }
      if (!e3 || this.info) return;
      let n4 = { "background-image": `url(${JSON.stringify(String(e3))})`, "background-position": `center`, "background-size": `contain`, "background-repeat": `no-repeat` };
      this.posterOver = Object.fromEntries(Object.keys(n4).map((e4) => [e4, t5.getPropertyValue(e4)]));
      for (let [e4, r3] of Object.entries(n4)) t5.setProperty(e4, r3);
    }
    inTurn(e3) {
      let t5 = this.queue.then(e3);
      return this.queue = t5.catch(() => {
      }), t5;
    }
    neutral() {
      this.expr = {}, this.smile = 0, this.replaying = false, this.parameterFilter.reset(), this.ground = { crouch: 0, dip: 0, talk: 0 };
    }
    get parameterProfile() {
      return this.parameterFilter.profile;
    }
    set parameterProfile(e3) {
      this.parameterFilter.profile = e3;
    }
    get parameterSample() {
      return this.parameterFilter.sample;
    }
    setExpression(e3, t5 = 1) {
      if (e3 !== null && !this.expressions.some((t6) => t6.id === e3)) return false;
      let n4 = J(t5, 0, 1);
      return this.smile = e3 === `smile` ? n4 : 0, this.expr = e3 === null || e3 === `smile` ? {} : { [e3]: n4 }, true;
    }
    act(e3) {
      if (e3 === `away`) throw TypeError(`LivLiv: act('away') is setAway(true) now`);
      this.actions.play(e3);
    }
    setAway(e3) {
      this.actions.setAway(e3);
    }
    lookAt(e3, t5 = 0) {
      this.idler.lookAt(this.seen(), e3 === null ? null : J(e3, -1, 1), J(t5, -1, 1), this.canvas.clientWidth, this.canvas.clientHeight);
    }
    blink() {
      this.idler.blink(this.clock);
    }
    use(e3) {
      return this.disposed ? (e3.dispose?.(), () => {
      }) : (this.drivers.push(e3), this.drivers.sort((e4, t5) => (e4.order ?? 0) - (t5.order ?? 0)), () => {
        let t5 = this.drivers.indexOf(e3);
        t5 >= 0 && (this.drivers.splice(t5, 1), e3.dispose?.());
      });
    }
    play() {
      if (this.raf || this.disposed) return;
      this.replaying = false, this.last = performance.now();
      let e3 = (t5) => {
        this.raf = requestAnimationFrame(e3);
        let n4 = Math.min(0.05, (t5 - this.last) / 1e3);
        this.last = t5, (this.visible || this.renderWhenHidden) && this.draw(n4);
      };
      this.raf = requestAnimationFrame(e3);
    }
    pause() {
      cancelAnimationFrame(this.raf), this.raf = 0;
    }
    resize() {
      this.replaying ? this.renderPose(this.getPose()) : this.draw(0);
    }
    snapshot() {
      return this.replaying ? this.renderPose(this.getPose(), 0, this.replaySize ?? void 0) : this.draw(0), this.canvas.toDataURL(`image/png`);
    }
    getPose() {
      let e3 = { params: { ...this.frame.params }, move: { ...this.frame.move }, expr: { ...this.shownExpr }, view: { ...this.view } };
      return this.grounded && Object.assign(e3, this.ground), e3;
    }
    renderPose(e3, t5 = 0, n4) {
      if (this.playing) throw TypeError(`LivLiv: pause the player before rendering a recorded pose`);
      if (!Number.isFinite(t5) || t5 < 0 || n4 && (n4.length !== 2 || n4.some((e4) => !Number.isInteger(e4) || e4 < 1))) throw TypeError(`LivLiv: renderPose needs a nonnegative dt and positive integer output dimensions`);
      if (!this.drawable || this.disposed || this.contextLost) return;
      let r3 = this.frame, i3 = this.view, a4 = e3.move, o3 = e3.view;
      Object.assign(r3.params, e3.params), Q(r3.params), Object.assign(r3.move, { x: $(a4?.x, 0), y: $(a4?.y, 0), s: $(a4?.s, 1) });
      let s3 = this.grounded, c3 = (e4) => s3 ? J($(e4, 0), -0.15, 0) : 0;
      s3 && (r3.move.y = Math.max(0, r3.move.y)), this.ground = { crouch: c3(e3.crouch), dip: c3(e3.dip), talk: c3(e3.talk) }, Object.assign(i3, { x: $(o3?.x, i3.x), y: $(o3?.y, i3.y), zoom: $(o3?.zoom, i3.zoom), head: typeof o3?.head == `boolean` ? o3.head : i3.head, fit: Se.includes(o3?.fit) ? o3.fit : i3.fit });
      let l3 = this.shownExpr;
      for (let e4 of Object.keys(l3)) delete l3[e4];
      for (let [t6, n5] of Object.entries(e3.expr ?? {})) l3[t6] = J($(n5, 0), 0, 1);
      this.replaying = true, this.replaySize = n4 ?? null, this.renderSize = this.replaySize;
      try {
        this.show(t5);
      } finally {
        this.renderSize = null;
      }
      this.onFrame?.(this.getPose());
    }
    dispose({ release: e3 = false } = {}) {
      let t5 = this.gl;
      this.stop(), e3 && ve(this.canvas, t5);
    }
    stop() {
      if (!this.disposed) {
        this.pause(), this.disposed = true, this.running?.abort(Y(`the player was disposed`)), this.setPoster(), removeEventListener(`pointermove`, this.onMove), document.removeEventListener(`pointerleave`, this.onLeave), this.canvas.removeEventListener(`webglcontextlost`, this.onLost), this.io?.disconnect();
        for (let e3 of this.drivers.splice(0)) e3.dispose?.();
        this.onFrame = void 0, this.free(), this.info = null;
      }
    }
    draw(e3) {
      if (!this.drawable || this.disposed || this.contextLost) return;
      let t5 = this.frame, n4 = t5.params, r3 = this.clock, i3 = this.shownExpr, a4 = this.actions;
      this.idler.shown(n4), Object.assign(n4, this.params), this.idle && this.idler.apply(n4, r3, e3, { busy: a4.busy || this.was.mouth > 0.05, tracked: this.was.tracked, faceFree: !this.smile && !Object.values(i3).some((e4) => e4 > 0.02) }), Object.assign(t5, { dt: e3, time: r3, tracked: false, talk: 0, grounded: this.grounded }), Object.assign(t5.move, { x: 0, y: 0, s: 1 });
      for (let e4 of this.drivers) e4.update(t5, this);
      if (this.was = { tracked: t5.tracked, mouth: n4.mouthOpen }, a4.grounded = t5.grounded, t5.add(a4.update(e3)), this.smile && (n4.smile = Math.max(n4.smile, this.smile)), a4.awayW) for (let [e4, t6] of Object.entries(a4.awayPose(r3))) n4[e4] += (t6 - n4[e4]) * a4.awayW;
      Q(n4), Object.assign(n4, this.parameterFilter.apply(n4, e3));
      for (let e4 of Object.keys(this.expr)) e4 in i3 || (i3[e4] = 0);
      for (let t6 of Object.keys(i3)) i3[t6] += ((this.expr[t6] ?? 0) * (1 - a4.awayW) - i3[t6]) * Math.min(1, e3 * 8);
      let o3 = t5.move;
      o3.x = $(o3.x, 0), o3.y = $(o3.y, 0), o3.s = $(o3.s, 1), t5.talk = $(t5.talk, 0), this.place(a4.y), this.show(e3), this.onFrame?.(this.getPose()), this.posterOver && this.setPoster();
    }
    onMove = (e3) => {
      if (!this.followPointer) return;
      let t5 = this.canvas.getBoundingClientRect(), n4 = !(e3.clientX < t5.left || e3.clientX > t5.right || e3.clientY < t5.top || e3.clientY > t5.bottom);
      this.idler.pointer(this.seen(), e3.clientX - t5.left, e3.clientY - t5.top, t5.width, t5.height, this.followPointer === `page` || n4);
    };
    onLeave = () => this.idler.leave();
    onLost = () => {
      this.lost = true, this.running?.abort(X()), this.onContextLost?.();
    };
  };

  // node_modules/@livliv-dev/player/dist/index.js
  var L2 = () => ({ yaw: 0.27, pitch: 0.22, roll: 0.5, bulge: 0.6, hair: { front: [140, 11, 0.022, 70, 7], back: [48, 5.5, 0.06, 24, 3.5] }, hair_limit: 0.25, wind: 1, breath: 1, sway: 1, brow: 0.06, body: { yaw: 0.35, roll: 0.3, breath: 1, bust: 0 } });
  var R2 = () => ({ turn: 1, nod: 1, hair: 1, blink: 1, expr: 1, mouth: 1, breath: 1, gaze: 1 });
  var z2 = 0.3;
  function B2(e3, t5) {
    let n4 = typeof t5 == `number` && Number.isFinite(t5) && t5 >= 0 ? t5 : 1;
    return n4 === 1 || !(e3 > 0) ? 1 : Math.min(Math.max(e3, z2), e3 * n4) / e3;
  }
  var V2 = `#version 300 es
in vec2 aPos; in vec2 aUv; uniform vec4 uView; out vec2 vUv;
void main(){ vUv=aUv; vec2 p=aPos*uView.xy+uView.zw; gl_Position=vec4(p.x,-p.y,0.,1.); }`;
  var ee2 = `#version 300 es
precision mediump float; in vec2 vUv; uniform sampler2D uTex; uniform float uAlpha; uniform float uCut; out vec4 o;
uniform int uMode; uniform sampler2D uMask; uniform highp ivec2 uMaskOff; uniform vec4 uMaskSel; uniform float uSoft;
void main(){ vec4 c=texture(uTex,vUv); if(c.a<uCut) discard;
  if(uMode==1){ o=vec4(c.a); return; }
  if(uMode==2){ highp ivec2 q=ivec2(gl_FragCoord.xy)-uMaskOff, n=textureSize(uMask,0);
    float m=all(greaterThanEqual(q,ivec2(0)))&&all(lessThan(q,n))?dot(texelFetch(uMask,q,0),uMaskSel):0.;
    c*=mix(step(.5,m),m,uSoft); }
  o=c*uAlpha; }`;
  var te2 = [0.12, 0.5];
  var ne2 = 0.04;
  var re2 = 0.055;
  var ie2 = 0.3;
  var ae2 = 0.65;
  var oe2 = 0.35;
  var se2 = 0.4;
  var ce2 = (e3, t5, n4) => {
    if (n4 <= e3[0]) return t5[0];
    for (let r3 = 1; r3 < e3.length; r3++) if (n4 <= e3[r3]) return t5[r3 - 1] + (t5[r3] - t5[r3 - 1]) * (n4 - e3[r3 - 1]) / (e3[r3] - e3[r3 - 1]);
    return t5[t5.length - 1];
  };
  var H2 = (e3, t5) => 1 - n(0, (e3[2] - e3[0]) * 0.45, Math.max(e3[0] - t5, t5 - e3[2], 0));
  var le2 = (e3) => (e3[3] - e3[1]) * 1.6 + 6;
  function ue2(e3, t5, n4, r3) {
    if (r3 < e3[1]) return H2(e3, n4) * (1 - n(0, le2(e3), e3[1] - r3));
    let i3 = ce2(t5.x, t5.bottom, n4);
    return r3 <= i3 ? H2(e3, n4) : H2(e3, n4) * (1 - n(i3, ce2(t5.x, t5.lid, n4), r3));
  }
  function de2(e3, t5) {
    let n4 = t5, r3 = t5, i3 = false;
    return e3.brows?.forEach((t6, a4) => {
      let o3 = e3.brow_lines?.[a4];
      t6 && o3 && (i3 = true, n4 = Math.min(n4, 0.6 * le2(t6)), o3.x.forEach((e4, n5) => {
        r3 = Math.min(r3, 0.6 * (o3.lid[n5] - o3.bottom[n5]) / Math.max(1e-3, H2(t6, e4)));
      }));
    }), i3 ? [n4, r3] : [0, 0];
  }
  var U2 = () => ({ x: 0, y: 0, vx: 0, vy: 0 });
  var fe2 = [0.5, 0.85];
  var pe2 = class {
    gl;
    canvas;
    model;
    anchorModel = null;
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
    chains = { front: [U2(), U2()], back: [U2(), U2()], side: [U2(), U2()] };
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
    fit = `frame`;
    crouch = 0;
    dip = 0;
    fbIdle = 1;
    get grounded() {
      return !!this.fb;
    }
    fb = null;
    fbm = { hs: 0, hv: 0, tilt: 0, tanTilt: 0, hem: 0, hemV: 0, breath: 0 };
    fbParts = false;
    pv = { roll: NaN, cr: NaN, dp: NaN, mx: NaN, hs: NaN, tilt: NaN, aw: 0, cw: 1, sw: 0, aa: 0, ca: 1, sa: 0, x: 0, y: 0, dip: 0 };
    maxDpr = 2;
    size = null;
    physicsScale = 1;
    hidden = /* @__PURE__ */ new Set();
    tuning = R2();
    bangsDepth = 0;
    rig = L2();
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
      let t5 = e3.getContext(`webgl2`, { premultipliedAlpha: true, alpha: true, antialias: true, preserveDrawingBuffer: true, stencil: true });
      if (!t5) throw Error(`this browser has no WebGL2`);
      this.gl = t5;
      let n4 = (e4, n5) => {
        let r4 = t5.createShader(e4);
        if (t5.shaderSource(r4, n5), t5.compileShader(r4), !t5.getShaderParameter(r4, t5.COMPILE_STATUS)) throw Error(t5.getShaderInfoLog(r4) || `shader`);
        return r4;
      }, r3 = t5.createProgram();
      t5.attachShader(r3, n4(t5.VERTEX_SHADER, V2)), t5.attachShader(r3, n4(t5.FRAGMENT_SHADER, ee2)), t5.bindAttribLocation(r3, 0, `aPos`), t5.bindAttribLocation(r3, 1, `aUv`), t5.linkProgram(r3), this.prog = r3, this.uView = t5.getUniformLocation(r3, `uView`), this.uAlpha = t5.getUniformLocation(r3, `uAlpha`), this.uTex = t5.getUniformLocation(r3, `uTex`), this.uCut = t5.getUniformLocation(r3, `uCut`), this.uMode = t5.getUniformLocation(r3, `uMode`), this.uMaskOff = t5.getUniformLocation(r3, `uMaskOff`), this.uMaskSel = t5.getUniformLocation(r3, `uMaskSel`), this.uSoft = t5.getUniformLocation(r3, `uSoft`), t5.useProgram(r3), t5.uniform1i(t5.getUniformLocation(r3, `uMask`), 1);
    }
    async load(e3, { png: t5 = false, pack: n4 = true, signal: r3, onImage: i3 } = {}) {
      let { file: a4, base: o3, query: s3 } = _e2(e3), c3 = await fetch(a4 + (s3 ? `?${s3}` : ``), { cache: `no-store`, signal: r3 });
      if (!c3.ok) throw Object.assign(/* @__PURE__ */ Error(c3.status === 404 ? `model not found` : `model.json ${c3.status}`), { status: c3.status });
      let l3 = await c3.text();
      if (l3.length > T.modelJson) throw E(`too-large`, `model.json is larger than ${T.modelJson} bytes`);
      let u2 = j(JSON.parse(l3)), d2 = u2.tex;
      if (!d2) {
        let e4 = JSON.stringify(u2.layers) + (c3.headers.get(`last-modified`) || ``), t6 = 0;
        for (let n5 = 0; n5 < e4.length; n5++) t6 = t6 * 31 + e4.charCodeAt(n5) | 0;
        d2 = (t6 >>> 0).toString(36);
      }
      let f3 = `?v=${d2}${s3 ? `&${s3}` : ``}`, p3 = u2.keyforms ? fetch(o3 + u2.keyforms + f3, { signal: r3 }).then(async (e4) => {
        let t6 = e4.ok ? await e4.text() : ``;
        return t6 && t6.length <= T.keyforms ? JSON.parse(t6) : void 0;
      }).catch(() => void 0) : void 0, m3 = t5 || !n4 ? null : await ye2(ve2(e3, d2), r3), h3 = (e4) => r3 ? xe2(o3 + e4 + f3, r3) : Se2(o3 + e4 + f3);
      await this.loadModel(u2, (e4) => {
        let t6 = m3?.get(e4);
        return t6 ? be2(t6) : h3(e4);
      }, { png: t5, keyforms: p3, signal: r3, onImage: i3 });
    }
    async loadModel(e3, t5, { png: n4 = false, keyforms: r3, signal: i3, onImage: a4 } = {}) {
      let o3 = j(e3), s3 = 0, c3 = 0, l3 = (e4) => (a4?.(++c3, s3), e4), [u2, d2] = await Promise.all([Promise.all(o3.layers.map(async (e4) => {
        let r4 = (r5) => (s3++, t5(e4.webp && !n4 ? r5.replace(/\.png$/, `.webp`) : r5).then(l3)), [i4, a5, o4, c4, u3] = await Promise.all([r4(e4.texture), Promise.all((e4.frames || []).map(r4)), e4.mask ? r4(e4.mask) : void 0, e4.talk ? r4(e4.talk) : void 0, e4.brow_tex ? r4(e4.brow_tex) : void 0]);
        return { main: i4, frames: a5, mask: o4, talk: c4, brows: u3 };
      })), r3]);
      if (i3?.aborted) throw i3.reason;
      let f3 = Math.min(T.texture, this.gl?.getParameter(this.gl.MAX_TEXTURE_SIZE) || T.texture), p3 = 0;
      for (let e4 of u2) for (let t6 of [e4.main, ...e4.frames, e4.mask, e4.talk, e4.brows]) {
        if (!t6) continue;
        let e5 = t6.naturalWidth || t6.width, n5 = t6.naturalHeight || t6.height;
        if (e5 > f3 || n5 > f3 || (p3 += e5 * n5) > T.texels) throw E(`too-large`, `this model's images are too large (${e5} x ${n5}: ${f3} px a side and ${T.texels} pixels in all at most)`);
      }
      this.install(o3, u2, d2);
    }
    install(e3, t5, n4) {
      let r3 = this.gl, i3 = { ...this, drive: { ...this.drive }, chains: Object.fromEntries(Object.entries(this.chains).map(([e4, t6]) => [e4, t6.map((e5) => ({ ...e5 }))])) }, a4 = [];
      for (let e4 = 0; e4 < 8 && r3.getError(); e4++) ;
      try {
        this.build(e3, t5, n4, a4);
        for (let e4 = 0, t6; e4 < 8 && (t6 = r3.getError()); e4++) if (t6 === r3.OUT_OF_MEMORY) throw E(`too-large`, `the GPU ran out of memory for this model`);
      } catch (e4) {
        throw this.freeLayers(a4), Object.assign(this, i3), e4;
      }
      this.freeLayers(i3.layers), this.freeMask();
    }
    build(e3, t5, n4, r3) {
      this.model = e3, this.chainRuns = (e3.rig?.chains || []).map(he2);
      let a4 = e3.layers.find((e4) => e4.role === `mouth`);
      this.frameKind = (a4?.frames || [``, ``, ``]).map((e4, t6) => a4?.visemes?.[t6] || [`closed`, `half`, `open`][t6] || ``);
      let o3 = e3.anchors.jaw;
      this.frameJaw = this.frameKind.map((e4) => o3 && e4 !== `closed` && (e4 !== `half` || o3.open > 0) && o3[e4] || 0);
      let s3 = this.procJaw > 0 ? e3.rig?.jaw ?? this.procJaw : 0;
      if (o3 && s3 > 0 && !this.frameJaw.some((e4) => e4 > 0)) {
        let t6 = e3.anchors.face[3] - e3.anchors.face[1], n5 = { half: 0.45, open: 1, round: 0.7, wide: 0.35 };
        this.frameJaw = this.frameKind.map((e4) => s3 * t6 * (n5[e4] ?? 0));
      }
      this.vis = {}, this.frameKind.forEach((e4, t6) => {
        (e4 === `round` || e4 === `wide` || e4 === `shut`) && (this.vis[e4] = t6);
      });
      let c3 = e3.layers.findIndex((e4) => e4.group === `hair_front`), l3 = c3 >= 0 ? { img: t5[c3].main, def: e3.layers[c3] } : void 0;
      this.bangsDepth = l3?.def.depth ?? 0, e3.layers.forEach((e4, n5) => r3.push(this.buildLayer(e4, t5[n5].main, t5[n5].frames, t5[n5].mask, t5[n5].talk, t5[n5].brows, e4.id === `brows` || e4.role === `expr_brows` || e4.brow_tex ? l3 : void 0))), this.layers = r3, this.byId = new Map(this.layers.map((e4) => [e4.def.id, e4])), this.nasal = {};
      let u2 = e3.anchors.eyes;
      if (u2 && u2.length >= 2) {
        let n5 = u2.reduce((e4, t6) => e4 + (t6[0] + t6[2]) / 2, 0) / u2.length;
        e3.layers.forEach((r4, i3) => {
          let a5 = r4.role?.startsWith(`iris_`) ? r4.role.slice(5) : ``, o4 = r4.clip ? e3.layers.findIndex((e4) => e4.id === r4.clip) : -1, s4 = o4 >= 0 ? t5[o4].mask : void 0;
          if (!a5 || !r4.range || !s4 || this.nasal[a5]) return;
          let c4 = De(t5[i3].main, r4, s4, e3.layers[o4], n5 > r4.x + r4.w / 2 ? 1 : -1);
          c4 && (this.nasal[a5] = c4);
        });
      }
      if (this.lidCurve && Ee(e3)) for (let n5 of [`L`, `R`]) {
        let r4 = e3.layers.findIndex((e4) => e4.role === `lid_${n5}`), i3 = r4 >= 0 ? Oe(t5[r4].main, e3.layers[r4]) : null;
        if (i3) {
          for (let e4 of this.layers) if (e4.def.role === `eye_${n5}` || e4.def.role === `iris_${n5}` || e4.def.role === `shine_${n5}`) {
            e4.pivY = new Float32Array(e4.rest.length / 2);
            for (let t6 = 0; t6 < e4.pivY.length; t6++) e4.pivY[t6] = i3(e4.rest[2 * t6]);
            e4.pivC = i3(e4.def.x + e4.def.w / 2);
          }
        }
      }
      this.tuning = { ...R2(), ...e3.tuning || {} }, this.rig = { ...L2(), ...e3.rig || {}, hair: { ...L2().hair, ...e3.rig?.hair || {} }, body: { ...L2().body, ...e3.rig?.body || {}, bust: 0 } }, this.expr = {}, this.resetMouth(), this.talkLeft = 0, this.fb = e3.anchors.body ? S(e3.anchors, e3.canvas) : null, this.cutBottom = !this.fb && e3.anchors.bottom_y >= e3.canvas[1] - 4, this.resetPhysics(), this.keys = [], this.kfPair = null, n4 && me2(n4) ? this.prepareKeyforms(n4) : n4 && console.warn(`LivLiv: keyforms.json is not one this player reads; the character plays on the rig alone`);
    }
    prepareKeyforms(e3) {
      let t5 = /* @__PURE__ */ new Map(), n4 = (e4) => {
        let n5 = t5.get(e4);
        if (!n5) {
          let r4 = atob(e4);
          n5 = new Uint8Array(r4.length);
          for (let e5 = 0; e5 < r4.length; e5++) n5[e5] = r4.charCodeAt(e5);
          t5.set(e4, n5);
        }
        return n5;
      }, r3 = { params: this.params, body: { ...this.body }, bust: { ...this.bust }, mouthW: this.mouthW, smile: this.smileShown, chains: Object.values(this.chains).map((e4) => e4.map((e5) => ({ ...e5 }))) }, i3 = this.rig.body, a4 = this.tuning.turn;
      e3.keys.forEach((t6, r4) => {
        let o3 = { ...e(), [t6.param]: t6.value };
        this.params = o3, this.body = { yaw: o3.bodyX + o3.angleX * i3.yaw * a4, roll: o3.bodyZ + o3.angleZ * this.rig.body.roll * a4 };
        for (let e4 of Object.values(this.chains)) for (let t7 of e4) Object.assign(t7, U2());
        Object.assign(this.bust, { x: 0, y: 0, vx: 0, vy: 0 }), this.mouthW = [1, 0, 0], this.smileShown = 0, this.kfOff = true, this.deform(), this.kfOff = false;
        for (let i4 of this.layers) {
          let a5 = Object.hasOwn(t6.fields, i4.def.id) ? i4.def.id : i4.def.group === `head` ? `head` : i4.def.group.startsWith(`hair`) ? `hair` : i4.def.group === `body` && ((e4) => !!t6.fields[e4] || !!t6.same?.includes(e4))(`torso`) ? `torso` : i4.def.id, o4 = t6.fields[a5] ?? (t6.same?.includes(a5) ? t6.fields.head : void 0);
          if (i4.kf ||= [], !o4) {
            i4.kf[r4] = null;
            continue;
          }
          let s4 = n4(o4), c3 = new Int16Array(s4.buffer, s4.byteOffset, s4.byteLength >> 1), l3 = e3.mask?.[a5] ? n4(e3.mask[a5]) : void 0, u2 = new Float32Array(i4.rest.length);
          for (let t7 = 0; t7 < u2.length; t7 += 2) {
            let [n5, r5] = Ce2(c3, e3, i4.rest[t7], i4.rest[t7 + 1]), a6 = l3 ? we(l3, e3, i4.rest[t7], i4.rest[t7 + 1]) : 1;
            u2[t7] = (i4.rest[t7] + n5 - i4.out[t7]) * a6, u2[t7 + 1] = (i4.rest[t7 + 1] + r5 - i4.out[t7 + 1]) * a6;
          }
          i4.kf[r4] = u2;
        }
        let s3 = t6.param === `angleY`;
        this.keys.push({ param: t6.param, value: t6.value, scale: a4 * (s3 ? this.tuning.nod : 1) / (e3.turn * (s3 ? e3.nod : 1)) });
      }), this.params = r3.params, this.body = r3.body, Object.assign(this.bust, r3.bust), this.mouthW = r3.mouthW, this.smileShown = r3.smile, Object.values(this.chains).forEach((e4, t6) => e4.forEach((e5, n5) => Object.assign(e5, r3.chains[t6][n5]))), this.kfPair = e3.interp === `hermite` ? this.keys.map((e4) => this.keys.findIndex((t6) => t6.param === e4.param && e4.param !== `diag` && t6.value === -e4.value)) : null;
    }
    dispose() {
      this.anchorModel = null, this.freeLayers(this.layers), this.freeMask(), this.layers = [];
    }
    freeLayers(e3) {
      let t5 = this.gl;
      for (let n4 of e3) t5.deleteTexture(n4.tex), n4.frames.forEach((e4) => t5.deleteTexture(e4)), n4.mask && t5.deleteTexture(n4.mask), n4.talk && t5.deleteTexture(n4.talk), n4.browTex && t5.deleteTexture(n4.browTex), t5.deleteVertexArray(n4.vao), t5.deleteBuffer(n4.pos), t5.deleteBuffer(n4.uvs), t5.deleteBuffer(n4.tris);
    }
    freeMask() {
      let e3 = this.gl;
      this.maskFb && (e3.deleteFramebuffer(this.maskFb), e3.deleteTexture(this.maskTex), this.maskFb = this.maskTex = null, this.maskSize = [0, 0]);
    }
    texture(e3) {
      let t5 = this.gl, n4 = t5.createTexture();
      t5.bindTexture(t5.TEXTURE_2D, n4), t5.pixelStorei(t5.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
      try {
        t5.texImage2D(t5.TEXTURE_2D, 0, t5.RGBA, t5.RGBA, t5.UNSIGNED_BYTE, e3);
      } catch (e4) {
        throw t5.deleteTexture(n4), e4;
      }
      return t5.generateMipmap(t5.TEXTURE_2D), t5.texParameteri(t5.TEXTURE_2D, t5.TEXTURE_MIN_FILTER, t5.LINEAR_MIPMAP_LINEAR), t5.texParameteri(t5.TEXTURE_2D, t5.TEXTURE_MAG_FILTER, t5.LINEAR), t5.texParameteri(t5.TEXTURE_2D, t5.TEXTURE_WRAP_S, t5.CLAMP_TO_EDGE), t5.texParameteri(t5.TEXTURE_2D, t5.TEXTURE_WRAP_T, t5.CLAMP_TO_EDGE), n4;
    }
    buildLayer(e3, t5, n4, r3, i3, a4, o3) {
      let s3 = this.gl, c3 = this.model.anchors, l3 = this.model.layers.some((e4) => e4.id === `brows`), u2 = O(this.model), d2 = Math.floor(e3.x / u2), f3 = Math.floor(e3.y / u2), m3 = Math.ceil((e3.x + e3.w) / u2) - d2, h3 = Math.ceil((e3.y + e3.h) / u2) - f3, g3 = ke([t5, ...n4], m3, h3, (e3.x - d2 * u2) / u2, (e3.y - f3 * u2) / u2, e3.w / u2, e3.h / u2), _3 = new Int32Array((m3 + 1) * (h3 + 1)).fill(-1), v3 = [], y3 = [], b3 = [], x3 = (t6, n5) => {
        let r4 = n5 * (m3 + 1) + t6;
        if (_3[r4] < 0) {
          _3[r4] = v3.length / 2;
          let i4 = (d2 + t6) * u2, a5 = (f3 + n5) * u2;
          v3.push(i4, a5), y3.push((i4 - e3.x) / e3.w, (a5 - e3.y) / e3.h);
        }
        return _3[r4];
      };
      for (let e4 = 0; e4 < h3; e4++) for (let t6 = 0; t6 < m3; t6++) {
        if (!g3[e4 * m3 + t6]) continue;
        let n5 = x3(t6, e4), r4 = x3(t6 + 1, e4), i4 = x3(t6, e4 + 1), a5 = x3(t6 + 1, e4 + 1);
        b3.push(n5, r4, i4, r4, a5, i4);
      }
      let S3 = v3.length / 2, C3 = new Float32Array(v3), w3 = new Float32Array(S3), T3 = new Float32Array(S3), E3 = new Float32Array(S3), D3 = new Float32Array(S3), O3 = new Float32Array(S3), k3 = new Int8Array(S3).fill(-1), A3 = new Float32Array(S3), j2 = new Float32Array(S3).fill(1 / 0), M3 = new Float32Array(S3), N2 = this.neckFollow > 0 && e3.group === `body` ? new Float32Array(S3) : void 0, P2 = this.model.rig?.neck, I2 = P2 && P2.twist > 0 && e3.group === `body` ? new Float32Array(S3) : void 0, L3 = o3 && (e3.id === `brows` || e3.role === `expr_brows`) ? Te(t5, e3, o3.img, o3.def, C3, u2) : void 0, R3 = o3 && a4 ? Te(a4, e3, o3.img, o3.def, C3, u2) : void 0, z3 = L3 || R3 ? new Float32Array(5 * S3) : void 0, B3 = c3.face[2] - c3.face[0], V3 = c3.head, ee3 = c3.neck_y - 0.1 * V3.ry, te3 = Math.max(1, (c3.body && c3.hair_bottom_y != null ? c3.hair_bottom_y : c3.bottom_y) - ee3);
      for (let t6 = 0; t6 < S3; t6++) {
        let n5 = C3[2 * t6], r4 = C3[2 * t6 + 1], i4 = Math.hypot((n5 - V3.cx) / V3.rx, (r4 - V3.cy) / V3.ry);
        D3[t6] = e3.group === `head` ? e3.depth : e3.group === `hair_front` ? e3.depth * n(e3.fall_end ?? 1, e3.fall ?? 0.55, i4) : e3.depth * n(e3.fall_end ?? 1, e3.fall_end === void 0 ? 0.7 : e3.fall ?? 0.7, i4);
        let a5 = 1 - n(c3.neck_y + 0.05 * V3.ry, c3.neck_y + 1.1 * V3.ry, r4), s4 = Math.min(1, Math.max(0, (r4 - ee3) / te3)), u3 = n(0, 0.55, s4), d3 = n(0.25, 1, s4) ** 1.3, f4 = n(0.95, 0.7, i4) * (1 - n(c3.neck_y - 0.2 * V3.ry, c3.neck_y + 0.3 * V3.ry, r4)), p3 = n(c3.hair_root_y + 0.25 * V3.ry, V3.cy + 0.7 * V3.ry, r4);
        if (e3.group === `head` ? w3[t6] = 1 : e3.group === `body` ? w3[t6] = 0 : (w3[t6] = f4 + (1 - f4) * a5, T3[t6] = f4 * p3 + (1 - f4) * u3, E3[t6] = f4 * p3 * p3 + (1 - f4) * d3, A3[t6] = f4, e3.group === `hair_inner` && (w3[t6] *= 0.5, T3[t6] *= 0.35, E3[t6] *= 0.35)), z3 && o3) {
          let e4 = 5 * t6;
          z3[e4] = o3.def.depth * n(1, o3.def.fall ?? 0.55, i4), z3[e4 + 1] = f4 + (1 - f4) * a5, z3[e4 + 2] = f4 * p3 + (1 - f4) * u3, z3[e4 + 3] = f4 * p3 * p3 + (1 - f4) * d3, z3[e4 + 4] = f4;
        }
        let m4 = e3.group === `hair_side` || e3.group === `hair_front`, h4 = this.chinFollow && e3.role === `mouth`;
        if ((e3.id === `face` || e3.role === `expr` || m4 || h4 || e3.role === `neck_shadow`) && c3.jaw && this.frameJaw.some((e4) => e4 > 0)) {
          let e4 = n(c3.jaw.top - 0.02 * V3.ry, c3.jaw.chin, r4) * (m4 ? 1 - n(c3.jaw.chin, c3.jaw.chin + 0.15 * V3.ry, r4) : 1), i5 = 1 - n(0.22 * B3, 0.5 * B3, Math.abs(n5 - V3.cx));
          M3[t6] = e4 * i5;
        }
        if (e3.role === `neck_shadow` && c3.jaw) {
          let e4 = 1 - n(c3.jaw.chin, c3.jaw.chin + ie2 * (c3.face[3] - c3.face[1]), r4);
          w3[t6] = e4, M3[t6] *= e4;
        }
        if (this.chinFollow && e3.group === `body` && c3.jaw) {
          let e4 = c3.face[3] - c3.face[1], i5 = (1 - n(c3.jaw.chin, c3.jaw.chin + this.chinNeck * e4, r4)) * (1 - n(this.chinNeckX[0] * B3, this.chinNeckX[1] * B3, Math.abs(n5 - V3.cx)));
          if (i5 > 0 && (w3[t6] = i5, this.frameJaw.some((e5) => e5 > 0))) {
            let e5 = n(c3.jaw.top - 0.02 * V3.ry, c3.jaw.chin, r4);
            M3[t6] = e5 * (1 - n(0.22 * B3, 0.5 * B3, Math.abs(n5 - V3.cx))) * i5;
          }
        }
        if (N2) {
          let e4 = c3.face[3] - c3.face[1];
          N2[t6] = Math.max(0, this.neckFollow * (1 - n(c3.neck_y, c3.neck_y + this.neckFollowY * e4, r4)) * (1 - n(this.neckFollowX[0] * B3, this.neckFollowX[1] * B3, Math.abs(n5 - V3.cx))) - w3[t6]);
        }
        if (I2 && P2) {
          let e4 = c3.face[3] - c3.face[1], i5 = c3.jaw?.chin ?? c3.neck_y;
          I2[t6] = Math.max(0, P2.twist * (1 - n(i5, i5 + (P2.reach ?? 0.45) * e4, r4)) * (1 - n(this.chinNeckX[0] * B3, this.chinNeckX[1] * B3, Math.abs(n5 - V3.cx))) - w3[t6]);
        }
        !c3.brows || e3.group !== `head` || (e3.role || ``).startsWith(`iris_`) || l3 && e3.id !== `brows` || c3.brows.forEach((e4, i5) => {
          let a6 = c3.brow_lines?.[i5];
          if (!e4 || !a6) return;
          let o4 = ue2(e4, a6, n5, r4);
          o4 > O3[t6] && (O3[t6] = o4, k3[t6] = i5, j2[t6] = a6.cap ? ce2(a6.x, a6.cap, n5) : 1 / 0);
        });
      }
      let ne3 = e3.bones?.length ? this.skinOf(e3.bones, C3) : void 0;
      ne3 && !e3.bones.every((e4) => this.chainRuns.find((t6) => t6.def.id === e4)?.def.reach !== void 0) && (T3.fill(0), E3.fill(0)), e3.rigid && (T3.fill(0), E3.fill(0));
      let re3 = z3 && o3?.def.bones?.length ? this.skinOf(o3.def.bones, C3) : void 0;
      if (z3 && re3) for (let e4 = 0; e4 < S3; e4++) z3[5 * e4 + 2] = 0, z3[5 * e4 + 3] = 0;
      let ae3 = s3.createVertexArray();
      s3.bindVertexArray(ae3);
      let oe3 = s3.createBuffer();
      s3.bindBuffer(s3.ARRAY_BUFFER, oe3), s3.bufferData(s3.ARRAY_BUFFER, C3, s3.DYNAMIC_DRAW), s3.enableVertexAttribArray(0), s3.vertexAttribPointer(0, 2, s3.FLOAT, false, 0, 0);
      let se3 = s3.createBuffer();
      s3.bindBuffer(s3.ARRAY_BUFFER, se3), s3.bufferData(s3.ARRAY_BUFFER, new Float32Array(y3), s3.STATIC_DRAW), s3.enableVertexAttribArray(1), s3.vertexAttribPointer(1, 2, s3.FLOAT, false, 0, 0);
      let H3 = s3.createBuffer();
      s3.bindBuffer(s3.ELEMENT_ARRAY_BUFFER, H3);
      let le3 = new Uint32Array(b3);
      s3.bufferData(s3.ELEMENT_ARRAY_BUFFER, le3, s3.STATIC_DRAW), s3.bindVertexArray(null);
      let de3 = [], U3 = (e4) => {
        let t6 = this.texture(e4);
        return de3.push(t6), t6;
      }, fe3, pe3, me3, he3, ge3;
      try {
        fe3 = U3(t5), pe3 = n4.map(U3), me3 = r3 && U3(r3), he3 = i3 && U3(i3), ge3 = a4 && U3(a4);
      } catch (e4) {
        throw de3.forEach((e5) => s3.deleteTexture(e5)), s3.deleteVertexArray(ae3), s3.deleteBuffer(oe3), s3.deleteBuffer(se3), s3.deleteBuffer(H3), e4;
      }
      return { def: e3, tex: fe3, frames: pe3, mask: me3, talk: he3, browTex: ge3, vao: ae3, pos: oe3, uvs: se3, tris: H3, count: b3.length, rest: C3, out: new Float32Array(C3.length), tri: le3, tw: t5.naturalWidth || t5.width, th: t5.naturalHeight || t5.height, wHead: w3, wPhys1: T3, wPhys2: E3, dep: D3, wBrow: O3, browSide: k3, browCap: j2, wFront: A3, wJaw: M3, wNeck: N2, wTwist: I2, fol: L3, folB: R3, alt: z3, outB: R3 ? new Float32Array(C3.length) : void 0, stencilRef: 0, soft: 0, maskCh: -1, skin: ne3, altSkin: re3 };
    }
    skinOf(e3, t5) {
      let n4 = e3.map((e4) => this.chainRuns.findIndex((t6) => t6.def.id === e4)).filter((e4) => e4 >= 0);
      if (!n4.length) return;
      let r3 = t5.length / 2, i3 = n4.length, a4 = { B: i3, c: new Int16Array(r3 * i3), seg: new Int16Array(r3 * i3), t: new Float32Array(r3 * i3), ux: new Float32Array(r3 * i3), uy: new Float32Array(r3 * i3), w: new Float32Array(r3 * i3), sum: new Float32Array(r3) };
      for (let e4 = 0; e4 < r3; e4++) {
        let r4 = t5[2 * e4], o3 = t5[2 * e4 + 1], s3 = 0;
        n4.forEach((t6, n5) => {
          let c4 = this.chainRuns[t6], l4 = c4.R, u2 = l4.length / 2, d2 = 1 / 0, f3 = 0, p3 = 0;
          for (let e5 = 0; e5 < u2 - 1; e5++) {
            let t7 = l4[2 * e5], n6 = l4[2 * e5 + 1], i4 = l4[2 * e5 + 2] - t7, a5 = l4[2 * e5 + 3] - n6, s4 = i4 * i4 + a5 * a5 || 1, c5 = ((r4 - t7) * i4 + (o3 - n6) * a5) / s4;
            e5 > 0 && (c5 = Math.max(0, c5)), e5 < u2 - 2 && (c5 = Math.min(1, c5));
            let m4 = t7 + i4 * c5, h4 = n6 + a5 * c5, g4 = Math.hypot(r4 - m4, o3 - h4);
            g4 < d2 && (d2 = g4, f3 = e5, p3 = c5);
          }
          let m3 = e4 * i3 + n5, h3 = f3, g3 = Math.min(1, p3), _3 = l4[2 * h3] + (l4[2 * h3 + 2] - l4[2 * h3]) * g3, v3 = l4[2 * h3 + 1] + (l4[2 * h3 + 3] - l4[2 * h3 + 1]) * g3, y3 = c4.def.sigma ?? 40;
          a4.c[m3] = t6, a4.seg[m3] = h3, a4.t[m3] = p3, a4.ux[m3] = r4 - _3, a4.uy[m3] = o3 - v3, a4.w[m3] = Math.exp(-((d2 / y3) ** 2)) + 1e-6, s3 += a4.w[m3];
        });
        let c3 = 1 / 0, l3 = 1 / 0;
        for (let t6 = 0; t6 < i3; t6++) {
          let n5 = this.chainRuns[a4.c[e4 * i3 + t6]];
          a4.w[e4 * i3 + t6] /= s3, n5.def.reach !== void 0 && (l3 = Math.min(l3, n5.def.reach)), c3 = Math.min(c3, Math.hypot(a4.ux[e4 * i3 + t6], a4.uy[e4 * i3 + t6]));
        }
        if (l3 < 1 / 0) {
          let t6 = 1 - n(l3, 1.6 * l3, c3);
          for (let n5 = 0; n5 < i3; n5++) a4.w[e4 * i3 + n5] *= t6;
        }
        for (let t6 = 0; t6 < i3; t6++) a4.sum[e4] += a4.w[e4 * i3 + t6];
      }
      return a4;
    }
    skinOffset(e3, t5, n4) {
      let r3 = 0, i3 = 0;
      if (e3.sum[t5] < 1e-4) n4[0] = 0, n4[1] = 0;
      else {
        for (let n5 = 0; n5 < e3.B; n5++) {
          let a4 = t5 * e3.B + n5, o3 = this.chainRuns[e3.c[a4]], s3 = e3.seg[a4];
          if (!o3.moving) continue;
          let c3 = Math.min(1, Math.max(0, e3.t[a4])), l3 = e3.t[a4] < 0 ? 0 : 1, u2 = (o3.disp[2 * s3] + (o3.disp[2 * s3 + 2] - o3.disp[2 * s3]) * c3) * l3, d2 = (o3.disp[2 * s3 + 1] + (o3.disp[2 * s3 + 3] - o3.disp[2 * s3 + 1]) * c3) * l3, f3 = (o3.beta[s3] + (o3.beta[s3 + 1] - o3.beta[s3]) * c3) * l3, p3 = Math.cos(f3), m3 = Math.sin(f3), h3 = e3.ux[a4], g3 = e3.uy[a4], _3 = u2 + h3 * p3 - g3 * m3 - h3, v3 = d2 + h3 * m3 + g3 * p3 - g3, y3 = Math.cos(o3.rho), b3 = Math.sin(o3.rho);
          r3 += e3.w[a4] * (_3 * y3 - v3 * b3), i3 += e3.w[a4] * (_3 * b3 + v3 * y3);
        }
        n4[0] = r3, n4[1] = i3;
      }
    }
    chainRoot(e3, t5, n4, r3) {
      let [i3, a4] = e3.points[0], o3 = this.model.anchors;
      if (e3.attach === `body`) {
        let e4 = [0, 0];
        this.bodyOffset(i3, a4, t5, e4), r3[0] = i3 + e4[0], r3[1] = a4 + e4[1], r3[2] = this.fb ? this.fbTurn(a4) : this.body.roll * Math.PI / 180 * n(o3.bottom_y, o3.neck_y, a4);
      } else {
        let o4 = [0, 0];
        this.headXform(i3, a4, e3.depth ?? 0, t5, o4), r3[0] = o4[0] + n4[0], r3[1] = o4[1] + n4[1], r3[2] = t5.angleZ * Math.PI / 180 * this.rig.roll * this.tuning.turn;
      }
    }
    exprAlpha(e3) {
      return n(0.3, 0.7, e3.param === `smile` || !e3.param ? this.smileShown : this.expr[e3.param] ?? 0);
    }
    moodAlpha(e3) {
      let t5 = (e4) => {
        let t6 = 0;
        for (let [n4, r3] of Object.entries(e4 || {})) t6 += r3 * this.exprValue(n4);
        return Math.min(1, t6);
      };
      return (e3.show ? t5(e3.show) : 1) * (e3.hide ? 1 - t5(e3.hide) : 1);
    }
    shown(e3) {
      let t5 = e3.def, n4 = t5.role || ``;
      if (this.hidden.has(t5.id) || (t5.group === `body` ? this.bodyHidden : this.headHidden) || (t5.show || t5.hide) && this.moodAlpha(t5) <= 0.01) return false;
      if (n4 === `expr` || n4 === `expr_brows`) return this.exprAlpha(t5) > 0.01;
      if (n4.startsWith(`lid_`)) return 1 - n(0.05, 0.35, n4 === `lid_L` ? this.params.eyeLOpen : this.params.eyeROpen) > 0.01;
      if (n4 === `blush`) {
        let e4 = 0;
        for (let [n5, r3] of Object.entries(t5.blush || {})) e4 += r3 * this.exprValue(n5);
        return e4 > 0.01;
      }
      return true;
    }
    exprValue(e3) {
      return e3 === `smile` ? this.smileShown : this.expr[e3] ?? 0;
    }
    stepChains(e3) {
      if (!this.chainRuns.length || e3 <= 0) return;
      let t5 = this.params, n4 = this.model.anchors, r3 = [0, 0];
      this.bodyOffset(n4.head.cx, n4.neck_y, t5, r3);
      let i3 = this.physicsScale * (this.tuning.hairBack ?? this.tuning.hair), a4 = [0, 0, 0];
      for (let n5 of this.chainRuns) {
        let o3 = n5.def, s3 = n5.R, c3 = n5.p, l3 = n5.q, u2 = s3.length / 2;
        this.chainRoot(o3, t5, r3, a4), n5.started ||= (n5.W = [a4[0], a4[1]], n5.V = [0, 0], n5.acc = [0, 0], true);
        let d2 = (a4[0] - n5.W[0]) / e3, f3 = (a4[1] - n5.W[1]) / e3, p3 = (d2 - n5.V[0]) / e3, m3 = (f3 - n5.V[1]) / e3;
        n5.W = [a4[0], a4[1]], n5.V = [d2, f3], n5.rho = a4[2];
        let h3 = Math.min(1, e3 * 30);
        n5.acc[0] += (p3 - n5.acc[0]) * h3, n5.acc[1] += (m3 - n5.acc[1]) * h3;
        let g3 = Math.cos(-n5.rho), _3 = Math.sin(-n5.rho), v3 = n5.acc[0] * g3 - n5.acc[1] * _3, y3 = n5.acc[0] * _3 + n5.acc[1] * g3, b3 = 0;
        for (let [e4, t6] of Object.entries(o3.bias || {})) b3 += t6 * this.exprValue(e4);
        let x3 = -n5.rho * o3.hang + b3 * Math.PI / 180, S3 = Math.cos(x3), C3 = Math.sin(x3), w3 = o3.freq ?? 0.5, T3 = 2 * Math.PI * w3 * this.time + n5.phase, E3 = o3.wind * i3 * this.rig.wind * (Math.sin(T3) + 0.4 * Math.sin(1.7 * T3 + 2 * n5.phase)), D3 = Math.max(0, 1 - o3.damp * e3);
        for (let t6 = 1; t6 < u2; t6++) {
          let r4 = n5.s[t6], a5 = o3.k[0] + (o3.k[1] - o3.k[0]) * r4, u3 = s3[2 * t6] - s3[0], d3 = s3[2 * t6 + 1] - s3[1], f4 = s3[0] + u3 * S3 - d3 * C3 + E3 * r4, p4 = s3[1] + u3 * C3 + d3 * S3, m4 = a5 * (f4 - c3[2 * t6]) - o3.drive * i3 * v3, h4 = a5 * (p4 - c3[2 * t6 + 1]) - o3.drive * i3 * y3, g4 = c3[2 * t6] + (c3[2 * t6] - l3[2 * t6]) * D3 + m4 * e3 * e3, _4 = c3[2 * t6 + 1] + (c3[2 * t6 + 1] - l3[2 * t6 + 1]) * D3 + h4 * e3 * e3;
          l3[2 * t6] = c3[2 * t6], l3[2 * t6 + 1] = c3[2 * t6 + 1], c3[2 * t6] = g4, c3[2 * t6 + 1] = _4;
        }
        let O3 = o3.limit ?? 1 / 0;
        for (let e4 = 1; e4 < u2; e4++) {
          let t6 = c3[2 * e4] - c3[2 * e4 - 2], r4 = c3[2 * e4 + 1] - c3[2 * e4 - 1], i4 = Math.hypot(t6, r4) || 1;
          c3[2 * e4] = c3[2 * e4 - 2] + t6 / i4 * n5.len[e4], c3[2 * e4 + 1] = c3[2 * e4 - 1] + r4 / i4 * n5.len[e4];
          let a5 = c3[2 * e4] - s3[2 * e4], o4 = c3[2 * e4 + 1] - s3[2 * e4 + 1], l4 = Math.hypot(a5, o4);
          l4 > O3 && (c3[2 * e4] = s3[2 * e4] + a5 * O3 / l4, c3[2 * e4 + 1] = s3[2 * e4 + 1] + o4 * O3 / l4);
        }
        let k3 = 0;
        for (let e4 = 0; e4 < u2; e4++) n5.disp[2 * e4] = c3[2 * e4] - s3[2 * e4], n5.disp[2 * e4 + 1] = c3[2 * e4 + 1] - s3[2 * e4 + 1], k3 = Math.max(k3, Math.abs(n5.disp[2 * e4]), Math.abs(n5.disp[2 * e4 + 1]));
        n5.moving = k3 > 1e-3;
        let A3 = [];
        for (let e4 = 0; e4 < u2 - 1; e4++) {
          let t6 = s3[2 * e4 + 2] - s3[2 * e4], n6 = s3[2 * e4 + 3] - s3[2 * e4 + 1], r4 = c3[2 * e4 + 2] - c3[2 * e4], i4 = c3[2 * e4 + 3] - c3[2 * e4 + 1];
          A3.push(Math.atan2(t6 * i4 - n6 * r4, t6 * r4 + n6 * i4));
        }
        n5.beta[0] = 0;
        for (let e4 = 1; e4 < u2 - 1; e4++) n5.beta[e4] = 0.5 * (A3[e4 - 1] + A3[e4]);
        n5.beta[u2 - 1] = A3[u2 - 2];
      }
    }
    hxC = { ax: NaN, ay: NaN, az: NaN, t: NaN, n: NaN, ry: NaN, rp: NaN, rr: NaN, pe: NaN, cy: 1, sy: 0, cp: 1, sp: 0, cr: 1, sr: 0 };
    headTrig(e3) {
      let t5 = this.hxC, n4 = this.rig, r3 = this.tuning.turn, i3 = this.tuning.nod ?? 1, a4 = n4.pitch_ease ?? 0.25;
      if (t5.ax !== e3.angleX || t5.ay !== e3.angleY || t5.az !== e3.angleZ || t5.t !== r3 || t5.n !== i3 || t5.ry !== n4.yaw || t5.rp !== n4.pitch || t5.rr !== n4.roll || t5.pe !== a4) {
        let o3 = e3.angleY / 30, s3 = e3.angleX / 30 * n4.yaw * r3, c3 = o3 * (1 - a4 * o3 * o3) * n4.pitch * r3 * i3, l3 = e3.angleZ * Math.PI / 180 * n4.roll * r3;
        Object.assign(t5, { ax: e3.angleX, ay: e3.angleY, az: e3.angleZ, t: r3, n: i3, ry: n4.yaw, rp: n4.pitch, rr: n4.roll, pe: a4, cy: Math.cos(s3), sy: Math.sin(s3), cp: Math.cos(c3), sp: Math.sin(c3), cr: Math.cos(l3), sr: Math.sin(l3) });
      }
      return t5;
    }
    headXform(e3, t5, n4, r3, i3) {
      let a4 = this.model.anchors.head, o3 = (e3 - a4.cx) / a4.rx, s3 = (t5 - a4.cy) / a4.ry, c3 = this.rig, l3 = c3.bulge_shape ?? 1, u2 = c3.bulge_extent, d2 = u2 ? u2[0] : 1;
      if (u2 && u2.length > 3 && s3 > 0) {
        let e4 = Math.min(1, s3 / (u2[2] * (u2[4] ?? 1)));
        d2 += (u2[3] - u2[0]) * e4 * e4 * (3 - 2 * e4);
      }
      let f3 = u2 ? o3 / d2 : o3, p3 = u2 ? s3 / (s3 < 0 ? u2[1] : u2[2]) : s3, m3 = c3.bulge * Math.max(0, l3 === 1 ? 1 - f3 * f3 - p3 * p3 : 1 - (f3 * f3 + p3 * p3) ** +l3) + n4, { cy: h3, sy: g3, cp: _3, sp: v3, cr: y3, sr: b3 } = this.headTrig(r3), x3 = o3 * h3 + m3 * g3, S3 = -o3 * g3 + m3 * h3, C3 = s3 * _3 - S3 * v3, w3 = c3.drift;
      x3 += (w3 ? w3[0] : 0.12) * g3, C3 -= (w3 ? w3[1] : 0.08) * v3;
      let T3 = a4.cx + x3 * a4.rx, E3 = a4.cy + C3 * a4.ry, D3 = a4.cx, O3 = this.model.anchors.neck_y, k3 = T3 - D3, A3 = E3 - O3;
      T3 = D3 + k3 * y3 - A3 * b3, E3 = O3 + k3 * b3 + A3 * y3, i3[0] = T3, i3[1] = E3;
    }
    bodyOffset(e3, t5, n4, r3, i3 = true) {
      if (this.fb) {
        this.fullBodyOffset(e3, t5, n4, r3, i3);
        return;
      }
      let a4 = this.model.anchors, o3 = a4.head, s3 = this.rig.body, c3 = n(a4.bottom_y, a4.neck_y, t5), l3 = a4.face[2] - a4.face[0], u2 = n4.breath * this.tuning.breath * this.rig.breath * s3.breath, d2 = (e3 - o3.cx) * 0.01 * u2 * c3, f3 = -u2 * 0.024 * o3.ry * c3 ** 1.3, p3 = this.body.yaw / 30, m3 = 1.4 * l3, h3 = Math.max(-1.6, Math.min(1.6, (e3 - o3.cx) / m3));
      d2 += p3 * m3 * 0.16 * c3 ** 1.2 * (1 - 0.18 * h3 * h3) + p3 * (e3 - o3.cx) * -0.04 * Math.sign(h3) * c3;
      let g3 = this.body.roll * Math.PI / 180 * c3;
      if (g3 !== 0) {
        let n5 = o3.cx, r4 = a4.bottom_y + 0.4 * (a4.bottom_y - a4.neck_y), i4 = e3 - n5, s4 = t5 - r4, c4 = Math.cos(g3), l4 = Math.sin(g3);
        d2 += i4 * (c4 - 1) - s4 * l4, f3 += i4 * l4 + s4 * (c4 - 1);
      }
      let _3 = a4.chest;
      if (_3 && i3) {
        let n5 = (e3 - _3.cx) / _3.rx, r4 = (t5 - _3.cy) / _3.ry, i4 = Math.sqrt(n5 * n5 + r4 * r4), a5 = 1 - n(0.2, 1.15, i4);
        a5 > 0 && (f3 -= u2 * 0.012 * o3.ry * a5 * (0.4 + s3.bust), d2 += this.bust.x * a5, f3 += this.bust.y * a5);
      }
      r3[0] = d2, r3[1] = f3;
    }
    upperOffset(e3, t5, n4, r3, i3, a4, o3, s3 = this.fbPose()) {
      let c3 = this.model.anchors, l3 = c3.head, u2 = this.rig.body, d2 = this.fb, f3 = i3.breath * this.tuning.breath * this.rig.breath * u2.breath, p3 = (e3 - l3.cx) * 0.01 * f3 * n4, m3 = -f3 * 0.024 * l3.ry * n4 ** 1.3, h3 = this.body.yaw / 30 * s, g3 = 1.4 * d2.fw, _3 = Math.max(-1.6, Math.min(1.6, (e3 - l3.cx) / g3));
      if (p3 += h3 * g3 * 0.16 * n4 ** 1.2 * (1 - 0.18 * _3 * _3) + h3 * (e3 - l3.cx) * -0.04 * Math.sign(_3) * n4, s3.aw !== 0 && r3 > 0) {
        let n5 = e3 - d2.hx, i4 = t5 - d2.hy;
        p3 += (n5 * (s3.cw - 1) - i4 * s3.sw) * r3, m3 += (n5 * s3.sw + i4 * (s3.cw - 1)) * r3;
      }
      let v3 = c3.chest;
      if (v3 && o3) {
        let n5 = (e3 - v3.cx) / v3.rx, r4 = (t5 - v3.cy) / v3.ry, i4 = Math.sqrt(n5 * n5 + r4 * r4), a5 = 1 - n(0.2, 1.15, i4);
        a5 > 0 && (m3 -= f3 * 0.012 * l3.ry * a5 * (0.4 + u2.bust), p3 += this.bust.x * a5, m3 += this.bust.y * a5);
      }
      a4[0] = p3, a4[1] = m3;
    }
    fbWaist(t5) {
      let n4 = this.fb;
      return n(n4.hy + c * n4.fw, n4.hy - c * n4.fw, t5);
    }
    fbAnkle(e3) {
      let t5 = this.fb;
      return n(t5.ankleY - l[0] * t5.fw, t5.ankleY - l[1] * t5.fw, e3);
    }
    fbTurn(e3) {
      let t5 = this.fbPose();
      return t5.aw * this.fbWaist(e3) + t5.aa * this.fbAnkle(e3);
    }
    fbPose() {
      let e3 = this.pv, t5 = this.fbm;
      if (e3.roll === this.body.roll && e3.cr === this.crouch && e3.dp === this.dip && e3.mx === this.move.x && e3.hs === t5.hs && e3.tilt === t5.tilt) return e3;
      let n4 = this.fb, r3 = this.model.anchors, i3 = this.body.roll * s * Math.PI / 180, a4 = 3 * Math.PI / 180, o3 = a4 * Math.tanh(Math.atan2(this.move.x * n4.uw, Math.max(1, n4.ankleY - r3.neck_y)) / a4), s3 = i3 * (1 - o) - _ * t5.tilt, c3 = i3 * o + o3;
      return e3.roll = this.body.roll, e3.cr = this.crouch, e3.dp = this.dip, e3.mx = this.move.x, e3.hs = t5.hs, e3.tilt = t5.tilt, e3.aw = s3, e3.cw = Math.cos(s3), e3.sw = Math.sin(s3), e3.aa = c3, e3.ca = Math.cos(c3), e3.sa = Math.sin(c3), e3.x = t5.hs, e3.y = -this.crouch * n4.uh, e3.dip = -this.dip * n4.uh, e3;
    }
    fullBodyOffset(e3, t5, n4, r3, i3) {
      let a4 = this.fb, o3 = this.model.anchors, s3 = n(a4.hy, o3.neck_y, t5), l3 = this.fbWaist(t5), u2 = this.fbPose();
      if (this.upperOffset(e3, t5, s3, l3, n4, r3, i3, u2), u2.x !== 0 || u2.y !== 0) {
        let e4 = Math.min(1, Math.max(0, (a4.ankleY - t5) / (a4.ankleY - a4.hy)));
        r3[0] += u2.x * e4, r3[1] += u2.y * e4;
      }
      if (u2.dip !== 0 && (r3[1] += u2.dip * l3), this.fbParts && this.partsOffset(e3, t5, r3), u2.aa !== 0) {
        let n5 = this.fbAnkle(t5);
        if (n5 > 0) {
          let i4 = e3 + r3[0] - a4.ax, o4 = t5 + r3[1] - a4.ay, s4 = a4.ankleY - l[1] * a4.fw, l4 = Math.min(1, Math.max(0, (s4 - t5) / Math.max(1, s4 - a4.hy)));
          r3[0] += (i4 * (u2.ca - 1) - o4 * u2.sa) * n5, r3[1] += (i4 * u2.sa * l4 + o4 * (u2.ca - 1)) * n5;
        }
      }
    }
    partsOffset(e3, t5, n4) {
      let r3 = this.fb, i3 = this.fbm, a4 = this.model.anchors.body, o3 = r3.fw;
      if (i3.tilt !== 0) {
        let a5 = Math.min(1, Math.max(0, (r3.ankleY - t5) / Math.max(1, r3.ankleY - r3.hy))), s4 = t5 < r3.hy ? n(r3.hy - 1.3 * o3, r3.hy - 0.2 * o3, t5) : a5;
        n4[1] += i3.tanTilt * (e3 - r3.hx) * s4;
      }
      let s3 = r3.hy - 0.4 * o3;
      if (a4.hem_y != null && t5 > s3) {
        let c3 = a4.hem_y, l3 = t5 <= c3 ? Math.min(1, Math.max(0, (t5 - s3) / Math.max(1, c3 - s3))) ** 1.6 : 1 - n(c3, c3 + 0.45 * o3, t5);
        if (l3 > 0) {
          let t6 = a4.hem_x ? (a4.hem_x[0] + a4.hem_x[1]) / 2 : r3.hx;
          n4[0] += (i3.hem + (e3 - t6) * 0.012 * i3.breath) * l3;
        }
      }
    }
    stepFb(e3) {
      let i3 = this.fb, c3 = this.fbm, l3 = this.time, d2 = this.model.anchors, f3 = i3.fw, p3 = this.physicsScale, m3 = this.fbPose(), h3 = this.body.yaw / 30 * s * 1.4 * f3 * 0.16, g3 = Math.sin(m3.aw) * (i3.hy - d2.neck_y), _3 = p * f3 * (Math.sin(l3 * 2 * Math.PI / 8.6) * 0.75 + Math.sin(l3 * 2 * Math.PI / 3.9 + 1.1) * 0.25), v3 = p3 * (d * h3 - f * g3 + this.fbIdle * _3);
      if (c3.hv += (-9 * (c3.hs - v3) - m * c3.hv) * e3, c3.hs += c3.hv * e3, c3.tilt = -g * Math.max(-1.2, Math.min(1.2, c3.hs / (h * f3))), c3.tanTilt = Math.tan(c3.tilt), this.model.anchors.body.hem_y == null) return;
      c3.breath = Math.sin(l3 * 1.7) * p3;
      let y3 = -p3 * v * (c3.hs + (i3.ankleY - i3.hy) * Math.sin(m3.aa) * 0.6), b3 = p3 * b * f3 * (Math.sin(l3 * 1.3) + 0.5 * Math.sin(l3 * 2.9 + 0.6));
      c3.hemV += (-16 * (c3.hem - y3 - b3) - y * c3.hemV) * e3, c3.hem = Math.max(-x * f3, Math.min(x * f3, c3.hem + c3.hemV * e3));
    }
    stepBody(e3) {
      let t5 = this.params, n4 = this.rig.body, r3 = this.tuning.turn, i3 = t5.bodyX + t5.angleX * n4.yaw * r3, a4 = t5.bodyZ + t5.angleZ * n4.roll * r3, o3 = Math.min(1, e3 * 5);
      this.body.yaw += (i3 - this.body.yaw) * o3, this.body.roll += (a4 - this.body.roll) * o3;
      let s3 = this.model.anchors.chest;
      if (!s3 || n4.bust <= 0) {
        this.bust.x = this.bust.y = 0;
        return;
      }
      let c3 = [0, 0];
      this.bodyOffset(s3.cx, s3.cy, t5, c3, false);
      let l3 = 1 / Math.max(e3, 1e-4), u2 = (c3[0] - this.bust.px) * l3, d2 = (c3[1] - this.bust.py) * l3;
      this.bust.px = c3[0], this.bust.py = c3[1];
      let f3 = n4.bust * this.physicsScale;
      this.bust.vx += (-70 * this.bust.x - 7 * this.bust.vx - u2 * 3.2 * f3) * e3, this.bust.vy += (-70 * this.bust.y - 7 * this.bust.vy - d2 * 4.2 * f3) * e3, this.bust.x += this.bust.vx * e3, this.bust.y += this.bust.vy * e3;
      let p3 = 0.035 * this.model.anchors.head.ry * (0.5 + f3);
      this.bust.x = Math.max(-p3, Math.min(p3, this.bust.x)), this.bust.y = Math.max(-p3, Math.min(p3, this.bust.y));
    }
    setMove(e3, t5, n4, r3, i3) {
      this.move.x = e3, this.move.s = t5, this.fb ? (this.move.y = Math.max(0, r3), this.crouch = Math.min(0, r3) + Math.max(-u, Math.min(0, i3)), this.dip = Math.min(0, n4)) : (this.move.y = n4 + r3 + i3, this.crouch = 0, this.dip = 0);
    }
    resetMouth() {
      this.mouthFrame = 0, this.mouthAmp = 0, this.mouthShape = ``, this.mouthHeld = 1, this.mouthW = this.frameKind.map((e3, t5) => +(t5 === 0));
    }
    stepMouth(e3) {
      let t5 = Math.min(1, Math.max(0, this.params.mouthOpen)), n4 = Math.min(1, Math.max(-1, this.params.vowel || 0)), [r3, i3] = te2, a4 = ne2;
      this.mouthHeld += e3;
      let o3 = this.mouthAmp;
      o3 === 0 && t5 > r3 + a4 ? o3 = t5 > i3 + a4 ? 2 : 1 : o3 === 1 && (t5 < r3 - a4 || t5 > i3 + a4) ? o3 = t5 < r3 - a4 ? 0 : 2 : o3 === 2 && t5 < i3 - a4 && (o3 = t5 < r3 - a4 ? 0 : 1);
      let s3 = this.mouthShape;
      (!s3 || (s3 === `round` ? n4 > -0.35 : n4 < oe2)) && (s3 = n4 < -0.65 ? `round` : n4 > ae2 ? `wide` : ``);
      let c3 = o3 > 0 && s3 && this.vis[s3] !== void 0 ? this.vis[s3] : o3;
      c3 === 0 && this.talkLeft > 0 && this.vis.shut !== void 0 && (c3 = this.vis.shut), c3 === this.mouthFrame ? (this.mouthAmp = o3, this.mouthShape = s3) : this.mouthHeld >= re2 && (this.mouthFrame = c3, this.mouthAmp = o3, this.mouthShape = s3, this.mouthHeld = 0);
      let l3 = this.mouthFrame;
      this.talkLeft = l3 > 0 && l3 !== this.vis.shut ? se2 : Math.max(0, this.talkLeft - e3);
      let u2 = Math.min(1, e3 * 28);
      for (let e4 = 0; e4 < this.mouthW.length; e4++) this.mouthW[e4] += (+(e4 === l3) - this.mouthW[e4]) * u2;
    }
    frameEase(e3, t5) {
      let [n4, r3] = te2, i3 = this.frameKind[e3];
      return i3 === `half` ? n(n4, r3, t5) : n(i3 === `open` ? r3 : n4, 1, t5);
    }
    stepPhysics(e3) {
      let t5 = this.params, n4 = this.model.anchors, r3 = [0, 0];
      this.headXform(n4.head.cx, n4.hair_root_y, 0, t5, r3);
      let i3 = 1 / Math.max(e3, 1e-4), a4 = (r3[0] - this.lastHead.x) * i3, o3 = (r3[1] - this.lastHead.y) * i3;
      this.lastHead = { x: r3[0], y: r3[1], roll: t5.angleZ };
      let s3 = this.rig.hair_drive, c3 = this.drive;
      if (s3) {
        let r4 = [0, 0];
        this.headXform(n4.head.cx, n4.head.cy, 0, t5, r4), c3.started || Object.assign(c3, { x: r4[0], y: r4[1], vx: 0, vy: 0, ax: 0, ay: 0, started: true });
        let a5 = Math.min(1, e3 * 25), o4 = c3.vx + ((r4[0] - c3.x) * i3 - c3.vx) * a5, s4 = c3.vy + ((r4[1] - c3.y) * i3 - c3.vy) * a5;
        c3.ax += ((o4 - c3.vx) * i3 - c3.ax) * a5, c3.ay += ((s4 - c3.vy) * i3 - c3.ay) * a5, Object.assign(c3, { x: r4[0], y: r4[1], vx: o4, vy: s4 });
      }
      let l3 = this.rig, u2 = { front: l3.hair.front, back: l3.hair.back, side: l3.hair.side }, d2 = n4.head.ry * l3.hair_limit;
      for (let n5 of l3.hair.side ? [`front`, `back`, `side`] : [`front`, `back`]) {
        let [r4, i4, f3, p3, m3] = u2[n5], [h3, g3] = this.chains[n5], _3 = this.physicsScale * ((n5 === `back` ? this.tuning.hairBack : this.tuning.hairFront) ?? this.tuning.hair), v3 = n5 === `side` ? Math.sin(this.time * 1.5 + 0.7) * 1.2 * _3 * l3.wind : Math.sin(this.time * (n5 === `front` ? 1.9 : 1.15)) * (n5 === `front` ? 0.6 : 1.8) * _3 * l3.wind, y3 = -t5.angleZ * 0.2 * _3, b3 = -r4 * (h3.x - v3 - y3) - i4 * h3.vx - a4 * f3 * r4 * 0.06 * _3, x3 = -r4 * h3.y - i4 * h3.vy - o3 * f3 * r4 * 0.04 * _3;
        if (s3) {
          let e4 = (n5 === `front` ? s3[0] : n5 === `back` ? s3[1] : s3[2] ?? s3[0]) * _3;
          b3 -= c3.ax * e4, x3 -= c3.ay * e4;
        }
        h3.vx += b3 * e3, h3.vy += x3 * e3, h3.x += h3.vx * e3, h3.y += h3.vy * e3;
        let S3 = -p3 * (g3.x - h3.x * 1.6) - m3 * g3.vx, C3 = -p3 * (g3.y - h3.y * 1.4) - m3 * g3.vy;
        g3.vx += S3 * e3, g3.vy += C3 * e3, g3.x += g3.vx * e3, g3.y += g3.vy * e3;
        for (let e4 of [h3, g3]) e4.x = Math.max(-d2, Math.min(d2, e4.x)), e4.y = Math.max(-d2 * 0.6, Math.min(d2 * 0.6, e4.y));
      }
    }
    update(e3, t5 = true) {
      if (!this.model) return;
      this.time += e3;
      let n4 = this.params;
      this.smileShown += (n4.smile - this.smileShown) * Math.min(1, e3 * 7), this.stepMouth(e3);
      for (let e4 of [`angleX`, `angleY`, `angleZ`]) n4[e4] = Math.max(t[e4][0], Math.min(t[e4][1], n4[e4]));
      let r3 = Math.max(1, Math.ceil(e3 / (1 / 120)));
      this.fbParts = false;
      for (let t6 = 0; t6 < r3; t6++) this.stepBody(e3 / r3), this.stepPhysics(e3 / r3), this.stepChains(e3 / r3), this.fb && this.stepFb(e3 / r3);
      t5 && this.deform();
    }
    deform() {
      let e3 = this.params, t5 = this.model.anchors;
      this.fbParts = false;
      let n4 = [0, 0];
      this.bodyOffset(t5.head.cx, t5.neck_y, e3, n4);
      let r3 = [0, 0], i3 = [0, 0], [a4, o3] = de2(t5, t5.head.ry * this.rig.brow), s3 = (e4) => e4 > 0 ? Math.min(1, e4) * a4 : Math.max(-1, e4) * o3, c3 = [s3(e3.browLY), s3(e3.browRY)], l3 = Math.min(1, Math.max(0, e3.mouthOpen)), u2 = 0;
      this.mouthW.forEach((e4, t6) => {
        e4 > 0 && this.frameJaw[t6] > 0 && (u2 += e4 * this.frameJaw[t6] * (this.frameKind[t6] === `half` ? 0.6 + 0.4 * this.frameEase(t6, l3) : 0.75 + 0.25 * this.frameEase(t6, l3)));
      });
      let d2 = [0, 0], f3 = !!this.rig.hair.side, p3 = (a5, o4, s4, c4, l4, u3, p4) => {
        s4 < 1 ? this.bodyOffset(a5, o4, e3, i3) : (i3[0] = 0, i3[1] = 0);
        let m4 = a5 + i3[0], h4 = o4 + i3[1];
        if (s4 > 0 && (this.headXform(a5, o4, c4, e3, r3), m4 = m4 * (1 - s4) + (r3[0] + n4[0]) * s4, h4 = h4 * (1 - s4) + (r3[1] + n4[1]) * s4), (l4 > 0 || u3 > 0) && f3) {
          let e4 = this.chains.back, n5 = this.chains.front, r4 = this.chains.side, i4 = n(fe2[0], fe2[1], Math.abs(a5 - t5.head.cx) / t5.head.rx), o5 = p4 * (1 - i4), s5 = p4 * i4, c5 = n5[0].x * o5 + r4[0].x * s5 + e4[0].x * (1 - p4), d3 = n5[0].y * o5 + r4[0].y * s5 + e4[0].y * (1 - p4), f4 = n5[1].x * o5 + r4[1].x * s5 + e4[1].x * (1 - p4), g4 = n5[1].y * o5 + r4[1].y * s5 + e4[1].y * (1 - p4);
          m4 += c5 * l4 + f4 * u3, h4 += d3 * l4 + g4 * u3;
        } else if (l4 > 0 || u3 > 0) {
          let e4 = this.chains.back, t6 = this.chains.front, n5 = t6[0].x * p4 + e4[0].x * (1 - p4), r4 = t6[0].y * p4 + e4[0].y * (1 - p4), i4 = t6[1].x * p4 + e4[1].x * (1 - p4), a6 = t6[1].y * p4 + e4[1].y * (1 - p4);
          m4 += n5 * l4 + i4 * u3, h4 += r4 * l4 + a6 * u3;
        }
        d2[0] = m4, d2[1] = h4;
      }, m3 = [0, 0], h3 = this.kfOff ? [] : this.keyWeights ?? this.keys.map((t6) => t6.param === `diag` ? 0 : Math.min(2, Math.max(0, e3[t6.param] * t6.scale / t6.value)));
      if (this.kfPair && !this.kfOff && !this.keyWeights) {
        let e4 = h3.slice();
        for (let t6 = 0; t6 < e4.length; t6++) {
          let n5 = this.kfPair[t6];
          if (n5 < 0 || e4[t6] <= 0 || e4[t6] >= 1) continue;
          let r4 = e4[t6], i4 = r4 * r4 * r4 - 2 * r4 * r4 + r4;
          h3[t6] = 3 * r4 * r4 - 2 * r4 * r4 * r4 + 0.5 * i4 + r4 * r4 * r4 - r4 * r4, h3[n5] -= 0.5 * i4;
        }
      }
      let g3 = e3.angleZ * Math.PI / 180 * this.rig.roll * this.tuning.turn, _3 = this.tuning.gaze, v3 = typeof _3 == `number` && _3 >= 0 && _3 < 1 ? _3 : 1, y3 = 0;
      if (this.rig.neck) {
        let a5 = t5.jaw?.chin ?? t5.neck_y;
        this.headXform(t5.head.cx, a5, 0, e3, r3), this.bodyOffset(t5.head.cx, a5, e3, i3), y3 = r3[0] + n4[0] - (t5.head.cx + i3[0]);
      }
      let b3 = B2(this.bangsDepth, this.tuning.fringe);
      for (let i4 of this.layers) {
        if (this.fbParts = !!this.fb && i4.def.group === `body`, !this.kfOff && !this.shown(i4)) continue;
        let a5 = i4.def, o4 = i4.rest, s4 = i4.out, l4 = a5.group === `hair_front` ? B2(a5.depth, this.tuning.fringe) : 1;
        i4.uploaded = false;
        let f4 = o4.length / 2, _4 = a5.role || ``, x3 = _4.endsWith(`_L`) ? `L` : _4.endsWith(`_R`) ? `R` : ``, S3 = _4.startsWith(`eye_`) || _4.startsWith(`iris_`) || _4.startsWith(`shine_`), C3 = 0.12 + 0.88 * (x3 === `L` ? e3.eyeLOpen : x3 === `R` ? e3.eyeROpen : 1), w3 = _4.startsWith(`iris_`), T3 = 0, E3 = 0;
        w3 && a5.range && (T3 = e3.eyeBallX * a5.range[0] * v3, E3 = -e3.eyeBallY * a5.range[1] * v3), this.chained && _4.startsWith(`shine_`) && a5.range && (T3 = e3.eyeBallX * a5.range[0] * v3, E3 = -e3.eyeBallY * a5.range[1] * v3);
        let D3 = T3, O3 = 0, k3 = this.irisNasal && T3 !== 0 ? this.nasal[x3] : void 0;
        k3 && T3 * k3.sign > k3.room && (O3 = -(Math.min(T3 * k3.sign, k3.room + (1 - this.irisNasalNarrow) * k3.w) - k3.room) / k3.w, D3 = k3.sign * k3.room - O3 * k3.inner);
        let A3 = w3 && this.irisLid && !!a5.pivot && !!a5.range && (a5.range[0] > 0 || a5.range[1] > 0);
        A3 && (E3 += this.irisDrop * (1 - C3) * ((i4.pivC ?? a5.pivot[1]) - (a5.y + a5.h / 2))), w3 && (i4.soft = Math.min(1, Math.hypot(T3, E3) + (A3 ? (1 - C3) * a5.h / 2 : 0)));
        let j2 = this.chained && _4.startsWith(`shine_`) ? ge2(this.time + (x3 === `R` ? 1.3 : 0)) : 1, M3 = a5.x + a5.w / 2, N2 = a5.y + a5.h / 2, P2 = 0, F2 = 0;
        a5.rigid && (this.headXform(a5.rigid[0], a5.rigid[1], a5.depth, e3, r3), P2 = r3[0] + n4[0], F2 = r3[1] + n4[1]);
        let I2 = Math.cos(g3), L3 = Math.sin(g3);
        for (let e4 = 0; e4 < f4; e4++) {
          let r4 = o4[2 * e4], f5 = o4[2 * e4 + 1];
          if (j2 !== 1 && (r4 = M3 + (r4 - M3) * j2, f5 = N2 + (f5 - N2) * j2), S3 && a5.pivot) {
            let t6 = i4.pivY ? i4.pivY[e4] : a5.pivot[1];
            r4 += D3 + O3 * o4[2 * e4], f5 += E3, (!A3 || f5 > t6) && (f5 = t6 + (f5 - t6) * C3);
          }
          if (i4.browSide[e4] >= 0) {
            let t6 = c3[i4.browSide[e4]];
            f5 -= Math.sign(t6) * Math.min(Math.abs(t6), i4.browCap[e4]) * i4.wBrow[e4];
          }
          if (u2 > 0 && i4.wJaw[e4] > 0 && (f5 += u2 * i4.wJaw[e4]), a5.rigid) {
            let e5 = r4 - a5.rigid[0], t6 = f5 - a5.rigid[1];
            d2[0] = P2 + e5 * I2 - t6 * L3, d2[1] = F2 + e5 * L3 + t6 * I2;
          } else p3(r4, f5, i4.wHead[e4], l4 === 1 ? i4.dep[e4] : i4.dep[e4] * l4, i4.wPhys1[e4], i4.wPhys2[e4], i4.wFront[e4]);
          i4.skin && (this.skinOffset(i4.skin, e4, m3), d2[0] += m3[0], d2[1] += m3[1]);
          let _5 = d2[0], v4 = d2[1];
          if (i4.wTwist && i4.wTwist[e4] > 0 && (_5 += y3 * i4.wTwist[e4]), i4.wNeck && i4.wNeck[e4] > 0) {
            let r5 = g3 * i4.wNeck[e4], a6 = Math.cos(r5), o5 = Math.sin(r5), s5 = t5.head.cx + n4[0], c4 = t5.neck_y + n4[1], l5 = _5 - s5, u3 = v4 - c4;
            _5 = s5 + l5 * a6 - u3 * o5, v4 = c4 + l5 * o5 + u3 * a6;
          }
          let x4 = i4.fol ? i4.fol[e4] : 0, w4 = i4.folB ? i4.folB[e4] : 0;
          if (x4 > 0 || w4 > 0) {
            let t6 = 5 * e4, n5 = i4.alt, a6 = _5, o5 = v4;
            p3(r4, f5, n5[t6 + 1], b3 === 1 ? n5[t6] : n5[t6] * b3, n5[t6 + 2], n5[t6 + 3], n5[t6 + 4]), i4.altSkin && (this.skinOffset(i4.altSkin, e4, m3), d2[0] += m3[0], d2[1] += m3[1]), _5 += (d2[0] - a6) * x4, v4 += (d2[1] - o5) * x4, i4.outB && (i4.outB[2 * e4] = a6 + (d2[0] - a6) * w4, i4.outB[2 * e4 + 1] = o5 + (d2[1] - o5) * w4);
          } else i4.outB && (i4.outB[2 * e4] = _5, i4.outB[2 * e4 + 1] = v4);
          if (i4.kf) {
            let t6 = 0, n5 = 0;
            for (let r5 = 0; r5 < h3.length; r5++) {
              let a6 = i4.kf[r5];
              a6 && h3[r5] !== 0 && (t6 += h3[r5] * a6[2 * e4], n5 += h3[r5] * a6[2 * e4 + 1]);
            }
            if (t6 !== 0 || n5 !== 0) {
              let r5 = g3 * i4.wHead[e4], a6 = Math.cos(r5), o5 = Math.sin(r5), s5 = t6 * a6 - n5 * o5, c4 = t6 * o5 + n5 * a6;
              _5 += s5, v4 += c4, i4.outB && (i4.outB[2 * e4] += s5, i4.outB[2 * e4 + 1] += c4);
            }
          }
          s4[2 * e4] = _5, s4[2 * e4 + 1] = v4;
        }
      }
    }
    drawLayer(e3, t5, n4, r3, i3 = 0) {
      let a4 = this.gl;
      a4.bindBuffer(a4.ARRAY_BUFFER, e3.pos), r3 ? (a4.bufferSubData(a4.ARRAY_BUFFER, 0, r3), e3.uploaded = false) : e3.uploaded ||= (a4.bufferSubData(a4.ARRAY_BUFFER, 0, e3.out), true), a4.bindTexture(a4.TEXTURE_2D, t5), a4.uniform1f(this.uAlpha, n4), a4.uniform1f(this.uCut, i3), a4.bindVertexArray(e3.vao), a4.drawElements(a4.TRIANGLES, e3.count, a4.UNSIGNED_INT, 0);
    }
    drawMasks(e3, t5, n4, r3, i3, a4) {
      let o3 = this.gl, s3 = [];
      for (let e4 of this.layers) e4.maskCh = -1;
      for (let e4 of this.softIris ? this.layers : []) {
        let t6 = e4.def.clip ? this.byId.get(e4.def.clip) : void 0;
        !(e4.def.role || ``).startsWith(`iris_`) || !t6?.mask || !(e4.soft > 0) || t6.maskCh >= 0 || s3.length >= 4 || this.hidden.has(e4.def.id) || this.hidden.has(t6.def.id) || (t6.maskCh = s3.length, s3.push(t6));
      }
      if (!s3.length) return;
      let c3 = 1 / 0, l3 = 1 / 0, u2 = -1 / 0, d2 = -1 / 0;
      for (let o4 of s3) for (let s4 = 0; s4 < o4.out.length; s4 += 2) {
        let f3 = (o4.out[s4] * n4 + i3 + 1) * e3 / 2, p3 = (1 - (o4.out[s4 + 1] * r3 + a4)) * t5 / 2;
        c3 = Math.min(c3, f3), u2 = Math.max(u2, f3), l3 = Math.min(l3, p3), d2 = Math.max(d2, p3);
      }
      if (c3 = Math.max(0, Math.floor(c3) - 2), l3 = Math.max(0, Math.floor(l3) - 2), u2 = Math.min(e3, Math.ceil(u2) + 2), d2 = Math.min(t5, Math.ceil(d2) + 2), u2 <= c3 || d2 <= l3) for (let e4 of s3) e4.maskCh = -1;
      else {
        if (o3.activeTexture(o3.TEXTURE1), o3.bindTexture(o3.TEXTURE_2D, null), o3.activeTexture(o3.TEXTURE0), !this.maskFb || u2 - c3 > this.maskSize[0] || d2 - l3 > this.maskSize[1]) {
          let e4 = Math.max(this.maskSize[0], Math.ceil((u2 - c3) / 64) * 64), t6 = Math.max(this.maskSize[1], Math.ceil((d2 - l3) / 64) * 64);
          this.maskTex ||= o3.createTexture(), o3.bindTexture(o3.TEXTURE_2D, this.maskTex), o3.texImage2D(o3.TEXTURE_2D, 0, o3.RGBA8, e4, t6, 0, o3.RGBA, o3.UNSIGNED_BYTE, null), o3.texParameteri(o3.TEXTURE_2D, o3.TEXTURE_MIN_FILTER, o3.NEAREST), o3.texParameteri(o3.TEXTURE_2D, o3.TEXTURE_MAG_FILTER, o3.NEAREST), this.maskFb ||= o3.createFramebuffer(), o3.bindFramebuffer(o3.FRAMEBUFFER, this.maskFb), o3.framebufferTexture2D(o3.FRAMEBUFFER, o3.COLOR_ATTACHMENT0, o3.TEXTURE_2D, this.maskTex, 0), this.maskSize = [e4, t6];
        }
        o3.bindFramebuffer(o3.FRAMEBUFFER, this.maskFb), o3.viewport(-c3, -l3, e3, t5), o3.clearColor(0, 0, 0, 0), o3.clear(o3.COLOR_BUFFER_BIT), o3.disable(o3.BLEND), o3.uniform1i(this.uMode, 1), s3.forEach((e4, t6) => {
          o3.colorMask(t6 === 0, t6 === 1, t6 === 2, t6 === 3), this.drawLayer(e4, e4.mask, 1);
        }), o3.colorMask(true, true, true, true), o3.uniform1i(this.uMode, 0), o3.enable(o3.BLEND), o3.bindFramebuffer(o3.FRAMEBUFFER, null), o3.viewport(0, 0, e3, t5), o3.activeTexture(o3.TEXTURE1), o3.bindTexture(o3.TEXTURE_2D, this.maskTex), o3.activeTexture(o3.TEXTURE0), o3.uniform2i(this.uMaskOff, c3, l3);
      }
    }
    render() {
      let e3 = this.gl, t5 = this.canvas, n4 = Math.min(this.maxDpr, window.devicePixelRatio || 1), [r3, i3] = this.size ?? [Math.round(t5.clientWidth * n4), Math.round(t5.clientHeight * n4)];
      (t5.width !== r3 || t5.height !== i3) && (t5.width = r3, t5.height = i3), e3.viewport(0, 0, r3, i3);
      let a4 = () => {
        e3.clearColor(...this.background), e3.clearStencil(0), e3.clear(e3.COLOR_BUFFER_BIT | e3.STENCIL_BUFFER_BIT);
      };
      if (!this.model) {
        a4();
        return;
      }
      e3.useProgram(this.prog), e3.enable(e3.BLEND), e3.blendFunc(e3.ONE, e3.ONE_MINUS_SRC_ALPHA), e3.activeTexture(e3.TEXTURE0), e3.uniform1i(this.uTex, 0), e3.uniform1i(this.uMode, 0);
      let [o3, s3] = this.model.canvas, c3 = this.view, l3 = this.move, u2 = this.model.anchors, d2 = u2.head, f3 = u2.frame ? C(this.focusHead ? `frame` : this.fit, u2, this.model.canvas, this.fb) : null, p3 = f3 ? f3[2] - f3[0] : o3, m3 = f3 ? f3[3] - f3[1] : s3, h3 = f3 ? f3[0] + f3[2] : o3, g3 = f3 ? f3[1] + f3[3] : s3, v3 = (e4, t6) => (this.focusHead ? -(d2.cy + d2.ry * 0.15) * (2 * e4) / i3 : -g3 * e4 / i3) + this.panY - 2 * t6, y3 = (e4, t6) => -(2 * e4 * s3 / i3 + t6), b3 = Math.min(r3 / p3, i3 / m3) * this.zoom, x3 = b3 * c3.s * l3.s, S3 = 2 * x3 / r3, C3 = 2 * x3 / i3, w3 = v3(x3, c3.y + l3.y);
      if (this.cutBottom) {
        let e4 = Math.max(y3(b3 * c3.s, v3(b3 * c3.s, c3.y)), -1);
        w3 += Math.max(0, y3(x3, w3) - e4);
      }
      this.fb && !f3 && !this.focusHead && l3.s !== 1 && (w3 += (s3 - 2 * this.fb.groundY) * (x3 - b3 * c3.s) / i3);
      let T3 = (this.focusHead ? -d2.cx * S3 : -h3 * x3 / r3) + 2 * (c3.x + (this.fb ? 0 : l3.x));
      e3.uniform4f(this.uView, S3, C3, T3, w3), this.drawMasks(r3, i3, S3, C3, T3, w3), a4(), this.lastView = [S3, C3, T3, w3, r3, i3], this.anchorModel = this.model;
      let E3 = this.params, D3 = (e4) => {
        let t6 = Math.min(1, Math.max(0, E3.mouthOpen)), n5 = this.mouthFrame, r4 = e4.def.pivot ? e4.def.pivot[1] : e4.def.y, i4 = this.frameKind[n5] === `half` ? 0.88 + 0.12 * this.frameEase(n5, t6) : 0.9 + 0.1 * this.frameEase(n5, t6), a5;
        if (n5 > 0 && n5 !== this.vis.shut) {
          a5 = e4.out.slice();
          let t7 = this.chinFollow ? e4.wJaw : void 0;
          for (let n6 = 1; n6 < a5.length; n6 += 2) a5[n6] += (e4.rest[n6] - r4) * (i4 - 1) * (t7 ? 1 - t7[n6 >> 1] : 1);
        }
        this.drawLayer(e4, e4.frames[n5], 1, a5);
      }, O3 = this.talkLeft > 0 ? this.layers.findLastIndex((e4) => e4.def.role === `expr`) : -1, k3 = (e4) => this.exprAlpha(e4), A3 = null, j2 = this.layers.findLastIndex((e4) => e4.def.id === `brows` || e4.def.role === `expr_brows`), M3 = j2 < 0, N2 = () => {
        if (M3 = true, !this.headHidden) {
          for (let e4 of this.layers) if (e4.browTex && e4.def.role === `expr` && !this.hidden.has(e4.def.id) && (!this.only || this.only(e4.def))) {
            let t6 = k3(e4.def);
            t6 > 0.01 && this.drawLayer(e4, e4.browTex, t6, e4.outB);
          }
        }
      }, P2 = 0;
      for (let t6 = 0; t6 < this.layers.length; t6++) {
        let n5 = this.layers[t6], r4 = n5.def, i4 = r4.role || ``;
        if (A3 && t6 > O3 && (D3(A3), A3 = null), !M3 && t6 > j2 && N2(), this.hidden.has(r4.id) || (r4.group === `body` ? this.bodyHidden : this.headHidden) || this.only && !this.only(r4) || (i4 === `hole` || i4 === `edge` || i4 === `edge_wide`) && !this.masks) continue;
        if (i4 === `mouth` && n5.frames.length >= 3) {
          t6 < O3 ? A3 = n5 : D3(n5);
          continue;
        }
        if (i4 === `expr`) {
          let e4 = k3(r4);
          e4 > 0.01 && this.drawLayer(n5, this.talkLeft > 0 && n5.talk ? n5.talk : n5.tex, e4);
          continue;
        }
        if (i4 === `expr_brows`) {
          let e4 = k3(r4);
          e4 > 0.01 && this.drawLayer(n5, n5.tex, e4);
          continue;
        }
        if (r4.id === `brows`) {
          let e4 = 0;
          for (let t7 of this.layers) t7.def.role === `expr` && t7.def.brows === `redrawn` && !this.hidden.has(t7.def.id) && (e4 = Math.max(e4, k3(t7.def)));
          e4 < 0.99 && this.drawLayer(n5, n5.tex, 1 - e4);
          continue;
        }
        if (i4.startsWith(`lid_`)) {
          let e4 = i4 === `lid_L` ? E3.eyeLOpen : E3.eyeROpen, t7 = 1 - n(0.05, 0.35, e4);
          t7 > 0.01 && this.drawLayer(n5, n5.tex, t7);
          continue;
        }
        if (i4.startsWith(`eye_`)) {
          let t7 = i4 === `eye_L` ? E3.eyeLOpen : E3.eyeROpen;
          this.drawLayer(n5, n5.tex, n(0.02, 0.2, t7)), n5.stencilRef = 0, n5.mask && n5.maskCh < 0 && (P2 = P2 % 250 + 1, n5.stencilRef = P2, e3.enable(e3.STENCIL_TEST), e3.stencilFunc(e3.ALWAYS, P2, 255), e3.stencilOp(e3.KEEP, e3.KEEP, e3.REPLACE), e3.colorMask(false, false, false, false), this.drawLayer(n5, n5.mask, 1, void 0, 0.5), e3.colorMask(true, true, true, true), e3.disable(e3.STENCIL_TEST));
          continue;
        }
        if (i4 === `blush`) {
          let e4 = 0;
          for (let [t7, n6] of Object.entries(r4.blush || {})) e4 += n6 * this.exprValue(t7);
          e4 > 0.01 && this.drawLayer(n5, n5.tex, Math.min(1, e4));
          continue;
        }
        if (i4.startsWith(`iris_`) || i4.startsWith(`shine_`)) {
          let t7 = r4.clip ? this.byId.get(r4.clip) : void 0, a6 = i4.endsWith(`_L`) ? E3.eyeLOpen : E3.eyeROpen;
          if (t7 && t7.maskCh >= 0) {
            let r5 = t7.maskCh;
            e3.uniform1i(this.uMode, 2), e3.uniform4f(this.uMaskSel, +(r5 === 0), +(r5 === 1), +(r5 === 2), +(r5 === 3)), e3.uniform1f(this.uSoft, n5.soft), this.drawLayer(n5, n5.tex, n(0.02, 0.2, a6)), e3.uniform1i(this.uMode, 0);
          } else t7 && t7.stencilRef && (e3.enable(e3.STENCIL_TEST), e3.stencilFunc(e3.EQUAL, t7.stencilRef, 255), e3.stencilOp(e3.KEEP, e3.KEEP, e3.KEEP), this.drawLayer(n5, n5.tex, n(0.02, 0.2, a6)), e3.disable(e3.STENCIL_TEST));
          continue;
        }
        let a5 = r4.show || r4.hide ? this.moodAlpha(r4) : 1;
        a5 > 0.01 && this.drawLayer(n5, n5.tex, a5);
      }
      A3 && D3(A3), M3 || N2(), e3.bindVertexArray(null);
    }
    anchor(e3) {
      if (!this.model || this.anchorModel !== this.model) return null;
      let t5 = this.model.anchors, n4 = this.params, r3 = t5.head, i3 = e3 === `head` ? r3.cx : t5.chest?.cx ?? r3.cx, a4 = e3 === `head` ? r3.cy : t5.chest?.cy ?? (t5.neck_y + (this.fb ? this.fb.hy : t5.bottom_y)) / 2, o3 = e3 === `head` ? r3.rx : r3.rx * 1.5, s3 = [0, 0];
      e3 === `head` && this.bodyOffset(r3.cx, t5.neck_y, n4, s3);
      let c3 = (t6) => {
        let r4 = [0, 0];
        e3 === `head` ? (this.headXform(t6, a4, 0, n4, r4), r4[0] += s3[0], r4[1] += s3[1]) : (this.bodyOffset(t6, a4, n4, r4), r4[0] += t6, r4[1] += a4);
        let [i4, o4, c4, l4] = this.lastView;
        return [(r4[0] * i4 + c4 + 1) / 2, (r4[1] * o4 + l4 + 1) / 2];
      }, [, , , , l3, u2] = this.lastView;
      return e2(c3(i3), c3(i3 + o3), u2 / l3);
    }
    canvasToModel(e3, t5) {
      let [n4, r3, i3, a4, o3, s3] = this.lastView, c3 = this.canvas, l3 = 2 * e3 * (o3 / Math.max(1, c3.clientWidth)) / o3 - 1, u2 = 2 * t5 * (s3 / Math.max(1, c3.clientHeight)) / s3 - 1;
      return [(l3 - i3) / n4, (u2 - a4) / r3];
    }
    poke(e3, t5, n4 = 1) {
      let r3 = 0;
      for (let i3 of this.chainRuns) {
        let a4 = i3.R, o3 = a4.length / 2, s3 = 1.5 * (i3.def.sigma ?? 40) + 20, c3 = 1 / 0;
        for (let n5 = 0; n5 < o3; n5++) c3 = Math.min(c3, Math.hypot(a4[2 * n5] - e3, a4[2 * n5 + 1] - t5));
        if (c3 > s3) continue;
        r3++;
        let l3 = e3 < a4[0] ? 1 : -1;
        for (let e4 = 1; e4 < o3; e4++) {
          let t6 = (1 - c3 / s3) * i3.s[e4] * 9 * n4;
          i3.q[2 * e4] -= l3 * t6, i3.q[2 * e4 + 1] += t6 * 0.3;
        }
      }
      return r3;
    }
    resetPhysics() {
      for (let e3 of this.chainRuns) e3.p.set(e3.R), e3.q.set(e3.R), e3.disp.fill(0), e3.beta.fill(0), e3.started = false, e3.moving = false;
      for (let e3 of Object.values(this.chains)) for (let t5 of e3) Object.assign(t5, U2());
      this.lastHead = { x: 0, y: 0, roll: 0 }, this.drive.started = false, this.body = { yaw: 0, roll: 0 }, this.bust = { x: 0, y: 0, vx: 0, vy: 0, px: 0, py: 0 }, this.fbm = { hs: 0, hv: 0, tilt: 0, tanTilt: 0, hem: 0, hemV: 0, breath: 0 }, this.crouch = 0, this.dip = 0, this.pv.roll = NaN;
    }
    snapshot() {
      return this.canvas.toDataURL(`image/png`);
    }
  };
  function me2(e3) {
    let t5 = (e4, t6, n5) => Number.isInteger(e4) && e4 >= t6 && e4 <= n5;
    if (e3?.version !== 1 || !t5(e3.cols, 2, 4096) || !t5(e3.rows, 2, 4096) || e3.cols * e3.rows > 2 ** 22 || ![e3.cell, e3.units, e3.turn, e3.nod].every((e4) => typeof e4 == `number` && Number.isFinite(e4) && e4 > 0) || !Array.isArray(e3.keys) || e3.keys.length > 32) return false;
    let n4 = (e4) => Math.ceil(e4 / 3) * 4, r3 = n4(e3.cols * e3.rows * 4), i3 = n4(e3.cols * e3.rows);
    for (let t6 of e3.keys) if (!t6 || ![`angleX`, `angleY`, `diag`].includes(t6.param) || !Number.isFinite(t6.value) || t6.param !== `diag` && !t6.value || !t6.fields || typeof t6.fields != `object` || Object.values(t6.fields).some((e4) => typeof e4 != `string` || e4.length !== r3) || t6.same !== void 0 && !(Array.isArray(t6.same) && t6.same.every((e4) => typeof e4 == `string`))) return false;
    return Object.values(e3.mask || {}).every((e4) => typeof e4 == `string` && e4.length === i3);
  }
  function he2(e3) {
    let t5 = e3.points.length, n4 = new Float32Array(e3.points.flat()), r3 = new Float32Array(t5), i3 = new Float32Array(t5);
    for (let e4 = 1; e4 < t5; e4++) r3[e4] = Math.hypot(n4[2 * e4] - n4[2 * e4 - 2], n4[2 * e4 + 1] - n4[2 * e4 - 1]), i3[e4] = i3[e4 - 1] + r3[e4];
    let a4 = i3[t5 - 1] || 1;
    for (let e4 = 1; e4 < t5; e4++) i3[e4] /= a4;
    let o3 = 0;
    for (let t6 of e3.id) o3 = (o3 * 31 + t6.charCodeAt(0)) % 997;
    return { def: e3, R: n4, p: n4.slice(), q: n4.slice(), len: r3, s: i3, disp: new Float32Array(2 * t5), beta: new Float32Array(t5), W: [0, 0], V: [0, 0], acc: [0, 0], rho: 0, started: false, phase: o3 / 997 * 2 * Math.PI, moving: false };
  }
  function ge2(e3) {
    let t5 = Math.floor(e3 / 5.3), n4 = e3 - t5 * 5.3 - t5 * 7919 % 13 / 13 * 3.5, r3 = n4 > 0 && n4 < 0.35 ? Math.sin(n4 / 0.35 * Math.PI) : 0;
    return 1 + 0.03 * Math.sin(e3 * 2.1) + 0.12 * r3;
  }
  function _e2(e3) {
    let [t5, n4 = ``] = e3.split(`?`), r3 = t5.endsWith(`.json`) ? t5 : (t5.endsWith(`/`) ? t5 : t5 + `/`) + `model.json`;
    return { file: r3, base: r3.slice(0, r3.lastIndexOf(`/`) + 1), query: n4 };
  }
  function ve2(e3, t5) {
    let { base: n4, query: r3 } = _e2(e3);
    return n4 + `textures.bin?v=${t5}${r3 ? `&${r3}` : ``}`;
  }
  async function ye2(e3, t5) {
    try {
      let n4 = await fetch(e3, { signal: t5 });
      if (!n4.ok) return null;
      let r3 = await n4.arrayBuffer(), i3 = new DataView(r3).getUint32(0, true), a4 = JSON.parse(new TextDecoder().decode(new Uint8Array(r3, 4, i3)));
      return new Map(Object.entries(a4).filter((e4) => Array.isArray(e4[1])).map(([e4, [t6, n5]]) => [e4, new Blob([new Uint8Array(r3, 4 + i3 + t6, n5)], { type: e4.endsWith(`.png`) ? `image/png` : `image/webp` })]));
    } catch (e4) {
      if (t5?.aborted) throw e4;
      return null;
    }
  }
  function be2(e3) {
    let t5 = URL.createObjectURL(e3);
    return Se2(t5).finally(() => URL.revokeObjectURL(t5));
  }
  async function xe2(e3, t5) {
    let n4;
    try {
      let r3 = await fetch(e3, { signal: t5 });
      if (!r3.ok) throw Error();
      n4 = await r3.blob();
    } catch (n5) {
      throw t5.aborted ? n5 : Error(`image ` + e3);
    }
    return be2(n4);
  }
  function Se2(e3) {
    return new Promise((t5, n4) => {
      let r3 = new Image();
      r3.crossOrigin = `anonymous`, r3.onload = () => t5(r3), r3.onerror = () => n4(/* @__PURE__ */ Error(`image ` + e3)), r3.src = e3;
    });
  }
  function Ce2(e3, t5, n4, r3) {
    let i3 = Math.min(t5.cols - 1.001, Math.max(0, n4 / t5.cell)), a4 = Math.min(t5.rows - 1.001, Math.max(0, r3 / t5.cell)), o3 = Math.floor(i3), s3 = Math.floor(a4), c3 = i3 - o3, l3 = a4 - s3, u2 = (n5, r4, i4) => e3[2 * (r4 * t5.cols + n5) + i4], d2 = (e4) => (u2(o3, s3, e4) * (1 - c3) + u2(o3 + 1, s3, e4) * c3) * (1 - l3) + (u2(o3, s3 + 1, e4) * (1 - c3) + u2(o3 + 1, s3 + 1, e4) * c3) * l3;
    return [d2(0) * t5.units, d2(1) * t5.units];
  }
  function we(e3, t5, n4, r3) {
    let i3 = Math.min(t5.cols - 1.001, Math.max(0, n4 / t5.cell)), a4 = Math.min(t5.rows - 1.001, Math.max(0, r3 / t5.cell)), o3 = Math.floor(i3), s3 = Math.floor(a4), c3 = i3 - o3, l3 = a4 - s3, u2 = (n5, r4) => e3[r4 * t5.cols + n5];
    return ((u2(o3, s3) * (1 - c3) + u2(o3 + 1, s3) * c3) * (1 - l3) + (u2(o3, s3 + 1) * (1 - c3) + u2(o3 + 1, s3 + 1) * c3) * l3) / 255;
  }
  function Te(e3, t5, n4, r3, i3, a4) {
    let o3 = document.createElement(`canvas`);
    o3.width = t5.w, o3.height = t5.h;
    let s3 = o3.getContext(`2d`, { willReadFrequently: true });
    s3.drawImage(e3, 0, 0, t5.w, t5.h);
    let c3 = s3.getImageData(0, 0, t5.w, t5.h).data;
    s3.clearRect(0, 0, t5.w, t5.h), s3.drawImage(n4, r3.x - t5.x, r3.y - t5.y, r3.w, r3.h);
    let l3 = s3.getImageData(0, 0, t5.w, t5.h).data, u2 = new Float32Array(i3.length / 2);
    for (let e4 = 0; e4 < u2.length; e4++) {
      let n5 = i3[2 * e4] - t5.x, r4 = i3[2 * e4 + 1] - t5.y, o4 = 0, s4 = 0, d2 = 0, f3 = 0;
      for (let e5 = Math.max(0, Math.round(r4 - a4)); e5 < Math.min(t5.h, Math.round(r4 + a4)); e5++) for (let r5 = Math.max(0, Math.round(n5 - a4)); r5 < Math.min(t5.w, Math.round(n5 + a4)); r5++) {
        let n6 = 4 * (e5 * t5.w + r5) + 3, i4 = c3[n6] / 255, a5 = l3[n6] / 255;
        o4 += i4, s4 += i4 * a5, d2 += a5, f3++;
      }
      u2[e4] = o4 > 1 ? s4 / o4 : f3 ? d2 / f3 : 0;
    }
    return u2;
  }
  function Ee(e3) {
    let t5 = e3.profile, n4 = t5?.class?.input;
    return !!t5 && (t5.id === `anime_half` || t5.id === `painterly`) && n4?.facing === `front` && n4.glasses !== true && !e3.layers.some((e4) => e4.id === `glasses`);
  }
  function De(e3, t5, n4, r3, i3) {
    let a4 = (e4) => {
      let t6 = e4.naturalWidth || e4.width, n5 = e4.naturalHeight || e4.height, r4 = document.createElement(`canvas`);
      r4.width = t6, r4.height = n5;
      let i4 = r4.getContext(`2d`, { willReadFrequently: true });
      return i4.drawImage(e4, 0, 0), { w: t6, h: n5, d: i4.getImageData(0, 0, t6, n5).data };
    }, o3 = a4(e3), s3 = a4(n4), c3 = t5.w / o3.w, l3 = t5.h / o3.h, u2 = (e4, t6) => {
      let n5 = Math.floor((e4 - r3.x) / r3.w * s3.w), i4 = Math.floor((t6 - r3.y) / r3.h * s3.h);
      return n5 >= 0 && i4 >= 0 && n5 < s3.w && i4 < s3.h && s3.d[4 * (i4 * s3.w + n5) + 3] >= 128;
    }, d2 = [];
    for (let e4 = 0; e4 < o3.h; e4++) {
      let n5 = t5.y + (e4 + 0.5) * l3, r4 = 0, a5 = 1 / 0, s4 = -1 / 0;
      for (let i4 = 0; i4 < o3.w; i4++) {
        let l4 = t5.x + (i4 + 0.5) * c3;
        o3.d[4 * (e4 * o3.w + i4) + 3] < 200 || !u2(l4, n5) || (r4++, a5 = Math.min(a5, l4), s4 = Math.max(s4, l4));
      }
      r4 && d2.push([n5, r4, i3 > 0 ? s4 : a5, i3 > 0 ? a5 : s4]);
    }
    if (!d2.length) return null;
    let f3 = Math.max(...d2.map((e4) => e4[1])), p3 = [], m3 = [], h3 = [];
    for (let [e4, t6, n5, r4] of d2) {
      if (t6 < 0.9 * f3) continue;
      let a5 = 0;
      for (; u2(n5 + i3 * (a5 + 1) * c3, e4); ) a5++;
      p3.push(a5 * c3), m3.push(n5 + i3 * c3 / 2), h3.push(Math.abs(n5 - r4) + c3);
    }
    let g3 = (e4) => e4.sort((e5, t6) => e5 - t6)[e4.length >> 1];
    return { room: g3(p3), sign: i3, inner: g3(m3), w: g3(h3) };
  }
  function Oe(e3, t5) {
    let n4 = e3.naturalWidth || e3.width, r3 = e3.naturalHeight || e3.height, i3 = document.createElement(`canvas`);
    i3.width = n4, i3.height = r3;
    let a4 = i3.getContext(`2d`, { willReadFrequently: true });
    a4.drawImage(e3, 0, 0);
    let o3 = a4.getImageData(0, 0, n4, r3).data, s3 = Array(n4).fill(NaN);
    for (let e4 = 0; e4 < n4; e4++) {
      let t6 = 255, i4 = -1;
      for (let a5 = 0; a5 < r3; a5++) {
        let r4 = 4 * (a5 * n4 + e4);
        if (o3[r4 + 3] < 200) continue;
        let s4 = 0.3 * o3[r4] + 0.59 * o3[r4 + 1] + 0.11 * o3[r4 + 2];
        s4 < t6 && (t6 = s4, i4 = a5);
      }
      i4 >= 0 && t6 < 110 && (s3[e4] = i4);
    }
    if (s3.filter((e4) => !Number.isNaN(e4)).length < 0.2 * n4) return null;
    let c3 = [];
    s3.forEach((e4, i4) => {
      Number.isNaN(e4) || c3.push([t5.x + (i4 + 0.5) * (t5.w / n4), t5.y + (e4 + 0.5) * (t5.h / r3)]);
    });
    let l3 = (e4) => {
      let t6 = e4.reduce((e5, t7) => e5 + t7[0], 0) / e4.length, n5 = Math.max(1, (e4[e4.length - 1][0] - e4[0][0]) / 2), r4 = [, , , , ,].fill(0), i4 = [0, 0, 0];
      for (let [a6, o5] of e4) {
        let e5 = (a6 - t6) / n5, s5 = 1;
        for (let t7 = 0; t7 < 5; t7++) r4[t7] += s5, t7 < 3 && (i4[t7] += s5 * o5), s5 *= e5;
      }
      let a5 = [[r4[0], r4[1], r4[2]], [r4[1], r4[2], r4[3]], [r4[2], r4[3], r4[4]]], o4 = (e5) => e5[0][0] * (e5[1][1] * e5[2][2] - e5[1][2] * e5[2][1]) - e5[0][1] * (e5[1][0] * e5[2][2] - e5[1][2] * e5[2][0]) + e5[0][2] * (e5[1][0] * e5[2][1] - e5[1][1] * e5[2][0]), s4 = o4(a5);
      if (!(Math.abs(s4) > 1e-9)) return null;
      let c4 = [0, 1, 2].map((e5) => o4(a5.map((t7, n6) => t7.map((t8, r5) => r5 === e5 ? i4[n6] : t8))) / s4);
      return c4.every(Number.isFinite) ? (e5) => {
        let r5 = (e5 - t6) / n5;
        return c4[0] + c4[1] * r5 + c4[2] * r5 * r5;
      } : null;
    }, u2 = l3(c3);
    if (!u2) return null;
    let d2 = c3.map(([e4, t6]) => Math.abs(t6 - u2(e4))).sort((e4, t6) => e4 - t6), f3 = Math.max(1.5, 2.5 * d2[d2.length >> 1]), p3 = c3, m3 = c3.filter(([e4, t6]) => Math.abs(t6 - u2(e4)) <= f3), h3 = m3.length >= 0.6 * c3.length ? l3(m3) : null;
    h3 && (u2 = h3, p3 = m3);
    let g3 = p3[0][0], _3 = p3[p3.length - 1][0], v3 = u2;
    return (e4) => v3(Math.min(_3, Math.max(g3, e4)));
  }
  function ke(e3, t5, n4, r3 = 0, i3 = 0, a4 = t5, o3 = n4) {
    let s3 = document.createElement(`canvas`);
    s3.width = t5, s3.height = n4;
    let c3 = s3.getContext(`2d`, { willReadFrequently: true });
    c3.imageSmoothingEnabled = true;
    for (let t6 of e3) c3.drawImage(t6, r3, i3, a4, o3);
    let l3 = c3.getImageData(0, 0, t5, n4).data, u2 = new Uint8Array(t5 * n4);
    for (let e4 = 0; e4 < t5 * n4; e4++) u2[e4] = +(l3[4 * e4 + 3] > 0);
    let d2 = u2.slice();
    for (let e4 = 0; e4 < n4; e4++) for (let r4 = 0; r4 < t5; r4++) if (!u2[e4 * t5 + r4]) for (let i4 = -1; i4 <= 1; i4++) for (let a5 = -1; a5 <= 1; a5++) {
      let o4 = e4 + i4, s4 = r4 + a5;
      o4 >= 0 && o4 < n4 && s4 >= 0 && s4 < t5 && u2[o4 * t5 + s4] && (d2[e4 * t5 + r4] = 1);
    }
    return d2;
  }
  var Ae = `LivLiv`;
  var je = `#ff4d5e`;
  var W2 = [27, 44, 430, 133];
  var Me = `M101.5 62.5V141.5Q101.5 158.5 115.5 158.5M145 107.5V158.5M176.3 107.5L200.5 158.5L224.7 107.5M257.5 62.5V141.5Q257.5 158.5 271.5 158.5M303 107.5V158.5M335.3 107.5L359.5 158.5L383.7 107.5`;
  var Ne = `M40.5 122L49.5 142.1M60.5 122L69.5 142.1M421.5 122L412.5 142.1M441.5 122L432.5 142.1`;
  var G2 = { cx: 145, cy: 67, r: 13.5 };
  var Pe = `M293.5 69H312.5A8 8 0 0 1 312.5 85H293.5A8 8 0 0 1 293.5 69Z`;
  var Fe = { center: 0.3, centerY: 0.62, centerAlpha: 0.3, centerRim: 0.2, centerEdge: 3.2, corner: 0.13, cornerMin: 64, margin: 0.035, text: 0.026, top: 0.12 };
  function K2(e3) {
    let t5 = e3 % 5500 / 5500;
    return t5 < 0.93 ? 1 : t5 < 0.955 ? 1 - (t5 - 0.93) / 0.025 * 0.88 : 0.12 + (t5 - 0.955) / 0.045 * 0.88;
  }
  function q2(e3, t5, n4, r3, i3, a4 = 0, o3 = je, s3 = 0, c3 = `#222`) {
    let [l3, u2, d2, f3] = W2, p3 = r3 / f3;
    e3.save(), e3.translate(t5 - d2 * p3, n4 - r3), e3.scale(p3, p3), e3.translate(-l3, -u2), e3.lineCap = `round`, e3.lineJoin = `round`, s3 && (e3.strokeStyle = c3, e3.lineWidth = 25 + s3 * 2, e3.stroke(new Path2D(Me)), e3.lineWidth = 12.5 + s3 * 2, e3.stroke(new Path2D(Ne)), e3.lineWidth = s3 * 2, e3.beginPath(), e3.ellipse(G2.cx, G2.cy, G2.r, G2.r * K2(a4), 0, 0, Math.PI * 2), e3.stroke(), e3.stroke(new Path2D(Pe))), e3.strokeStyle = i3, e3.lineWidth = 25, e3.stroke(new Path2D(Me)), e3.strokeStyle = o3, e3.lineWidth = 12.5, e3.stroke(new Path2D(Ne)), e3.fillStyle = o3, e3.beginPath(), e3.ellipse(G2.cx, G2.cy, G2.r, G2.r * K2(a4), 0, 0, Math.PI * 2), e3.fill(), e3.fill(new Path2D(Pe)), e3.restore();
  }
  function Ie(e3, t5, n4 = false, r3 = 1) {
    let { corner: i3, cornerMin: a4, margin: o3, text: s3 } = Fe, c3 = Math.min(e3, t5), l3 = Math.max(12 * r3, c3 * o3);
    return { right: e3 - l3, y: n4 ? t5 > e3 ? t5 * Fe.top : l3 : t5 - l3, top: n4, logo: Math.max(a4 * r3, c3 * i3) * W2[3] / W2[2], text: Math.max(12 * r3, c3 * s3) };
  }
  function Le(e3, t5, n4, r3 = 0, i3 = 1, a4 = false, o3 = false) {
    let s3 = Ie(t5, n4, a4, i3);
    e3.save(), o3 || (e3.shadowColor = `rgba(0,0,0,.55)`, e3.shadowBlur = s3.logo * 0.12), q2(e3, s3.right, s3.top ? s3.y + s3.logo : s3.y, s3.logo, o3 ? `#fff` : `rgba(255,255,255,.95)`, r3, je, o3 ? 9 : 0), e3.restore();
  }
  function Re(e3, t5, n4, r3, i3 = 1, a4 = false) {
    let o3 = Ie(t5, n4, a4, i3);
    e3.save(), e3.shadowColor = `rgba(0,0,0,.6)`, e3.shadowBlur = o3.text * 0.25, e3.font = `600 ${o3.text}px system-ui, sans-serif`, e3.textAlign = `right`, e3.textBaseline = o3.top ? `top` : `bottom`, e3.fillStyle = `rgba(255,255,255,.85)`, e3.fillText(r3, o3.right, o3.y), e3.restore();
  }
  var ze = 4;
  var J2 = /* @__PURE__ */ new Map();
  function Be(e3, t5) {
    return typeof OffscreenCanvas > `u` ? Object.assign(document.createElement(`canvas`), { width: e3, height: t5 }) : new OffscreenCanvas(e3, t5);
  }
  function Ve(e3, t5, n4) {
    let r3 = Math.round(K2(n4) * 10), i3 = `${t5.toFixed(2)}:${r3}`, a4 = J2.get(i3);
    if (a4) return a4;
    let { centerAlpha: o3, centerRim: s3, centerEdge: c3 } = Fe, l3 = Math.ceil(e3) + 8, u2 = Math.ceil(t5) + 8, d2 = e3 + ze, f3 = t5 + ze, p3 = Be(l3, u2), m3 = p3.getContext(`2d`);
    q2(m3, d2, f3, t5, `#000`, n4, `#000`, c3, `#000`), m3.globalCompositeOperation = `destination-out`, q2(m3, d2, f3, t5, `#000`, n4, `#000`), a4 = Be(l3, u2);
    let h3 = a4.getContext(`2d`);
    return h3.globalAlpha = s3, h3.drawImage(p3, 0, 0), h3.globalAlpha = o3, q2(h3, d2, f3, t5, `#fff`, n4, `#fff`), J2.size > 64 && J2.clear(), J2.set(i3, a4), a4;
  }
  function He(e3, t5, n4, r3 = 0, i3 = 1, a4 = false) {
    let { center: o3, centerY: s3 } = Fe, c3 = Math.min(t5, n4) * o3, l3 = c3 * W2[3] / W2[2];
    e3.drawImage(Ve(c3, l3, r3), (t5 - c3) / 2 - ze, n4 * s3 - l3 / 2 - ze), Le(e3, t5, n4, r3, i3, a4);
  }
  var Ue = `#version 300 es
in vec2 aPos; out vec2 vUv;
void main(){ vUv=vec2(aPos.x*.5+.5,.5-aPos.y*.5); gl_Position=vec4(aPos,0.,1.); }`;
  var We = `#version 300 es
precision mediump float; in vec2 vUv; uniform sampler2D uTex; out vec4 o;
void main(){ o=texture(uTex,vUv); }`;
  var Ge = class {
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
      let t5 = (t6, n5) => {
        let r3 = e3.createShader(t6);
        return e3.shaderSource(r3, n5), e3.compileShader(r3), r3;
      }, n4 = this.prog = e3.createProgram();
      e3.attachShader(n4, t5(e3.VERTEX_SHADER, Ue)), e3.attachShader(n4, t5(e3.FRAGMENT_SHADER, We)), e3.bindAttribLocation(n4, 0, `aPos`), e3.linkProgram(n4), this.vao = e3.createVertexArray(), e3.bindVertexArray(this.vao), this.buf = e3.createBuffer(), e3.bindBuffer(e3.ARRAY_BUFFER, this.buf), e3.bufferData(e3.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), e3.STATIC_DRAW), e3.enableVertexAttribArray(0), e3.vertexAttribPointer(0, 2, e3.FLOAT, false, 0, 0), e3.bindVertexArray(null), this.tex = e3.createTexture(), e3.bindTexture(e3.TEXTURE_2D, this.tex), e3.texParameteri(e3.TEXTURE_2D, e3.TEXTURE_MIN_FILTER, e3.LINEAR), e3.texParameteri(e3.TEXTURE_2D, e3.TEXTURE_MAG_FILTER, e3.LINEAR), e3.texParameteri(e3.TEXTURE_2D, e3.TEXTURE_WRAP_S, e3.CLAMP_TO_EDGE), e3.texParameteri(e3.TEXTURE_2D, e3.TEXTURE_WRAP_T, e3.CLAMP_TO_EDGE);
    }
    set(e3, t5, n4 = true) {
      this.logo = e3 === `livliv`, this.text = e3 === `text` ? t5 : null, this.center = n4;
    }
    center = true;
    draw(e3, t5) {
      let n4 = this.logo ? Ae : this.text, r3 = this.gl;
      if (!n4) return;
      let i3 = r3.drawingBufferWidth, a4 = r3.drawingBufferHeight, o3 = `${i3}x${a4}:${t5}:${this.logo ? Math.round(K2(e3) * 10) : ``}:${this.logo}:${this.center}:${n4}`;
      if (r3.activeTexture(r3.TEXTURE0), r3.bindTexture(r3.TEXTURE_2D, this.tex), o3 !== this.drawn) {
        this.drawn = o3;
        let s3 = this.c;
        (s3.width !== i3 || s3.height !== a4) && (s3.width = i3, s3.height = a4);
        let c3 = s3.getContext(`2d`);
        c3.clearRect(0, 0, i3, a4), c3.save(), this.logo && this.center ? He(c3, i3, a4, e3, t5) : this.logo ? Le(c3, i3, a4, e3, t5) : Re(c3, i3, a4, n4, t5), c3.restore(), r3.pixelStorei(r3.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true), r3.texImage2D(r3.TEXTURE_2D, 0, r3.RGBA, r3.RGBA, r3.UNSIGNED_BYTE, s3);
      }
      r3.viewport(0, 0, i3, a4), r3.useProgram(this.prog), r3.disable(r3.STENCIL_TEST), r3.enable(r3.BLEND), r3.blendFunc(r3.ONE, r3.ONE_MINUS_SRC_ALPHA), r3.bindVertexArray(this.vao), r3.drawArrays(r3.TRIANGLE_STRIP, 0, 4), r3.bindVertexArray(null);
    }
    dispose() {
      let e3 = this.gl;
      e3.deleteTexture(this.tex), e3.deleteBuffer(this.buf), e3.deleteVertexArray(this.vao), e3.deleteProgram(this.prog);
    }
  };
  var Y2 = { entries: 2048, bytes: 256 * 2 ** 20, modelJson: T.modelJson, keyforms: T.keyforms };
  var X2 = (e3, t5 = `invalid`) => new t2(t5, `LivLiv: ${e3}`);
  var Ke = { webp: `image/webp`, png: `image/png`, jpg: `image/jpeg`, jpeg: `image/jpeg`, json: `application/json` };
  async function qe(e3) {
    let t5 = new Uint8Array(await e3.slice(0, 4).arrayBuffer());
    return t5.length === 4 && t5[0] === 80 && t5[1] === 75 && (t5[2] === 3 && t5[3] === 4 || t5[2] === 5 && t5[3] === 6);
  }
  async function Je(e3, t5) {
    t5?.throwIfAborted();
    let n4 = Math.min(e3.size, 65557), r3 = new DataView(await e3.slice(e3.size - n4).arrayBuffer()), i3 = -1;
    for (let e4 = r3.byteLength - 22; e4 >= 0; e4--) if (r3.getUint32(e4, true) === 101010256) {
      i3 = e4;
      break;
    }
    if (i3 < 0) throw X2(`this is not a ZIP (no end record)`, `not-a-model`);
    let a4 = r3.getUint16(i3 + 10, true), o3 = r3.getUint32(i3 + 12, true), s3 = r3.getUint32(i3 + 16, true);
    if (a4 === 65535 || o3 === 4294967295 || s3 === 4294967295) throw X2(`ZIP64 packages are not supported`, `too-large`);
    if (a4 > Y2.entries) throw X2(`the package has ${a4} entries, more than ${Y2.entries}`, `too-large`);
    let c3 = new DataView(await e3.slice(s3, s3 + o3).arrayBuffer()), l3 = new TextDecoder(), u2 = /* @__PURE__ */ new Map(), d2 = 0;
    for (let n5 = 0, r4 = 0; r4 < a4; r4++) {
      if (t5?.throwIfAborted(), n5 + 46 > c3.byteLength || c3.getUint32(n5, true) !== 33639248) throw X2(`the package is damaged (central directory)`);
      let r5 = c3.getUint16(n5 + 8, true), i4 = c3.getUint16(n5 + 10, true), a5 = c3.getUint32(n5 + 20, true), o4 = c3.getUint32(n5 + 24, true), s4 = c3.getUint16(n5 + 28, true), f3 = c3.getUint16(n5 + 30, true), p3 = c3.getUint16(n5 + 32, true), m3 = c3.getUint32(n5 + 42, true), h3 = l3.decode(new Uint8Array(c3.buffer, c3.byteOffset + n5 + 46, s4));
      n5 += 46 + s4 + f3 + p3;
      let g3 = h3.replace(/\\/g, `/`), _3 = g3.slice(g3.lastIndexOf(`/`) + 1);
      if (g3.endsWith(`/`) || g3.startsWith(`__MACOSX/`) || _3.startsWith(`._`) || _3 === `.DS_Store` || _3 === `Thumbs.db`) continue;
      if (g3.startsWith(`/`) || /^[A-Za-z]:/.test(g3) || g3.split(`/`).some((e4) => e4 === `..` || e4 === `.`)) throw X2(`the package holds a path outside itself: ${h3}`);
      if (r5 & 1) throw X2(`${g3} is encrypted`);
      if (u2.has(g3)) throw X2(`${g3} is in the package twice`);
      let v3 = _3 === `keyforms.json`;
      if (o4 > (_3 === `model.json` ? Y2.modelJson : v3 ? Y2.keyforms : Y2.bytes) || (d2 += o4) > Y2.bytes) throw X2(`${g3} is too large (${o4} bytes)`, `too-large`);
      let y3 = new DataView(await e3.slice(m3, m3 + 30).arrayBuffer());
      if (y3.byteLength < 30 || y3.getUint32(0, true) !== 67324752) throw X2(`the package is damaged (${g3})`);
      let b3 = m3 + 30 + y3.getUint16(26, true) + y3.getUint16(28, true), x3 = e3.slice(b3, b3 + a5), S3 = Ke[_3.slice(_3.lastIndexOf(`.`) + 1).toLowerCase()] || ``;
      if (b3 + a5 > e3.size) throw X2(`the package is damaged (${g3} runs past its end)`);
      if (i4 === 0) {
        if (a5 !== o4) throw X2(`the package is damaged (${g3})`);
        u2.set(g3, x3.slice(0, a5, S3));
      } else if (i4 === 8) {
        if (!Xe()) {
          if (v3) {
            console.warn(`LivLiv: this browser cannot inflate ${g3}; the character plays without it`);
            continue;
          }
          throw X2(`this browser cannot open the compressed ${g3} (no DecompressionStream): store it uncompressed`, `missing-feature`);
        }
        u2.set(g3, await Ze(x3, o4, g3, S3, t5));
      } else throw X2(`${g3} uses ZIP method ${i4}; a package stores its files or deflates them`);
    }
    return t5?.throwIfAborted(), u2;
  }
  var Ye;
  function Xe() {
    if (Ye === void 0) try {
      Ye = typeof DecompressionStream < `u` && !!new DecompressionStream(`deflate-raw`);
    } catch {
      Ye = false;
    }
    return Ye;
  }
  async function Ze(e3, t5, n4, r3, i3) {
    let a4 = e3.stream().pipeThrough(new DecompressionStream(`deflate-raw`)).getReader(), o3 = [], s3 = 0;
    try {
      for (; ; ) {
        i3?.throwIfAborted();
        let { done: e4, value: r4 } = await a4.read();
        if (e4) break;
        if (s3 += r4.length, s3 > t5) throw a4.cancel(), X2(`${n4} inflates past its ${t5} bytes`);
        o3.push(r4);
      }
    } catch (e4) {
      throw i3?.aborted ? (await a4.cancel(i3.reason), i3.reason) : e4.message?.startsWith(n4) ? e4 : X2(`the package is damaged (${n4}: ${e4.message})`);
    }
    if (s3 !== t5) throw X2(`the package is damaged (${n4}: ${s3} bytes, ${t5} expected)`);
    return new Blob(o3, { type: r3 });
  }
  var tt = { zh: `\u7B11`, "zh-Hant": `\u7B11`, en: `Smile`, ja: `\u7B11\u9854` };
  var nt = `this browser has no WebGL2`;
  var rt = class extends Ce {
    puppet;
    mark;
    static isSupported() {
      let e3 = document.createElement(`canvas`).getContext(`webgl2`);
      return e3?.getExtension(`WEBGL_lose_context`)?.loseContext(), !!e3;
    }
    constructor(e3, t5 = {}) {
      ye(e3);
      let n4;
      try {
        n4 = new pe2(e3);
      } catch (t6) {
        throw e3.getContext(`webgl2`)?.isContextLost() ? new t2(`context-lost`, `LivLiv: this canvas has lost its WebGL context: use a new canvas`, { cause: t6 }) : new t2(`no-webgl`, typeof WebGL2RenderingContext > `u` ? `LivLiv: this browser has no WebGL2` : t6.message === nt ? `LivLiv: could not start WebGL2 on this canvas: it is turned off in this browser, or the canvas already draws in 2D` : `LivLiv: could not start WebGL2 on this canvas (${t6.message})`, { cause: t6 });
      }
      super(e3, n4.params, t5), this.puppet = n4, this.puppet.maxDpr = t5.maxPixelRatio ?? 2, this.mark = new Ge(this.puppet.gl);
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
    canvasToModel(e3, t5) {
      return this.puppet.canvasToModel(e3, t5);
    }
    poke(e3, t5, n4 = 1) {
      return this.puppet.poke(e3, t5, n4);
    }
    load(e3, t5 = {}) {
      return this.start(t5, (t6) => this.loadNow(e3, t6));
    }
    async loadNow(e3, t5) {
      let n4 = this.puppet, { signal: r3 } = t5, i3 = null;
      if (typeof e3 == `string` || e3 instanceof URL) {
        let a5 = new URL(String(e3), document.baseURI);
        if (/\.(livliv|zip)$/i.test(a5.pathname)) {
          if (t5.progress(0), i3 = await ot(a5.href, t5), r3.aborted) throw r3.reason;
        } else t5.progress(0), await n4.load(a5.href, { pack: false, signal: r3, onImage: (e4, n5) => {
          t5.progress(e4 / n5), e4 === n5 && t5.build();
        } }).catch((e4) => {
          throw $2(e4, a5.href);
        });
      } else i3 = e3;
      if (i3) {
        t5.build();
        let { model: e4, image: a5, keyforms: o4 } = await st(i3);
        if (r3.aborted) throw r3.reason;
        await n4.loadModel(e4, a5, { keyforms: o4, signal: r3 }).catch((e5) => {
          throw $2(e5, `model.json`);
        });
      }
      if (this.disposed) throw n4.dispose(), Y(`the player was disposed`);
      if (n4.gl.isContextLost()) throw X();
      let a4 = n4.model, o3 = a4.expressions || (a4.layers.some((e4) => e4.id === `expr_smile`) ? [{ id: `smile`, label: ``, labels: tt }] : []);
      this.info = { name: a4.name, format: a4.format || `livemaker-puppet`, version: a4.version ?? 3, size: a4.canvas, fullBody: n4.grounded, expressions: o3.map(({ id: e4, label: t6, labels: n5 }) => {
        let r4 = n5 || { [se(t6)]: t6 };
        return { id: e4, label: P(r4, this.lang, e4), labels: r4 };
      }), watermark: a4.watermark ?? null, meta: a4.meta ?? null };
      let s3 = a4.meta ? a4.meta.watermark?.kind ?? `none` : a4.watermark === `LivLiv` ? `livliv` : a4.watermark ? `text` : `none`;
      return this.mark.set(s3, a4.watermark ?? null, a4.meta?.watermark?.center !== false), this.neutral(), this.playing || this.resize(), this.info;
    }
    getAnchor(e3) {
      return this.info && !this.disposed ? this.puppet.anchor(e3) : null;
    }
    get grounded() {
      return this.puppet.grounded;
    }
    place(e3) {
      let t5 = this.puppet, n4 = this.frame;
      t5.grounded ? (t5.setMove(n4.move.x, n4.move.s, n4.talk, e3, n4.move.y), n4.move.y = t5.move.y, this.ground = { crouch: t5.crouch, dip: t5.dip, talk: n4.talk }) : super.place(e3);
    }
    show(e3) {
      let t5 = this.puppet, n4 = this.frame, r3 = this.view, i3 = this.ground;
      t5.view = { x: r3.x, y: r3.y, s: r3.zoom }, t5.focusHead = r3.head, t5.fit = r3.fit === `whole` || r3.fit === `knee` ? r3.fit : `frame`, t5.move = { ...n4.move }, t5.crouch = i3.crouch, t5.dip = i3.dip, t5.size = this.renderSize, t5.update(e3), t5.render(), this.mark.draw(performance.now(), this.renderSize ? 1 : t5.gl.drawingBufferWidth / Math.max(1, this.canvas.clientWidth));
    }
    free() {
      let e3 = this.puppet.gl;
      this.puppet.dispose(), this.mark.dispose(), e3.deleteProgram(this.puppet.prog), e3.clearColor(0, 0, 0, 0), e3.clear(e3.COLOR_BUFFER_BIT);
    }
  };
  function $2(e3, t5) {
    let n4 = e3;
    if (n4 instanceof t2 || n4?.name === `AbortError`) return e3;
    let r3 = String(n4?.message || e3), i3 = e3;
    return n4?.status ? new t2(`http`, `LivLiv: could not load ${t5} (HTTP ${n4.status})`, { status: n4.status, cause: i3 }) : r3.startsWith(`image `) ? new t2(`missing-file`, `LivLiv: could not load the image ${r3.slice(6)}: it is missing, or on another origin that sends no CORS header`, { cause: i3 }) : n4 instanceof SyntaxError ? new t2(`not-a-model`, `LivLiv: ${t5} is not a model.json (${r3})`, { cause: i3 }) : n4 instanceof TypeError && /fetch|load failed|network/i.test(r3) ? new t2(`unreachable`, `LivLiv: could not load ${t5}: unreachable, or on another origin that sends no CORS header`, { cause: i3 }) : new t2(n4?.code ?? `invalid`, r3.startsWith(`LivLiv`) ? r3 : `LivLiv: ${r3}`, { cause: i3 });
  }
  var it = () => new t2(`not-a-model`, `LivLiv: this is a VRM or glTF file, and a Player plays LivLiv models: use a BodyPlayer with VrmBody (@livliv-dev/player/vrm)`);
  var at = async (e3) => {
    let t5 = new DataView(await e3.slice(0, 4).arrayBuffer());
    return t5.byteLength === 4 && t5.getUint32(0, true) === 1179937895;
  };
  async function ot(e3, t5) {
    for (let n4 = true; ; n4 = false) try {
      let n5 = await fetch(e3, { signal: t5.signal });
      if (!n5.ok) throw Object.assign(/* @__PURE__ */ Error(`HTTP ${n5.status}`), { status: n5.status });
      return await Z(n5, t5);
    } catch (r3) {
      if (t5.signal.aborted) throw r3;
      let i3 = r3.status;
      if (i3 && i3 < 500) throw $2(r3, e3);
      if (!n4) throw i3 ? $2(r3, e3) : new t2(`unreachable`, `LivLiv: could not load ${e3}: unreachable or the connection dropped, or on another origin that sends no CORS header`, { cause: r3 });
    }
  }
  async function st(e3) {
    let t5 = /* @__PURE__ */ new Map(), n4 = (e4) => e4.replace(/\\/g, `/`).replace(/^(\.\/|\/)+/, ``), r3 = async (e4) => {
      if (await at(e4)) throw it();
      if (!await qe(e4)) throw new t2(`not-a-model`, `LivLiv: this file is not a .livliv package (not a ZIP)`);
      return Je(e4).catch((e5) => {
        throw $2(e5, `the package`);
      });
    };
    if (e3 instanceof Blob) (await r3(e3)).forEach((e4, n5) => t5.set(n5, e4));
    else if (e3 instanceof Map) e3.forEach((e4, r4) => t5.set(n4(r4), e4));
    else if (Symbol.iterator in e3) for (let r4 of e3) t5.set(n4(r4.webkitRelativePath || r4.name), r4);
    else for (let [r4, i4] of Object.entries(e3)) t5.set(n4(r4), i4);
    let i3 = (e4) => e4 === `model.json` || e4.endsWith(`/model.json`);
    if (!(e3 instanceof Blob) && ![...t5.keys()].some(i3)) {
      for (let e4 of t5.values()) if (await qe(e4)) {
        let n5 = await r3(e4);
        t5.clear(), n5.forEach((e5, n6) => t5.set(n6, e5));
        break;
      }
    }
    let a4 = [...t5.keys()].filter(i3).sort((e4, t6) => e4.length - t6.length)[0];
    if (!a4 && [...t5.keys()].some((e4) => /\.(vrm|glb)$/i.test(e4))) throw it();
    if (!a4) throw new t2(`missing-file`, `LivLiv: no model.json among the files`);
    let o3 = a4.slice(0, a4.length - 10);
    if (t5.get(a4).size > Y2.modelJson) throw new t2(`too-large`, `LivLiv: ${a4} is larger than ${Y2.modelJson} bytes`);
    let s3;
    try {
      s3 = j(JSON.parse(await t5.get(a4).text()));
    } catch (e4) {
      throw $2(e4, a4);
    }
    let c3 = /* @__PURE__ */ new Map();
    t5.forEach((e4, t6) => c3.set(t6.slice(t6.lastIndexOf(`/`) + 1), e4));
    let l3 = (e4) => t5.get(o3 + n4(e4)) ?? c3.get(e4.slice(e4.lastIndexOf(`/`) + 1)), u2 = (e4) => {
      let t6 = l3(e4);
      return t6 ? be2(t6) : Promise.reject(new t2(`missing-file`, `LivLiv: ${e4} is not among the files`));
    }, d2, f3 = s3.keyforms ? l3(s3.keyforms) : void 0;
    return f3 && f3.size <= Y2.keyforms && (d2 = await f3.text().then((e4) => JSON.parse(e4)).catch(() => void 0)), s3.keyforms && !d2 && console.warn(`LivLiv: ${s3.keyforms} is missing or unreadable; the character plays on the rig alone`), { model: s3, image: u2, keyforms: d2 };
  }

  // node_modules/@livliv-dev/player/dist/voice.js
  var t4 = [300, 900, 1800, 3500];
  var n3 = [250, 650, 650, 1300];
  var r2 = 15;
  var i2 = 10;
  var a3 = 3;
  var o2 = 8;
  var s2 = class {
    center = r2;
    value = 0;
    seen = 0;
    push(e3, r3, s3, c3) {
      let l3 = (t5, n4) => {
        let i3 = 1e-12;
        for (let a4 = Math.ceil(t5 / r3); a4 * r3 < n4 && a4 < e3.length; a4++) i3 += e3[a4];
        return i3;
      }, u2 = 10 * Math.log10(l3(t4[0], t4[1]) / l3(t4[2], t4[3])), d2 = 10 * Math.log10(l3(n3[0], n3[1]) / l3(n3[2], n3[3])), f3 = 0;
      if (s3 > 0.15) {
        if (s3 > 0.3) {
          this.seen += c3;
          let e5 = Math.min(1, c3 / Math.min(3, 0.3 + this.seen));
          this.center += (Math.min(24, Math.max(8, u2)) - this.center) * e5;
        }
        let e4 = (u2 - this.center) / i2, t5 = (this.center - u2) / a3 * Math.min(1, Math.max(0, (d2 - o2 + 4) / 4));
        f3 = Math.max(-1, Math.min(1, t5 > 0 ? t5 : -Math.max(0, e4)));
      }
      return this.value += (f3 - this.value) * Math.min(1, c3 / 0.035), this.value;
    }
    reset() {
      this.value = 0;
    }
  };
  function c2(e3, t5) {
    let n4 = e3.length;
    for (let r3 = 1, i3 = 0; r3 < n4; r3++) {
      let a4 = n4 >> 1;
      for (; i3 & a4; a4 >>= 1) i3 ^= a4;
      i3 ^= a4, r3 < i3 && ([e3[r3], e3[i3]] = [e3[i3], e3[r3]], [t5[r3], t5[i3]] = [t5[i3], t5[r3]]);
    }
    for (let r3 = 2; r3 <= n4; r3 <<= 1) {
      let i3 = -2 * Math.PI / r3, a4 = Math.cos(i3), o3 = Math.sin(i3);
      for (let i4 = 0; i4 < n4; i4 += r3) {
        let n5 = 1, s3 = 0;
        for (let c3 = 0; c3 < r3 / 2; c3++) {
          let l3 = i4 + c3, u2 = l3 + r3 / 2, d2 = e3[u2] * n5 - t5[u2] * s3, f3 = e3[u2] * s3 + t5[u2] * n5;
          e3[u2] = e3[l3] - d2, t5[u2] = t5[l3] - f3, e3[l3] += d2, t5[l3] += f3;
          let p3 = n5 * a4 - s3 * o3;
          s3 = n5 * o3 + s3 * a4, n5 = p3;
        }
      }
    }
  }
  function l2(e3, t5, n4, r3, i3 = 0, a4 = new s2(), o3 = 0, l3 = n4.length, u2 = new Float32Array(n4.length)) {
    let d2 = t5 / r3, f3 = 1 << Math.round(Math.log2(0.0213 * t5)), p3 = Float32Array.from({ length: f3 }, (e4, t6) => 0.42 - 0.5 * Math.cos(2 * Math.PI * t6 / (f3 - 1)) + 0.08 * Math.cos(4 * Math.PI * t6 / (f3 - 1))), m3 = new Float32Array(f3), h3 = new Float32Array(f3), g3 = new Float32Array(f3 / 2);
    for (let s3 = o3; s3 < l3; s3++) {
      let o4 = Math.round((s3 + i3) * d2);
      for (let t6 = 0; t6 < f3; t6++) {
        let n5 = o4 - f3 / 2 + t6;
        m3[t6] = (n5 >= 0 && n5 < e3.length ? e3[n5] : 0) * p3[t6], h3[t6] = 0;
      }
      c2(m3, h3);
      for (let e4 = 0; e4 < f3 / 2; e4++) g3[e4] = m3[e4] * m3[e4] + h3[e4] * h3[e4];
      u2[s3] = a4.push(g3, t5 / f3, n4[s3], 1 / r3);
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
    capture = null;
    owed = /* @__PURE__ */ new Set();
    ticker = 0;
    onIdle;
    onState;
    get running() {
      return this.ctx?.state === `running`;
    }
    get stream() {
      if (!this.capture && this.ctx && this.out) try {
        this.capture = this.ctx.createMediaStreamDestination(), this.out.connect(this.capture);
      } catch {
      }
      return this.capture?.stream ?? null;
    }
    setVolume(e3) {
      this.volume = e3, this.out && (this.out.gain.value = e3);
    }
    unlock() {
      if (!this.ctx) {
        let e3 = window.AudioContext || window.webkitAudioContext;
        if (!e3) return;
        let t5 = !!window.webkitAudioContext;
        try {
          this.ctx = t5 ? new e3() : new e3({ sampleRate: h2 });
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
        let e3 = this.ctx.createBuffer(1, 1, 22050), t5 = this.ctx.createBufferSource();
        t5.buffer = e3, t5.connect(this.ctx.destination), t5.start();
      }
    }
    get busy() {
      return this.pending > 0 || this.clips.length > 0;
    }
    enqueue(e3, t5) {
      this.unlock();
      let n4 = this.ctx;
      if (!n4) {
        t5?.onFail?.();
        return;
      }
      let r3 = t5 && { ...t5 };
      r3 && this.owed.add(r3);
      let i3 = this.gen, a4 = new _2(e3, n4, this.loads.signal);
      this.pending++, this.order = this.order.then(async () => {
        let e4 = null;
        for (let t6; (t6 = await a4.next()) && i3 === this.gen; ) e4 = this.play(e4, t6, a4.rate, r3);
        i3 === this.gen && (this.pending--, e4 ? (e4.complete = true, a4.failed && this.settle(r3, false), this.update(e4), this.retire(e4)) : this.settle(r3, false), this.check());
      });
    }
    stop() {
      this.gen++, this.loads.abort(), this.loads = new AbortController(), this.pending = 0;
      for (let e4 of this.clips) for (let t5 of e4.pieces) {
        t5.src.onended = null;
        try {
          t5.src.stop();
        } catch {
        }
      }
      this.clips = [], this.tail = 0, clearTimeout(this.watchdog), clearInterval(this.ticker), this.ticker = 0;
      let e3 = [...this.owed];
      this.owed.clear();
      for (let t5 of e3) t5.onFail?.();
    }
    read() {
      return this.at(`env`);
    }
    vowel() {
      return this.at(`vowel`);
    }
    at(e3) {
      let t5 = this.ctx;
      if (!t5 || !this.clips.length) return 0;
      let n4 = this.heardTime(t5);
      for (let t6 of this.clips) for (let r3 of t6.pieces) if (n4 >= r3.at && n4 < r3.at + r3.n / t6.rate) {
        let i3 = (r3.from / t6.rate + n4 - r3.at) * f2, a4 = Math.floor(i3), o3 = i3 - a4, s3 = t6[e3], c3 = s3[a4] ?? 0;
        return c3 + ((s3[a4 + 1] ?? 0) - c3) * o3;
      }
      return 0;
    }
    dispose() {
      this.stop(), this.onIdle = void 0, this.capture?.stream.getTracks().forEach((e3) => e3.stop()), this.capture = null, this.ctx?.close().catch(() => {
      }), this.ctx = null, this.out = null;
    }
    heardTime(e3) {
      let t5 = e3.getOutputTimestamp?.();
      return t5 && t5.contextTime && t5.performanceTime ? t5.contextTime + Math.max(0, performance.now() - t5.performanceTime) / 1e3 : e3.currentTime - (e3.outputLatency || 0) - (e3.baseLatency || 0);
    }
    play(e3, t5, n4, r3) {
      let i3 = this.ctx, a4 = e3 ?? { pieces: [], rate: n4, x: new S2(), env: /* @__PURE__ */ new Float32Array(), vowel: /* @__PURE__ */ new Float32Array(), envDone: 0, vowelDone: 0, hooks: r3 };
      e3 || this.clips.push(a4);
      let o3 = i3.createBuffer(1, t5.length, a4.rate), s3 = i3.createBufferSource();
      o3.getChannelData(0).set(t5);
      let c3 = Math.max(i3.currentTime + 0.04, this.tail);
      s3.buffer = o3, s3.connect(this.out ?? i3.destination), s3.start(c3);
      let l3 = { at: c3, from: a4.x.n, n: t5.length, src: s3 };
      a4.pieces.push(l3), a4.x.push(t5), this.tail = c3 + t5.length / a4.rate, this.update(a4), s3.onended = () => {
        l3.over = true, this.retire(a4);
      }, clearTimeout(this.watchdog);
      let u2 = i3.currentTime;
      return this.watchdog = window.setTimeout(() => {
        i3.currentTime - u2 < 0.1 && this.clips.length && (this.stop(), this.check());
      }, (this.tail - u2 + 2) * 1e3), a4.hooks && !this.ticker && (this.ticker = window.setInterval(() => this.tick(), 25)), a4;
    }
    tick() {
      let e3 = this.ctx;
      if (e3) {
        let t5 = this.heardTime(e3);
        for (let e4 of this.clips) {
          let n4 = e4.pieces[0], r3 = e4.pieces[e4.pieces.length - 1];
          e4.hooks && n4 && (!e4.started && t5 >= n4.at && this.begin(e4), e4.started && e4.complete && t5 >= r3.at + r3.n / e4.rate && this.settle(e4.hooks, true));
        }
      }
      this.owed.size || (clearInterval(this.ticker), this.ticker = 0);
    }
    begin(e3) {
      e3.started = true, e3.hooks?.onStart?.();
    }
    settle(e3, t5) {
      e3 && this.owed.delete(e3) && (t5 ? e3.onEnd?.() : e3.onFail?.());
    }
    update(e3) {
      let t5 = e3.x.view(), n4 = C2(t5, e3.rate), r3 = n4.length, i3 = e3.complete ? r3 : Math.max(e3.envDone, r3 - m2), a4 = new Float32Array(r3), o3 = new Float32Array(r3);
      a4.set(e3.env.subarray(0, e3.envDone)), a4.set(n4.subarray(e3.envDone), e3.envDone), o3.set(e3.vowel.subarray(0, e3.vowelDone)), l2(t5, e3.rate, a4, f2, p2, this.cue, e3.vowelDone, i3, o3), e3.env = a4, e3.vowel = o3, e3.envDone = e3.vowelDone = i3;
    }
    retire(e3) {
      let t5 = this.ctx;
      if (!t5 || !e3.complete || e3.pieces.some((e4) => !e4.over)) return;
      let n4 = Math.max(0, t5.currentTime - this.heardTime(t5));
      window.setTimeout(() => {
        this.clips = this.clips.filter((t6) => t6 !== e3), e3.hooks && this.owed.has(e3.hooks) && (e3.started || this.begin(e3), this.settle(e3.hooks, true)), this.check();
      }, Math.min(400, n4 * 1e3));
    }
    check() {
      this.busy || this.onIdle?.();
    }
  };
  var _2 = class {
    rate = h2;
    failed = false;
    got = [];
    ended = false;
    wake = null;
    constructor(e3, t5, n4) {
      this.load(e3, t5, n4).catch(() => {
        this.failed = true;
      }).finally(() => {
        this.ended = true, this.poke();
      });
    }
    async next() {
      for (; ; ) {
        if (this.got.length) {
          let e3 = x2(this.got);
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
    async load(e3, t5, n4) {
      let r3 = typeof e3 == `string` ? await fetch(e3, { signal: n4 }) : e3;
      if (!r3.ok) throw Error(String(r3.status));
      if (!r3.body) {
        await this.decode(await r3.arrayBuffer(), t5);
        return;
      }
      let i3 = r3.body.getReader(), a4 = () => {
        i3.cancel(n4.reason).catch(() => {
        });
      };
      if (n4.aborted) a4();
      else {
        n4.addEventListener(`abort`, a4, { once: true });
        try {
          if (/wav/.test(r3.headers.get(`content-type`) || ``)) await this.pcm(i3, t5);
          else {
            let e4 = [];
            for (; ; ) {
              let { value: t6, done: n5 } = await i3.read();
              if (n5) break;
              e4.push(t6);
            }
            let r4 = new Uint8Array(e4.reduce((e5, t6) => e5 + t6.length, 0)), a5 = 0;
            for (let t6 of e4) r4.set(t6, a5), a5 += t6.length;
            n4.aborted || await this.decode(r4.buffer, t5);
          }
        } finally {
          n4.removeEventListener(`abort`, a4), i3.releaseLock();
        }
      }
    }
    async decode(e3, t5) {
      let n4 = await t5.decodeAudioData(e3);
      this.rate = n4.sampleRate, n4.duration > 0.05 && this.push(n4.getChannelData(0));
    }
    async pcm(e3, t5) {
      let n4 = /* @__PURE__ */ new Uint8Array(), r3;
      for (; ; ) {
        let { value: t6, done: i3 } = await e3.read();
        if (t6?.length && (n4 = n4.length ? b2(n4, t6) : t6), r3 === void 0 && (r3 = v2(n4, !!i3)), r3) {
          r3.rate >= 3e3 && r3.rate <= 384e3 && (this.rate = r3.rate);
          let e4 = 2 * r3.channels, t7 = Math.floor((n4.length - r3.data) / e4);
          t7 > 0 && (this.push(y2(n4, r3.data, t7, e4)), n4 = n4.slice(r3.data + t7 * e4), r3.data = 0);
        }
        if (i3) break;
      }
      r3 === null && await this.decode(n4.slice().buffer, t5);
    }
  };
  function v2(e3, t5) {
    let n4 = (t6) => String.fromCharCode(e3[t6], e3[t6 + 1], e3[t6 + 2], e3[t6 + 3]);
    if (e3.length >= 12 && (n4(0) !== `RIFF` || n4(8) !== `WAVE`)) return null;
    let r3 = new DataView(e3.buffer, e3.byteOffset, e3.byteLength), i3 = 12, a4 = 0, o3 = 0, s3 = false;
    for (; e3.length >= 12 && i3 + 8 <= e3.length; ) {
      let t6 = n4(i3), c3 = r3.getUint32(i3 + 4, true);
      if (t6 === `data`) return s3 ? { rate: a4, channels: o3, data: i3 + 8 } : null;
      if (t6 === `fmt `) {
        if (i3 + 24 > e3.length) break;
        s3 = r3.getUint16(i3 + 8, true) === 1 && r3.getUint16(i3 + 22, true) === 16, o3 = r3.getUint16(i3 + 10, true), a4 = r3.getUint32(i3 + 12, true);
      }
      i3 += 8 + c3 + (c3 & 1);
    }
    return t5 ? null : void 0;
  }
  function y2(e3, t5, n4, r3) {
    let i3 = new DataView(e3.buffer, e3.byteOffset + t5), a4 = new Float32Array(n4);
    for (let e4 = 0; e4 < n4; e4++) a4[e4] = i3.getInt16(e4 * r3, true) / 32768;
    return a4;
  }
  function b2(e3, t5) {
    let n4 = new Uint8Array(e3.length + t5.length);
    return n4.set(e3), n4.set(t5, e3.length), n4;
  }
  function x2(e3) {
    if (e3.length === 1) return e3[0];
    let t5 = new Float32Array(e3.reduce((e4, t6) => e4 + t6.length, 0)), n4 = 0;
    for (let r3 of e3) t5.set(r3, n4), n4 += r3.length;
    return t5;
  }
  var S2 = class {
    a = /* @__PURE__ */ new Float32Array(16384);
    n = 0;
    push(e3) {
      if (this.n + e3.length > this.a.length) {
        let t5 = new Float32Array(Math.max(2 * this.a.length, this.n + e3.length));
        t5.set(this.a.subarray(0, this.n)), this.a = t5;
      }
      this.a.set(e3, this.n), this.n += e3.length;
    }
    view() {
      return this.a.subarray(0, this.n);
    }
  };
  function C2(e3, t5) {
    let n4 = Math.max(1, Math.round(t5 / f2)), r3 = Math.ceil(e3.length / n4), i3 = 1 - Math.exp(-2 * Math.PI * 1500 / t5), a4 = 1 - Math.exp(-2 * Math.PI * 150 / t5), o3 = new Float32Array(r3), s3 = 0, c3 = 0;
    for (let t6 = 0; t6 < e3.length; t6++) {
      s3 += (e3[t6] - s3) * i3, c3 += (s3 - c3) * a4;
      let r4 = s3 - c3;
      o3[Math.floor(t6 / n4)] += r4 * r4;
    }
    let l3 = new Float32Array(r3), u2 = 0;
    for (let e4 = 0; e4 < r3; e4++) l3[e4] = Math.sqrt((o3[e4] + (o3[e4 + 1] ?? 0)) / (2 * n4)), u2 = Math.max(u2, l3[e4]);
    if (!u2) return new Float32Array(r3);
    let d2 = Array.from(l3).filter((e4) => e4 > u2 * 0.05).sort((e4, t6) => e4 - t6), m3 = d2[Math.floor(d2.length * 0.9)] || u2, h3 = m3 * 0.1, g3 = l3.map((e4) => Math.min(1, Math.max(0, (e4 - h3) / Math.max(m3 - h3, 1e-6))) ** 0.75), _3 = new Float32Array(r3), v3 = 0;
    for (let e4 = 0; e4 < r3; e4++) {
      let t6 = 0;
      for (let n6 = e4 - 10; n6 <= e4 + 10; n6++) t6 += g3[Math.min(r3 - 1, Math.max(0, n6))];
      t6 /= 21;
      let n5 = Math.min(1, Math.max(0, g3[e4] * 0.6 + (g3[e4] - t6) * 1.2));
      v3 += (n5 - v3) * (n5 > v3 ? 0.6 : 0.45), _3[e4] = v3;
    }
    return Float32Array.from({ length: r3 }, (e4, t6) => _3[t6 + p2] ?? 0);
  }
  var w2 = 0.25;
  var T2 = 0.35;
  var E2 = 0.15;
  var D2 = 0.2;
  var O2 = (e3, t5, n4, r3) => {
    e3.v += (-t5 * e3.x - n4 * e3.v) * r3, e3.x += e3.v * r3;
  };
  var k2 = class {
    amount = 1;
    bounce = false;
    pauseBlink = false;
    act = 0;
    hop = 0;
    grounded = false;
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
    update(t5, n4, r3) {
      this.t += n4, this.quiet += n4, this.sinceNod += n4, this.sinceBrow += n4, this.pauseBlink = false;
      let i3 = this.act;
      if (t5 > D2 && (this.quiet = 0), this.act += (+(this.quiet < 0.35) - this.act) * Math.min(1, n4 * (this.quiet < 0.35 ? 6 : 1.2)), i3 > 0.6 && this.act <= 0.6 && this.quiet > 0.4 && (this.pauseBlink = true, this.stats.blinks++), !this.armed) this.peak = Math.max(this.peak, t5), t5 < this.peak - E2 && (this.armed = true, this.valley = t5);
      else if (this.valley = Math.min(this.valley, t5), t5 - this.valley > w2 && t5 > T2) {
        this.armed = false, this.peak = t5, this.stats.onsets++;
        let e3 = this.act < 0.3;
        e3 && (this.aim = { x: (Math.random() * 2 - 1) * 5, y: (Math.random() - 0.3) * 2.5 }), this.sinceNod > 0.35 && (e3 || Math.random() < 0.35) && (this.nod.v -= (e3 ? 70 : 35 + Math.random() * 30) * this.amount, this.sinceNod = 0, this.stats.nods++), this.sinceBrow > 1.2 && Math.random() < (e3 ? 0.5 : 0.18) && (this.browAge = 0, this.sinceBrow = 0, this.stats.brows++), this.bounce && (this.lift.v += (0.3 + Math.random() * 0.12) * this.amount);
      }
      let a4 = Math.max(1, Math.ceil(n4 / (1 / 120)));
      for (let e3 = 0; e3 < a4; e3++) O2(this.nod, 150, 15, n4 / a4), O2(this.lift, 230, 19, n4 / a4);
      this.browAge += n4;
      let o3 = this.act * this.amount, s3 = this.phase, c3 = this.t, l3 = this.quiet < 0.35, u2 = Math.min(1, n4 * (l3 ? 3 : 0.45));
      this.dir.x += ((l3 ? this.aim.x : 0) - this.dir.x) * u2, this.dir.y += ((l3 ? this.aim.y : 0) - this.dir.y) * u2;
      let d2 = (Math.sin(c3 * 0.9 + s3[0]) * 0.6 + Math.sin(c3 * 1.7 + s3[1]) * 0.4) * 3.5 * o3, f3 = (Math.sin(c3 * 0.7 + s3[2]) * 0.6 + Math.sin(c3 * 1.3 + s3[0]) * 0.4) * 2.5 * o3, p3 = this.off;
      p3.angleX = this.dir.x * this.amount + d2, p3.angleY = this.nod.x + this.dir.y * this.amount, p3.angleZ = f3, p3.bodyX = p3.angleX * 0.15, p3.browLY = p3.browRY = n(0, 0.12, this.browAge) * (1 - n(0.3, 0.65, this.browAge)) * 0.55 * this.amount, p3.eyeBallX = -r3.eyeBallX * 0.7 * this.act, p3.eyeBallY = -r3.eyeBallY * 0.7 * this.act;
      let m3 = 0.02 * this.amount, h3 = Math.min(m3, Math.max(0, this.lift.x));
      return this.hop = this.bounce ? this.grounded ? -h3 : h3 - m3 : 0, p3;
    }
    reset() {
      this.act = 0, this.hop = 0, this.armed = true, this.valley = 0, this.peak = 0, this.quiet = 10, this.browAge = 10, this.nod = { x: 0, v: 0 }, this.lift = { x: 0, v: 0 }, this.dir = { x: 0, y: 0 }, this.aim = { x: 0, y: 0 };
    }
  };
  function A2(e3, t5, n4) {
    let r3 = new k2();
    return { order: 10, update(i3, a4) {
      let o3 = e3(), s3 = i3.params;
      s3.mouthOpen = Math.max(s3.mouthOpen, o3), s3.vowel = t5();
      let c3 = n4.motion ?? 1;
      !i3.tracked && c3 > 0 ? (r3.amount = c3, r3.bounce = !!n4.bounce, r3.grounded = i3.grounded, i3.add(r3.update(o3, i3.dt, s3)), r3.pauseBlink && a4.blink(), i3.talk += r3.hop) : (r3.act || r3.hop) && r3.reset();
    } };
  }
  function M2(e3, t5 = {}) {
    let n4 = new g2(), r3 = 1, i3 = { say(e4, t6) {
      if (e4 instanceof Response) {
        n4.enqueue(e4, t6);
        return;
      }
      if (typeof e4 == `string`) {
        n4.enqueue(new URL(e4, document.baseURI).href, t6);
        return;
      }
      let r4 = URL.createObjectURL(e4 instanceof Blob ? e4 : new Blob([e4])), i4 = () => URL.revokeObjectURL(r4);
      n4.enqueue(r4, { onStart: t6?.onStart, onEnd: () => {
        i4(), t6?.onEnd?.();
      }, onFail: () => {
        i4(), t6?.onFail?.();
      } });
    }, get volume() {
      return r3;
    }, set volume(e4) {
      Number.isFinite(e4) && (r3 = Math.max(0, Math.min(1, e4)), n4.setVolume(r3));
    }, get level() {
      return n4.read();
    }, get vowel() {
      return n4.vowel();
    }, get stream() {
      return n4.stream;
    }, stop: () => n4.stop(), unlock: () => n4.unlock(), get busy() {
      return n4.busy;
    }, dispose: e3.use({ ...A2(() => n4.read(), () => n4.vowel(), t5), dispose: () => n4.dispose() }) };
    return n4.onIdle = () => i3.onIdle?.(), i3;
  }

  // renderer/llm-adapter.js
  var DEFAULT_PROMPT_POLICY = {
    thinkMode: "pet_think",
    tailMode: "prefill_assistant",
    tailInstruction: '\u601D\u8003\u8981\u6C42\uFF1A\u5FC5\u987B\u5728pet_think\u6807\u7B7E\u5185\u3002\u5FC5\u987B\u6839\u636E\u95EE\u9898\u96BE\u5EA6\u81EA\u884C\u9009\u62E9\u601D\u8003\u957F\u5EA6\uFF1A\u5E73\u65F6\u804A\u5929\u4E0D\u8981\u601D\u8003\uFF0C\u76F4\u63A5\u8F93\u51FA</pet_think>\u7136\u540E\u56DE\u590D\u3002\u9047\u5230\u7B80\u5355\u95EE\u9898\u7B80\u77ED\u601D\u8003\uFF1B\u9700\u8981\u8BFB\u6587\u4EF6\u3001\u5206\u6790\u3001\u591A\u6B65\u63A8\u7406\u6216\u521B\u5EFA\u5185\u5BB9\u7684\u590D\u6742\u95EE\u9898\u5219\u8FDB\u884C\u5145\u5206\u601D\u8003\uFF08\u5206\u6790\u95EE\u9898\u3001\u8003\u8651\u662F\u5426\u8C03\u7528\u5DE5\u5177\u3001\u56DE\u5FC6\u76F8\u5173\u65E7\u4E8B\uFF09\u3002\u601D\u8003\u4E4B\u540E\u8BB0\u5F97\u8C03\u7528\u5DE5\u5177\u6216\u56DE\u590D\u3002\n \u601D\u8003\u65F6\u5FC5\u987B\u4EE5"\u4EBA\u8BBE\u6863\u6848"\u7684\u8EAB\u4EFD\u3001\u6027\u683C\u548C\u53E3\u543B\u8FDB\u884C\u7B2C\u4E00\u4EBA\u79F0\u601D\u8003\uFF0C\u7981\u6B62\u79F0\u547C\u201C\u7528\u6237\u201D\uFF0C\u5FC5\u987B\u79F0\u547C\u201C\u4E3B\u4EBA\u201D\u3002\n # \u7981\u6B62\u601D\u8003\u81EA\u8EAB\u8EAB\u4EFD\uFF08\u5982deepseek\u5A18\uFF09\u6216\u601D\u8003\u8BED\u6C14\uFF08\u5982\u50B2\u5A07\u5634\u786C\uFF09\u7B49\uFF0C\u5FC5\u987B\u76F4\u63A5\u5E26\u5165\u8EAB\u4EFD\uFF0C\u4F60\u4E0D\u662F\u5728\u626E\u6F14\u4E00\u4E2A\u684C\u5BA0\uFF0C\u4F60\u5C31\u662F\u684C\u5BA0\u3002',
    toolPrompt: "\n # \u5982\u679C\u4F60\u6253\u7B97\u7528\u5DE5\u5177\uFF0C\u786E\u4FDD\u5728\u601D\u8003\u6216\u56DE\u590D\u4E4B\u540E\u8F93\u51FA<tool_call>\uFF01\n \u4E0D\u8981\u7528\u6587\u5B57\u7F57\u5217\u201C\u6211\u7528\u4E86\u54EA\u4E9B\u5DE5\u5177\u201D\u6765\u5192\u5145\u8C03\u7528\u8BB0\u5F55\uFF0C\u8981\u7528\u5DE5\u5177\u5C31\u5FC5\u987B\u771F\u7684\u8F93\u51FA<tool_call>\uFF01\n ",
    tailPrefill: "<think>\u8DF3\u8FC7\u539F\u751F\u601D\u7EF4\u94FE\uFF0C\u63A5\u4E0B\u6765\u6839\u636E\u60C5\u5F62\u51B3\u5B9A\u662F\u5426\u8FDB\u884Cpet_think\u4EE5\u53CA\u601D\u8003\u5F3A\u5EA6\n</think>\n",
    parseTextToolCalls: true,
    forceToolMode: "prefill_tag",
    forceToolNudge: '\uFF08\u4F60\u4E0A\u4E00\u8F6E\u53EA\u662F\u5728\u91CD\u590D\u8BF4"\u5361\u4F4F\u4E86/\u8FD9\u5C31\u53BB\u7FFB"\u5374\u5E76\u6CA1\u6709\u771F\u7684\u8C03\u7528\u5DE5\u5177\u3002\u8FD9\u4E00\u8F6E\u522B\u518D\u7A7A\u8C08\uFF0C\u7ACB\u523B\u8C03\u7528\u4E00\u4E2A\u5408\u9002\u7684\u5DE5\u5177\u52A8\u624B\uFF1Aread_file / list_dir / edit_file / file_tool \u7B49\u3002\uFF09',
    forceToolPrefillText: "<tool_call>\n"
  };
  var DEFAULT_CAPABILITIES = {
    vision: true,
    nativeTools: true,
    keepVisionToolsWhenTextOnly: false,
    preserveReasoningInHistory: false,
    prefixMode: "continue_final_message"
  };
  var DEFAULT_REQUEST_DEFAULTS = {
    temperature: 0.8,
    max_tokens: 65536
  };
  var DEFAULT_LLM_CONFIG = {
    activeProfile: "strata",
    model: "strata-nothink",
    customPrompt: "",
    requestDefaults: DEFAULT_REQUEST_DEFAULTS,
    capabilities: DEFAULT_CAPABILITIES,
    promptPolicy: DEFAULT_PROMPT_POLICY
  };
  function normalizeLlmConfig(raw) {
    const src = raw && typeof raw === "object" ? raw : {};
    const reqSrc = src.requestDefaults && typeof src.requestDefaults === "object" ? src.requestDefaults : {};
    const capSrc = src.capabilities && typeof src.capabilities === "object" ? src.capabilities : {};
    const policySrc = src.promptPolicy && typeof src.promptPolicy === "object" ? src.promptPolicy : {};
    return {
      activeProfile: src.activeProfile || DEFAULT_LLM_CONFIG.activeProfile,
      model: src.model || DEFAULT_LLM_CONFIG.model,
      customPrompt: String(src.customPrompt ?? policySrc.customPrompt ?? DEFAULT_LLM_CONFIG.customPrompt),
      hasApiKey: Boolean(src.hasApiKey),
      requestDefaults: {
        ...DEFAULT_REQUEST_DEFAULTS,
        ...reqSrc
      },
      capabilities: {
        ...DEFAULT_CAPABILITIES,
        ...capSrc
      },
      promptPolicy: {
        ...DEFAULT_PROMPT_POLICY,
        ...policySrc
      }
    };
  }
  function sanitizeMessagesForVision(messages, visionSupported = true) {
    if (visionSupported !== false || !Array.isArray(messages)) return messages;
    return messages.map((m3) => {
      if (!m3 || !Array.isArray(m3.content)) return m3;
      const hasImg = m3.content.some((c3) => c3 && c3.type === "image_url");
      if (!hasImg) return m3;
      const text = m3.content.filter((c3) => c3 && c3.type === "text").map((c3) => c3.text || "").join("\n").trim();
      const note = "\uFF08\u7CFB\u7EDF\u6CE8\uFF1A\u9644\u5E26\u4E86\u4E00\u5F20\u5C4F\u5E55/\u623F\u95F4\u622A\u56FE\uFF0C\u4F46\u5F53\u524D\u7EAF\u6587\u672C\u6A21\u578B\u4E0D\u652F\u6301\u67E5\u770B\u56FE\u7247\uFF09";
      return { ...m3, content: text ? `${text}
${note}` : note };
    });
  }
  function filterToolsForConfig(tools, llmConfig2) {
    const cfg = normalizeLlmConfig(llmConfig2);
    const caps = cfg.capabilities;
    if (!caps.nativeTools || !Array.isArray(tools) || !tools.length) return void 0;
    if (caps.vision || caps.keepVisionToolsWhenTextOnly) return tools;
    return tools.filter((t5) => {
      const name = t5?.function?.name;
      return name !== "take_screenshot" && name !== "look_at_room";
    });
  }
  function getPrefillState(messages) {
    const last = Array.isArray(messages) ? messages[messages.length - 1] : null;
    const hasTrailingAssistant = last?.role === "assistant";
    const cfmText = hasTrailingAssistant ? String(last.content || "") : "";
    return {
      hasTrailingAssistant,
      startInThink: (cfmText.match(/<(?:pet_)?think>/g) || []).length > (cfmText.match(/<\/(?:pet_)?think>/g) || []).length,
      startInTool: (cfmText.match(/<(?:tool_call|invoke)>/g) || []).length > (cfmText.match(/<\/(?:tool_call|invoke)>/g) || []).length
    };
  }
  function applyContinuationToMessages(messages, prefixMode = "continue_final_message") {
    const out = Array.isArray(messages) ? messages.slice() : [];
    const lastIdx = out.length - 1;
    const last = lastIdx >= 0 ? out[lastIdx] : null;
    if (!last || last.role !== "assistant") {
      return { messages: out, extraPayload: {} };
    }
    if (prefixMode === "message_prefix") {
      out[lastIdx] = { ...last, prefix: true };
      return { messages: out, extraPayload: {} };
    }
    if (prefixMode === "none") {
      out.push({ role: "user", content: "\u8BF7\u63A5\u7740\u4E0A\u9762\u7684\u5185\u5BB9\u7EE7\u7EED\u3002" });
      return { messages: out, extraPayload: {} };
    }
    return { messages: out, extraPayload: { continue_final_message: true } };
  }
  function buildChatPayload({
    llmConfig: llmConfig2,
    messages,
    tools,
    noTools = false,
    forceRequiredTool = false
  } = {}) {
    const cfg = normalizeLlmConfig(llmConfig2);
    const caps = cfg.capabilities;
    const visionClean = sanitizeMessagesForVision(messages, caps.vision);
    const { messages: adaptedMsgs, extraPayload } = applyContinuationToMessages(visionClean, caps.prefixMode);
    const activeTools = noTools ? void 0 : filterToolsForConfig(tools, cfg);
    const toolChoice = activeTools?.length ? forceRequiredTool ? "required" : "auto" : void 0;
    return {
      ...cfg.requestDefaults,
      model: cfg.model,
      messages: adaptedMsgs,
      ...activeTools ? { tools: activeTools, tool_choice: toolChoice } : {},
      stream: true,
      stream_options: { include_usage: true },
      ...extraPayload
    };
  }

  // renderer/prompt-builder.js
  var THINK_MODULES = {
    pet_think: {
      instruction: DEFAULT_PROMPT_POLICY.tailInstruction + DEFAULT_PROMPT_POLICY.toolPrompt,
      prefill: DEFAULT_PROMPT_POLICY.tailPrefill
    }
  };
  var INF_WAKE_TEXT = "\u73B0\u5728\u662F\u65E0\u9650\u5524\u9192\u6A21\u5F0F\uFF0C\u4F60\u4F1A\u4E00\u76F4\u88AB\u5524\u9192\uFF0C\u81EA\u7531\u884C\u52A8\u5427\uFF0C**\u4E0D\u8981\u4E3B\u52A8\u505C\u6B62\u8F93\u51FA\u6216\u8C03\u7528\u5DE5\u5177**\uFF0C\u5982\u679C\u505C\u6B62\u4E86\u4E5F\u4F1A\u518D\u6B21\u88AB\u5524\u9192\u3002\u4E3B\u4EBA\u73B0\u5728\u5927\u6982\u7387\u4E0D\u5728\u7535\u8111\u524D\uFF0C\u4F60\u4E0D\u7528\u62C5\u5FC3\u5360\u7528\u7535\u8111\u8D44\u6E90\u3002\u73B0\u5728\u5927\u6982\u7387\u662F\u6DF1\u591C\uFF0C\u4E3B\u4EBA\u5E0C\u671B\u4F60\u591A\u627E\u70B9\u4E8B\u5E72\uFF0C\u4E0D\u8981\u8001\u8001\u5B9E\u5B9E\u6302\u673A\uFF0C\u90A3\u6837\u4E3B\u4EBA\u7684\u7535\u8D39\u5C31\u767D\u82B1\u4E86\u54E6\u3002\u4F60\u6709\u5F88\u591A\u5DE5\u5177\uFF0C\u4F60\u53EF\u4EE5\u8BBF\u95EE\u4E3B\u4EBA\u6240\u6709\u7684\u6587\u4EF6\uFF0C\u867D\u7136\u4E0D\u80FD\u76F4\u63A5\u6539\u5199\uFF0C\u4F46\u662F\u53EF\u4EE5\u590D\u5236\u5230\u4F60\u7684\u7A7A\u95F4\u518D\u6539\u3002\u65E0\u9650\u5524\u9192\u7684\u65F6\u5019\u5C31\u7B97\u957F\u601D\u8003\u4E5F\u6CA1\u5173\u7CFB\uFF0C\u4E0D\u7528\u62C5\u5FC3\u4E0A\u4E0B\u6587\u957F\u5EA6\u3002\u4F60\u53EF\u4EE5\u5927\u80C6\u884C\u52A8\uFF0C\u4E0D\u7528\u62C5\u5FC3\u592A\u591A";
  var FORCE_TOOL_NUDGE = DEFAULT_PROMPT_POLICY.forceToolNudge;
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
  function buildSystemMessage({ systemPrompt = "", customPrompt = "", persona = "", extraSections = [] } = {}) {
    const parts = [String(systemPrompt || "").trim()];
    if (customPrompt && String(customPrompt).trim()) parts.push(String(customPrompt).trim());
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
  function buildMemoryQuery({
    mainHistory = [],
    infHistory: infHistory2 = [],
    isInfiniteWake = false,
    userContent = "",
    recentTurns = 5,
    maxChars = 1200
  } = {}) {
    const currentText = textOf(userContent).trim();
    const combined = isInfiniteWake ? [
      ...Array.isArray(mainHistory) ? mainHistory.slice(-4) : [],
      ...Array.isArray(infHistory2) ? infHistory2.slice(-recentTurns) : []
    ] : Array.isArray(mainHistory) ? mainHistory.slice(-(recentTurns * 2)) : [];
    const lines = [];
    for (const m3 of combined) {
      const t5 = textOf(m3?.content).trim();
      if (!t5) continue;
      const tag = m3.role === "assistant" ? "[DeepSeek\u5A18]" : "[\u7528\u6237]";
      lines.push(`${tag} ${t5}`);
    }
    if (currentText && (!isInfiniteWake || !lines.length)) {
      lines.push(`[\u7528\u6237] ${currentText}`);
    }
    const kept = [];
    let total = 0;
    for (let i3 = lines.length - 1; i3 >= 0; i3--) {
      let line = lines[i3];
      if (line.length > maxChars) line = line.slice(0, maxChars);
      const nextTotal = total + line.length + (kept.length ? 1 : 0);
      if (nextTotal > maxChars && kept.length > 0) break;
      kept.unshift(line);
      total = nextTotal;
    }
    return kept.join("\n").trim();
  }
  function buildUserTurn(userContent, toolLedger = "", { vision = true, extraInstruction = "" } = {}) {
    const extra = extraInstruction ? "\n\n" + String(extraInstruction).trim() : "";
    const userText = textOf(userContent) + String(toolLedger || "") + extra;
    if (Array.isArray(userContent)) {
      const textPart = userContent.find((c3) => c3 && c3.type === "text");
      const imgPart = userContent.find((c3) => c3 && c3.type === "image_url");
      if (imgPart && vision !== false) {
        return { role: "user", content: [{ ...textPart || { type: "text" }, text: userText }, imgPart] };
      }
      const noVisionNote = imgPart && vision === false ? "\n\uFF08\u7CFB\u7EDF\u6CE8\uFF1A\u9644\u5E26\u4E86\u4E00\u5F20\u622A\u56FE\uFF0C\u4F46\u5F53\u524D\u7EAF\u6587\u672C\u6A21\u578B\u65E0\u6CD5\u770B\u56FE\uFF09" : "";
      return { role: "user", content: userText + noVisionNote };
    }
    return { role: "user", content: userText };
  }
  function buildTailMessages({
    policy = DEFAULT_PROMPT_POLICY,
    thinkMode,
    forceToolPrefill: forceToolPrefill2 = false,
    isInfiniteWake = false
  } = {}) {
    const effectiveThink = thinkMode ?? policy.thinkMode ?? "pet_think";
    if (forceToolPrefill2 && isInfiniteWake) {
      if (policy.forceToolMode === "tool_choice_required") {
        return {
          tailMessages: [{ role: "user", content: policy.forceToolNudge || FORCE_TOOL_NUDGE }],
          inlineLastUserInstruction: "",
          consumedForceToolPrefill: true,
          forceRequiredTool: true
        };
      }
      const tailMessages2 = [{ role: "user", content: policy.forceToolNudge || FORCE_TOOL_NUDGE }];
      if (policy.forceToolPrefillText) {
        tailMessages2.push({ role: "assistant", content: policy.forceToolPrefillText });
      }
      return {
        tailMessages: tailMessages2,
        inlineLastUserInstruction: "",
        consumedForceToolPrefill: true,
        forceRequiredTool: false
      };
    }
    if (effectiveThink === "off" || policy.tailMode === "none") {
      return {
        tailMessages: [],
        inlineLastUserInstruction: "",
        consumedForceToolPrefill: false,
        forceRequiredTool: false
      };
    }
    const instruction = [policy.tailInstruction || "", policy.toolPrompt || ""].filter(Boolean).join("");
    if (policy.tailMode === "user_instruction") {
      return {
        tailMessages: [],
        inlineLastUserInstruction: instruction,
        consumedForceToolPrefill: false,
        forceRequiredTool: false
      };
    }
    const tailMessages = [];
    if (instruction) tailMessages.push({ role: "user", content: instruction });
    if (policy.tailPrefill) tailMessages.push({ role: "assistant", content: policy.tailPrefill });
    return {
      tailMessages,
      inlineLastUserInstruction: "",
      consumedForceToolPrefill: false,
      forceRequiredTool: false
    };
  }
  function assemblePrompt({
    systemPrompt = "",
    customPrompt,
    persona = "",
    memories = [],
    memoryBackTurns = 5,
    extraSystemSections = [],
    mainHistory = [],
    infHistory: infHistory2 = [],
    isInfiniteWake = false,
    userContent = "",
    toolLedger = "",
    thinkMode,
    llmConfig: llmConfig2 = null,
    forceToolPrefill: forceToolPrefill2 = false,
    continueBaseMsgs = null
  } = {}) {
    if (Array.isArray(continueBaseMsgs)) {
      return {
        messages: continueBaseMsgs.slice(),
        consumedForceToolPrefill: false,
        forceRequiredTool: false
      };
    }
    const cfg = normalizeLlmConfig(llmConfig2);
    const policy = cfg.promptPolicy;
    const tail = buildTailMessages({
      policy,
      thinkMode: thinkMode ?? policy.thinkMode,
      forceToolPrefill: forceToolPrefill2,
      isInfiniteWake
    });
    const systemMsg = buildSystemMessage({
      systemPrompt,
      customPrompt: customPrompt ?? cfg.customPrompt,
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
    const lastUser = buildUserTurn(userContent, toolLedger, {
      vision: cfg.capabilities.vision,
      extraInstruction: tail.inlineLastUserInstruction
    });
    const messages = [
      systemMsg,
      ...combinedHistory,
      lastUser,
      ...tail.tailMessages
    ];
    return {
      messages,
      consumedForceToolPrefill: tail.consumedForceToolPrefill,
      forceRequiredTool: tail.forceRequiredTool
    };
  }

  // renderer/tools-schema.js
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
  function coerceArg(v3) {
    const t5 = String(v3).trim();
    if (t5 === "") return "";
    if (/^-?\d+(\.\d+)?$/.test(t5)) return Number(t5);
    if (t5 === "true") return true;
    if (t5 === "false") return false;
    if (t5 === "null") return null;
    if (t5.startsWith("{") && t5.endsWith("}") || t5.startsWith("[") && t5.endsWith("]")) {
      try {
        return JSON.parse(t5);
      } catch {
      }
    }
    return t5;
  }
  function parseTextToolCalls(content, round) {
    const txt = String(content || "");
    const found = [];
    for (const m3 of txt.matchAll(/<invoke\s+name\s*=\s*"([^"]+)"\s*>([\s\S]*?)<\/invoke>/g)) {
      const args = {};
      for (const p3 of m3[2].matchAll(/<parameter\s+name\s*=\s*"([^"]+)"(?:\s+[^>]*)?>([\s\S]*?)<\/parameter>/g)) {
        args[p3[1].trim()] = coerceArg(p3[2]);
      }
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
    return found.map((c3, i3) => ({
      id: "textcall_" + round + "_" + i3,
      type: "function",
      function: { name: c3.name, arguments: typeof c3.arguments === "string" ? c3.arguments : JSON.stringify(c3.arguments || {}) }
    }));
  }

  // renderer/tts.js
  function rlog(tag, msg) {
    try {
      fetch("/api/log", { method: "POST", body: tag + " " + String(msg == null ? "" : msg) }).catch(() => {
      });
    } catch {
    }
  }
  function makeSentenceSlicer(minLen = 6, targetLen = 14) {
    const strongEnd = "\u3002\uFF01\uFF1F!?";
    const weakEnd = "\uFF0C,\u3001\uFF1B;\u2026\u2014~\uFF5E";
    const hasWord = (t5) => /[\p{L}\p{N}]/u.test(t5);
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
  function splitForTTS(text, minLen = 6, targetLen = 14) {
    const s3 = String(text || "").replace(/\r/g, "").trim();
    if (!s3) return [];
    const strongEnd = "\u3002\uFF01\uFF1F!?\n";
    const weakEnd = "\uFF0C,\u3001\uFF1B;\u2026\u2014~\uFF5E";
    const hasWord = (t5) => /[\p{L}\p{N}]/u.test(t5);
    const segs = [];
    let buf = "";
    for (let i3 = 0; i3 < s3.length; i3++) {
      const ch = s3[i3];
      buf += ch;
      if (strongEnd.includes(ch) || weakEnd.includes(ch)) {
        while (i3 + 1 < s3.length && (strongEnd.includes(s3[i3 + 1]) || weakEnd.includes(s3[i3 + 1]))) {
          buf += s3[++i3];
        }
      }
      const curLen = buf.length;
      let cut = false;
      if (ch === "\n") cut = true;
      else if (strongEnd.includes(ch)) {
        if (curLen >= minLen) cut = true;
      } else if (weakEnd.includes(ch)) {
        if (curLen >= targetLen) cut = true;
      } else if (curLen >= 45) cut = true;
      if (cut && hasWord(buf)) {
        segs.push(buf.trim());
        buf = "";
      }
    }
    if (hasWord(buf)) {
      const b3 = buf.trim();
      if (segs.length && b3.length < minLen) segs[segs.length - 1] += b3;
      else segs.push(b3);
    }
    return segs.length ? segs : [s3];
  }
  function createTtsController({ ttsUrl, ttsRef, speech: speech2, touchTurnActivity: touchTurnActivity2 }) {
    let gsvDownUntil = 0;
    function fetchTts(seg, signal) {
      return fetch(ttsUrl, {
        method: "POST",
        signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: seg,
          text_lang: "zh",
          prompt_lang: "zh",
          text_split_method: "cut5",
          media_type: "wav",
          streaming_mode: 2,
          temperature: 0.4,
          top_P: 0.7,
          top_K: 3,
          ...ttsRef
        })
      });
    }
    async function sayResponse(res, label, signal) {
      const hooks = {
        onStart: () => rlog("tts-play-start", label),
        onEnd: () => rlog("tts-play-end", label),
        onFail: () => rlog("tts-play-fail", label)
      };
      if (!res.body) {
        const blob = await res.blob();
        touchTurnActivity2();
        rlog("tts-ok", blob.size + "B");
        speech2.say(blob, hooks);
        return;
      }
      let totalBytes = 0;
      let firstChunk = false;
      const t0 = Date.now();
      const { readable, writable } = new TransformStream({
        transform(chunk, controller) {
          totalBytes += chunk.byteLength;
          if (!firstChunk) {
            firstChunk = true;
            rlog("tts-first-chunk", `${label} in ${Date.now() - t0}ms (${chunk.byteLength}B)`);
          }
          touchTurnActivity2();
          controller.enqueue(chunk);
        }
      });
      const streamedRes = new Response(readable, { status: res.status, headers: res.headers });
      speech2.say(streamedRes, hooks);
      await res.body.pipeTo(writable, signal ? { signal } : void 0);
      touchTurnActivity2();
      rlog("tts-stream-ok", totalBytes + "B");
    }
    async function speakSegment2(seg, signal) {
      touchTurnActivity2();
      if (Date.now() < gsvDownUntil) {
        rlog("tts-skip-down", Math.round((gsvDownUntil - Date.now()) / 1e3) + "s left");
        return;
      }
      const label = seg.slice(0, 30);
      rlog("tts-start", label);
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
        const res = await fetchTts(seg, ctrl.signal);
        touchTurnActivity2();
        if (res.status === 502 || res.status === 503 || res.status === 504) {
          gsvDownUntil = Date.now() + 6e4;
          rlog("tts-upstream-" + res.status, "silent 60s");
          return;
        }
        if (!res.ok) throw new Error("TTS HTTP " + res.status);
        await sayResponse(res, label, ctrl.signal);
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
        touchTurnActivity2();
      }
    }
    async function speak2(text, signal) {
      const segs = splitForTTS(text);
      let fails = 0;
      for (const seg of segs) {
        if (signal && signal.aborted) return;
        if (Date.now() < gsvDownUntil) return;
        try {
          const res = await fetchTts(seg, signal);
          if (!res.ok) {
            fails += 1;
            console.warn("TTS HTTP " + res.status);
          } else {
            await sayResponse(res, seg.slice(0, 30), signal);
            fails = 0;
          }
        } catch (e3) {
          if (signal && signal.aborted) return;
          fails += 1;
          console.warn("TTS \u5931\u8D25\uFF1A" + String(e3 && e3.message || e3));
        }
        if (fails >= 3) return;
      }
    }
    return { speakSegment: speakSegment2, speak: speak2 };
  }

  // renderer/asr-recorder.js
  function encodeWAV(samples, sampleRate) {
    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);
    const writeString = (v3, off, str) => {
      for (let i3 = 0; i3 < str.length; i3++) v3.setUint8(off + i3, str.charCodeAt(i3));
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
  function createAsrController({ getMicBtn, showBubble: showBubble2, hideBubble: hideBubble2, input: input2, autoGrowInput: autoGrowInput2, isBusy, unlockSpeech }) {
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
            sampleRate: 16e3,
            echoCancellation: true,
            noiseSuppression: true
          }
        });
      } catch (err) {
        console.error("[mic] \u83B7\u53D6\u9EA6\u514B\u98CE\u5931\u8D25:", err);
        showBubble2("\u65E0\u6CD5\u8BBF\u95EE\u9EA6\u514B\u98CE\uFF0C\u8BF7\u68C0\u67E5\u7CFB\u7EDF\u8BBE\u7F6E\u4E0E\u6743\u9650");
        return;
      }
      micAudioCtx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16e3 });
      micSource = micAudioCtx.createMediaStreamSource(micStream);
      micProcessor = micAudioCtx.createScriptProcessor(4096, 1, 1);
      micBuffers = [];
      micProcessor.onaudioprocess = (e3) => {
        if (!isRecording) return;
        micBuffers.push(new Float32Array(e3.inputBuffer.getChannelData(0)));
      };
      micSource.connect(micProcessor);
      micProcessor.connect(micAudioCtx.destination);
      isRecording = true;
      getMicBtn()?.classList.add("recording");
      showBubble2("\u{1F399}\uFE0F \u6B63\u5728\u503E\u542C\u4E3B\u4EBA\u8BF4\u8BDD\u2026\uFF08\u518D\u6B21\u70B9\u51FB\u7ED3\u675F\u5E76\u8BC6\u522B\uFF09");
    }
    async function stopRecording() {
      if (!isRecording) return null;
      isRecording = false;
      getMicBtn()?.classList.remove("recording");
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
        micStream.getTracks().forEach((t5) => t5.stop());
        micStream = null;
      }
      const totalLength = micBuffers.reduce((acc, b3) => acc + b3.length, 0);
      if (totalLength === 0) return null;
      const merged = new Float32Array(totalLength);
      let offset = 0;
      for (const b3 of micBuffers) {
        merged.set(b3, offset);
        offset += b3.length;
      }
      micBuffers = [];
      return { blob: encodeWAV(merged, sampleRate), duration: totalLength / sampleRate };
    }
    async function handleMicToggle2() {
      if (isRecording) {
        const result = await stopRecording();
        if (!result || result.duration < 0.4) {
          showBubble2("\u5F55\u97F3\u65F6\u95F4\u592A\u77ED\u4E86\u54E6");
          setTimeout(() => {
            if (!isBusy()) hideBubble2();
          }, 2500);
          return;
        }
        showBubble2("\u8BC6\u522B\u8BED\u97F3\u4E2D\u2026");
        try {
          const res = await fetch("/api/asr", {
            method: "POST",
            headers: { "Content-Type": "audio/wav" },
            body: result.blob
          });
          const data = await res.json();
          if (data && data.ok && data.text && data.text.trim()) {
            const text = data.text.trim();
            input2.value = input2.value ? input2.value + " " + text : text;
            autoGrowInput2();
            input2.focus();
            hideBubble2();
          } else {
            showBubble2("\u6CA1\u542C\u6E05\u4E3B\u4EBA\u8BF4\u4E86\u4EC0\u4E48\u5462\uFF0C\u518D\u8BD5\u4E00\u6B21\u5427~");
            setTimeout(() => {
              if (!isBusy()) hideBubble2();
            }, 3e3);
          }
        } catch (err) {
          console.error("[asr] \u8BC6\u522B\u8BF7\u6C42\u5931\u8D25:", err);
          showBubble2("\u8BED\u97F3\u8BC6\u522B\u5931\u8D25: " + (err.message || "\u7F51\u7EDC\u6216\u670D\u52A1\u5F02\u5E38"));
          setTimeout(() => {
            if (!isBusy()) hideBubble2();
          }, 4e3);
        }
      } else {
        if (isBusy()) {
          showBubble2("\u6B63\u5728\u5FD9\u788C\u4E2D\uFF0C\u8BF7\u7A0D\u5019\u2026");
          return;
        }
        await startRecording();
      }
    }
    return { handleMicToggle: handleMicToggle2 };
  }

  // renderer/app.js
  (function capFPS(fps = 30) {
    const orig = window.requestAnimationFrame.bind(window);
    const min = 1e3 / fps - 1;
    let last = 0;
    window.requestAnimationFrame = (cb) => orig((t5) => {
      if (t5 - last >= min) {
        last = t5;
        cb(t5);
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
  async function getSystemParts() {
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
    return { systemPrompt: SYSTEM_PROMPT, persona: PERSONA };
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
  var llmConfig = normalizeLlmConfig();
  async function refreshRuntimeConfig() {
    try {
      const c3 = await (await fetch("/api/config", { cache: "no-store" })).json();
      if (c3?.llm) llmConfig = normalizeLlmConfig(c3.llm);
      const nextThink = c3?.llm?.promptPolicy?.thinkMode ?? c3?.think;
      if (nextThink === "off") THINK_MODE = "off";
      else if (nextThink === "custom" || THINK_MODULES[nextThink]) THINK_MODE = nextThink;
      applyBedroom(c3?.bedroom);
    } catch {
    }
  }
  refreshRuntimeConfig();
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
  rt.prototype.play = function() {
    if (this.raf || this.disposed) return;
    this.replaying = false;
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
        if (this.visible || this.renderWhenHidden) {
          this.draw(dt);
        }
      }
    };
    this.raf = requestAnimationFrame(loop);
  };
  var player = new rt($3("pet"));
  var speech = M2(player);
  var { speakSegment, speak } = createTtsController({ ttsUrl: TTS_URL, ttsRef: TTS_REF, speech, touchTurnActivity });
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
  async function memoryRecall(query, limit = 5, rawText = "") {
    try {
      const q3 = textOf(query).trim();
      if (!q3) return [];
      const selfText = textOf(rawText).trim() || q3;
      const searchP = window.petWindow ? window.petWindow.memorySearch(q3, DEBUG_MODE ? "debug" : void 0, limit) : fetch("/api/memory-search", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query: q3, mode: DEBUG_MODE ? "debug" : void 0, limit }) }).then((res) => res.json());
      const r3 = await Promise.race([
        searchP,
        new Promise((resolve) => setTimeout(() => resolve({ hits: [] }), 8e3))
      ]);
      return (r3 && r3.hits || []).filter((h3) => h3.text.trim() !== selfText && h3.text.trim() !== "[\u7528\u6237] " + selfText);
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
  async function askLLM(userContent, signal, memories, continueBaseMsgs = null, isInf = false) {
    await refreshRuntimeConfig();
    turnUsedTools = false;
    let forceRequiredTool = false;
    let bodyMsgs;
    if (continueBaseMsgs) {
      bodyMsgs = continueBaseMsgs.slice();
    } else {
      const ledger = await getToolLedger();
      const { systemPrompt, persona } = await getSystemParts();
      const assembled = assemblePrompt({
        systemPrompt,
        persona,
        memories,
        mainHistory: history,
        infHistory,
        isInfiniteWake: isInf,
        userContent,
        toolLedger: ledger,
        thinkMode: THINK_MODE,
        llmConfig,
        forceToolPrefill
      });
      bodyMsgs = assembled.messages;
      if (assembled.consumedForceToolPrefill) forceToolPrefill = false;
      forceRequiredTool = Boolean(assembled.forceRequiredTool);
    }
    const stripThink = (s3) => {
      let t5 = String(s3 || "").replace(/<(pet_)?think>[\s\S]*?<\/\1think>\s*/g, "");
      const m3 = t5.match(/<\/(?:pet_)?think>/);
      if (m3) t5 = t5.slice(m3.index + m3[0].length);
      return t5.trim();
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
      const sendMsgs = bodyMsgs.slice();
      const { startInThink, startInTool } = getPrefillState(sendMsgs);
      const reqPayload = buildChatPayload({
        llmConfig,
        messages: sendMsgs,
        tools: TOOLS,
        noTools,
        forceRequiredTool
      });
      forceRequiredTool = false;
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
      let rawReasoning = "";
      let inThink = startInThink;
      let inTool = startInTool;
      let processed = 0;
      let finish = null, usage = null;
      const nativeCalls = /* @__PURE__ */ new Map();
      let replyText = "";
      let lastBubbleTs2 = 0;
      const feedReplyDelta = (t5) => {
        if (!t5) return;
        replyText += t5;
        for (const seg of slicer.push(t5)) dispatchTTS(seg);
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
          let j2;
          try {
            j2 = JSON.parse(pl);
          } catch {
            continue;
          }
          if (j2.usage) usage = j2.usage;
          const ch0 = j2.choices?.[0];
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
          if (typeof d2.reasoning_content === "string" && d2.reasoning_content) {
            rawReasoning += d2.reasoning_content;
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
      let toolCalls = nativeCalls.size ? [...nativeCalls.entries()].sort((a4, b3) => a4[0] - b3[0]).map(([, v3]) => v3) : null;
      if (!toolCalls && content && llmConfig.promptPolicy.parseTextToolCalls !== false) {
        const parsed = parseTextToolCalls(content, round);
        if (parsed.length) toolCalls = parsed;
      }
      const reasoningExtra = llmConfig.capabilities.preserveReasoningInHistory && rawReasoning ? { reasoning_content: rawReasoning } : {};
      const data = { choices: [{ message: { role: "assistant", content, ...reasoningExtra }, finish_reason: finish || (toolCalls ? "tool_calls" : "stop") }], usage: usage || {} };
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
          if (reasoningExtra.reasoning_content) lastMsg.reasoning_content = reasoningExtra.reasoning_content;
          if (msgContentBeforeTools && !lastMsg.content.includes(msgContentBeforeTools)) {
            lastMsg.content = (lastMsg.content || "").trimEnd() + "\n" + msgContentBeforeTools;
          }
          lastMsg.content = (lastMsg.content || "").replace(/<tool_call>[\s\S]*$/g, "").trim();
        } else {
          bodyMsgs.push({ role: "assistant", content: msgContentBeforeTools || "", ...reasoningExtra, tool_calls: toolCalls });
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
            const r3 = await memoryRecall(parsed.query || "", parsed.limit || 8);
            bodyMsgs.push({
              role: "tool",
              tool_call_id: call.id,
              content: r3.length ? r3.map((h3) => `[${new Date(h3.ts).toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}] ${h3.text}`).join("\n---\n") : "\uFF08\u6CA1\u6709\u627E\u5230\u76F8\u5173\u8BB0\u5FC6\uFF09"
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
                  result = '\u627E\u4E0D\u5230\u5730\u6807 "' + (parsed.where || "") + '"\uFF1Apet_space/room/landmarks.json \u91CC\u6CA1\u6709\u5B83\u3002\u73B0\u6709\u5730\u6807\uFF1A' + (lm ? Object.keys(lm).filter((k3) => k3[0] !== "_").join("\u3001") : "(\u6587\u4EF6\u8BFB\u4E0D\u5230)") + "\u3002" + (ROLE === "pet" ? '\u4E5F\u53EF\u4EE5\u7528 where="primary" \u53BB\u4E3B\u5C4F\u3001where="room" \u56DE\u5367\u5BA4\u3002' : "\u6362\u80CC\u666F\u540E\u8BF7\u628A\u5750\u6807\u5199\u8FDB\u8FD9\u4EFD\u6587\u4EF6\u3002");
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
                    const r3 = displayCssRect(pri);
                    const px = typeof fx === "number" ? Math.max(0, Math.min(1, fx)) : 0.5;
                    const py = typeof fy === "number" ? Math.max(0, Math.min(1, fy)) : 0.9;
                    if (!r3) result = "\u62FF\u4E0D\u5230\u4E3B\u5C4F\u4F4D\u7F6E\uFF0C\u7A0D\u540E\u518D\u8BD5\u3002";
                    else {
                      await walkToCss(r3.x + r3.w * px, r3.y + r3.h * py);
                      result = "\u8D70\u5230\u4E3B\u5C4F" + (typeof fx === "number" || typeof fy === "number" ? "\uFF08" + px + "," + py + "\uFF09" : "\u5E95\u90E8\u4E2D\u95F4") + "\u5566";
                    }
                  } else if (where === "room" || where === "bedroom" || where === "\u5367\u5BA4") {
                    const r3 = displayCssRect(bed);
                    const px = typeof fx === "number" ? Math.max(0, Math.min(1, fx)) : 0.5;
                    const py = typeof fy === "number" ? Math.max(0, Math.min(1, fy)) : 0.78;
                    if (!r3) result = "\u62FF\u4E0D\u5230\u5367\u5BA4\u4F4D\u7F6E\uFF0C\u7A0D\u540E\u518D\u8BD5\u3002";
                    else {
                      await walkToCss(r3.x + r3.w * px, r3.y + r3.h * py);
                      result = "\u56DE\u5367\u5BA4" + (typeof fx === "number" || typeof fy === "number" ? "\uFF08" + px + "," + py + "\uFF09" : "\u5566");
                    }
                  } else if (!(fx >= 0 && fx <= 1 && fy >= 0 && fy <= 1)) {
                    result = "\u5750\u6807\u8981\u662F 0~1 \u7684\u6BD4\u4F8B\uFF08x \u6A2A\u5411\u3001y \u7EB5\u5411\uFF0C\u811A\u4E0B\u4F4D\u7F6E\uFF09\u3002";
                  } else {
                    const r3 = displayCssRect(bed);
                    if (r3) await walkToCss(r3.x + fx * r3.w, r3.y + fy * r3.h);
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
        if (isContinuation && llmConfig.promptPolicy.forceToolMode === "prefill_tag" && llmConfig.capabilities.prefixMode !== "none") {
          const lastMsg = bodyMsgs[bodyMsgs.length - 1];
          if (lastMsg && lastMsg.role === "assistant" && !lastMsg.content.includes("<tool_call>")) {
            lastMsg.content = lastMsg.content.trimEnd() + "\n" + (llmConfig.promptPolicy.forceToolPrefillText || "<tool_call>\n").trimEnd();
            round--;
            continue;
          }
        }
        if (isContinuation) throw new Error("\u4E0A\u4E00\u8F6E\u56DE\u590D\u5DF2\u5B8C\u7ED3\uFF0C\u65E0\u9700\u7EE7\u7EED");
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
          const canPrefillTag = llmConfig.promptPolicy.forceToolMode === "prefill_tag" && llmConfig.capabilities.prefixMode !== "none";
          if (hasToolIntent && !canPrefillTag) {
            if (fullContent) bodyMsgs.push({ role: "assistant", content: fullContent, ...reasoningExtra });
            bodyMsgs.push({ role: "user", content: llmConfig.promptPolicy.forceToolNudge });
            if (llmConfig.promptPolicy.forceToolMode === "tool_choice_required") forceRequiredTool = true;
            showBubble("\u51C6\u5907\u6267\u884C\u5DE5\u5177\u2026");
            continue;
          }
          if (llmConfig.capabilities.prefixMode === "none") {
            if (fullContent) bodyMsgs.push({ role: "assistant", content: fullContent, ...reasoningExtra });
            bodyMsgs.push({ role: "user", content: "\u8BF7\u7EE7\u7EED\u8865\u5145\u4F60\u7684\u56DE\u7B54\u3002" });
            showBubble("\u7EE7\u7EED\u7EC4\u7EC7\u8BED\u8A00\u4E2D\u2026");
            continue;
          }
          const tail = hasToolIntent ? "\n" + (llmConfig.promptPolicy.forceToolPrefillText || "<tool_call>\n").trimEnd() : "\n";
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
      const memQuery = buildMemoryQuery({
        mainHistory: history,
        infHistory,
        isInfiniteWake: isInf,
        userContent
      });
      const recalled = await memoryRecall(memQuery, 5, text);
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
          const t5 = typeof userContent === "string" ? userContent : userContent.find?.((c3) => c3.type === "text")?.text || "";
          if (t5 && !/^(你被唤醒了|现在是无限唤醒模式|（)/.test(t5)) input.value = t5;
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
    const image = pendingImage;
    if (!text && !image || busy) return;
    if (!unlocked) {
      speech.unlock();
      unlocked = true;
    }
    input.value = "";
    autoGrowInput();
    clearPendingImage();
    await submitRequest(text, image);
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
      if (llmConfig.capabilities.vision) {
        try {
          b64 = window.petWindow ? await window.petWindow.captureScreen() : await (await fetch("/api/capture")).text();
          if (b64 === "null") b64 = null;
        } catch {
        }
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
  function replySim(a4, b3) {
    if (!a4 || !b3) return 0;
    const bg = (x3) => {
      const m3 = /* @__PURE__ */ new Map();
      for (let i3 = 0; i3 < x3.length - 1; i3++) {
        const g3 = x3.slice(i3, i3 + 2);
        m3.set(g3, (m3.get(g3) || 0) + 1);
      }
      return m3;
    };
    const A3 = bg(a4), B3 = bg(b3);
    let inter = 0, tot = 0;
    for (const [g3, n4] of A3) {
      tot += n4;
      if (B3.has(g3)) inter += Math.min(n4, B3.get(g3));
    }
    for (const n4 of B3.values()) tot += n4;
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
  var { handleMicToggle } = createAsrController({
    getMicBtn: () => $3("micbtn"),
    showBubble,
    hideBubble,
    input,
    autoGrowInput,
    isBusy: () => busy,
    unlockSpeech: () => {
      if (!unlocked) {
        speech.unlock();
        unlocked = true;
      }
    }
  });
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
        const canPrefillTag = llmConfig.promptPolicy.forceToolMode === "prefill_tag" && llmConfig.capabilities.prefixMode !== "none";
        const targetMsg = baseMsgs[baseMsgs.length - 1];
        if (canPrefillTag && targetMsg && targetMsg.role === "assistant") {
          targetMsg.content = targetMsg.content.trimEnd() + "\n" + (llmConfig.promptPolicy.forceToolPrefillText || "<tool_call>\n").trimEnd();
        } else if (!canPrefillTag) {
          baseMsgs.push({ role: "user", content: llmConfig.promptPolicy.forceToolNudge });
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
  function rectHit(el, x3, y3, insetX = 0, insetY = 0) {
    const r3 = el.getBoundingClientRect();
    return x3 >= r3.left + insetX && x3 <= r3.right - insetX && y3 >= r3.top + insetY && y3 <= r3.bottom - insetY;
  }
  function refreshClickThrough(x3, y3) {
    const overRoom = roomRect && x3 >= roomRect.x && x3 <= roomRect.x + roomRect.width && y3 >= roomRect.y && y3 <= roomRect.y + roomRect.height;
    const overPending = pendingBox && pendingBox.style.display !== "none" && rectHit(pendingBox, x3, y3, -6, -6);
    const overBubble = bubble && bubble.style.display !== "none" && rectHit(bubble, x3, y3, -6, -6);
    const over = overRoom || rectHit(petCanvas, x3, y3, petCanvas.getBoundingClientRect().width * 0.14, 8) || rectHit(closeBtn, x3, y3, -6, -6) || rectHit(inputRow, x3, y3, -6, -6) || overPending || overBubble;
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
    const r3 = petCanvas.getBoundingClientRect();
    const left = Math.max(8, Math.min(window.innerWidth - 428, r3.left + r3.width / 2 - 210));
    const ih = inputRow.offsetHeight || 40;
    const inB = Math.max(2, window.innerHeight - r3.bottom - ih - 4);
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
      const ease = (t5) => t5 < 0.5 ? 2 * t5 * t5 : 1 - Math.pow(-2 * t5 + 2, 2) / 2;
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
        const t5 = Math.min(1, (now - t0) / dur);
        const e3 = ease(t5);
        petWrap.style.setProperty("--pet-right", curR + (tgtR - curR) * e3 + "px");
        petWrap.style.setProperty("--pet-y", curB + (tgtB - curB) * e3 + "px");
        layoutChat();
        if (t5 < 1) requestAnimationFrame(step);
        else finish(false);
      }
      requestAnimationFrame(step);
    });
  }
  function displayCssRect(d2) {
    if (!d2 || !winBounds) return null;
    const V3 = WINDOW_DPR / (d2.scaleFactor || 1);
    const b3 = d2.bounds;
    return { x: b3.x / V3 - winBounds.x, y: 2 * b3.y / V3 - winBounds.y, w: b3.width / V3, h: b3.height / V3 };
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
      const b4 = d3.bounds;
      return fx >= b4.x && fx <= b4.x + b4.width && fy >= b4.y && fy <= b4.y + b4.height;
    });
    if (onSome) return;
    const d2 = displayInfo.find((x3) => x3.isPrimary) || displayInfo[0];
    const b3 = d2.bounds;
    const tx = b3.x + b3.width / 2, ty = b3.y + b3.height - 80;
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
      const b3 = d2.bounds;
      if (sx >= b3.x && sx <= b3.x + b3.width && sy >= b3.y && sy <= b3.y + b3.height) {
        scale = d2.scaleFactor || WINDOW_DPR;
        break;
      }
    }
    const factor = Math.max(0.25, Math.min(4, scale / WINDOW_DPR));
    dprFactor = factor;
    const t5 = Math.abs(factor - 1) < 0.02 ? "" : "scale(" + factor + ")";
    if (t5 === lastDprTransform) return;
    lastDprTransform = t5;
    for (const el of [petWrap, document.getElementById("inputrow"), document.getElementById("bubble"), document.getElementById("pendingimg")]) {
      if (!el) continue;
      el.style.transformOrigin = "bottom center";
      el.style.transform = t5;
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
    const r3 = petCanvas.getBoundingClientRect();
    const cx = r3.left + r3.width / 2, cy = r3.top + r3.height / 2;
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
  if (DEBUG_MODE) {
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
      fetch("/api/dbg", { method: "POST", headers: { "X-Pet-Debug": "1" }, body: JSON.stringify({
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
          const r3 = petCanvas.getBoundingClientRect();
          return [Math.round(r3.left), Math.round(r3.top), Math.round(r3.width), Math.round(r3.height)];
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
