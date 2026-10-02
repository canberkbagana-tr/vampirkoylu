/**
 * NETWORK.JS - Vampir Köylü (Sapanca Edition)
 * MQTT over WebSocket tabanlı sıfır konfigürasyonlu multiplayer senkronizasyon katmanı
 */

class NetworkEngine {
  constructor() {
    this.client = null;
    this.roomCode = null;
    this.playerId = this.getOrCreatePlayerId();
    this.playerName = localStorage.getItem('vk_playerName') || '';
    this.isHost = false;
    this.isConnected = false;
    this.isTestMode = false;
    this.isAdmin = this.checkIsAdmin(this.playerName);

    this.onStateReceived = null;
    this.onActionReceived = null;
    this.onStatusChanged = null;

    // Ücretsiz ve güvenilir public WSS broker listesi
    this.brokers = [
      'wss://broker.hivemq.com:8884/mqtt',
      'wss://broker.emqx.io:8084/mqtt'
    ];
    this.currentBrokerIndex = 0;
  }

  checkIsAdmin(name) {
    return (name || '').trim().toLowerCase() === 'canberk';
  }

  getOrCreatePlayerId() {
    let id = localStorage.getItem('vk_playerId');
    if (!id) {
      id = 'p_' + Math.random().toString(36).substring(2, 9);
      localStorage.setItem('vk_playerId', id);
    }
    return id;
  }

  generateRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  connect(roomCode, isHost = false, playerName = '') {
    this.roomCode = roomCode.toUpperCase().trim();
    this.isHost = isHost;
    this.playerName = playerName.trim() || 'Misafir';
    this.isAdmin = this.checkIsAdmin(this.playerName);
    this.isTestMode = false;

    localStorage.setItem('vk_playerName', this.playerName);
    localStorage.setItem('vk_roomCode', this.roomCode);

    if (this.client) {
      try { this.client.end(true); } catch (e) {}
    }

    const brokerUrl = this.brokers[this.currentBrokerIndex];
    const clientId = `vk_${this.playerId}_${Math.random().toString(36).substring(2, 6)}`;

    console.log(`[Network] Bağlanıyor: ${brokerUrl} (Oda: ${this.roomCode}, Host: ${this.isHost}, Admin: ${this.isAdmin})`);
    if (this.onStatusChanged) this.onStatusChanged('connecting', `Sunucuya bağlanılıyor...`);

    try {
      this.client = mqtt.connect(brokerUrl, {
        clientId: clientId,
        clean: true,
        connectTimeout: 7000,
        reconnectPeriod: 3000,
        keepalive: 30
      });

      this.client.on('connect', () => {
        this.isConnected = true;
        console.log('[Network] MQTT Bağlantısı Başarılı!');
        if (this.onStatusChanged) this.onStatusChanged('connected', 'Odaya bağlandı');

        // Odadaki topic'lere abone ol
        const broadcastTopic = `vampir-sapanca/${this.roomCode}/broadcast`;
        const clientDirectTopic = `vampir-sapanca/${this.roomCode}/client/${this.playerId}`;

        this.client.subscribe([broadcastTopic, clientDirectTopic], (err) => {
          if (err) console.error('[Network] Subscribe hatası:', err);
        });

        // Host veya Canberk Admin ise oyuncu aksiyonlarını dinler
        if (this.isHost || this.isAdmin) {
          const hostActionsTopic = `vampir-sapanca/${this.roomCode}/host_actions`;
          this.client.subscribe(hostActionsTopic);
        }

        // Odaya katıldığını duyur
        this.sendAction('PLAYER_JOIN', {
          id: this.playerId,
          name: this.playerName,
          isHost: this.isHost,
          isAdmin: this.isAdmin
        });
      });

      this.client.on('message', (topic, payload) => {
        try {
          const data = JSON.parse(payload.toString());
          this.handleIncomingMessage(topic, data);
        } catch (e) {
          console.error('[Network] Mesaj işleme hatası:', e);
        }
      });

      this.client.on('error', (err) => {
        console.warn('[Network] Broker hatası:', err);
        this.tryNextBroker();
      });

      this.client.on('close', () => {
        this.isConnected = false;
        if (this.onStatusChanged) this.onStatusChanged('disconnected', 'Bağlantı koptu, yeniden deneniyor...');
      });

    } catch (e) {
      console.error('[Network] MQTT başlatma hatası:', e);
      this.tryNextBroker();
    }
  }

  tryNextBroker() {
    this.currentBrokerIndex = (this.currentBrokerIndex + 1) % this.brokers.length;
    console.log(`[Network] Alternatif broker deneniyor: ${this.brokers[this.currentBrokerIndex]}`);
  }

  handleIncomingMessage(topic, data) {
    if (topic.endsWith('/broadcast') || topic.includes('/client/')) {
      if (this.onStateReceived) {
        this.onStateReceived(data);
      }
    } else if (topic.endsWith('/host_actions') && (this.isHost || this.isAdmin)) {
      if (this.onActionReceived) {
        this.onActionReceived(data);
      }
    }
  }

  // Host: Tüm oyunculara güncel oyun durumunu yollar
  broadcastState(state) {
    if (this.isTestMode) {
      if (this.onStateReceived) this.onStateReceived(state);
      return;
    }
    if (!this.client || !this.isConnected || !this.roomCode) return;

    const topic = `vampir-sapanca/${this.roomCode}/broadcast`;
    this.client.publish(topic, JSON.stringify(state), { qos: 0 });
  }

  // Belirli bir oyuncuya gizli mesaj yollar (Örn: Kahin sorgu sonucu veya rol)
  sendToClient(targetPlayerId, message) {
    if (this.isTestMode) {
      if (targetPlayerId === this.playerId && this.onStateReceived) {
        this.onStateReceived(message);
      }
      return;
    }
    if (!this.client || !this.isConnected || !this.roomCode) return;

    const topic = `vampir-sapanca/${this.roomCode}/client/${targetPlayerId}`;
    this.client.publish(topic, JSON.stringify(message), { qos: 0 });
  }

  // Oyuncu: Host'a aksiyon yollar (Hazır, Oy verdi, Kurban seçti vs.)
  sendAction(actionType, payload = {}) {
    const actionData = {
      type: actionType,
      playerId: this.playerId,
      playerName: this.playerName,
      isAdmin: this.isAdmin || this.checkIsAdmin(this.playerName),
      timestamp: Date.now(),
      payload: payload
    };

    if (this.isTestMode || this.isHost) {
      if (this.onActionReceived) {
        this.onActionReceived(actionData);
      }
      return;
    }

    if (!this.client || !this.isConnected || !this.roomCode) return;
    const topic = `vampir-sapanca/${this.roomCode}/host_actions`;
    this.client.publish(topic, JSON.stringify(actionData), { qos: 0 });
  }

  // Test / Simülasyon modunu başlatır (8 sanal oyuncu ile anında test)
  startLocalTestMode() {
    this.isTestMode = true;
    this.isHost = true;
    this.roomCode = 'TEST';
    this.playerName = localStorage.getItem('vk_playerName') || 'Canberk';
    this.isAdmin = this.checkIsAdmin(this.playerName);
    if (this.onStatusChanged) this.onStatusChanged('test', 'Simülasyon Modu Aktif (8 Oyuncu)');
  }
}

window.networkEngine = new NetworkEngine();
