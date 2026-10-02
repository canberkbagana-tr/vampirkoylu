/**
 * GAME.JS - Vampir Köylü (Sapanca Edition)
 * Oyun mantığı, durum makinesi (State Machine) ve rol aksiyonları
 */

const ROLES = {
  VAMPIRE: {
    id: 'VAMPIRE',
    baseRole: 'VAMPIRE',
    name: 'Vampir',
    team: 'evil',
    image: 'assets/vampire.jpg',
    color: '#e11d48',
    description: 'Gece diğer vampir ile uyanır ve ortak bir kurban seçer. Gündüz masum köylü taklidi yapar.',
    instruction: 'Amacınız köydeki masumları yok ederek köylü sayısına eşitlenmek.'
  },
  DOCTOR: {
    id: 'DOCTOR',
    baseRole: 'DOCTOR',
    name: 'Doktor',
    team: 'good',
    image: 'assets/doctor.jpg',
    color: '#10b981',
    description: 'Gece uyanır ve vampirlerin saldırısından korumak istediği bir köylüyü seçer.',
    instruction: 'Her gece 1 kişiyi kurtarabilirsiniz. Aynı kişiyi üst üste 2 gece koruyamazsınız.'
  },
  SEER: {
    id: 'SEER',
    baseRole: 'SEER',
    name: 'Kahin (Gözcü)',
    team: 'good',
    image: 'assets/seer.jpg',
    color: '#8b5cf6',
    description: 'Gece uyanır ve şüphelendiği 1 kişinin gizli rolünü (Vampir mi Masum mu) öğrenir.',
    instruction: 'Kimin rolünü öğrenmek istediğinizi seçin. Gündüz elde ettiğiniz istihbaratı akıllıca kullanın.'
  },
  VILLAGER_1: {
    id: 'VILLAGER_1',
    baseRole: 'VILLAGER',
    name: 'Köylü (Halay Başı Dayı)',
    team: 'good',
    image: 'assets/koylu1.png',
    color: '#f59e0b',
    description: 'Şalvarını çekti, vampir avına halayla gidiyor! Gece uyur, gündüz köy meydanını coşturur.',
    instruction: 'Sezgilerine ve ritmine güven. Aranızdaki vampirleri yakala!'
  },
  VILLAGER_2: {
    id: 'VILLAGER_2',
    baseRole: 'VILLAGER',
    name: 'Köylü (Köyde Eylem Var!)',
    team: 'good',
    image: 'assets/koylu2.png',
    color: '#f59e0b',
    description: '"Köyde eylem var!" diyerek vampirlere karşı halkı sokağa döküyor. Hak, hukuk, adalet!',
    instruction: 'Gündüz tartışmasında hakkını savun. Şüpheli vampirleri mahkemeye sür!'
  },
  VILLAGER_3: {
    id: 'VILLAGER_3',
    baseRole: 'VILLAGER',
    name: 'Köylü (Su Bulan Dayı)',
    team: 'good',
    image: 'assets/koylu3.png',
    color: '#f59e0b',
    description: 'Elindeki dut dalıyla noktasıyla su bulur gibi vampir arıyor. Yeraltı radarı açık!',
    instruction: 'Dut çubuğu kime dönüyorsa oylamada ona bas! Titreşimi takip et.'
  },
  VILLAGER_4: {
    id: 'VILLAGER_4',
    baseRole: 'VILLAGER',
    name: 'Köylü (Bilge Kasketli)',
    team: 'good',
    image: 'assets/koylu4.png',
    color: '#f59e0b',
    description: 'Kasketinin altından bıyık burup olan biteni izleyen bilge köylü. Az konuşur, öz konuşur.',
    instruction: 'Sakin kal, vampirlerin açık vermesini bekle ve tam zamanında oyunu patlat.'
  },
  VILLAGER: {
    id: 'VILLAGER',
    baseRole: 'VILLAGER',
    name: 'Köylü',
    team: 'good',
    image: 'assets/koylu1.png',
    color: '#f59e0b',
    description: 'Gece uyur, gündüz dedektiflik yapar.',
    instruction: 'Aranızdaki vampirleri bulun.'
  }
};

const PHASES = {
  LOBBY: 'LOBBY',
  ROLE_REVEAL: 'ROLE_REVEAL',
  NIGHT_INTRO: 'NIGHT_INTRO',
  NIGHT_VAMPIRE: 'NIGHT_VAMPIRE',
  NIGHT_DOCTOR: 'NIGHT_DOCTOR',
  NIGHT_SEER: 'NIGHT_SEER',
  DAY_DAWN: 'DAY_DAWN',
  DAY_DISCUSSION: 'DAY_DISCUSSION',
  DAY_VOTING: 'DAY_VOTING',
  DAY_EXECUTION: 'DAY_EXECUTION',
  GAME_OVER: 'GAME_OVER'
};

class GameController {
  constructor() {
    this.network = window.networkEngine;
    this.sound = window.soundEngine;
    this.narrator = window.voiceNarrator;
    this.haptic = window.HapticMotor;

    // Yerel oyuncu bilgileri
    this.me = {
      id: this.network.playerId,
      name: '',
      role: null,
      isAlive: true,
      isReady: false,
      confirmedRole: false,
      isAdmin: false,
      godViewEnabled: false
    };

    // Sunucu/Oda durumu
    this.state = {
      roomCode: '',
      phase: PHASES.LOBBY,
      nightCount: 0,
      timer: 0,
      timerTotal: 0,
      players: [], // { id, name, isHost, isReady, isAlive, role, isBot }
      roleSetup: {
        vampire: 2,
        doctor: 1,
        seer: 1,
        villager: 4
      },
      nightActions: {
        vampireTarget: null,
        vampireVotes: {}, // { [playerId]: targetId }
        doctorTarget: null,
        lastDoctorTarget: null,
        seerTarget: null,
        seerResult: null // { targetName, isVampire }
      },
      dayActions: {
        skipDebateVotes: [], // [playerId, ...]
        votes: {}, // { [voterId]: targetId veya 'SKIP' }
        lastKilledNight: null, // { name, role } veya null
        lastExecutedDay: null // { name, role } veya null
      },
      winner: null,
      historyLogs: [],
      phaseEndsAt: null
    };

    this.timerInterval = null;
    this.clientTimerInterval = null;
    this._phaseAutoAdvanceTimeout = null;
    this._tickedSeconds = new Set();
    this.wakeLock = null;

    this.initNetworkHooks();
    this.requestWakeLock();

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.requestWakeLock();
        if (this.state.phaseEndsAt && !this.network.isHost) {
          this.startLocalTimerTicker(null, null);
        }
      }
    });
  }

  async requestWakeLock() {
    try {
      if ('wakeLock' in navigator) {
        this.wakeLock = await navigator.wakeLock.request('screen');
        console.log('[WakeLock] Ekran açık tutuluyor.');
      }
    } catch (e) {
      console.log('[WakeLock] Bilgi:', e.message);
    }
  }

  initNetworkHooks() {
    this.network.onStatusChanged = (status, msg) => {
      this.updateConnectionBadge(status, msg);
    };

    this.network.onStateReceived = (newState) => {
      this.syncState(newState);
    };

    this.network.onActionReceived = (action) => {
      if (this.network.isHost || this.me.isAdmin) {
        this.handleHostAction(action);
      }
    };
  }

  updateConnectionBadge(status, msg) {
    const badge = document.getElementById('connection-badge');
    if (!badge) return;
    badge.className = `status-pill ${status}`;
    badge.textContent = msg;
  }

  // --- HOST YÖNETİMİ & FAZ AKIŞI ---

  handleHostAction(action) {
    const { type, playerId, playerName, payload } = action;

    switch (type) {
      case 'PLAYER_JOIN': {
        let p = this.state.players.find(x => x.id === playerId);
        const isCanberk = (playerName || '').trim().toLowerCase() === 'canberk';
        if (!p) {
          p = {
            id: playerId,
            name: playerName,
            isHost: action.payload.isHost || (this.state.players.length === 0),
            isAdmin: isCanberk || action.payload.isAdmin || false,
            isReady: false,
            isAlive: true,
            role: null,
            isBot: false
          };
          this.state.players.push(p);
          this.addLog(`${playerName} odaya katıldı.${isCanberk ? ' ⚡ (Admin Yetkisi)' : ''}`);
        } else {
          p.name = playerName;
          if (isCanberk) p.isAdmin = true;
        }

        // Eğer lobi sahibi henüz özel bir rol dağılımı ayarlamadıysa, kişi sayısına göre otomatik dengele
        if (!this.state.customRoleSetupManuallySet) {
          const autoComp = this.getDynamicRoleComposition(this.state.players.length);
          this.state.roleSetup = {
            vampire: autoComp.vampires,
            doctor: autoComp.doctors,
            seer: autoComp.seers,
            villager: autoComp.villagers
          };
        }

        this.broadcastCurrentState();
        break;
      }

      case 'UPDATE_ROLE_SETUP': {
        const isSenderAdmin = action.isAdmin || (action.playerName || '').trim().toLowerCase() === 'canberk';
        if (this.network.isHost || isSenderAdmin) {
          this.state.roleSetup = { ...this.state.roleSetup, ...payload.roleSetup };
          this.state.customRoleSetupManuallySet = !payload.isAuto;
          this.addLog(`Host rol dağılımını güncelledi: ${this.state.roleSetup.vampire}V, ${this.state.roleSetup.doctor}D, ${this.state.roleSetup.seer}K, ${this.state.roleSetup.villager}K`);
          this.broadcastCurrentState();
        }
        break;
      }

      case 'TOGGLE_READY': {
        const p = this.state.players.find(x => x.id === playerId);
        if (p) {
          p.isReady = !p.isReady;
          this.broadcastCurrentState();
        }
        break;
      }

      case 'CONFIRM_ROLE': {
        const p = this.state.players.find(x => x.id === playerId);
        if (p) {
          p.confirmedRole = true;
          // Eğer herkes rolünü onayladıysa Gece Intro'ya geç
          const allConfirmed = this.state.players.every(x => x.confirmedRole);
          if (allConfirmed && this.state.phase === PHASES.ROLE_REVEAL) {
            this.startPhaseNightIntro();
          } else {
            this.broadcastCurrentState();
          }
        }
        break;
      }

      case 'VAMPIRE_VOTE': {
        if (this.state.phase === PHASES.NIGHT_VAMPIRE) {
          this.state.nightActions.vampireVotes[playerId] = payload.targetId;
          this.evaluateVampireVotes();
          this.broadcastCurrentState();

          // Erken Faz Geçişi: Yaşayan tüm vampirler oyunu verdi mi?
          const aliveVamps = this.state.players.filter(p => p.role === 'VAMPIRE' && p.isAlive);
          const allVampsVoted = aliveVamps.length > 0 && aliveVamps.every(v => !!this.state.nightActions.vampireVotes[v.id]);
          if (allVampsVoted) {
            const targetsChosen = aliveVamps.map(v => this.state.nightActions.vampireVotes[v.id]);
            const consensus = targetsChosen.every(t => t === targetsChosen[0]);
            if (consensus || aliveVamps.length === 1) {
              if (this._phaseAutoAdvanceTimeout) clearTimeout(this._phaseAutoAdvanceTimeout);
              this._phaseAutoAdvanceTimeout = setTimeout(() => {
                if (this.state.phase === PHASES.NIGHT_VAMPIRE) {
                  this.evaluateVampireVotes();
                  this.startPhaseNightDoctor();
                }
              }, 1200);
            }
          }
        }
        break;
      }

      case 'DOCTOR_PROTECT': {
        if (this.state.phase === PHASES.NIGHT_DOCTOR) {
          this.state.nightActions.doctorTarget = payload.targetId;
          this.broadcastCurrentState();
          if (this._phaseAutoAdvanceTimeout) clearTimeout(this._phaseAutoAdvanceTimeout);
          this._phaseAutoAdvanceTimeout = setTimeout(() => {
            if (this.state.phase === PHASES.NIGHT_DOCTOR) {
              this.startPhaseNightSeer();
            }
          }, 1200);
        }
        break;
      }

      case 'SEER_INSPECT': {
        if (this.state.phase === PHASES.NIGHT_SEER) {
          const target = this.state.players.find(x => x.id === payload.targetId);
          if (target) {
            const isVamp = target.role === 'VAMPIRE';
            const result = {
              targetId: target.id,
              targetName: target.name,
              isVampire: isVamp
            };
            this.state.nightActions.seerTarget = target.id;
            this.state.nightActions.seerResult = result;
            // Kahine özel sonuç gönder
            this.network.sendToClient(playerId, {
              type: 'SEER_RESULT',
              result: result
            });
            this.broadcastCurrentState();
            if (this._phaseAutoAdvanceTimeout) clearTimeout(this._phaseAutoAdvanceTimeout);
            this._phaseAutoAdvanceTimeout = setTimeout(() => {
              if (this.state.phase === PHASES.NIGHT_SEER) {
                this.startPhaseDayDawn();
              }
            }, 2500);
          }
        }
        break;
      }

      case 'SKIP_DEBATE': {
        if (this.state.phase === PHASES.DAY_DISCUSSION) {
          if (!this.state.dayActions.skipDebateVotes.includes(playerId)) {
            this.state.dayActions.skipDebateVotes.push(playerId);
            const aliveCount = this.getAlivePlayers().length;
            if (this.state.dayActions.skipDebateVotes.length >= Math.ceil(aliveCount / 2)) {
              this.startPhaseVoting();
            } else {
              this.broadcastCurrentState();
            }
          }
        }
        break;
      }

      case 'CAST_VOTE': {
        if (this.state.phase === PHASES.DAY_VOTING) {
          this.state.dayActions.votes[playerId] = payload.targetId;
          const alive = this.getAlivePlayers();
          const votesCount = Object.keys(this.state.dayActions.votes).length;
          if (votesCount >= alive.length) {
            // Herkes oy verdi, erkenden infaza geç
            this.evaluateVotesAndExecute();
          } else {
            this.broadcastCurrentState();
          }
        }
        break;
      }

      // --- CANBERK ADMİN AKSİYONLARI ---
      case 'ADMIN_START_GAME': {
        const isSenderAdmin = action.isAdmin || (action.playerName || '').trim().toLowerCase() === 'canberk';
        if (isSenderAdmin || this.network.isHost) {
          this.startGame();
        }
        break;
      }

      case 'ADMIN_FORCE_NEXT_PHASE': {
        const isSenderAdmin = action.isAdmin || (action.playerName || '').trim().toLowerCase() === 'canberk';
        if (!isSenderAdmin && !this.network.isHost) return;
        this.executeForceNextPhase(`Admin (${action.playerName || 'Canberk'})`);
        break;
      }

      case 'ADMIN_FORCE_VOTE': {
        const isSenderAdmin = action.isAdmin || (action.playerName || '').trim().toLowerCase() === 'canberk';
        if (!isSenderAdmin && !this.network.isHost) return;
        this.addLog(`⚡ Admin (${action.playerName}) tartışmayı bitirip oylamayı başlattı.`);
        clearInterval(this.timerInterval);
        if (this._phaseAutoAdvanceTimeout) clearTimeout(this._phaseAutoAdvanceTimeout);
        this.startPhaseVoting();
        break;
      }

      case 'ADMIN_RESET_LOBBY': {
        const isSenderAdmin = action.isAdmin || (action.playerName || '').trim().toLowerCase() === 'canberk';
        if (!isSenderAdmin && !this.network.isHost) return;
        this.executeResetLobby(`Admin (${action.playerName || 'Canberk'})`);
        break;
      }

      case 'ADMIN_SET_VICTORY': {
        const isSenderAdmin = action.isAdmin || (action.playerName || '').trim().toLowerCase() === 'canberk';
        if (!isSenderAdmin && !this.network.isHost) return;
        clearInterval(this.timerInterval);
        if (this._phaseAutoAdvanceTimeout) clearTimeout(this._phaseAutoAdvanceTimeout);
        const winTeam = payload.winner || 'good';
        this.state.phase = PHASES.GAME_OVER;
        this.state.winner = winTeam;
        this.addLog(`⚡ Admin (${action.playerName}) oyunu sonlandırdı: ${winTeam === 'evil' ? 'Vampirler' : 'Köylüler'} kazandı!`);
        this.broadcastCurrentState();
        break;
      }

      case 'ADMIN_TOGGLE_LIFE': {
        const isSenderAdmin = action.isAdmin || (action.playerName || '').trim().toLowerCase() === 'canberk';
        if (!isSenderAdmin && !this.network.isHost) return;
        const target = this.state.players.find(p => p.id === payload.targetId);
        if (target) {
          target.isAlive = !target.isAlive;
          this.addLog(`⚡ Admin (${action.playerName}) ${target.name}'i ${target.isAlive ? 'diriltti' : 'öldürdü'}.`);
          this.checkVictory();
          this.broadcastCurrentState();
        }
        break;
      }
    }
  }

  broadcastCurrentState() {
    this.state.roomCode = this.network.roomCode;
    this.network.broadcastState(this.state);
    this.syncState(this.state);
  }

  // Durumu yerel ekrana uygula
  syncState(newState) {
    if (newState.type === 'SEER_RESULT') {
      this.displaySeerResult(newState.result);
      return;
    }

    const prevPhase = this.state.phase;
    this.state = newState;

    // Kendi oyuncu nesnemi bul
    const myPlayer = this.state.players.find(p => p.id === this.me.id);
    if (myPlayer) {
      this.me.name = myPlayer.name;
      this.me.role = myPlayer.role;
      this.me.isAlive = myPlayer.isAlive;
      this.me.isReady = myPlayer.isReady;
      this.me.confirmedRole = myPlayer.confirmedRole;
      this.me.isAdmin = myPlayer.isAdmin || (myPlayer.name || '').trim().toLowerCase() === 'canberk' || this.network.isAdmin;
    } else {
      this.me.isAdmin = (this.network.playerName || '').trim().toLowerCase() === 'canberk' || this.network.isAdmin;
    }

    // Faz geçişinde ses veya haptik tepkisi
    if (prevPhase !== this.state.phase) {
      this._tickedSeconds = new Set();
      this.onPhaseChanged(this.state.phase, prevPhase);
    }

    // İstemcilerde ve yerel ekranda timestamp tabanlı yerel sayaç başlat
    if (this.state.phaseEndsAt && this.state.phase !== PHASES.LOBBY && this.state.phase !== PHASES.GAME_OVER) {
      this.startLocalTimerTicker(null, () => {
        if (this.network.isHost || this.me.isAdmin) {
          this.advancePhaseTimeout();
        }
      });
    }

    this.renderUI();
  }

  onPhaseChanged(newPhase, oldPhase) {
    console.log(`[Phase] Geçiş: ${oldPhase} -> ${newPhase}`);

    switch (newPhase) {
      case PHASES.ROLE_REVEAL:
        this.sound.playCardSting();
        this.narrator.speak('Roller dağıtıldı. Kartınıza basılı tutarak gizli kimliğinizi öğrenin.');
        break;

      case PHASES.NIGHT_INTRO:
        this.sound.playGong();
        this.narrator.speak('Gece oldu. Köy derin bir uykuya dalıyor... Herkes gözlerini kapatsın veya telefonunu ters koysun.', true);
        break;

      case PHASES.NIGHT_VAMPIRE:
        if (this.me.role === 'VAMPIRE' && this.me.isAlive) {
          this.haptic.wakeUpRole();
          this.sound.startHeartbeat(1000);
        }
        this.narrator.speak('Vampirler, gözlerinizi açın. Birbirinizi görün ve kurbanınızı seçin.');
        break;

      case PHASES.NIGHT_DOCTOR:
        this.sound.stopHeartbeat();
        if (this.me.role === 'DOCTOR' && this.me.isAlive) {
          this.haptic.wakeUpRole();
        }
        this.narrator.speak('Vampirler uykuya dalsın. Doktor, uyan... Kimi korumak istiyorsun?');
        break;

      case PHASES.NIGHT_SEER:
        if (this.me.role === 'SEER' && this.me.isAlive) {
          this.haptic.wakeUpRole();
        }
        this.narrator.speak('Doktor uykuya dalsın. Kahin, uyan... Kimin kimliğini öğrenmek istiyorsun?');
        break;

      case PHASES.DAY_DAWN:
        this.sound.playDawn();
        let reportText = 'Güneş doğuyor, köy uyanıyor! Herkes gözlerini açsın. ';
        const killed = this.state.dayActions.lastKilledNight;
        if (killed) {
          reportText += `Korkunç bir geceydi... ${killed.name} vampirler tarafından katledildi!`;
          this.haptic.deathAlert();
        } else {
          reportText += 'Doktor bu gece mucizevi bir şekilde saldırıyı engelledi! Kimse ölmedi!';
        }
        this.narrator.speak(reportText, true);
        break;

      case PHASES.DAY_DISCUSSION:
        this.sound.startHeartbeat(1400);
        this.narrator.speak('Tartışma başladı. İki dakikanız var, aranızdaki vampirleri ortaya çıkarın.');
        break;

      case PHASES.DAY_VOTING:
        this.sound.startHeartbeat(900);
        this.narrator.speak('Mahkeme vakti geldi! Kimi asmak istediğinize karar verin veya Pas geçin.');
        break;

      case PHASES.DAY_EXECUTION:
        this.sound.stopHeartbeat();
        this.sound.playGong();
        const executed = this.state.dayActions.lastExecutedDay;
        if (executed) {
          this.narrator.speak(`Köy halkı kararını verdi. ${executed.name} idam edildi! Rolü: ${ROLES[executed.role].name}`, true);
        } else {
          this.narrator.speak('Oylar eşit çıktı veya çoğunluk sağlanamadı. Bugün kimse asılmadı.', true);
        }
        break;

      case PHASES.GAME_OVER:
        this.sound.stopHeartbeat();
        this.sound.playGong();
        const winTeam = this.state.winner === 'evil' ? 'VAMPİRLER KAZANDI!' : 'KÖYLÜLER KAZANDI!';
        this.narrator.speak(`Oyun bitti! ${winTeam}`, true);
        break;
    }
  }

  // --- HOST DURUM MAKİNESİ VE TIMESTAMP TABANLI ZAMANLAYICI ---

  startTimer(seconds, onTick, onComplete) {
    clearInterval(this.timerInterval);
    if (this._phaseAutoAdvanceTimeout) {
      clearTimeout(this._phaseAutoAdvanceTimeout);
      this._phaseAutoAdvanceTimeout = null;
    }

    const now = Date.now();
    this.state.phaseEndsAt = now + (seconds * 1000);
    this.state.timer = seconds;
    this.state.timerTotal = seconds;
    this._tickedSeconds = new Set();
    this._warned60 = false;
    this._warned15 = false;

    // Faz başında tüm odaya anlık durum bildirimi yap
    if (this.network.isHost || this.me.isAdmin) {
      this.broadcastCurrentState();
    }

    this.startLocalTimerTicker(onTick, onComplete);
  }

  startLocalTimerTicker(onTick, onComplete) {
    if (this.clientTimerInterval) clearInterval(this.clientTimerInterval);
    this._tickedSeconds = this._tickedSeconds || new Set();

    this.clientTimerInterval = setInterval(() => {
      if (!this.state.phaseEndsAt || this.state.phase === PHASES.LOBBY || this.state.phase === PHASES.GAME_OVER) {
        clearInterval(this.clientTimerInterval);
        return;
      }

      const remainingMs = this.state.phaseEndsAt - Date.now();
      const remainingSec = Math.max(0, Math.ceil(remainingMs / 1000));
      this.state.timer = remainingSec;

      // 60 sn ve 15 sn sesli hatırlatma
      if (this.state.phase === PHASES.DAY_DISCUSSION) {
        if (remainingSec === 60 && !this._warned60) {
          this._warned60 = true;
          this.narrator.speak('Tartışma için son bir dakika.');
        } else if (remainingSec === 15 && !this._warned15) {
          this._warned15 = true;
          this.narrator.speak('Tartışma bitiyor, oylamaya hazırlanın.');
        }
      }

      // Son 5 saniyede tık sesi
      if (remainingSec <= 5 && remainingSec > 0 && !this._tickedSeconds.has(remainingSec)) {
        this._tickedSeconds.add(remainingSec);
        this.sound.playTick();
      }

      // Sayacı ekranda güncelle
      const timerVal = document.getElementById('phase-timer-value');
      if (timerVal) {
        timerVal.textContent = this.formatTime(remainingSec);
      }

      if (onTick) onTick(remainingSec);

      // Süre bittiğinde
      if (remainingSec <= 0) {
        clearInterval(this.clientTimerInterval);
        this.clientTimerInterval = null;

        if (this.network.isHost || this.me.isAdmin) {
          if (onComplete) {
            onComplete();
          } else {
            this.advancePhaseTimeout();
          }
        }
      } else if (remainingMs < -2500) {
        // GÜVENLİK SİGORTASI (WATCHDOG):
        // Host telefonu kilitlendiyse veya koptuysa oyunu takılı bırakma
        if (this.isHostFallbackCandidate()) {
          console.warn('[Watchdog] Host yanıt vermedi, faz otomatik ilerletiliyor...');
          this.advancePhaseTimeout();
        }
      }
    }, 500);
  }

  isHostFallbackCandidate() {
    if (this.network.isHost || this.me.isAdmin) return true;
    const realPlayers = this.state.players.filter(p => !p.isBot);
    return realPlayers.length > 0 && realPlayers[0].id === this.me.id;
  }

  advancePhaseTimeout() {
    const curPhase = this.state.phase;
    console.log(`[Phase Advance] Faz süresi tamamlandı, ilerleniyor: ${curPhase}`);

    if (curPhase === PHASES.ROLE_REVEAL || curPhase === PHASES.NIGHT_INTRO) {
      this.startPhaseNightVampire();
    } else if (curPhase === PHASES.NIGHT_VAMPIRE) {
      this.evaluateVampireVotes();
      this.startPhaseNightDoctor();
    } else if (curPhase === PHASES.NIGHT_DOCTOR) {
      this.startPhaseNightSeer();
    } else if (curPhase === PHASES.NIGHT_SEER) {
      this.startPhaseDayDawn();
    } else if (curPhase === PHASES.DAY_DAWN) {
      this.startPhaseDayDiscussion();
    } else if (curPhase === PHASES.DAY_DISCUSSION) {
      this.startPhaseVoting();
    } else if (curPhase === PHASES.DAY_VOTING) {
      this.evaluateVotesAndExecute();
    } else if (curPhase === PHASES.DAY_EXECUTION) {
      this.startPhaseNightIntro();
    }
  }

  executeForceNextPhase(actorName = 'Admin') {
    this.addLog(`⚡ ${actorName} fazı ileri sardı.`);
    clearInterval(this.timerInterval);
    if (this.clientTimerInterval) clearInterval(this.clientTimerInterval);
    if (this._phaseAutoAdvanceTimeout) clearTimeout(this._phaseAutoAdvanceTimeout);
    this.advancePhaseTimeout();
  }

  executeResetLobby(actorName = 'Admin') {
    this.addLog(`⚡ ${actorName} oyunu sıfırladı, lobiye dönüldü.`);
    clearInterval(this.timerInterval);
    if (this.clientTimerInterval) clearInterval(this.clientTimerInterval);
    if (this._phaseAutoAdvanceTimeout) clearTimeout(this._phaseAutoAdvanceTimeout);
    this.state.phase = PHASES.LOBBY;
    this.state.winner = null;
    this.state.players.forEach(p => {
      p.isReady = p.isBot ? true : false;
      p.role = null;
      p.isAlive = true;
      p.confirmedRole = false;
    });
    this.broadcastCurrentState();
  }

  // Oyunu Başlat (Host veya Canberk Admin)
  startGame() {
    const isCanberk = (this.me.name || '').trim().toLowerCase() === 'canberk' || this.me.isAdmin;
    if (!this.network.isHost && !isCanberk) return;

    if (!this.network.isHost && isCanberk) {
      this.network.sendAction('ADMIN_START_GAME');
      return;
    }

    const count = this.state.players.length;
    if (count < 4) {
      alert('Oyunu başlatmak için en az 4 oyuncu gereklidir (Grup büyüklüğüne göre roller otomatik dengelenir).');
      return;
    }

    // Rolleri oluştur ve karıştır
    const roleDeck = this.generateRoleDeck(count);
    this.shuffle(roleDeck);

    this.state.players.forEach((p, idx) => {
      p.role = roleDeck[idx];
      p.isAlive = true;
      p.confirmedRole = p.isBot ? true : false;
    });

    this.state.phase = PHASES.ROLE_REVEAL;
    this.state.nightCount = 0;
    this.state.winner = null;
    this.state.historyLogs = [];
    this.addLog(`Oyun ${count} oyuncu ile başladı.`);

    this.broadcastCurrentState();
  }

  // Kişi sayısına göre dinamik rol dengesi hesaplama
  getDynamicRoleComposition(playerCount) {
    const total = Math.max(1, playerCount);
    let vampires = 2;
    let doctors = 1;
    let seers = 1;

    if (total <= 4) {
      vampires = 1;
      doctors = 1;
      seers = 0;
    } else if (total <= 6) {
      vampires = 1;
      doctors = 1;
      seers = 1;
    } else if (total <= 9) {
      // 7, 8, 9 kişilik gruplarda ideal denge: 2 Vampir, 1 Doktor, 1 Kahin
      vampires = 2;
      doctors = 1;
      seers = 1;
    } else {
      // 10 ve üzeri kalabalık gruplar için 3 vampir
      vampires = Math.max(3, Math.floor(total * 0.3));
      doctors = 1;
      seers = 1;
    }

    const villagers = Math.max(1, total - (vampires + doctors + seers));
    return { vampires, doctors, seers, villagers, total };
  }

  generateRoleDeck(playerCount) {
    let comp = this.state.roleSetup;
    if (!comp || !this.state.customRoleSetupManuallySet) {
      const dynamic = this.getDynamicRoleComposition(playerCount);
      comp = {
        vampire: dynamic.vampires,
        doctor: dynamic.doctors,
        seer: dynamic.seers,
        villager: dynamic.villagers
      };
      this.state.roleSetup = comp;
    }

    let vampires = comp.vampire !== undefined ? comp.vampire : (comp.vampires || 2);
    let doctors = comp.doctor !== undefined ? comp.doctor : (comp.doctors || 1);
    let seers = comp.seer !== undefined ? comp.seer : (comp.seers || 1);

    if (vampires < 1) vampires = 1;

    let deck = [];
    for (let i = 0; i < vampires; i++) deck.push('VAMPIRE');
    for (let i = 0; i < doctors; i++) deck.push('DOCTOR');
    for (let i = 0; i < seers; i++) deck.push('SEER');

    // 4 Benzersiz Meme Köylü Kartı Havuzu
    const allMemeVillagers = ['VILLAGER_1', 'VILLAGER_2', 'VILLAGER_3', 'VILLAGER_4'];
    const shuffledMemes = [...allMemeVillagers];
    this.shuffle(shuffledMemes);

    // Kalan tüm koltukları meme köylü kartlarıyla doldur
    const neededVillagers = Math.max(0, playerCount - deck.length);
    for (let i = 0; i < neededVillagers; i++) {
      if (i < shuffledMemes.length) {
        deck.push(shuffledMemes[i]);
      } else {
        deck.push(shuffledMemes[i % shuffledMemes.length]);
      }
    }

    return deck;
  }

  shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  // Gece 0/1 Intro
  startPhaseNightIntro() {
    this.state.phase = PHASES.NIGHT_INTRO;
    this.state.nightCount++;
    this.state.nightActions = {
      vampireTarget: null,
      vampireVotes: {},
      doctorTarget: null,
      lastDoctorTarget: this.state.nightActions.doctorTarget || null,
      seerTarget: null,
      seerResult: null
    };

    this.startTimer(6, null, () => {
      this.startPhaseNightVampire();
    });
  }

  // Gece Vampir Fazı (25 sn)
  startPhaseNightVampire() {
    this.state.phase = PHASES.NIGHT_VAMPIRE;

    // Bot vampirler varsa otomatik hedef seçtir
    this.simulateBotVampireVote();

    this.startTimer(25, null, () => {
      this.evaluateVampireVotes();
      this.startPhaseNightDoctor();
    });
  }

  evaluateVampireVotes() {
    const votes = this.state.nightActions.vampireVotes;
    const voteCounts = {};
    Object.values(votes).forEach(t => {
      if (t) voteCounts[t] = (voteCounts[t] || 0) + 1;
    });

    let topTarget = null;
    let maxVotes = 0;
    for (const [targetId, count] of Object.entries(voteCounts)) {
      if (count > maxVotes) {
        maxVotes = count;
        topTarget = targetId;
      }
    }
    this.state.nightActions.vampireTarget = topTarget;
  }

  // Gece Doktor Fazı (20 sn)
  startPhaseNightDoctor() {
    const doctorAlive = this.state.players.some(p => p.role === 'DOCTOR' && p.isAlive);
    if (!doctorAlive) {
      // Doktor ölmüşse hızlıca Kahine geç
      setTimeout(() => this.startPhaseNightSeer(), 2500);
      return;
    }

    this.state.phase = PHASES.NIGHT_DOCTOR;
    this.simulateBotDoctorProtect();

    this.startTimer(20, null, () => {
      this.startPhaseNightSeer();
    });
  }

  // Gece Kahin Fazı (20 sn)
  startPhaseNightSeer() {
    const seerAlive = this.state.players.some(p => p.role === 'SEER' && p.isAlive);
    if (!seerAlive) {
      setTimeout(() => this.startPhaseDayDawn(), 2500);
      return;
    }

    this.state.phase = PHASES.NIGHT_SEER;
    this.simulateBotSeerInspect();

    this.startTimer(20, null, () => {
      this.startPhaseDayDawn();
    });
  }

  // Gündüz Şafak & Rapor (8 sn)
  startPhaseDayDawn() {
    this.state.phase = PHASES.DAY_DAWN;

    const vTargetId = this.state.nightActions.vampireTarget;
    const docTargetId = this.state.nightActions.doctorTarget;

    let killedPlayer = null;
    if (vTargetId && vTargetId !== docTargetId) {
      killedPlayer = this.state.players.find(p => p.id === vTargetId);
      if (killedPlayer) {
        killedPlayer.isAlive = false;
        this.addLog(`Gece: ${killedPlayer.name} vampirler tarafından öldürüldü.`);
      }
    } else if (vTargetId && vTargetId === docTargetId) {
      const saved = this.state.players.find(p => p.id === vTargetId);
      this.addLog(`Gece: Doktor ${saved ? saved.name : 'birini'} kurtardı!`);
    } else {
      this.addLog('Gece: Vampirler kurban seçemedi.');
    }

    this.state.dayActions = {
      skipDebateVotes: [],
      votes: {},
      lastKilledNight: killedPlayer ? { name: killedPlayer.name, role: killedPlayer.role } : null,
      lastExecutedDay: null
    };

    // Zafer kontrolü
    if (this.checkVictory()) {
      return;
    }

    this.startTimer(8, null, () => {
      this.startPhaseDayDiscussion();
    });
  }

  // Gündüz Tartışma (120 sn / 2 Dakika)
  startPhaseDayDiscussion() {
    this.state.phase = PHASES.DAY_DISCUSSION;
    this.startTimer(120, null, () => {
      this.startPhaseVoting();
    });
  }

  // Gündüz Mahkeme & Oylama (40 sn)
  startPhaseVoting() {
    this.state.phase = PHASES.DAY_VOTING;
    this.state.dayActions.votes = {};

    // Botlar oy kullansın
    this.simulateBotDayVotes();

    this.startTimer(40, null, () => {
      this.evaluateVotesAndExecute();
    });
  }

  // Oyları Say ve İnfaz Et
  evaluateVotesAndExecute() {
    clearInterval(this.timerInterval);
    this.state.phase = PHASES.DAY_EXECUTION;

    const votes = this.state.dayActions.votes;
    const voteCounts = {};
    Object.values(votes).forEach(t => {
      if (t && t !== 'SKIP') {
        voteCounts[t] = (voteCounts[t] || 0) + 1;
      }
    });

    let highestTarget = null;
    let maxVotes = 0;
    let isTie = false;

    for (const [targetId, count] of Object.entries(voteCounts)) {
      if (count > maxVotes) {
        maxVotes = count;
        highestTarget = targetId;
        isTie = false;
      } else if (count === maxVotes) {
        isTie = true;
      }
    }

    let executedPlayer = null;
    if (highestTarget && !isTie && maxVotes > 1) {
      executedPlayer = this.state.players.find(p => p.id === highestTarget);
      if (executedPlayer) {
        executedPlayer.isAlive = false;
        this.state.dayActions.lastExecutedDay = {
          name: executedPlayer.name,
          role: executedPlayer.role
        };
        this.addLog(`Mahkeme: ${executedPlayer.name} ${maxVotes} oyla asıldı (${ROLES[executedPlayer.role].name}).`);
      }
    } else {
      this.state.dayActions.lastExecutedDay = null;
      this.addLog(`Mahkeme: Oylar eşit çıktı veya yetersizdi, kimse asılmadı.`);
    }

    if (this.checkVictory()) {
      return;
    }

    // 8 saniye infaz ekranını gösterip yeni geceye geç
    this.startTimer(8, null, () => {
      this.startPhaseNightIntro();
    });
  }

  // Zafer Durumu Kontrolü
  checkVictory() {
    const alive = this.getAlivePlayers();
    const aliveVamps = alive.filter(p => p.role === 'VAMPIRE');
    const aliveGood = alive.filter(p => p.role !== 'VAMPIRE');

    if (aliveVamps.length === 0) {
      this.state.phase = PHASES.GAME_OVER;
      this.state.winner = 'good';
      this.addLog('ZAFER: Köylüler tüm vampirleri yok etti!');
      this.broadcastCurrentState();
      return true;
    }

    if (aliveVamps.length >= aliveGood.length) {
      this.state.phase = PHASES.GAME_OVER;
      this.state.winner = 'evil';
      this.addLog('ZAFER: Vampirler köyün kontrolünü ele geçirdi!');
      this.broadcastCurrentState();
      return true;
    }

    return false;
  }

  getAlivePlayers() {
    return this.state.players.filter(p => p.isAlive);
  }

  addLog(msg) {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    this.state.historyLogs.unshift(`[${time}] ${msg}`);
  }

  // --- BOT SIMÜLASYON YÖNTEMLERİ ---

  addTestBots(targetTotal = 7) {
    const botNames = ['Zeynep', 'Ahmet', 'Mehmet', 'Ayşe', 'Elif', 'Burak', 'Selin', 'Can'];
    let nameIdx = 0;
    while (this.state.players.length < targetTotal) {
      const name = botNames[nameIdx] || `Oyuncu ${this.state.players.length + 1}`;
      nameIdx++;
      this.state.players.push({
        id: 'bot_' + Math.random().toString(36).substring(2, 7),
        name: name,
        isHost: false,
        isReady: true,
        isAlive: true,
        role: null,
        isBot: true
      });
    }
    this.broadcastCurrentState();
  }

  simulateBotVampireVote() {
    const botVamps = this.state.players.filter(p => p.isBot && p.role === 'VAMPIRE' && p.isAlive);
    const innocents = this.state.players.filter(p => p.isAlive && p.role !== 'VAMPIRE');
    if (botVamps.length > 0 && innocents.length > 0) {
      const picked = innocents[Math.floor(Math.random() * innocents.length)];
      botVamps.forEach(bv => {
        this.state.nightActions.vampireVotes[bv.id] = picked.id;
      });
    }
  }

  simulateBotDoctorProtect() {
    const botDoc = this.state.players.find(p => p.isBot && p.role === 'DOCTOR' && p.isAlive);
    if (botDoc) {
      const alive = this.getAlivePlayers().filter(p => p.id !== this.state.nightActions.lastDoctorTarget);
      if (alive.length > 0) {
        const picked = alive[Math.floor(Math.random() * alive.length)];
        this.state.nightActions.doctorTarget = picked.id;
      }
    }
  }

  simulateBotSeerInspect() {
    const botSeer = this.state.players.find(p => p.isBot && p.role === 'SEER' && p.isAlive);
    if (botSeer) {
      const others = this.getAlivePlayers().filter(p => p.id !== botSeer.id);
      if (others.length > 0) {
        const picked = others[Math.floor(Math.random() * others.length)];
        this.state.nightActions.seerTarget = picked.id;
      }
    }
  }

  simulateBotDayVotes() {
    const botPlayers = this.state.players.filter(p => p.isBot && p.isAlive);
    const alive = this.getAlivePlayers();

    botPlayers.forEach(bot => {
      // %20 ihtimalle pas, %80 ihtimalle rastgele birine oy
      if (Math.random() < 0.2) {
        this.state.dayActions.votes[bot.id] = 'SKIP';
      } else {
        const candidates = alive.filter(p => p.id !== bot.id);
        const target = candidates[Math.floor(Math.random() * candidates.length)];
        this.state.dayActions.votes[bot.id] = target.id;
      }
    });
  }

  // --- KULLANICI ETKİLEŞİMİ & AKSİYONLARI ---

  toggleMyReady() {
    this.network.sendAction('TOGGLE_READY');
  }

  confirmMyRole() {
    this.network.sendAction('CONFIRM_ROLE');
    this.me.confirmedRole = true;
    this.renderUI();
  }

  voteVampireTarget(targetId) {
    this.network.sendAction('VAMPIRE_VOTE', { targetId });
    this.haptic.confirmAction();
    this.sound.playHeartbeat();
  }

  protectDoctorTarget(targetId) {
    this.network.sendAction('DOCTOR_PROTECT', { targetId });
    this.haptic.confirmAction();
  }

  inspectSeerTarget(targetId) {
    this.network.sendAction('SEER_INSPECT', { targetId });
    this.haptic.confirmAction();
  }

  voteDayTarget(targetId) {
    this.network.sendAction('CAST_VOTE', { targetId });
    this.haptic.confirmAction();
  }

  skipDayDebate() {
    this.network.sendAction('SKIP_DEBATE');
    this.haptic.confirmAction();
  }

  displaySeerResult(result) {
    const cardEl = document.getElementById('seer-reveal-card');
    if (!cardEl) return;

    cardEl.style.display = 'block';
    const isVamp = result.isVampire;
    cardEl.className = `seer-result-card ${isVamp ? 'is-vampire' : 'is-innocent'}`;
    cardEl.innerHTML = `
      <div class="result-badge">${isVamp ? '☠️ VAMPİR' : '🛡️ MASUM'}</div>
      <h3>${result.targetName}</h3>
      <p>${isVamp ? 'Bu kişi karanlığın hizmetkarı, BİR VAMPİR!' : 'Bu kişi temiz kalpli masum bir köylü.'}</p>
    `;
    this.sound.playCardSting();
  }

  // --- ROL YAPILANDIRMA VE SEÇİM METODLARI ---

  toggleRoleCustomizer() {
    const body = document.getElementById('customizer-body');
    const icon = document.getElementById('customizer-toggle-icon');
    if (!body) return;
    const isHidden = body.style.display === 'none';
    body.style.display = isHidden ? 'block' : 'none';
    if (icon) icon.textContent = isHidden ? '▲' : '▼';
  }

  adjustRoleCount(roleKey, delta) {
    const isCanberk = (this.me.name || '').trim().toLowerCase() === 'canberk' || this.me.isAdmin;
    if (!this.network.isHost && !isCanberk) {
      alert('Rolleri sadece Oda Lideri (Host) veya Admin ayarlayabilir.');
      return;
    }

    const currentSetup = { ...this.state.roleSetup };
    let v = currentSetup.vampire !== undefined ? currentSetup.vampire : 2;
    let d = currentSetup.doctor !== undefined ? currentSetup.doctor : 1;
    let s = currentSetup.seer !== undefined ? currentSetup.seer : 1;
    let vill = currentSetup.villager !== undefined ? currentSetup.villager : 3;

    if (roleKey === 'vampire') v = Math.max(1, Math.min(6, v + delta));
    if (roleKey === 'doctor') d = Math.max(0, Math.min(3, d + delta));
    if (roleKey === 'seer') s = Math.max(0, Math.min(3, s + delta));
    if (roleKey === 'villager') vill = Math.max(0, Math.min(15, vill + delta));

    const newSetup = { vampire: v, doctor: d, seer: s, villager: vill };
    this.network.sendAction('UPDATE_ROLE_SETUP', { roleSetup: newSetup, isAuto: false });
    this.haptic.confirmAction();
  }

  autoBalanceRoles() {
    const isCanberk = (this.me.name || '').trim().toLowerCase() === 'canberk' || this.me.isAdmin;
    if (!this.network.isHost && !isCanberk) return;

    const count = this.state.players.length || 7;
    const comp = this.getDynamicRoleComposition(count);
    const newSetup = {
      vampire: comp.vampires,
      doctor: comp.doctors,
      seer: comp.seers,
      villager: comp.villagers
    };
    this.network.sendAction('UPDATE_ROLE_SETUP', { roleSetup: newSetup, isAuto: true });
    this.haptic.confirmAction();
  }

  // --- CANBERK ADMİN YARDIMCI METODLARI ---

  adminForceNextPhase() {
    this.haptic.confirmAction();
    if (this.network.isHost || this.me.isAdmin) {
      this.executeForceNextPhase(`Admin (${this.me.name || 'Canberk'})`);
    } else {
      this.network.sendAction('ADMIN_FORCE_NEXT_PHASE');
    }
  }

  adminForceVote() {
    this.haptic.confirmAction();
    if (this.network.isHost || this.me.isAdmin) {
      this.addLog(`⚡ Admin (${this.me.name || 'Canberk'}) tartışmayı bitirip oylamayı başlattı.`);
      clearInterval(this.timerInterval);
      if (this.clientTimerInterval) clearInterval(this.clientTimerInterval);
      if (this._phaseAutoAdvanceTimeout) clearTimeout(this._phaseAutoAdvanceTimeout);
      this.startPhaseVoting();
    } else {
      this.network.sendAction('ADMIN_FORCE_VOTE');
    }
  }

  adminResetLobby() {
    if (confirm('Oyunu sıfırlayıp herkesi lobiye döndürmek istediğinize emin misiniz?')) {
      this.haptic.confirmAction();
      const modal = document.getElementById('admin-panel-modal');
      if (modal) modal.style.display = 'none';

      if (this.network.isHost || this.me.isAdmin) {
        this.executeResetLobby(`Admin (${this.me.name || 'Canberk'})`);
      } else {
        this.network.sendAction('ADMIN_RESET_LOBBY');
      }
    }
  }

  adminSetVictory(team) {
    if (confirm(`Oyunu ${team === 'evil' ? 'VAMPİRLER' : 'KÖYLÜLER'} lehine bitirmek istediğinize emin misiniz?`)) {
      this.haptic.confirmAction();
      const modal = document.getElementById('admin-panel-modal');
      if (modal) modal.style.display = 'none';

      if (this.network.isHost || this.me.isAdmin) {
        clearInterval(this.timerInterval);
        if (this.clientTimerInterval) clearInterval(this.clientTimerInterval);
        if (this._phaseAutoAdvanceTimeout) clearTimeout(this._phaseAutoAdvanceTimeout);
        this.state.phase = PHASES.GAME_OVER;
        this.state.winner = team;
        this.addLog(`⚡ Admin (${this.me.name || 'Canberk'}) oyunu sonlandırdı: ${team === 'evil' ? 'Vampirler' : 'Köylüler'} kazandı!`);
        this.broadcastCurrentState();
      } else {
        this.network.sendAction('ADMIN_SET_VICTORY', { winner: team });
      }
    }
  }

  adminToggleLife(targetId) {
    this.haptic.confirmAction();
    if (this.network.isHost || this.me.isAdmin) {
      const target = this.state.players.find(p => p.id === targetId);
      if (target) {
        target.isAlive = !target.isAlive;
        this.addLog(`⚡ Admin (${this.me.name || 'Canberk'}) ${target.name}'i ${target.isAlive ? 'diriltti' : 'öldürdü'}.`);
        this.checkVictory();
        this.broadcastCurrentState();
      }
    } else {
      this.network.sendAction('ADMIN_TOGGLE_LIFE', { targetId });
    }
  }

  adminToggleGodView() {
    this.me.godViewEnabled = !this.me.godViewEnabled;
    this.renderUI();
  }

  // --- UI RENDER MOTORU ---

  renderUI() {
    const phase = this.state.phase;
    const viewLobby = document.getElementById('view-lobby');
    const viewGame = document.getElementById('view-game');
    const viewGameOver = document.getElementById('view-game-over');

    // Hangi ana görünümün aktif olacağı
    if (phase === PHASES.LOBBY) {
      if (viewLobby) viewLobby.style.display = 'block';
      if (viewGame) viewGame.style.display = 'none';
      if (viewGameOver) viewGameOver.style.display = 'none';
      this.renderLobby();
      return;
    }

    if (phase === PHASES.GAME_OVER) {
      if (viewLobby) viewLobby.style.display = 'none';
      if (viewGame) viewGame.style.display = 'none';
      if (viewGameOver) viewGameOver.style.display = 'block';
      this.renderGameOver();
      return;
    }

    if (viewLobby) viewLobby.style.display = 'none';
    if (viewGame) viewGame.style.display = 'block';
    if (viewGameOver) viewGameOver.style.display = 'none';

    this.renderGamePhase();
    this.renderAdminFloatingPanel();
  }

  renderLobby() {
    // Oda Kodu & Başlık
    const codeDisplay = document.getElementById('lobby-room-code');
    if (codeDisplay) codeDisplay.textContent = this.network.roomCode || '----';

    // Oyuncu Listesi
    const listEl = document.getElementById('lobby-player-list');
    if (!listEl) return;
    listEl.innerHTML = '';

    const pCount = this.state.players.length;
    const countEl = document.getElementById('player-count-display');
    if (countEl) {
      countEl.textContent = `${pCount} Oyuncu${pCount < 4 ? ' (Min 4)' : ''}`;
    }

    // Rol Yapılandırması ve Önizleme
    const setup = this.state.roleSetup || this.getDynamicRoleComposition(pCount || 7);
    const vVal = setup.vampire !== undefined ? setup.vampire : (setup.vampires || 2);
    const dVal = setup.doctor !== undefined ? setup.doctor : (setup.doctors || 1);
    const sVal = setup.seer !== undefined ? setup.seer : (setup.seers || 1);
    const villVal = setup.villager !== undefined ? setup.villager : (setup.villagers || 3);
    const totalRoles = vVal + dVal + sVal + villVal;

    // Rol Önizleme Çubuğu
    const previewEl = document.getElementById('lobby-role-preview');
    if (previewEl) {
      previewEl.innerHTML = `
        <span class="preview-badge vamp">🧛 ${vVal} Vampir</span>
        ${dVal > 0 ? `<span class="preview-badge doc">💉 ${dVal} Doktor</span>` : ''}
        ${sVal > 0 ? `<span class="preview-badge seer">🔮 ${sVal} Kahin</span>` : ''}
        <span class="preview-badge vill">🧑‍🌾 ${villVal} Köylü</span>
      `;
    }

    // Rol Yapılandırma Paneli Elemanları
    const vEl = document.getElementById('count-role-vampire');
    const dEl = document.getElementById('count-role-doctor');
    const sEl = document.getElementById('count-role-seer');
    const villEl = document.getElementById('count-role-villager');
    const totRolesEl = document.getElementById('customizer-total-roles');
    const totPlayersEl = document.getElementById('customizer-total-players');
    const sumTextEl = document.getElementById('customizer-summary-text');

    if (vEl) vEl.textContent = vVal;
    if (dEl) dEl.textContent = dVal;
    if (sEl) sEl.textContent = sVal;
    if (villEl) villEl.textContent = villVal;
    if (totRolesEl) totRolesEl.textContent = totalRoles;
    if (totPlayersEl) totPlayersEl.textContent = pCount || 7;
    if (sumTextEl) {
      sumTextEl.textContent = `${vVal} Vampir, ${dVal} Doktor, ${sVal} Kahin, ${villVal} Köylü`;
    }

    this.state.players.forEach(p => {
      const isMe = p.id === this.me.id;
      const isCanberk = (p.name || '').trim().toLowerCase() === 'canberk' || p.isAdmin;
      const card = document.createElement('div');
      card.className = `player-lobby-card ${p.isReady ? 'ready' : ''} ${isMe ? 'is-me' : ''} ${isCanberk ? 'is-admin-card' : ''}`;
      card.innerHTML = `
        <div class="player-avatar-circle">${p.name.charAt(0).toUpperCase()}</div>
        <div class="player-info">
          <div class="name">
            ${p.name}
            ${isMe ? '<span class="tag-me">(Siz)</span>' : ''}
            ${p.isHost ? '<span class="tag-host">👑 Lider</span>' : ''}
            ${isCanberk ? '<span class="tag-admin">⚡ Admin</span>' : ''}
          </div>
          <div class="ready-status">${p.isReady ? '✓ HAZIR' : 'Bekleniyor...'}</div>
        </div>
      `;
      listEl.appendChild(card);
    });

    // Hazır Butonu
    const readyBtn = document.getElementById('btn-lobby-ready');
    if (readyBtn) {
      readyBtn.className = `btn-primary ${this.me.isReady ? 'btn-ready-active' : ''}`;
      readyBtn.textContent = this.me.isReady ? '✓ HAZIRSINIZ (Değiştir)' : 'HAZIRIM';
    }

    // Host veya Canberk Kontrolleri
    const hostControls = document.getElementById('host-controls');
    const isCanberkMe = (this.me.name || '').trim().toLowerCase() === 'canberk' || this.me.isAdmin;
    if (hostControls) {
      hostControls.style.display = (this.network.isHost || isCanberkMe) ? 'flex' : 'none';
    }

    // QR Kod Oluşturma
    this.renderQRCode();
    this.renderAdminFloatingPanel();
  }

  renderAdminFloatingPanel() {
    const isCanberk = (this.me.name || '').trim().toLowerCase() === 'canberk' || this.me.isAdmin;
    const adminFloatBtn = document.getElementById('btn-admin-floating');
    if (adminFloatBtn) {
      adminFloatBtn.style.display = isCanberk ? 'flex' : 'none';
    }

    const adminPanel = document.getElementById('admin-panel-modal');
    if (!adminPanel || !isCanberk) return;

    const phaseNameEl = document.getElementById('admin-current-phase');
    if (phaseNameEl) phaseNameEl.textContent = this.state.phase;

    const godBtn = document.getElementById('btn-admin-god-view');
    if (godBtn) {
      godBtn.textContent = this.me.godViewEnabled ? '👁️ Röntgenci Modu: AÇIK (Rolleri Görüyorsun)' : '👁️ Röntgenci Modu: KAPALI';
      godBtn.className = `admin-btn ${this.me.godViewEnabled ? 'active-gold' : ''}`;
    }

    // Oyuncu Hayat Listesi
    const playersListEl = document.getElementById('admin-players-control-list');
    if (playersListEl) {
      playersListEl.innerHTML = this.state.players.map(p => {
        const r = ROLES[p.role];
        return `
          <div class="admin-player-row">
            <span class="p-name">${p.name} ${r ? `<small style="color:${r.color}">(${r.name})</small>` : ''}</span>
            <span class="p-status ${p.isAlive ? 'alive' : 'dead'}">${p.isAlive ? 'Canlı' : 'Ölü'}</span>
            <button class="btn-admin-small" onclick="window.gameController.adminToggleLife('${p.id}')">
              ${p.isAlive ? '💀 Öldür' : '💚 Dirilt'}
            </button>
          </div>
        `;
      }).join('');
    }
  }

  renderQRCode() {
    const qrContainer = document.getElementById('lobby-qrcode');
    if (!qrContainer || !window.QRCode || !this.network.roomCode) return;
    if (qrContainer.dataset.rendered === this.network.roomCode) return;

    qrContainer.innerHTML = '';
    const joinUrl = `${window.location.origin}${window.location.pathname}#${this.network.roomCode}`;
    new QRCode(qrContainer, {
      text: joinUrl,
      width: 140,
      height: 140,
      colorDark: '#0a0b0e',
      colorLight: '#f59e0b',
      correctLevel: QRCode.CorrectLevel.M
    });
    qrContainer.dataset.rendered = this.network.roomCode;
  }

  renderGamePhase() {
    const phase = this.state.phase;
    const phaseHeader = document.getElementById('phase-title');
    const phaseSub = document.getElementById('phase-subtitle');
    const timerVal = document.getElementById('phase-timer-value');
    const contentArea = document.getElementById('game-phase-content');
    const myRoleBanner = document.getElementById('my-role-pill');

    if (timerVal) {
      timerVal.textContent = this.formatTime(this.state.timer);
    }

    if (myRoleBanner && this.me.role) {
      const r = ROLES[this.me.role];
      myRoleBanner.innerHTML = `<span style="color:${r.color}; font-weight:bold;">${r.name}</span> | ${this.me.isAlive ? '💚 Hayatta' : '☠️ Ölü (Hayalet)'}`;
    }

    if (!contentArea) return;

    // --- FAZ 1: ROLÜ GÖRME & ONAYLAMA ---
    if (phase === PHASES.ROLE_REVEAL) {
      if (phaseHeader) phaseHeader.textContent = 'GİZLİ KİMLİK';
      if (phaseSub) phaseSub.textContent = 'Kartınıza basılı tutarak rolünüzü öğrenin.';

      const roleData = ROLES[this.me.role] || ROLES.VILLAGER;
      contentArea.innerHTML = `
        <div class="role-reveal-container">
          <div class="card-flipper-box" id="card-reveal-box" title="Kartı Çevir">
            <div class="card-inner">
              <div class="card-face card-back">
                <img src="assets/card_back.jpg" alt="Kart Arkası" />
                <div class="hold-prompt">
                  <span class="finger-icon">🃏</span>
                  <strong>KARTI ÇEVİRMEK İÇİN TIKLA</strong>
                  <small>Gizli kimliğinizi görmek için dokunun</small>
                </div>
              </div>
              <div class="card-face card-front">
                <img src="${roleData.image}" alt="${roleData.name}" />
              </div>
            </div>
          </div>

          <div class="role-info-card">
            <h2 style="color:${roleData.color}">${roleData.name.toUpperCase()}</h2>
            <p class="role-desc">${roleData.description}</p>
            <div class="role-inst">${roleData.instruction}</div>
          </div>

          <div class="confirm-role-section">
            <button id="btn-toggle-flip" class="btn-secondary" style="width:100%; margin-bottom: 10px;">
              🔄 Kartı Çevir / Gizle
            </button>
            <button id="btn-confirm-role" class="btn-primary ${this.me.confirmedRole ? 'disabled' : ''}">
              ${this.me.confirmedRole ? '✓ Rolü Onayladınız (Diğerleri Bekleniyor)' : 'ROLÜMÜ ANLADIM VE HAZIRIM'}
            </button>
          </div>
        </div>
      `;

      this.setupHoldToReveal();
      const confBtn = document.getElementById('btn-confirm-role');
      if (confBtn && !this.me.confirmedRole) {
        confBtn.onclick = () => this.confirmMyRole();
      }
      return;
    }

    // --- FAZ 2: GECE GİRİŞ (UYKU) ---
    if (phase === PHASES.NIGHT_INTRO) {
      if (phaseHeader) phaseHeader.textContent = 'GECE OLUYOR...';
      if (phaseSub) phaseSub.textContent = 'Köy uykuya dalıyor. Herkes gözlerini kapatsın!';
      contentArea.innerHTML = `
        <div class="night-blind-screen">
          <div class="moon-pulse">🌕</div>
          <h2>HERKES GÖZLERİNİ KAPATSIN</h2>
          <p>Telefonunuzu masaya ters koyun veya ekranı kapatın.</p>
          <div class="sleeping-fog"></div>
        </div>
      `;
      return;
    }

    // --- FAZ 3: GECE VAMPİR ---
    if (phase === PHASES.NIGHT_VAMPIRE) {
      const isVamp = this.me.role === 'VAMPIRE' && this.me.isAlive;
      if (phaseHeader) phaseHeader.textContent = isVamp ? 'VAMPİRLER UYANDI' : 'GECE (UYUYORSUNUZ)';
      if (phaseSub) phaseSub.textContent = isVamp ? 'Ortağınızla kurbanınızı seçin.' : 'Gözlerinizi açmayın!';

      if (!isVamp) {
        this.renderSleepingBlindScreen(contentArea);
        return;
      }

      // Vampir Ekranı
      const otherVamps = this.state.players.filter(p => p.role === 'VAMPIRE' && p.id !== this.me.id);
      const otherVamp = otherVamps.length > 0 ? otherVamps[0] : null;
      const partnerVoteId = otherVamp ? this.state.nightActions.vampireVotes[otherVamp.id] : null;
      const partnerTarget = partnerVoteId ? this.state.players.find(p => p.id === partnerVoteId) : null;
      const myVoteId = this.state.nightActions.vampireVotes[this.me.id];

      // Kurban listesi: sadece yaşayan masumlar (kendisi ve diğer vampirler HARİÇ!)
      const targets = this.state.players.filter(p => p.isAlive && p.role !== 'VAMPIRE' && p.id !== this.me.id);

      contentArea.innerHTML = `
        <div class="vampire-action-panel">
          <div class="vampire-partner-badge">
            ${otherVamp ? `
              🧛 Ortağınız: <strong>${otherVamp.name}</strong>
              ${partnerTarget ? `<span class="partner-choice">Ortağın tercihi: <em>${partnerTarget.name}</em></span>` : '<span class="partner-choice">Ortağın henüz seçmedi</span>'}
            ` : `
              🧛 <strong>Tek Vampirsiniz</strong>
              <span class="partner-choice" style="color:var(--color-gold);">Köydeki av tamamen sizin elinizde!</span>
            `}
          </div>

          ${myVoteId ? `
            <div class="vote-locked-banner" style="background:rgba(225,29,72,0.18); border:1px solid #e11d48; border-radius:8px; padding:10px 14px; margin-bottom:14px; text-align:center; font-size:13px;">
              🩸 Seçiminiz yapıldı: <strong>${this.state.players.find(p=>p.id===myVoteId)?.name || ''}</strong>. 
              ${otherVamp ? (partnerVoteId ? (partnerVoteId === myVoteId ? '✓ Ortakla anlaştınız! Faz otomatik ilerletiliyor...' : '⏳ Ortağınızla hedefleriniz farklı.') : 'Ortağınızın seçimi bekleniyor...') : '✓ Kurban kilitlendi, faz otomatik ilerletiliyor...'}
            </div>
          ` : ''}

          <h3 class="panel-section-title">Kurbanınızı Seçin:</h3>
          <div class="player-selection-grid">
            ${targets.map(t => {
              const isSelectedByMe = myVoteId === t.id;
              const isSelectedByPartner = partnerVoteId === t.id;
              return `
                <button class="target-card ${isSelectedByMe ? 'selected-by-me' : ''} ${isSelectedByPartner ? 'selected-by-partner' : ''}" onclick="window.gameController.voteVampireTarget('${t.id}')">
                  <div class="target-avatar">${t.name.charAt(0)}</div>
                  <div class="target-name">${t.name}</div>
                  ${isSelectedByPartner ? '<span class="partner-badge">🧛 Ortak Seçimi</span>' : ''}
                  ${isSelectedByMe ? '<span class="my-badge">✓ Seçiminiz</span>' : ''}
                </button>
              `;
            }).join('')}
          </div>
        </div>
      `;
      return;
    }

    // --- FAZ 4: GECE DOKTOR ---
    if (phase === PHASES.NIGHT_DOCTOR) {
      const isDoc = this.me.role === 'DOCTOR' && this.me.isAlive;
      if (phaseHeader) phaseHeader.textContent = isDoc ? 'DOKTOR UYANDI' : 'GECE (UYUYORSUNUZ)';
      if (phaseSub) phaseSub.textContent = isDoc ? 'Korumak istediğiniz bir köylüyü seçin.' : 'Gözlerinizi açmayın!';

      if (!isDoc) {
        this.renderSleepingBlindScreen(contentArea);
        return;
      }

      const lastProtected = this.state.nightActions.lastDoctorTarget;
      const targets = this.getAlivePlayers();
      const myPick = this.state.nightActions.doctorTarget;

      contentArea.innerHTML = `
        <div class="doctor-action-panel">
          <div class="doctor-info-badge">
            🛡️ Bu gece kimi kurtarmak istiyorsunuz?
            ${lastProtected ? `<small>(Geçen gece korunan: ${this.state.players.find(p=>p.id===lastProtected)?.name || ''} - Üst üste seçilemez)</small>` : ''}
          </div>
          <div class="player-selection-grid">
            ${targets.map(t => {
              const isBlocked = t.id === lastProtected;
              const isSelected = myPick === t.id;
              return `
                <button class="target-card ${isSelected ? 'selected-doctor' : ''} ${isBlocked ? 'disabled' : ''}" ${isBlocked ? 'disabled' : ''} onclick="window.gameController.protectDoctorTarget('${t.id}')">
                  <div class="target-avatar">${t.name.charAt(0)}</div>
                  <div class="target-name">${t.name}</div>
                  ${isSelected ? '<span class="doc-badge">🛡️ Korumada</span>' : ''}
                </button>
              `;
            }).join('')}
          </div>
        </div>
      `;
      return;
    }

    // --- FAZ 5: GECE KAHİN ---
    if (phase === PHASES.NIGHT_SEER) {
      const isSeer = this.me.role === 'SEER' && this.me.isAlive;
      if (phaseHeader) phaseHeader.textContent = isSeer ? 'KAHİN UYANDI' : 'GECE (UYUYORSUNUZ)';
      if (phaseSub) phaseSub.textContent = isSeer ? 'Gizli kimliğini öğrenmek istediğiniz kişiyi seçin.' : 'Gözlerinizi açmayın!';

      if (!isSeer) {
        this.renderSleepingBlindScreen(contentArea);
        return;
      }

      const targets = this.getAlivePlayers().filter(p => p.id !== this.me.id);
      contentArea.innerHTML = `
        <div class="seer-action-panel">
          <div class="seer-info-badge">🔮 Bir köylü seçin, gizli kimliği kristal kürede belirsin.</div>
          <div id="seer-reveal-card" class="seer-reveal-container" style="display:none;"></div>
          <div class="player-selection-grid">
            ${targets.map(t => `
              <button class="target-card" onclick="window.gameController.inspectSeerTarget('${t.id}')">
                <div class="target-avatar">${t.name.charAt(0)}</div>
                <div class="target-name">${t.name}</div>
              </button>
            `).join('')}
          </div>
        </div>
      `;
      return;
    }

    // --- FAZ 6: ŞAFAK / SABAH RAPORU ---
    if (phase === PHASES.DAY_DAWN) {
      if (phaseHeader) phaseHeader.textContent = 'GÜNEŞ DOĞDU ☀️';
      if (phaseSub) phaseSub.textContent = 'Köy uyanıyor, gece neler oldu?';

      const killed = this.state.dayActions.lastKilledNight;
      contentArea.innerHTML = `
        <div class="dawn-report-card ${killed ? 'has-death' : 'saved'}">
          <div class="report-icon">${killed ? '☠️' : '🕊️'}</div>
          <h2>${killed ? `${killed.name.toUpperCase()} KATLEDİLDİ!` : 'KİMSE ÖLMEDİ!'}</h2>
          <p>${killed ? `Vampirler gece kan döktü. ${killed.name} artık aramızda değil.` : 'Doktor gece vampirlerin saldırısını püskürttü!'}</p>
        </div>
      `;
      return;
    }

    // --- FAZ 7: GÜNDÜZ TARTIŞMA (2 DAKİKA) ---
    if (phase === PHASES.DAY_DISCUSSION) {
      if (phaseHeader) phaseHeader.textContent = 'GÜNDÜZ TARTIŞMASI';
      if (phaseSub) phaseSub.textContent = 'Köy meydanında tartışın. Şüpheli vampirleri belirleyin!';

      const alive = this.getAlivePlayers();
      const skipVotes = this.state.dayActions.skipDebateVotes || [];
      const hasVotedSkip = skipVotes.includes(this.me.id);

      contentArea.innerHTML = `
        <div class="discussion-panel">
          <div class="discussion-timer-hero">
            <div class="radial-timer-box">
              <span class="timer-digits">${this.formatTime(this.state.timer)}</span>
              <span class="timer-label">Kalan Süre</span>
            </div>
          </div>

          <div class="alive-roster">
            <h4>Köyde Hayatta Kalanlar (${alive.length})</h4>
            <div class="alive-chips">
              ${alive.map(p => {
                const r = ROLES[p.role];
                const godTag = (this.me.godViewEnabled && r) ? `<span class="god-tag" style="color:${r.color}; font-size:11px; font-weight:bold; margin-left:4px;">[${r.name}]</span>` : '';
                return `
                  <div class="alive-chip ${p.id === this.me.id ? 'is-me' : ''}">
                    <span class="dot"></span> ${p.name} ${godTag}
                  </div>
                `;
              }).join('')}
            </div>
          </div>

          <div class="skip-debate-container">
            <button id="btn-skip-debate" class="btn-secondary ${hasVotedSkip ? 'disabled' : ''}" onclick="window.gameController.skipDayDebate()">
              ⚖️ ${hasVotedSkip ? 'Erken Oylama İstendi' : 'Tartışmayı Bitirip Oylamaya Geç'} (${skipVotes.length}/${Math.ceil(alive.length/2)})
            </button>
          </div>
        </div>
      `;
      return;
    }

    // --- FAZ 8: MAHKEME & OYLAMA ---
    if (phase === PHASES.DAY_VOTING) {
      if (phaseHeader) phaseHeader.textContent = 'KÖY MAHKEMESİ ⚖️';
      if (phaseSub) phaseSub.textContent = 'Kimi asmak istediğinizi oylayın veya Pas geçin.';

      const alive = this.getAlivePlayers();
      const myVote = this.state.dayActions.votes[this.me.id];
      const votesCastCount = Object.keys(this.state.dayActions.votes).length;

      if (!this.me.isAlive) {
        contentArea.innerHTML = `
          <div class="spectator-voting-banner">
            <div class="ghost-icon">👻</div>
            <h3>Ölüler Oy Kullanamaz</h3>
            <p>Hayattaki köylülerin oylamasını izliyorsunuz. (${votesCastCount} / ${alive.length} oy kullanıldı)</p>
          </div>
        `;
        return;
      }

      contentArea.innerHTML = `
        <div class="voting-panel">
          <div class="voting-stats-banner">
            Oylar: <strong>${votesCastCount} / ${alive.length}</strong> köylü oyunu kullandı.
          </div>
          <div class="player-selection-grid">
            ${alive.map(p => {
              const isSelected = myVote === p.id;
              const isMe = p.id === this.me.id;
              const r = ROLES[p.role];
              const godTag = (this.me.godViewEnabled && r) ? `<div class="god-role-badge" style="color:${r.color}; font-size:11px; font-weight:bold;">👁️ ${r.name}</div>` : '';
              return `
                <button class="target-card ${isSelected ? 'selected-vote' : ''}" onclick="window.gameController.voteDayTarget('${p.id}')">
                  <div class="target-avatar">${p.name.charAt(0)}</div>
                  <div class="target-name">${p.name} ${isMe ? '(Siz)' : ''}</div>
                  ${godTag}
                  ${isSelected ? '<span class="vote-badge">⚖️ OYUNUZ</span>' : ''}
                </button>
              `;
            }).join('')}

            <button class="target-card target-skip ${myVote === 'SKIP' ? 'selected-vote' : ''}" onclick="window.gameController.voteDayTarget('SKIP')">
              <div class="target-avatar">🕊️</div>
              <div class="target-name">PAS (Kimseyi Asma)</div>
              ${myVote === 'SKIP' ? '<span class="vote-badge">🕊️ PAS</span>' : ''}
            </button>
          </div>
        </div>
      `;
      return;
    }

    // --- FAZ 9: İNFAZ SONUCU ---
    if (phase === PHASES.DAY_EXECUTION) {
      if (phaseHeader) phaseHeader.textContent = 'MAHKEME KARARI';
      if (phaseSub) phaseSub.textContent = 'Köy halkının kararı açıklandı!';

      const executed = this.state.dayActions.lastExecutedDay;
      contentArea.innerHTML = `
        <div class="execution-card ${executed ? 'hung' : 'spared'}">
          <div class="exec-icon">${executed ? '⚰️' : '🕊️'}</div>
          <h2>${executed ? `${executed.name.toUpperCase()} ASILDI!` : 'KİMSE ASILMADI!'}</h2>
          ${executed ? `
            <p>Köy halkı ${executed.name}'i darağacına gönderdi.</p>
            <div class="role-reveal-pill" style="border-color:${ROLES[executed.role].color}">
              Gerçek Rolü: <strong style="color:${ROLES[executed.role].color}">${ROLES[executed.role].name}</strong>
            </div>
          ` : '<p>Oylar eşit çıktı veya çoğunluk sağlanamadı. Darağacı boş kaldı.</p>'}
        </div>
      `;
      return;
    }
  }

  renderSleepingBlindScreen(container) {
    container.innerHTML = `
      <div class="night-blind-screen">
        <div class="candle-flame">🕯️</div>
        <h2>KÖY DERİN UYKUDASINIZ</h2>
        <p>Gözlerinizi kapalı tutun. Sıranız geldiğinde telefonunuz titreyecektir.</p>
        <div class="dark-whisper">Zaman akıyor...</div>
      </div>
    `;
  }

  setupHoldToReveal() {
    const box = document.getElementById('card-reveal-box');
    const toggleBtn = document.getElementById('btn-toggle-flip');
    if (!box) return;

    let isFlipped = false;

    const toggleCard = (e) => {
      if (e) e.preventDefault();
      isFlipped = !isFlipped;
      box.classList.toggle('is-flipped', isFlipped);
      this.sound.playCardSting();
      this.haptic.confirmAction();
    };

    box.onclick = toggleCard;
    if (toggleBtn) {
      toggleBtn.onclick = toggleCard;
    }
  }

  renderGameOver() {
    const isEvilWin = this.state.winner === 'evil';
    const titleEl = document.getElementById('game-over-title');
    const subtitleEl = document.getElementById('game-over-subtitle');
    const rosterEl = document.getElementById('game-over-roster');

    if (titleEl) {
      titleEl.textContent = isEvilWin ? '🧛 VAMPİRLER KAZANDI!' : '☀️ KÖYLÜLER KAZANDI!';
      titleEl.style.color = isEvilWin ? '#e11d48' : '#f59e0b';
    }

    if (subtitleEl) {
      subtitleEl.textContent = isEvilWin
        ? 'Köy karanlığa gömüldü, vampirler tüm masumları avladı.'
        : 'Güneş nihayet Sapanca üzerinde doğdu, tüm vampirler yok edildi!';
    }

    if (rosterEl) {
      rosterEl.innerHTML = `
        <h3>Tüm Oyuncuların Rolleri</h3>
        <div class="game-over-cards-grid">
          ${this.state.players.map(p => {
            const r = ROLES[p.role] || ROLES.VILLAGER;
            return `
              <div class="end-player-card ${p.isAlive ? 'survived' : 'dead'}">
                <img src="${r.image}" alt="${r.name}" class="end-card-thumb" />
                <div class="end-info">
                  <div class="name">${p.name}</div>
                  <div class="role-tag" style="color:${r.color}">${r.name}</div>
                  <div class="status-tag">${p.isAlive ? 'Hayatta Kaldı' : 'Öldü'}</div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `;
    }
  }

  restartToLobby() {
    const isCanberk = (this.me.name || '').trim().toLowerCase() === 'canberk' || this.me.isAdmin;
    if (!this.network.isHost && !isCanberk) return;

    if (!this.network.isHost && isCanberk) {
      this.network.sendAction('ADMIN_RESET_LOBBY');
      return;
    }

    this.state.phase = PHASES.LOBBY;
    this.state.players.forEach(p => {
      p.isReady = p.isBot ? true : false;
      p.role = null;
      p.isAlive = true;
      p.confirmedRole = false;
    });
    this.broadcastCurrentState();
  }

  formatTime(secs) {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }
}

window.gameController = new GameController();
