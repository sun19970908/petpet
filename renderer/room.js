// 卧室：iframe 定位、窗帘/灯状态、人物是否在房间
export function createRoomController({
  role,
  roomEl,
  roomFrame,
  getPetRect,
  isBusy,
  showBubble,
  hideBubble,
  recenterPet,
  refreshDisplays,
  layoutChat,
}) {
  let bedroomMode = false; // 整窗在副屏 = 卧室铺满视口
  let roomRect = null; // 卧室矩形（CSS px）；卧室模式下 = 整个视口
  let roomState = { curtain: 'open', lamp: 'off' };
  let inRoom = false;

  function updateInRoom(announce = false) {
    const was = inRoom;
    if (!roomRect) { inRoom = false; return; }
    const r = getPetRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    inRoom = cx >= roomRect.x && cx <= roomRect.x + roomRect.width && cy >= roomRect.y && cy <= roomRect.y + roomRect.height;
    if (inRoom !== was && announce && !isBusy()) {
      showBubble(inRoom ? '回卧室啦~' : '出来陪你啦~');
      setTimeout(() => { if (!isBusy()) hideBubble(); }, 4000);
    }
  }

  function syncRoomRect() {
    roomRect = bedroomMode ? { x: 0, y: 0, width: innerWidth, height: innerHeight } : null;
    updateInRoom();
  }

  function applyBedroom(on) {
    bedroomMode = role === 'pet' ? false : !!on; // 双窗：桌宠窗不画房间（房间在独立的卧室窗）
    roomEl.style.display = bedroomMode ? 'block' : 'none';
    syncRoomRect();
  }

  // 把状态推给她的房间页（窗帘/灯由她渲染）
  function pushRoomState() {
    try { roomFrame && roomFrame.contentWindow && roomFrame.contentWindow.postMessage({ type: 'set-room-state', state: roomState }, '*'); } catch {}
  }

  async function setRoomState(patch) {
    if (patch.curtain === 'open' || patch.curtain === 'closed') roomState.curtain = patch.curtain;
    if (patch.lamp === 'on' || patch.lamp === 'off') roomState.lamp = patch.lamp;
    pushRoomState();
    try {
      if (window.petWindow) await window.petWindow.roomStateSave(roomState);
      else await fetch('/api/room-state', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(roomState) });
    } catch {}
  }

  // 她的房间页点窗帘/灯后上报；只认这两种消息形状，其余一律忽略
  window.addEventListener('message', (e) => {
    if (!roomFrame || e.source !== roomFrame.contentWindow) return;
    const d = e.data;
    if (!d || typeof d !== 'object') return;
    if (d.type === 'pet-recenter') { recenterPet(); return; }
    if (d.type === 'room-state-request') { pushRoomState(); return; }
    if (d.type !== 'room-state') return;
    if (d.curtain === 'open' || d.curtain === 'closed') roomState.curtain = d.curtain;
    if (d.lamp === 'on' || d.lamp === 'off') roomState.lamp = d.lamp;
    try {
      if (window.petWindow) window.petWindow.roomStateSave(roomState);
      else fetch('/api/room-state', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(roomState) });
    } catch {}
  });
  if (roomFrame) roomFrame.addEventListener('load', pushRoomState);

  // 桌宠窗永远不渲染房间（房间在独立卧室窗）：把隐藏 iframe 也置空。
  // 否则她的房间脚本会在桌宠窗里再跑一份——改动出 bug 会拖死桌宠窗的输入/拖动，
  // 而且页面加载时 self report 的状态会覆盖窗帘/灯存盘。
  if (role === 'pet' && roomFrame) { try { roomFrame.src = 'about:blank'; } catch {} }

  // 她改了 pet_space/room/ 下的文件：只重载房间 iframe（带缓存戳），不用重启 app
  window.petWindow?.onRoomChanged?.(() => {
    if (roomFrame) roomFrame.src = '/pet_space/room/index.html?t=' + Date.now();
  });

  (async () => {
    let s = null;
    try { s = window.petWindow ? await window.petWindow.roomStateLoad() : await (await fetch('/api/room-state')).json(); } catch {}
    roomState = { curtain: s?.curtain === 'closed' ? 'closed' : 'open', lamp: s?.lamp === 'on' ? 'on' : 'off' };
    pushRoomState();
  })();

  // 副屏插拔/分辨率变化：主进程重算窗口后通知这里重新拿房间矩形
  window.petWindow?.onDisplaysChanged?.(async () => {
    try {
      const c = await (await fetch('/api/config', { cache: 'no-store' })).json();
      applyBedroom(c?.bedroom);
      await refreshDisplays();
      layoutChat();
    } catch {}
  });

  return {
    applyBedroom,
    syncRoomRect,
    setRoomState,
    updateInRoom,
    pushRoomState,
    get state() { return roomState; },
    get inRoom() { return inRoom; },
    get bedroomMode() { return bedroomMode; },
    get rect() { return roomRect; },
  };
}
