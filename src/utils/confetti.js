/**
 * Confetti explosion utility.
 * Renders a lightweight, high-performance canvas-based particle effect.
 * Uses hardware-accelerated 2D canvas drawing to avoid DOM element overhead.
 */

let canvas = null;
let ctx = null;
let width = 0;
let height = 0;
let resizeHandler = null;
let animationFrameId = null;
let particles = [];

// Vibrant confetti color palette
const colors = [
  '#f43f5e', // Rose
  '#3b82f6', // Blue
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#14b8a6'  // Teal
];

// Helper to spawn particles at a given origin with angular range
const spawnConfetti = (originX, originY, minAngle, maxAngle) => {
  const count = 75; // Number of particles per cannon
  for (let i = 0; i < count; i++) {
    const angle = minAngle + Math.random() * (maxAngle - minAngle);
    const speed = 12 + Math.random() * 16;
    particles.push({
      x: originX,
      y: originY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 6 + Math.random() * 8,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.15,
      opacity: 1,
      shape: Math.random() > 0.45 ? 'circle' : 'square',
      wobble: Math.random() * Math.PI * 2,
      wobbleSpeed: 0.05 + Math.random() * 0.1
    });
  }
};

export function triggerConfetti() {
  if (!canvas) {
    // 1. Create a full-screen canvas element overlay
    canvas = document.createElement('canvas');
    canvas.id = 'confetti-canvas';
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '99999';
    document.body.appendChild(canvas);

    ctx = canvas.getContext('2d');
    
    // Scale for High-DPI/Retina screens to ensure crisp rendering
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resizeHandler = resize;
    window.addEventListener('resize', resizeHandler);
    resize();
  } else {
    width = window.innerWidth;
    height = window.innerHeight;
  }

  // Launch from bottom corners angling towards the center-top
  // Left cannon: angling up-right (-60 to -15 degrees)
  spawnConfetti(0, height, -Math.PI / 3, -Math.PI / 12);
  // Right cannon: angling up-left (-165 to -120 degrees)
  spawnConfetti(width, height, -Math.PI * 11 / 12, -Math.PI * 2 / 3);

  // Animation loop using requestAnimationFrame
  const update = () => {
    ctx.clearRect(0, 0, width, height);

    let hasActiveParticles = false;

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      if (p.opacity <= 0) continue;

      hasActiveParticles = true;

      // Update positions with gravity and wind drag
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.45;       // Gravity acceleration
      p.vx *= 0.985;      // Air resistance X
      p.vy *= 0.985;      // Air resistance Y
      p.rotation += p.rotationSpeed;
      p.wobble += p.wobbleSpeed;

      // Apply horizontal wobble motion for a fluttering feather-like fall
      p.x += Math.sin(p.wobble) * 0.5;

      // Fade out slowly as they fall, and fade out faster when near/below screen bottom
      if (p.y > height - 150) {
        p.opacity -= 0.015;
      } else {
        p.opacity -= 0.004;
      }

      ctx.save();
      ctx.globalAlpha = Math.max(0, p.opacity);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.fillStyle = p.color;

      if (p.shape === 'circle') {
        ctx.beginPath();
        ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Draw standard rectangular confetti piece
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      }

      ctx.restore();
    }

    if (hasActiveParticles) {
      animationFrameId = requestAnimationFrame(update);
    } else {
      // Clean up event listeners and canvas node completely
      window.removeEventListener('resize', resizeHandler);
      if (canvas.parentNode) {
        canvas.remove();
      }
      canvas = null;
      ctx = null;
      resizeHandler = null;
      animationFrameId = null;
      particles = [];
    }
  };

  // Start animation loop if not already running
  if (!animationFrameId && particles.length > 0) {
    update();
  }
}
