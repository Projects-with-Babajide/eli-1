// ─── Timmy interactive dialogue ───────────────────────────────────────────────

let _container = null;

function injectStyles() {
  if (document.getElementById('timmy-dlg-style')) return;
  const s = document.createElement('style');
  s.id = 'timmy-dlg-style';
  s.textContent = `
    #timmy-dlg {
      position: fixed;
      bottom: 60px;
      left: 50%;
      transform: translateX(-50%);
      width: min(680px, 90vw);
      background: rgba(8, 8, 12, 0.93);
      border: 1px solid rgba(136, 170, 255, 0.35);
      border-radius: 4px;
      padding: 22px 28px 20px;
      font-family: 'Courier New', monospace;
      z-index: 80;
      box-shadow: 0 0 30px rgba(136,170,255,0.08);
      pointer-events: all;
    }
    #timmy-dlg .tdlg-name {
      color: #88aaff;
      font-size: 11px;
      letter-spacing: 3px;
      text-transform: uppercase;
      margin-bottom: 10px;
    }
    #timmy-dlg .tdlg-text {
      color: #e8e8e8;
      font-size: 15px;
      line-height: 1.65;
      letter-spacing: 1px;
      margin-bottom: 18px;
      min-height: 24px;
    }
    #timmy-dlg .tdlg-choices {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    #timmy-dlg .tdlg-btn {
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.12);
      color: #ccc;
      font-family: 'Courier New', monospace;
      font-size: 13px;
      letter-spacing: 1px;
      padding: 10px 16px;
      text-align: left;
      cursor: pointer;
      border-radius: 2px;
      transition: background 0.15s, border-color 0.15s, color 0.15s;
    }
    #timmy-dlg .tdlg-btn:hover {
      background: rgba(136,170,255,0.12);
      border-color: rgba(136,170,255,0.5);
      color: #fff;
    }
    #timmy-dlg .tdlg-close {
      display: block;
      margin-top: 14px;
      background: none;
      border: none;
      color: rgba(255,255,255,0.2);
      font-family: 'Courier New', monospace;
      font-size: 10px;
      letter-spacing: 2px;
      cursor: pointer;
      text-transform: uppercase;
      padding: 0;
    }
    #timmy-dlg .tdlg-close:hover { color: rgba(255,255,255,0.5); }
  `;
  document.head.appendChild(s);
}

function buildUI() {
  injectStyles();
  const div = document.createElement('div');
  div.id = 'timmy-dlg';
  div.innerHTML = `
    <div class="tdlg-name">Timmy</div>
    <div class="tdlg-text"></div>
    <div class="tdlg-choices"></div>
    <button class="tdlg-close">[ close ]</button>
  `;
  div.querySelector('.tdlg-close').addEventListener('click', closeDialogue);
  document.body.appendChild(div);
  _container = div;
}

function setText(text) {
  _container.querySelector('.tdlg-text').textContent = text;
}

function setChoices(choices) {
  const box = _container.querySelector('.tdlg-choices');
  box.innerHTML = '';
  choices.forEach(({ label, cb }) => {
    const btn = document.createElement('button');
    btn.className = 'tdlg-btn';
    btn.textContent = label;
    btn.addEventListener('click', () => { cb(); });
    box.appendChild(btn);
  });
}

function closeDialogue() {
  if (_container) { _container.remove(); _container = null; }
  window._timmyDialogueActive = false;
}

// ── Dialogue tree ──────────────────────────────────────────────────────────────

function showGreeting() {
  setText("Hi! I'm Timmy the mouse. Here to guide you through the mysteries of this box. Do you have any questions?");
  setChoices([
    { label: "a)  Why can you talk? Mice can't talk.", cb: answerA },
    { label: "b)  When can I go home?",                cb: answerB },
  ]);
}

function answerA() {
  setText("Well I read a lot of books of course. Makes mice smart you know heh... nothing else... totally...");
  setChoices([
    { label: "...okay.",         cb: showGreeting },
    { label: "[ close ]",       cb: closeDialogue },
  ]);
}

function answerB() {
  setText("...I don't know.");
  setChoices([
    { label: "[ close ]", cb: closeDialogue },
  ]);
}

// ── Public entry point ─────────────────────────────────────────────────────────

export function openTimmyDialogue() {
  if (window._timmyDialogueActive) return;
  window._timmyDialogueActive = true;
  // Release pointer lock so the player can click the choice buttons
  document.exitPointerLock();
  buildUI();
  showGreeting();
}
