const TTS = {
    synth: window.speechSynthesis,
    utterance: null,
    elements: [],
    currentIndex: -1,
    isPlaying: false,
    isPaused: false,
    panelVisible: false,

    STORAGE_KEY: 'ps_tts_prefs',
    prefs: { rate: 1, voiceURI: null },

    init() {
        this.loadPrefs();
        this.buildPanel();
        this.populateVoiceList();
        if (this.synth) {
            this.synth.onvoiceschanged = () => this.populateVoiceList();
        }
        document.addEventListener('authRendered', () => this.updateToolbarButton());
    },

    loadPrefs() {
        try {
            const saved = JSON.parse(localStorage.getItem(this.STORAGE_KEY));
            this.prefs = { rate: 1, voiceURI: null, ...saved };
        } catch { this.prefs = { rate: 1, voiceURI: null }; }
    },

    savePrefs() {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.prefs));
    },

    buildPanel() {
        if (document.getElementById('tts-panel')) return;
        const panel = document.createElement('div');
        panel.id = 'tts-panel';
        panel.className = 'tts-panel';
        panel.setAttribute('role', 'region');
        panel.setAttribute('aria-label', 'Control de lectura por voz');
        panel.innerHTML = `
            <div class="tts-panel-header">
                <span class="tts-panel-title"><i class="fas fa-volume-up"></i> Lectura por Voz</span>
                <button class="tts-close" id="tts-panel-close" aria-label="Cerrar panel de lectura">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="tts-panel-body">
                <div class="tts-status" id="tts-status" aria-live="polite">Listo para leer</div>
                <div class="tts-controls-row">
                    <button class="tts-btn tts-btn-play" id="tts-play-btn" aria-label="Iniciar lectura" title="Iniciar">
                        <i class="fas fa-play"></i>
                    </button>
                    <button class="tts-btn tts-btn-pause" id="tts-pause-btn" aria-label="Pausar lectura" title="Pausar" disabled>
                        <i class="fas fa-pause"></i>
                    </button>
                    <button class="tts-btn tts-btn-stop" id="tts-stop-btn" aria-label="Detener lectura" title="Detener" disabled>
                        <i class="fas fa-stop"></i>
                    </button>
                </div>
                <div class="tts-controls-row">
                    <label class="tts-label">
                        Velocidad
                        <select id="tts-rate" class="tts-select" aria-label="Velocidad de lectura">
                            <option value="0.5">0.5x</option>
                            <option value="0.75">0.75x</option>
                            <option value="1" selected>1x</option>
                            <option value="1.25">1.25x</option>
                            <option value="1.5">1.5x</option>
                            <option value="2">2x</option>
                        </select>
                    </label>
                    <label class="tts-label">
                        Voz
                        <select id="tts-voice" class="tts-select" aria-label="Seleccionar voz">
                            <option value="">Voz por defecto</option>
                        </select>
                    </label>
                </div>
            </div>
        `;
        document.body.appendChild(panel);

        document.getElementById('tts-play-btn').addEventListener('click', () => this.togglePlay());
        document.getElementById('tts-pause-btn').addEventListener('click', () => this.pause());
        document.getElementById('tts-stop-btn').addEventListener('click', () => this.stop());
        document.getElementById('tts-panel-close').addEventListener('click', () => this.hidePanel());
        document.getElementById('tts-rate').addEventListener('change', (e) => {
            this.prefs.rate = parseFloat(e.target.value);
            this.savePrefs();
            if (this.isPlaying && !this.isPaused) {
                Toast.show('La velocidad cambiará al siguiente párrafo', 'info');
            }
        });
        document.getElementById('tts-voice').addEventListener('change', (e) => {
            this.prefs.voiceURI = e.target.value || null;
            this.savePrefs();
        });
    },

    populateVoiceList() {
        const sel = document.getElementById('tts-voice');
        if (!sel) return;
        const current = sel.value;
        sel.innerHTML = '<option value="">Voz por defecto</option>';
        const voices = this.synth.getVoices().filter(v => v.lang.startsWith('es') || v.lang.startsWith('en'));
        voices.forEach(v => {
            const opt = document.createElement('option');
            opt.value = v.voiceURI;
            opt.textContent = `${v.name} (${v.lang})`;
            sel.appendChild(opt);
        });
        if (current) sel.value = current;
    },

    getContentElements() {
        const main = document.getElementById('main-content');
        if (!main) return [];
        const els = [];
        const selectors = 'p, h1, h2, h3, h4, h5, h6, li, blockquote, .section-subtitle, .section-title, .video-description p, .card-text, .hero-subtitle';
        main.querySelectorAll(selectors).forEach(el => {
            const text = el.textContent.trim();
            if (text && el.offsetParent !== null) {
                els.push({ el, text });
            }
        });
        return els;
    },

    togglePlay() {
        if (this.isPlaying && !this.isPaused) { this.pause(); return; }
        if (this.isPaused) { this.resume(); return; }
        this.start();
    },

    start() {
        if (this.isPlaying) return;
        this.elements = this.getContentElements();
        if (this.elements.length === 0) {
            Toast.show('No hay contenido para leer en esta página', 'error');
            return;
        }
        this.isPlaying = true;
        this.isPaused = false;
        this.currentIndex = 0;
        this.setStatus('Leyendo...');
        this.readNext();
    },

    readNext() {
        if (!this.isPlaying || this.isPaused) return;
        if (this.currentIndex >= this.elements.length) {
            this.finish();
            return;
        }
        const entry = this.elements[this.currentIndex];
        this.highlightElement(this.currentIndex);
        entry.el.scrollIntoView({ behavior: 'smooth', block: 'center' });

        const u = new SpeechSynthesisUtterance(entry.text);
        u.lang = 'es';
        u.rate = this.prefs.rate;
        if (this.prefs.voiceURI) {
            const v = this.synth.getVoices().find(vv => vv.voiceURI === this.prefs.voiceURI);
            if (v) u.voice = v;
        }
        u.onend = () => {
            if (!this.isPlaying) return;
            this.currentIndex++;
            this.readNext();
        };
        u.onerror = (e) => {
            if (e.error !== 'canceled' && e.error !== 'interrupted') {
                if (this.isPlaying) {
                    this.currentIndex++;
                    this.readNext();
                }
            }
        };
        this.utterance = u;
        this.synth.speak(u);
        this.updateButtons();
    },

    pause() {
        if (!this.isPlaying || this.isPaused) return;
        this.isPaused = true;
        this.synth.pause();
        this.setStatus('Pausado');
        this.updateButtons();
    },

    resume() {
        if (!this.isPlaying || !this.isPaused) return;
        this.isPaused = false;
        this.synth.resume();
        this.setStatus('Leyendo...');
        this.updateButtons();
    },

    stop() {
        this.isPlaying = false;
        this.isPaused = false;
        this.synth.cancel();
        this.utterance = null;
        this.currentIndex = -1;
        this.clearHighlight();
        this.setStatus('Detenido');
        this.updateButtons();
    },

    finish() {
        this.isPlaying = false;
        this.isPaused = false;
        this.utterance = null;
        this.currentIndex = -1;
        this.clearHighlight();
        this.setStatus('Lectura completada');
        this.updateButtons();
        Toast.show('Lectura finalizada', 'success');
    },

    highlightElement(index) {
        this.clearHighlight();
        if (index >= 0 && index < this.elements.length) {
            this.elements[index].el.classList.add('tts-highlight');
        }
    },

    clearHighlight() {
        document.querySelectorAll('.tts-highlight').forEach(el => el.classList.remove('tts-highlight'));
    },

    setStatus(msg) {
        const s = document.getElementById('tts-status');
        if (s) s.textContent = msg;
    },

    updateButtons() {
        const play = document.getElementById('tts-play-btn');
        const pause = document.getElementById('tts-pause-btn');
        const stop = document.getElementById('tts-stop-btn');
        if (!play) return;
        if (this.isPlaying && !this.isPaused) {
            play.innerHTML = '<i class="fas fa-pause"></i>';
            play.setAttribute('aria-label', 'Pausar lectura');
            play.title = 'Pausar';
            pause.disabled = false;
            stop.disabled = false;
        } else if (this.isPaused) {
            play.innerHTML = '<i class="fas fa-play"></i>';
            play.setAttribute('aria-label', 'Reanudar lectura');
            play.title = 'Reanudar';
            pause.disabled = true;
            stop.disabled = false;
        } else {
            play.innerHTML = '<i class="fas fa-play"></i>';
            play.setAttribute('aria-label', 'Iniciar lectura');
            play.title = 'Iniciar';
            pause.disabled = true;
            stop.disabled = true;
        }
        this.updateToolbarButton();
    },

    showPanel() {
        const p = document.getElementById('tts-panel');
        if (p) { p.classList.add('active'); this.panelVisible = true; }
    },

    hidePanel() {
        this.stop();
        const p = document.getElementById('tts-panel');
        if (p) { p.classList.remove('active'); this.panelVisible = false; }
        this.updateToolbarButton();
    },

    togglePanel() {
        if (this.panelVisible) { this.hidePanel(); }
        else { this.showPanel(); }
    },

    updateToolbarButton() {
        const btn = document.getElementById('a11y-tts-btn');
        if (!btn) return;
        const active = this.panelVisible || this.isPlaying;
        btn.classList.toggle('active-a11y', active);
        btn.title = active ? 'Cerrar lectura por voz' : 'Lectura por voz';
        btn.setAttribute('aria-label', btn.title);
    },

    reset() {
        this.stop();
        this.hidePanel();
        this.prefs = { rate: 1, voiceURI: null };
        this.savePrefs();
        const rateSel = document.getElementById('tts-rate');
        if (rateSel) rateSel.value = '1';
        const voiceSel = document.getElementById('tts-voice');
        if (voiceSel) voiceSel.value = '';
    }
};

window.TTS = TTS;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => TTS.init());
} else {
    TTS.init();
}
