import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Eye, ShieldCheck, Activity, RotateCcw } from 'lucide-react';

interface RoadTwin3DProps {
  initialMode?: 'pothole' | 'repaired' | 'scan';
}

export const RoadTwin3D: React.FC<RoadTwin3DProps> = ({ initialMode = 'pothole' }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<'pothole' | 'repaired' | 'scan'>(initialMode);
  const [isRotating, setIsRotating] = useState(true);
  const sceneRef = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    roadMesh: THREE.Mesh;
    craterMesh: THREE.Mesh;
    repairedMesh: THREE.Mesh;
    gridLines: THREE.LineSegments;
    subBaseMesh: THREE.Mesh;
    reqId: number;
  } | null>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight || 320;

    // Scene & Camera
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x090e17);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(5.5, 4.2, 5.5);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x38bdf8, 1.2);
    dirLight.position.set(6, 10, 6);
    scene.add(dirLight);

    const orangeLight = new THREE.DirectionalLight(0xf97316, 0.8);
    orangeLight.position.set(-6, 4, -4);
    scene.add(orangeLight);

    // Group for the entire road block
    const roadGroup = new THREE.Group();

    // 1. Sub-base Earth/Gravel layer
    const subBaseGeo = new THREE.BoxGeometry(4.8, 0.6, 3.2);
    const subBaseMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.9,
      metalness: 0.1
    });
    const subBaseMesh = new THREE.Mesh(subBaseGeo, subBaseMat);
    subBaseMesh.position.y = -0.3;
    roadGroup.add(subBaseMesh);

    // 2. Asphalt Top Layer
    const asphaltGeo = new THREE.BoxGeometry(4.8, 0.3, 3.2);
    const asphaltMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.8,
      metalness: 0.2
    });
    const roadMesh = new THREE.Mesh(asphaltGeo, asphaltMat);
    roadMesh.position.y = 0.15;
    roadGroup.add(roadMesh);

    // Lane dividing dashed lines
    for (let i = -1.8; i <= 1.8; i += 1.2) {
      const stripeGeo = new THREE.PlaneGeometry(0.6, 0.08);
      const stripeMat = new THREE.MeshBasicMaterial({ color: 0xf8fafc, side: THREE.DoubleSide });
      const stripe = new THREE.Mesh(stripeGeo, stripeMat);
      stripe.rotation.x = -Math.PI / 2;
      stripe.position.set(i, 0.31, 0);
      roadGroup.add(stripe);
    }

    // 3. Crater / Pothole representation (depressed fractured disc)
    const craterGeo = new THREE.CylinderGeometry(0.65, 0.45, 0.28, 16);
    const craterMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.95,
      wireframe: false
    });
    const craterMesh = new THREE.Mesh(craterGeo, craterMat);
    craterMesh.position.set(0.6, 0.16, 0.5);
    roadGroup.add(craterMesh);

    // 4. Repaired Asphalt Patch
    const repairGeo = new THREE.BoxGeometry(1.4, 0.32, 1.1);
    const repairMat = new THREE.MeshStandardMaterial({
      color: 0x020617,
      roughness: 0.6,
      metalness: 0.3
    });
    const repairedMesh = new THREE.Mesh(repairGeo, repairMat);
    repairedMesh.position.set(0.6, 0.16, 0.5);
    repairedMesh.visible = false;
    roadGroup.add(repairedMesh);

    // 5. Laser Scan Grid Lines
    const gridHelper = new THREE.GridHelper(5, 14, 0x14b8a6, 0x0284c7);
    gridHelper.position.y = 0.35;
    const gridLines = gridHelper as any;
    gridLines.visible = false;
    roadGroup.add(gridLines);

    // Safety Marker Cone on edge
    const coneGeo = new THREE.ConeGeometry(0.12, 0.35, 12);
    const coneMat = new THREE.MeshStandardMaterial({ color: 0xf97316 });
    const cone = new THREE.Mesh(coneGeo, coneMat);
    cone.position.set(0.6, 0.48, -0.8);
    roadGroup.add(cone);

    scene.add(roadGroup);

    // Mouse drag interaction
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - prevMouseX;
      const deltaY = e.clientY - prevMouseY;
      roadGroup.rotation.y += deltaX * 0.008;
      roadGroup.rotation.x = Math.max(-0.4, Math.min(0.6, roadGroup.rotation.x + deltaY * 0.008));
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    // Animation Loop
    let reqId = 0;
    const animate = () => {
      reqId = requestAnimationFrame(animate);
      if (!isDragging) {
        roadGroup.rotation.y += 0.003;
      }
      renderer.render(scene, camera);
    };
    animate();

    sceneRef.current = {
      renderer,
      scene,
      camera,
      roadMesh,
      craterMesh,
      repairedMesh,
      gridLines,
      subBaseMesh,
      reqId
    };

    const handleResize = () => {
      if (!container || !sceneRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight || 320;
      sceneRef.current.camera.aspect = w / h;
      sceneRef.current.camera.updateProjectionMatrix();
      sceneRef.current.renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      cancelAnimationFrame(reqId);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Update visibility based on mode
  useEffect(() => {
    if (!sceneRef.current) return;
    const { craterMesh, repairedMesh, gridLines } = sceneRef.current;

    if (mode === 'pothole') {
      craterMesh.visible = true;
      repairedMesh.visible = false;
      gridLines.visible = false;
    } else if (mode === 'repaired') {
      craterMesh.visible = false;
      repairedMesh.visible = true;
      gridLines.visible = false;
    } else if (mode === 'scan') {
      craterMesh.visible = true;
      repairedMesh.visible = false;
      gridLines.visible = true;
    }
  }, [mode]);

  return (
    <div className="relative w-full h-[320px] lg:h-[380px] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-xl flex flex-col">
      {/* Top Telemetry Bar */}
      <div className="absolute top-3 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2 bg-slate-900/80 backdrop-blur-md border border-slate-700/60 rounded-lg px-3 py-1.5 text-xs text-slate-300">
          <Activity className="w-3.5 h-3.5 text-teal-400 animate-pulse" />
          <span className="font-semibold text-slate-100">Digital Road Twin</span>
          <span className="text-slate-500">·</span>
          <span className="font-mono text-teal-300 tabular-nums">IRC-SP-100 Spec</span>
        </div>

        <div className="hidden sm:flex items-center gap-3 text-xs font-mono tabular-nums text-slate-400 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/60">
          <span>Depth: <strong className="text-orange-400">{mode === 'repaired' ? '0.0 cm' : '14.5 cm'}</strong></span>
          <span>Compaction: <strong className="text-teal-400">{mode === 'repaired' ? '98.8%' : '62.1%'}</strong></span>
        </div>
      </div>

      {/* 3D WebGL Canvas */}
      <div ref={mountRef} className="w-full flex-1 cursor-grab active:cursor-grabbing" />

      {/* Bottom Mode Switcher Bar */}
      <div className="absolute bottom-3 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-auto">
        <div className="flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md p-1 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => setMode('pothole')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              mode === 'pothole'
                ? 'bg-orange-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Pothole Void</span>
          </button>

          <button
            type="button"
            onClick={() => setMode('repaired')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              mode === 'repaired'
                ? 'bg-teal-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Repaired Seal</span>
          </button>

          <button
            type="button"
            onClick={() => setMode('scan')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              mode === 'scan'
                ? 'bg-cyan-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>LiDAR Scan Grid</span>
          </button>
        </div>

        <span className="text-[11px] text-slate-500 hidden sm:inline-block bg-slate-900/60 px-2 py-1 rounded">
          Drag to rotate 3D pavement model
        </span>
      </div>
    </div>
  );
};
