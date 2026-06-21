"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import missionsData from "@/data/missions.json";

// ─── 定数とリンクデータ ──────────────────────────────────────────
const LINKS = [
  {
    id: "ogiri",
    name: "⛩️ PROTOCOL: OGIRI_SYS",
    path: "/lobby",
    status: "ACTIVE",
    description: "大喜利SNSシステム。AIと大喜利で対決し、座布団を競い合う分散ソーシャルネットワーク。",
    color: "#fcee0a", // Cyberpunk Yellow
    glowColor: "rgba(252, 238, 10, 0.4)",
    tag: "SYS_LAUNCH",
    icon: "⛩️",
    external: false,
    disabled: false,
  },
  {
    id: "note",
    name: "📝 CONNECT: NOTE_PORTAL",
    path: "https://note.com/mon_hormone",
    status: "ONLINE",
    description: "思考の暗号化ブロック。アイデアやコラムを綴るローカルテキストストレージ。（エッセイ、哲学的な雑文、技術メモなど）",
    color: "#00f0ff", // Cyberpunk Cyan
    glowColor: "rgba(0, 240, 255, 0.4)",
    tag: "TXT_NODE",
    icon: "📝",
    external: true,
    disabled: false,
  },
  {
    id: "hatena",
    name: "📚 ACCESS: HATENA_ARCHIVES",
    path: "https://dokusyocoffee.hatenablog.com",
    status: "ONLINE",
    description: "日誌データアーカイブ。技術、日常、思考のログを保管する長期記録データベース。（読書感想文）",
    color: "#ff0055", // Cyberpunk Pink/Red
    glowColor: "rgba(255, 0, 85, 0.4)",
    tag: "LOG_DB",
    icon: "📚",
    external: true,
    disabled: false,
  },
  {
    id: "x",
    name: "🐦 COMMS: X_PROTOCOL",
    path: "https://x.com/dokusyo_coffee",
    status: "ONLINE",
    description: "短尺データブロードキャスト。日常の思考パケットを即時送信する大衆周波数ネットワーク。（日常の雑多なつぶやき）",
    color: "#38bdf8", // X blue
    glowColor: "rgba(56, 189, 248, 0.4)",
    tag: "COM_TRANS",
    icon: "🐦",
    external: true,
    disabled: false,
  },
  {
    id: "youtube",
    name: "📺 STREAM: YOUTUBE_CH",
    path: "https://youtube.com/@motsuni_philo_ogiri",
    status: "ONLINE",
    description: "視覚データ周波数チャネル。動画および音声形式の情報ストリームを配信するメディアセル。（ずんだもん・四国めたんの哲学・大喜利解説動画）",
    color: "#ef4444", // YouTube Red
    glowColor: "rgba(239, 68, 68, 0.4)",
    tag: "VID_CELL",
    icon: "📺",
    external: true,
    disabled: false,
  },
  {
    id: "cpusim",
    name: "🛠️ PROTOCOL: CPU_SIM_v0.1",
    path: "#",
    status: "PREPARING",
    description: "4-bit CPU動作ビジュアライザ・アセンブリ学習シミュレータ。現在コアマトリックス構築中（システム設計フェーズ）。",
    color: "#a855f7", // Cyberpunk Purple
    glowColor: "rgba(168, 85, 247, 0.4)",
    tag: "SIM_OFFLINE",
    icon: "🛠️",
    external: false,
    disabled: true,
  },
];

// ─── 効果音再生関数（Web Audio API） ─────────────────────────────
const playSynthSound = (type: "hover" | "click" | "glitch", muted: boolean) => {
  if (muted) return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    if (type === "hover") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(980, ctx.currentTime);
      gain.gain.setValueAtTime(0.015, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.09);
    } else if (type === "click") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(520, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1040, ctx.currentTime + 0.07);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.09);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } else if (type === "glitch") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(90, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(320, ctx.currentTime + 0.06);
      gain.gain.setValueAtTime(0.02, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.06);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.06);
    }
  } catch (e) {
    // ブラウザによってブロックされた場合などは何もしない
  }
};

// ─── テキスト解号アニメーションコンポーネント ────────────────────────
function DecryptText({ text, delay = 0, hoverTrigger = false, activeHoverState = false }: { text: string; delay?: number; hoverTrigger?: boolean; activeHoverState?: boolean }) {
  const [displayText, setDisplayText] = useState("");
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*{}[];:/?";
  const timerRef = useRef<any>(null);

  useEffect(() => {
    let active = true;
    let iteration = 0;
    
    const animate = () => {
      clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        if (!active) return;
        setDisplayText(
          text
            .split("")
            .map((char, index) => {
              if (char === " ") return " ";
              if (index < iteration) {
                return text[index];
              }
              return chars[Math.floor(Math.random() * chars.length)];
            })
            .join("")
        );
        
        if (iteration >= text.length) {
          clearInterval(timerRef.current);
        }
        iteration += 0.5;
      }, 25);
    };

    if (!hoverTrigger) {
      const timeout = setTimeout(animate, delay);
      return () => {
        active = false;
        clearTimeout(timeout);
        clearInterval(timerRef.current);
      };
    } else if (activeHoverState) {
      animate();
    } else {
      setDisplayText(text);
    }

    return () => {
      active = false;
      clearInterval(timerRef.current);
    };
  }, [text, delay, hoverTrigger, activeHoverState]);

  return <span>{displayText}</span>;
}

// ─── メインコンポーネント ──────────────────────────────────────────
export default function CyberpunkPortal() {
  const router = useRouter();
  const [muted, setMuted] = useState(true);
  const [hoveredLink, setHoveredLink] = useState<typeof LINKS[0] | null>(null);
  
  // ターミナルログとコマンド
  const [logs, setLogs] = useState<string[]>([
    "SECURE NEURAL INTERFACE SHIELD ACTIVE...",
    "PORTAL DECRYPTOR MODULE MOUNTED [OK]",
    "ESTABLISHING VPN TO HOST SYSTEM...",
    "READY FOR INPUT. TYPE 'help' FOR LIST.",
  ]);
  const [commandInput, setCommandInput] = useState("");
  
  // ハードウェア負荷と時計
  const [timeStr, setTimeStr] = useState("");
  const [cpuLoad, setCpuLoad] = useState(14);
  const [netSpeed, setNetSpeed] = useState(4.8);
  
  // キャンバス設定
  const [canvasTheme, setCanvasTheme] = useState<"cyan" | "matrix">("cyan");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // ニューラルダイブ（遷移演出）
  const [isDiving, setIsDiving] = useState(false);
  const [diveProgress, setDiveProgress] = useState(0);

  // 拡張機能：MissionsおよびRSSフィード
  const [feedItems, setFeedItems] = useState<any[]>([]);
  const [feedLoading, setFeedLoading] = useState(true);

  // 音声 hum 制御用の Ref
  const humOsc1Ref = useRef<OscillatorNode | null>(null);
  const humOsc2Ref = useRef<OscillatorNode | null>(null);
  const humGainRef = useRef<GainNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // ─── RSSフィードの取得 ─────────────────────────────────────────
  useEffect(() => {
    const fetchFeeds = async () => {
      try {
        const res = await fetch("/api/feeds");
        const data = await res.json();
        if (data.success && data.feeds) {
          setFeedItems(data.feeds);
        }
      } catch (e) {
        console.error("Failed to fetch RSS feeds:", e);
      } finally {
        setFeedLoading(false);
      }
    };
    fetchFeeds();
  }, []);

  // ─── アンビエントHum音の開始/停止 ──────────────────────────────
  const startHum = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContextClass();
      }
      const ctx = audioCtxRef.current;
      
      stopHum(); // 重複防止
      
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();
      
      osc1.type = "sawtooth";
      osc1.frequency.setValueAtTime(55, ctx.currentTime); // A1 note
      
      osc2.type = "triangle";
      osc2.frequency.setValueAtTime(55.3, ctx.currentTime); // コーラス用のうねり
      
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(95, ctx.currentTime); // マイルドな低音に絞る
      
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.04, ctx.currentTime + 1.2); // 徐々にフェードイン
      
      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      
      osc1.start();
      osc2.start();
      
      humOsc1Ref.current = osc1;
      humOsc2Ref.current = osc2;
      humGainRef.current = gain;
    } catch (e) {
      console.error("Hum sound initiation failed:", e);
    }
  };

  const stopHum = () => {
    try {
      if (humGainRef.current && audioCtxRef.current) {
        const ctx = audioCtxRef.current;
        const gain = humGainRef.current;
        gain.gain.cancelScheduledValues(ctx.currentTime);
        gain.gain.setValueAtTime(gain.gain.value, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3); // クイックフェードアウト
      }
      setTimeout(() => {
        if (humOsc1Ref.current) {
          try { humOsc1Ref.current.stop(); } catch (e) {}
          humOsc1Ref.current = null;
        }
        if (humOsc2Ref.current) {
          try { humOsc2Ref.current.stop(); } catch (e) {}
          humOsc2Ref.current = null;
        }
        humGainRef.current = null;
      }, 350);
    } catch (e) {}
  };

  // ミュート状態に応じてHum音を制御
  useEffect(() => {
    if (!muted && !isDiving) {
      startHum();
    } else {
      stopHum();
    }
    return () => stopHum();
  }, [muted, isDiving]);

  // ─── ニューラルダイブ（遷移）の実行 ───────────────────────────
  const triggerNeuralDive = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (isDiving) return;
    
    setIsDiving(true);
    stopHum();
    playSynthSound("click", muted);
    
    // グリッチ音を時間差で再生
    setTimeout(() => playSynthSound("glitch", muted), 250);
    setTimeout(() => playSynthSound("glitch", muted), 550);
    
    let progress = 0;
    const interval = setInterval(() => {
      progress += 5;
      if (progress > 100) {
        clearInterval(interval);
        router.push("/lobby");
      } else {
        setDiveProgress(progress);
      }
    }, 50);
  };

  // ─── リアルタイム時計 ──────────────────────────────────────────
  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      const pad = (n: number) => String(n).padStart(2, "0");
      const ms = String(d.getMilliseconds()).slice(0, 2).padEnd(2, "0");
      setTimeStr(`${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${ms}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 40);
    return () => clearInterval(interval);
  }, []);

  // ─── ログ監視シミュレーション ────────────────────────────────────
  useEffect(() => {
    const logPool = [
      "DECRYPTED INBOUND PACKETS ON SOCKET_09...",
      "SYSTEM STATUS: SECURE (LOAD MINIMAL)",
      "PINGING TARGET ENDPOINT GATEWAY: ACK [24ms]",
      "ROUTING MATRIX OVERLAY UPDATED",
      "CLEARING CACHED SECTOR FRAGMENTS...",
      "ALERT: COGNITIVE NET INTERACTIVE ON PROTOCOL_X",
      "INTEGRITY SHIELD CAPACITY AT 99.8%",
      "AI LOBBY ANCHOR STABILIZED [LOBBY_V2]",
    ];
    const interval = setInterval(() => {
      if (isDiving) return;
      setLogs((prev) => {
        const next = [...prev, logPool[Math.floor(Math.random() * logPool.length)]];
        if (next.length > 5) next.shift();
        return next;
      });
      setCpuLoad((prev) => {
        const diff = Math.floor(Math.random() * 8) - 4;
        return Math.max(5, Math.min(85, prev + diff));
      });
      setNetSpeed((prev) => {
        const diff = (Math.random() * 1.2) - 0.6;
        return Math.max(1.2, Math.min(12.0, Number((prev + diff).toFixed(1))));
      });
    }, 4500);
    return () => clearInterval(interval);
  }, [isDiving]);

  // ─── コマンドライン入力ハンドラー ─────────────────────────────────
  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = commandInput.trim().toLowerCase();
    if (!cmd) return;

    playSynthSound("click", muted);
    
    // 入力コマンドをログに追加
    setLogs((prev) => {
      const next = [...prev, `guest@neural_shell:~$ ${commandInput}`];
      if (next.length > 5) next.shift();
      return next;
    });
    setCommandInput("");

    // コマンド分岐
    setTimeout(() => {
      let response = "";
      if (cmd === "help") {
        response = "CMD LIST: [help, clear, play, hack, reset, sound on, sound off]";
      } else if (cmd === "clear") {
        setLogs([]);
        return;
      } else if (cmd === "play" || cmd === "lobby" || cmd === "start") {
        triggerNeuralDive();
        return;
      } else if (cmd === "hack" || cmd === "matrix") {
        setCanvasTheme("matrix");
        response = "MATRIX PROTOCOL STACK OVERWRITE [OK]";
        playSynthSound("glitch", muted);
      } else if (cmd === "reset" || cmd === "restore" || cmd === "cyan") {
        setCanvasTheme("cyan");
        response = "CYAN PARTICLES RESTORED [OK]";
        playSynthSound("click", muted);
      } else if (cmd === "sound on") {
        setMuted(false);
        response = "AUDIO MODULE: ACTIVE";
      } else if (cmd === "sound off" || cmd === "mute") {
        setMuted(true);
        response = "AUDIO MODULE: MUTED";
      } else {
        response = `COMMAND NOT FOUND: '${cmd}'. TYPE 'help' FOR INFO.`;
        playSynthSound("glitch", muted);
      }

      setLogs((prev) => {
        const next = [...prev, `>> ${response}`];
        if (next.length > 5) next.shift();
        return next;
      });
    }, 150);
  };

  // ─── Canvas 背景アニメーション (テーマ切り替え) ─────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    // Cyan Particle Net 用の状態
    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
    }> = [];

    const particleCount = 65;
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        radius: Math.random() * 1.5 + 0.5,
      });
    }

    let mouseX = -1000;
    let mouseY = -1000;
    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };
    const handleMouseLeave = () => {
      mouseX = -1000;
      mouseY = -1000;
    };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);

    // Matrix Rain 用の状態
    const fontSize = 14;
    const columns = Math.ceil(width / fontSize);
    const drops = Array(columns).fill(0).map(() => Math.random() * -100);
    const matrixChars = "ｦｧｨｩｪｫｬｭｮｯｰｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ1023456789X+-$#@".split("");

    const draw = () => {
      if (canvasTheme === "cyan") {
        ctx.clearRect(0, 0, width, height);

        // グリッド背景の描画
        ctx.strokeStyle = "rgba(255, 255, 255, 0.015)";
        ctx.lineWidth = 1;
        const gridSize = 50;
        for (let x = 0; x < width; x += gridSize) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
          ctx.stroke();
        }
        for (let y = 0; y < height; y += gridSize) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }

        // パーティクルの描画
        particles.forEach((p) => {
          p.x += p.vx;
          p.y += p.vy;

          if (p.x < 0 || p.x > width) p.vx *= -1;
          if (p.y < 0 || p.y > height) p.vy *= -1;

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(0, 240, 255, 0.15)";
          ctx.fill();
        });

        // コネクション線の描画
        ctx.lineWidth = 0.5;
        for (let i = 0; i < particles.length; i++) {
          for (let j = i + 1; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 110) {
              ctx.beginPath();
              ctx.moveTo(particles[i].x, particles[i].y);
              ctx.lineTo(particles[j].x, particles[j].y);
              ctx.strokeStyle = `rgba(0, 240, 255, ${0.12 * (1 - dist / 110)})`;
              ctx.stroke();
            }
          }

          // マウス位置との吸着コネクト
          if (mouseX !== -1000) {
            const dx = particles[i].x - mouseX;
            const dy = particles[i].y - mouseY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 160) {
              ctx.beginPath();
              ctx.moveTo(particles[i].x, particles[i].y);
              ctx.lineTo(mouseX, mouseY);
              ctx.strokeStyle = `rgba(252, 238, 10, ${0.2 * (1 - dist / 160)})`;
              ctx.stroke();
            }
          }
        }
      } else {
        // Matrix Rain の描画
        ctx.fillStyle = "rgba(7, 7, 9, 0.08)";
        ctx.fillRect(0, 0, width, height);

        ctx.fillStyle = "#00ff66";
        ctx.font = `${fontSize}px monospace`;
        ctx.shadowBlur = 6;
        ctx.shadowColor = "#00ff66";

        for (let i = 0; i < drops.length; i++) {
          const text = matrixChars[Math.floor(Math.random() * matrixChars.length)];
          const x = i * fontSize;
          const y = drops[i] * fontSize;

          ctx.fillText(text, x, y);

          if (y > height && Math.random() > 0.98) {
            drops[i] = 0;
          }
          drops[i]++;
        }
        ctx.shadowBlur = 0; // シャドウリセット
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [canvasTheme]);

  return (
    <div className="relative min-h-screen bg-[#070709] text-[#e0e0ea] font-mono overflow-x-hidden select-none flex flex-col justify-between">
      
      {/* ─── スキャンラインと不規則フリッカーオーバーレイ ─── */}
      <div className="pointer-events-none fixed inset-0 z-50 scanlines-flicker" 
           style={{
             backgroundImage: "linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.4) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.03), rgba(0, 255, 0, 0.01), rgba(0, 0, 255, 0.03))",
             backgroundSize: "100% 4px, 6px 100%"
           }} 
      />
      <div className="pointer-events-none fixed inset-0 z-40 bg-radial-gradient from-transparent via-[#070709]/30 to-[#070709]/80" />

      {/* ─── 動的背景キャンバス ─── */}
      <canvas ref={canvasRef} className="fixed inset-0 z-0 pointer-events-none" />

      {/* ─── ヘッダー ─── */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-6 py-6 flex justify-between items-center border-b border-white/5 bg-black/10 backdrop-blur-md">
        <div className="flex flex-col">
          <h1 className="text-sm font-black tracking-[0.25em] text-[#fcee0a] flex items-center gap-2">
            <span className="animate-pulse text-xs">●</span> SYSTEM OVERRIDE // NEURAL LINK
          </h1>
          <p className="text-[10px] text-white/40 tracking-wider mt-0.5">
            DISPERSAL PORTAL PROTOCOL v2.6.0
          </p>
        </div>

        <div className="flex items-center gap-6">
          {/* システムクロック */}
          <div className="text-right hidden sm:block">
            <p className="text-[10px] text-white/30 tracking-wider uppercase font-mono">NODE TIME (GMT+9)</p>
            <p className="text-xs text-white/80 font-bold tracking-widest">{timeStr || "00:00:00.00"}</p>
          </div>

          {/* ミュートトグル */}
          <button
            onClick={() => {
              setMuted((prev) => !prev);
              playSynthSound("click", !muted);
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded border text-[10px] tracking-wider transition-all duration-200 cursor-pointer"
            style={{
              borderColor: muted ? "rgba(255, 255, 255, 0.1)" : (canvasTheme === "matrix" ? "#00ff66" : "#00f0ff"),
              color: muted ? "rgba(255, 255, 255, 0.4)" : (canvasTheme === "matrix" ? "#00ff66" : "#00f0ff"),
              boxShadow: muted ? "none" : `0 0 10px ${canvasTheme === "matrix" ? "rgba(0, 255, 102, 0.2)" : "rgba(0, 240, 255, 0.2)"}`,
              background: muted ? "transparent" : (canvasTheme === "matrix" ? "rgba(0, 255, 102, 0.05)" : "rgba(0, 240, 255, 0.05)")
            }}
          >
            <span>{muted ? "🔇 SOUND_OFF" : "🔊 SOUND_ON"}</span>
          </button>
        </div>
      </header>

      {/* ─── メインレイアウト ─── */}
      <main className="relative z-10 w-full max-w-7xl mx-auto px-6 py-10 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* 左側：システムターミナル（シェル入力 / ミッション切り替えタブ） */}
        {/* 左側：システムターミナル（ミッションログ＆診断パネル上下配置） */}
        <section className="lg:col-span-4 flex flex-col gap-6 self-stretch justify-center h-full max-lg:order-2">
          <div className="relative border border-white/10 bg-[#0d0d11]/85 backdrop-blur-md p-5 rounded-sm flex flex-col justify-between flex-1 min-h-[460px] overflow-hidden"
               style={{ clipPath: "polygon(0 0, calc(100% - 15px) 0, 100% 15px, 100% 100%, 0 100%)" }}>
            
            {/* 角のハイライト */}
            <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2" style={{ borderColor: canvasTheme === "matrix" ? "#00ff66" : "#00f0ff" }} />
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2" style={{ borderColor: canvasTheme === "matrix" ? "#00ff66" : "#00f0ff" }} />

            <div className="flex flex-col gap-5">
              {/* 上部：MISSION LOG */}
              <div>
                <div className="border-b border-white/10 pb-1.5 mb-3 text-[10px] tracking-wider font-bold text-[#fcee0a]">
                  [ MISSION LOG ]
                </div>
                <div className="flex flex-col gap-3">
                  {missionsData.missions.map((mission: any) => (
                    <div key={mission.id}>
                      <div className="flex justify-between text-[9px] mb-1 font-mono">
                        <span className="text-white/80 truncate mr-2">{mission.title}</span>
                        <span style={{ color: mission.color }} className="font-bold">{mission.progress}%</span>
                      </div>
                      <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden border border-white/5">
                        <div className="h-full" style={{ width: `${mission.progress}%`, backgroundColor: mission.color }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 中部：DIAGNOSTICS & SYSTEM LOG */}
              <div>
                <div className="border-b border-white/10 pb-1.5 mb-3 text-[10px] tracking-wider font-bold text-[#00f0ff]"
                     style={{ borderColor: canvasTheme === "matrix" ? "#00ff66" : "#00f0ff", color: canvasTheme === "matrix" ? "#00ff66" : "#00f0ff" }}>
                  [ SYSTEM DIAGNOSTICS ]
                </div>
                <div className="flex flex-col gap-1.5 min-h-[90px] max-h-[120px] overflow-y-auto">
                  {logs.map((log, idx) => (
                    <div key={idx} className="text-[9px] tracking-wider leading-relaxed text-white/85 font-mono">
                      <span className="mr-1.5" style={{ color: canvasTheme === "matrix" ? "#00ff66" : "#00f0ff" }}>&gt;</span>
                      {log}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* インタラクティブ入力 */}
            <form onSubmit={handleCommandSubmit} className="mt-3 flex items-center border-t border-white/10 pt-3 text-[10px]">
              <span className="mr-1.5 font-bold" style={{ color: canvasTheme === "matrix" ? "#00ff66" : "#00f0ff" }}>guest@neural_shell:~$</span>
              <input 
                type="text" 
                value={commandInput} 
                onChange={(e) => setCommandInput(e.target.value)} 
                placeholder="ENTER COMMAND (e.g. 'help')..." 
                className="bg-transparent border-none outline-none flex-1 font-mono text-[10px]"
                style={{ color: canvasTheme === "matrix" ? "#00ff66" : "#00f0ff" }}
              />
            </form>

            {/* ハードウェア統計 */}
            <div className="mt-4 border-t border-white/5 pt-3">
              <div className="flex justify-between text-[10px] text-white/50 mb-2 font-mono">
                <span>CPU COGNITIVE LOAD:</span>
                <span className="text-[#fcee0a]">{cpuLoad}%</span>
              </div>
              <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                <div className="bg-[#fcee0a] h-full transition-all duration-1000" style={{ width: `${cpuLoad}%` }} />
              </div>

              <div className="flex justify-between text-[10px] text-white/50 mt-4 mb-2 font-mono">
                <span>NET CONNECTION BANDWIDTH:</span>
                <span style={{ color: canvasTheme === "matrix" ? "#00ff66" : "#00f0ff" }}>{netSpeed} Gb/s</span>
              </div>
              <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                <div className="h-full transition-all duration-1000" 
                     style={{ 
                       width: `${(netSpeed / 12.0) * 100}%`,
                       backgroundColor: canvasTheme === "matrix" ? "#00ff66" : "#00f0ff"
                     }} 
                />
              </div>
            </div>
          </div>
        </section>

        {/* 右側：メインリンクノード */}
        <section className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-8 self-stretch justify-center items-center py-4">
          
          {/* リンクノード選択メニュー */}
          <div className="flex flex-col gap-4">
            <h2 className="text-xs text-white/30 uppercase tracking-[0.3em] mb-2 pl-2">
              [ ACCESS TERMINALS ]
            </h2>

            {LINKS.map((link) => {
              const isHovered = hoveredLink?.id === link.id;
              
              // リンクのレンダリング要素
              const content = (
                <div
                  onMouseEnter={() => {
                    setHoveredLink(link);
                    playSynthSound("hover", muted);
                  }}
                  onMouseLeave={() => setHoveredLink(null)}
                  className="group relative flex items-center justify-between p-4 bg-[#0d0d11]/70 border border-white/10 hover:border-white/0 rounded-sm cursor-pointer transition-all duration-300 overflow-hidden"
                  style={{
                    clipPath: "polygon(0 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%)",
                    backgroundColor: isHovered ? "rgba(255,255,255,0.02)" : "rgba(13,13,17,0.7)",
                  }}
                >
                  {/* ホバー時のボーダーグロー効果 */}
                  <div
                    className="absolute inset-0 border transition-opacity duration-300 pointer-events-none"
                    style={{
                      borderColor: link.color,
                      opacity: isHovered ? 1 : 0,
                      boxShadow: `inset 0 0 15px ${link.glowColor}, 0 0 10px ${link.glowColor}`,
                    }}
                  />

                  {/* 左側のネオンカラーバー */}
                  <div className="absolute left-0 top-0 bottom-0 w-1 transition-all duration-300"
                       style={{ backgroundColor: isHovered ? link.color : "rgba(255,255,255,0.15)" }} 
                  />

                  {/* テキスト情報 */}
                  <div className="pl-2">
                    <p className="text-xs font-bold tracking-wider group-hover:translate-x-1 transition-transform duration-300"
                       style={{ color: isHovered ? link.color : "#e0e0ea" }}>
                      <DecryptText text={link.name} hoverTrigger={true} activeHoverState={isHovered} />
                    </p>
                    <p className="text-[9px] text-white/30 tracking-widest mt-1 uppercase">
                      STATUS: <span style={{ color: isHovered ? link.color : "inherit" }}>{link.status}</span> · TYPE: {link.tag}
                    </p>
                  </div>

                  {/* 右側アイコン */}
                  <span className="text-xl opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300 mr-2">
                    {link.icon}
                  </span>
                </div>
              );

              if (link.disabled) {
                return (
                  <div
                    key={link.id}
                    onClick={() => playSynthSound("glitch", muted)}
                    onMouseEnter={() => {
                      setHoveredLink(link);
                      playSynthSound("hover", muted);
                    }}
                    onMouseLeave={() => setHoveredLink(null)}
                    className="block"
                  >
                    {content}
                  </div>
                );
              } else if (link.external) {
                return (
                  <a href={link.path} key={link.id} target="_blank" rel="noopener noreferrer" onClick={() => playSynthSound("click", muted)} className="block no-underline">
                    {content}
                  </a>
                );
              } else {
                return (
                  <div key={link.id} onClick={triggerNeuralDive} className="block no-underline">
                    {content}
                  </div>
                );
              }
            })}
          </div>

          {/* ホバー中ノードの詳細ディスプレイ 兼 RSS新着フィードボード */}
          <div className="relative border bg-[#0d0d11]/85 backdrop-blur-md p-6 rounded-sm min-h-[300px] flex flex-col justify-between transition-colors duration-300 overflow-hidden"
               style={{
                 borderColor: hoveredLink ? hoveredLink.color : "rgba(255, 255, 255, 0.1)",
                 boxShadow: hoveredLink ? `0 0 30px ${hoveredLink.glowColor}` : "none",
                 clipPath: "polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 0 100%)",
               }}
          >
            {/* バックグラウンドロゴグラフィック */}
            <div className="absolute right-[-40px] bottom-[-40px] text-[160px] opacity-[0.03] select-none pointer-events-none font-serif font-black">
              {hoveredLink ? hoveredLink.icon : "⛩️"}
            </div>

            {hoveredLink ? (
              /* ① ホバー状態：ノードの詳細を表示 */
              <div>
                <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-2 text-[10px] text-white/50 tracking-wider">
                  <span>[ TERMINAL CORE DISP ]</span>
                  <span style={{ color: hoveredLink.color }}>CONNECTED</span>
                </div>

                <div className="flex flex-col gap-4 animate-fade-in-up">
                  <h3 className="text-base font-black tracking-widest font-mono" style={{ color: hoveredLink.color }}>
                    {hoveredLink.name.replace(/^[^\s]+\s/, "")}
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-2 text-[10px] text-white/60 border-y border-white/5 py-3 font-mono">
                    <div>
                      NODE STATUS: <span style={{ color: hoveredLink.color }} className="font-bold">{hoveredLink.status}</span>
                    </div>
                    <div>
                      PROTOCOL: <span className="text-white/95">{hoveredLink.tag}</span>
                    </div>
                    <div className="col-span-2">
                      GATEWAY: <span className="text-white/95 break-all">{hoveredLink.path}</span>
                    </div>
                  </div>

                  <p className="text-xs text-white/90 leading-relaxed font-mono mt-1">
                    {hoveredLink.description}
                  </p>
                </div>
              </div>
            ) : (
              /* ② スタンバイ状態：RSSフィードを流し込む */
              <div className="flex flex-col h-full justify-between animate-fade-in-up">
                <div>
                  <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-2 text-[10px] text-white/50 tracking-wider">
                    <span>[ SECURE DATAFEED: GLOBAL STREAM ]</span>
                    <span className="text-[#00f0ff] font-mono animate-pulse">● LIVE_FEED</span>
                  </div>
                  
                  {feedLoading ? (
                    <div className="flex flex-col justify-center items-center text-center py-12 text-white/30">
                      <svg className="animate-spin h-5 w-5 mb-3 text-[#00f0ff]" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      <p className="text-[9px] tracking-widest uppercase">FETCHING DATA STREAMS...</p>
                    </div>
                  ) : feedItems.length === 0 ? (
                    <div className="flex flex-col justify-center items-center text-center py-12 text-white/30">
                      <span className="text-2xl mb-2">📡</span>
                      <p className="text-[10px] tracking-widest uppercase">NO ACTIVE STREAMS DETECTED</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4 max-h-[300px] overflow-y-auto pr-1">
                      {/* 📝 LATEST ARTICLES (note / blog) */}
                      <div>
                        <div className="text-[8px] text-[#00f0ff] tracking-wider uppercase mb-1.5 font-bold flex justify-between border-b border-white/5 pb-0.5">
                          <span>[ LATEST ARTICLES ]</span>
                          <span>MAX_5</span>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          {feedItems.filter((item) => item.source !== "youtube").length === 0 ? (
                            <p className="text-[8px] text-white/30 italic">NO ARTICLES FOUND</p>
                          ) : (
                            feedItems
                              .filter((item) => item.source !== "youtube")
                              .slice(0, 5)
                              .map((item, idx) => {
                                const sourceLabel = item.source === "hatena" ? "BLOG" : "NOTE";
                                const sourceColor = item.source === "hatena" ? "#ff0055" : "#00f0ff";
                                const formattedDate = new Date(item.date).toLocaleDateString("ja-JP", {
                                  year: "numeric",
                                  month: "2-digit",
                                  day: "2-digit"
                                });

                                return (
                                  <a 
                                    key={idx} 
                                    href={item.link} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    onClick={() => playSynthSound("click", muted)}
                                    className="group flex flex-col p-1.5 bg-white/3 border border-white/5 hover:border-white/15 hover:bg-white/5 transition-all rounded-xs no-underline"
                                  >
                                    <div className="flex justify-between items-center text-[7px] mb-0.5 font-mono">
                                      <span className="px-1 py-0.2 rounded-xs font-bold text-[6px]" 
                                            style={{ border: `1px solid ${sourceColor}`, color: sourceColor, background: `${sourceColor}10` }}>
                                        {sourceLabel}
                                      </span>
                                      <span className="text-white/40">{formattedDate}</span>
                                    </div>
                                    <p className="text-[9px] text-white/80 leading-snug font-mono truncate group-hover:text-white transition-colors">
                                      {item.title}
                                    </p>
                                  </a>
                                );
                              })
                          )}
                        </div>
                      </div>

                      {/* 📺 LATEST VIDEOS (youtube) */}
                      <div>
                        <div className="text-[8px] text-[#ef4444] tracking-wider uppercase mb-1.5 font-bold flex justify-between border-b border-white/5 pb-0.5">
                          <span>[ LATEST VIDEOS ]</span>
                          <span>MAX_2</span>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          {feedItems.filter((item) => item.source === "youtube").length === 0 ? (
                            <p className="text-[8px] text-white/30 italic">NO VIDEOS FOUND</p>
                          ) : (
                            feedItems
                              .filter((item) => item.source === "youtube")
                              .slice(0, 2)
                              .map((item, idx) => {
                                const sourceLabel = "YT_VIDEO";
                                const sourceColor = "#ef4444";
                                const formattedDate = new Date(item.date).toLocaleDateString("ja-JP", {
                                  year: "numeric",
                                  month: "2-digit",
                                  day: "2-digit"
                                });

                                return (
                                  <a 
                                    key={idx} 
                                    href={item.link} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    onClick={() => playSynthSound("click", muted)}
                                    className="group flex flex-col p-1.5 bg-white/3 border border-white/5 hover:border-white/15 hover:bg-white/5 transition-all rounded-xs no-underline"
                                  >
                                    <div className="flex justify-between items-center text-[7px] mb-0.5 font-mono">
                                      <span className="px-1 py-0.2 rounded-xs font-bold text-[6px]" 
                                            style={{ border: `1px solid ${sourceColor}`, color: sourceColor, background: `${sourceColor}10` }}>
                                        {sourceLabel}
                                      </span>
                                      <span className="text-white/40">{formattedDate}</span>
                                    </div>
                                    <p className="text-[9px] text-white/80 leading-snug font-mono truncate group-hover:text-white transition-colors">
                                      {item.title}
                                    </p>
                                  </a>
                                );
                              })
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* パネルの底のグラフィック */}
            <div className="flex justify-between items-center text-[8px] text-white/20 mt-6 pt-2 border-t border-white/5 uppercase">
              <span>SYSTEM: ONLINE</span>
              {hoveredLink ? (
                <span style={{ color: hoveredLink.color }}>NODE_{hoveredLink.id.toUpperCase()}</span>
              ) : (
                <span>DATAFEED_ACTIVE</span>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* ─── フッター ─── */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row justify-between items-center border-t border-white/5 bg-black/10 backdrop-blur-md text-[9px] text-white/30 tracking-widest font-mono">
        <div className="flex gap-4 max-md:mb-2">
          <span>SECURE PROTOCOL ACTIVE</span>
          <span>·</span>
          <span>CORE ENERGY: 100%</span>
        </div>

        <div className="flex gap-4">
          <span className="hover:text-white transition-colors duration-200">
            © {new Date().getFullYear()} OGIRI PORTAL NET
          </span>
        </div>
      </footer>

      {/* ─── ニューラルダイブ（画面遷移）演出オーバーレイ ─── */}
      {isDiving && (
        <div className="fixed inset-0 z-50 bg-[#070709] flex flex-col items-center justify-center font-mono select-none dive-flicker">
          {/* CRTスキャナーライン */}
          <div className="pointer-events-none absolute inset-0 z-50 opacity-25" 
               style={{
                 backgroundImage: "linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.4) 50%)",
                 backgroundSize: "100% 8px"
               }} 
          />
          
          <div className="flex flex-col items-center max-w-sm w-full px-6 text-center animate-fade-in-up">
            <h2 className="text-[#fcee0a] text-sm font-black tracking-[0.4em] mb-6 flex items-center gap-2">
              ⚡ NEURAL SYNC DIVE ⚡
            </h2>
            
            <div className="w-full bg-white/5 border border-[#fcee0a]/20 h-6 p-0.5 rounded-sm overflow-hidden mb-3 relative">
              <div className="bg-[#fcee0a] h-full transition-all duration-300 ease-out" 
                   style={{ width: `${diveProgress}%`, boxShadow: "0 0 15px #fcee0a" }} 
              />
              <div className="absolute inset-0 flex items-center justify-center text-[10px] text-black font-extrabold mix-blend-difference tracking-widest">
                {diveProgress}% SYNCED
              </div>
            </div>
            
            <p className="text-[10px] text-white/40 tracking-[0.2em] uppercase animate-pulse">
              Uploading Consciousness to OGIRI_NET...
            </p>
            
            <div className="text-[9px] text-[#00f0ff] mt-8 text-left font-mono leading-relaxed h-10 w-full max-w-[280px]">
              {diveProgress < 30 && ">> CONNECTING TO RETINA SYSTEM..."}
              {diveProgress >= 30 && diveProgress < 65 && ">> ESTABLISHING SYNAPTIC BRIDGE..."}
              {diveProgress >= 65 && diveProgress < 95 && ">> OVERWRITING THALAMIC SHIELD..."}
              {diveProgress >= 95 && ">> ACCESS GRANTED. SYSTEM GO."}
            </div>
          </div>
        </div>
      )}

      {/* ─── カスタムアニメーション用スタイル ─── */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes flicker-scanlines {
          0% { opacity: 0.03; }
          15% { opacity: 0.05; }
          30% { opacity: 0.02; }
          45% { opacity: 0.04; }
          60% { opacity: 0.015; }
          75% { opacity: 0.05; }
          90% { opacity: 0.03; }
          100% { opacity: 0.05; }
        }
        
        @keyframes flicker-dive {
          0% { opacity: 0.98; }
          15% { opacity: 1.0; }
          30% { opacity: 0.95; }
          45% { opacity: 0.99; }
          60% { opacity: 0.94; }
          75% { opacity: 1.0; }
          90% { opacity: 0.97; }
          100% { opacity: 1.0; }
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.25s ease-out forwards;
        }
        
        .scanlines-flicker {
          animation: flicker-scanlines 0.2s infinite;
        }
        
        .dive-flicker {
          animation: flicker-dive 0.1s infinite;
        }
      `}} />
    </div>
  );
}
