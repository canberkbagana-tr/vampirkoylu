/**
 * APP.JS - UI Olay Dinleyicileri ve Ekran Yönlendirmeleri
 */

document.addEventListener('DOMContentLoaded', () => {
  const game = window.gameController;
  const net = window.networkEngine;
  const sound = window.soundEngine;

  // Elemanlar
  const viewEntry = document.getElementById('view-entry');
  const viewLobby = document.getElementById('view-lobby');
  const viewGame = document.getElementById('view-game');
  const viewGameOver = document.getElementById('view-game-over');

  const inputName = document.getElementById('input-player-name');
  const inputRoomCode = document.getElementById('input-room-code');

  const btnCreateRoom = document.getElementById('btn-create-room');
  const btnJoinRoom = document.getElementById('btn-join-room');
  const btnStartSim = document.getElementById('btn-start-test-simulation');
  const btnCopyLink = document.getElementById('btn-copy-link');
  const btnSoundToggle = document.getElementById('btn-sound-toggle');
  const soundIcon = document.getElementById('sound-icon');

  const btnLobbyReady = document.getElementById('btn-lobby-ready');
  const btnHostStart = document.getElementById('btn-host-start-game');
  const btnHostAddBots = document.getElementById('btn-host-add-bots');
  const btnGameOverRematch = document.getElementById('btn-game-over-rematch');

  // URL Hash kontrolü (Örn: #SPNC ile girildiyse odayı otomatik yaz)
  if (window.location.hash) {
    const hashRoom = window.location.hash.replace('#', '').toUpperCase().trim();
    if (hashRoom && inputRoomCode) {
      inputRoomCode.value = hashRoom;
    }
  }

  // Hafızadaki oyuncu adını geri getir
  if (inputName) {
    inputName.value = localStorage.getItem('vk_playerName') || '';
  }

  // Ses Aç/Kapat Butonu
  if (btnSoundToggle) {
    btnSoundToggle.addEventListener('click', () => {
      const isMuted = sound.toggleMute();
      soundIcon.textContent = isMuted ? '🔇' : '🔊';
      btnSoundToggle.classList.toggle('muted', isMuted);
    });
  }

  // Görünüm Değiştirici Yardımcı
  function showView(view) {
    [viewEntry, viewLobby, viewGame, viewGameOver].forEach(v => {
      if (v) v.style.display = 'none';
    });
    if (view) view.style.display = 'block';
  }

  // 1. Yeni Oda Kur
  if (btnCreateRoom) {
    btnCreateRoom.addEventListener('click', () => {
      sound.init(); // Kullanıcı dokunmasıyla AudioContext açılır
      const name = inputName.value.trim() || 'Lider';
      const code = net.generateRoomCode();
      showView(viewLobby);
      net.connect(code, true, name);
    });
  }

  // 2. Odaya Katıl
  if (btnJoinRoom) {
    btnJoinRoom.addEventListener('click', () => {
      sound.init();
      const name = inputName.value.trim() || 'Köylü';
      const code = inputRoomCode.value.trim().toUpperCase();
      if (!code) {
        alert('Lütfen katılmak istediğiniz oda kodunu girin.');
        return;
      }
      showView(viewLobby);
      net.connect(code, false, name);
    });
  }

  // 3. Simülasyon Modu (8 Kişilik Hızlı Test)
  if (btnStartSim) {
    btnStartSim.addEventListener('click', () => {
      sound.init();
      const name = inputName.value.trim() || 'Siz (Lider)';
      net.startLocalTestMode();
      showView(viewLobby);

      // Oyuncuyu ve 7 botu lobiye ekle
      game.state.players = [{
        id: net.playerId,
        name: name,
        isHost: true,
        isReady: false,
        isAlive: true,
        role: null,
        isBot: false
      }];

      game.addTestBots(8);
      game.renderLobby();
    });
  }

  // Katılım Linkini Kopyala
  if (btnCopyLink) {
    btnCopyLink.addEventListener('click', () => {
      const joinUrl = `${window.location.origin}${window.location.pathname}#${net.roomCode}`;
      navigator.clipboard.writeText(joinUrl).then(() => {
        const oldText = btnCopyLink.textContent;
        btnCopyLink.textContent = '✓';
        setTimeout(() => btnCopyLink.textContent = oldText, 2000);
      });
    });
  }

  // Lobi Hazırım Butonu
  if (btnLobbyReady) {
    btnLobbyReady.addEventListener('click', () => {
      game.toggleMyReady();
    });
  }

  // Host: Kalanı Botla Doldur
  if (btnHostAddBots) {
    btnHostAddBots.addEventListener('click', () => {
      game.addTestBots(8);
    });
  }

  // Host: Oyunu Başlat
  if (btnHostStart) {
    btnHostStart.addEventListener('click', () => {
      game.startGame();
    });
  }

  // Tekrar Oyna
  if (btnGameOverRematch) {
    btnGameOverRematch.addEventListener('click', () => {
      game.restartToLobby();
      showView(viewLobby);
    });
  }

  // Canberk Admin Modalı Aç/Kapat
  const btnAdminFloating = document.getElementById('btn-admin-floating');
  const adminModal = document.getElementById('admin-panel-modal');
  const btnCloseAdmin = document.getElementById('btn-close-admin-modal');
  const adminBackdrop = document.getElementById('admin-modal-backdrop');

  if (btnAdminFloating && adminModal) {
    btnAdminFloating.addEventListener('click', () => {
      adminModal.style.display = 'flex';
      game.renderAdminFloatingPanel();
    });
  }

  if (btnCloseAdmin && adminModal) {
    btnCloseAdmin.addEventListener('click', () => {
      adminModal.style.display = 'none';
    });
  }

  if (adminBackdrop && adminModal) {
    adminBackdrop.addEventListener('click', () => {
      adminModal.style.display = 'none';
    });
  }

  // Günlük Güncellemesi Takibi
  setInterval(() => {
    const listEl = document.getElementById('game-logs-list');
    const countEl = document.getElementById('log-count');
    if (listEl && game.state.historyLogs) {
      if (countEl) countEl.textContent = game.state.historyLogs.length;
      listEl.innerHTML = game.state.historyLogs.map(l => `<div class="log-entry">${l}</div>`).join('');
    }
  }, 1000);
});
