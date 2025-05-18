import { OrbitControls, Environment } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useRef, useState, Suspense, useEffect } from 'react';
import * as THREE from 'three';
import { gsap } from 'gsap';
import WebGPUCanvas from './canvas';
import Model from './model';

const MinimalistLoader = () => {
  const loaderRef = useRef(null);
  const progressRef = useRef(null);
  const textRef = useRef(null);
  const [progress, setProgress] = useState(0);
  
  useEffect(() => {
    const tl = gsap.timeline();
    
    tl.fromTo(loaderRef.current, 
      { opacity: 0 }, 
      { opacity: 1, duration: 0.5 }
    );
    
    gsap.to(progressRef.current, {
      width: '100%',
      duration: 3.5,
      ease: 'power1.inOut',
      onUpdate: function() {
        const prog = Math.round(this.progress() * 100);
        setProgress(prog);
      },
      onComplete: function() {
        gsap.to(loaderRef.current, {
          opacity: 0,
          duration: 0.5,
          delay: 0.2
        });
      }
    });
    
    return () => {
      tl.kill();
    };
  }, []);
  
  return (
    <div 
      ref={loaderRef} 
      className="absolute inset-0 flex flex-col items-center justify-center bg-black z-50 text-white font-sans"
    >
      <div className="mb-3 text-xs tracking-wider opacity-80" ref={textRef}>
        {progress}%
      </div>
      <div className="w-44 h-0.5 bg-white/10 overflow-hidden rounded-sm">
        <div 
          ref={progressRef} 
          className="h-full w-0 bg-white rounded-sm"
        />
      </div>
    </div>
  );
};

const cubicInOut = (t: number): number => {
  return t < 0.5
    ? 4 * t * t * t
    : 0.5 * Math.pow(2 * t - 2, 3) + 1;
};

const RotatingModel = () => {
  const groupRef = useRef<THREE.Group>(null);
  const [isHovered, setIsHovered] = useState(false);
  const rotationSpeedRef = useRef(0.005);
  
  const transitionProgressRef = useRef(0);
  const normalSpeed = 0.005;
  const hoverSpeed = 0.0015;
  
  useFrame((_, delta) => {
    if (groupRef.current) {
      const transitionDirection = isHovered ? -1 : 1;
      
      transitionProgressRef.current = Math.max(
        0, 
        Math.min(
          1, 
          transitionProgressRef.current + transitionDirection * delta * 1.5
        )
      );
      
      const easedProgress = cubicInOut(transitionProgressRef.current);
      
      rotationSpeedRef.current = THREE.MathUtils.lerp(
        hoverSpeed,
        normalSpeed,
        easedProgress
      );
      
      groupRef.current.rotation.y += rotationSpeedRef.current;
    }
  });
  
  return (
    <group 
      ref={groupRef}
      onPointerOver={() => setIsHovered(true)}
      onPointerOut={() => setIsHovered(false)}
    >
      <Model 
        position={[0, 0, 0]} 
        rotation={[0, 0, 0]} 
        scale={10} 
      />
    </group>
  );
};

const Scene = () => {
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 4000);
    
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <>
      {isLoading && <MinimalistLoader />}
      <WebGPUCanvas 
        camera={{ position: [0, 0, 3], fov: 45 }}
        style={{ width: '100%', height: '100%' }}
        gl={{ antialias: true }}
        shadows
      >
        <color attach="background" args={['#000000']} />
        <ambientLight intensity={0.5} />
        
        <directionalLight 
          position={[5, 5, 5]} 
          intensity={1.5} 
          castShadow 
          shadow-mapSize={[1024, 1024]}
        />
        
        <directionalLight 
          position={[-5, 3, -5]} 
          intensity={0.8} 
        />
        
        <Suspense fallback={null}>
          <RotatingModel />
        </Suspense>
        
        <OrbitControls 
          enableDamping 
          dampingFactor={0.05}
          minDistance={1.5}
          maxDistance={10}
        />
        
        <Suspense fallback={null}>
          <Environment files="/studio_small_03_4k.hdr" />
        </Suspense>
        
      </WebGPUCanvas>
    </>
  );
};

export default Scene;