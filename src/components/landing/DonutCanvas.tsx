'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js'

// ─── Voronoi helpers ──────────────────────────────────────────────────────────
function hash2(px: number, py: number): [number, number] {
  const a = Math.sin(px * 127.1 + py * 311.7) * 43758.5453
  const b = Math.sin(px * 269.5 + py * 183.3) * 43758.5453
  return [a - Math.floor(a), b - Math.floor(b)]
}

const FRAG_SCALE = 50
const TORUS_R = 2
const TORUS_r = 0.4

function cellSeed(u: number, v: number): [number, number] {
  const nx = Math.floor(u * FRAG_SCALE)
  const ny = Math.floor(v * FRAG_SCALE)
  const fx = u * FRAG_SCALE - nx
  const fy = v * FRAG_SCALE - ny
  let md = Infinity
  let best: [number, number] = [nx, ny]
  for (let j = -2; j <= 2; j++) {
    for (let i = -2; i <= 2; i++) {
      const [ox, oy] = hash2(nx + i, ny + j)
      const dx = i + ox - fx
      const dy = j + oy - fy
      const d = dx * dx + dy * dy
      if (d < md) { md = d; best = [nx + i + ox, ny + j + oy] }
    }
  }
  return [best[0] / FRAG_SCALE, best[1] / FRAG_SCALE]
}

function addBarycentricCoords(geo: THREE.BufferGeometry): THREE.BufferGeometry {
  const g = geo.toNonIndexed()
  const count = g.attributes.position.count
  const bary = new Float32Array(count * 3)
  for (let i = 0; i < count; i += 3) {
    bary[i * 3] = 1; bary[i * 3 + 1] = 0; bary[i * 3 + 2] = 0
    bary[(i + 1) * 3] = 0; bary[(i + 1) * 3 + 1] = 1; bary[(i + 1) * 3 + 2] = 0
    bary[(i + 2) * 3] = 0; bary[(i + 2) * 3 + 1] = 0; bary[(i + 2) * 3 + 2] = 1
  }
  g.setAttribute('barycentric', new THREE.BufferAttribute(bary, 3))
  return g
}

// ─── Fragment data type ───────────────────────────────────────────────────────
interface FragData {
  cellCenter: THREE.Vector3
  cellNormal: THREE.Vector3
  rotAxis: THREE.Vector3
  maxAngle: number
  lift: number
}

// ─── Component ────────────────────────────────────────────────────────────────
export function DonutCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // ── Scene ────────────────────────────────────────────────────────────────
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x050505)

    const scrollGroup = new THREE.Group()
    scene.add(scrollGroup)
    const torusGroup = new THREE.Group()
    scrollGroup.add(torusGroup)

    // ── Camera ───────────────────────────────────────────────────────────────
    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000)
    camera.position.z = 10

    // ── Renderer ─────────────────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.0

    // ── Post-processing ──────────────────────────────────────────────────────
    const composer = new EffectComposer(renderer)
    composer.addPass(new RenderPass(scene, camera))

    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      0.6, 0.5, 0.3
    )
    composer.addPass(bloomPass)

    const fxaaPass = new ShaderPass(FXAAShader)
    fxaaPass.uniforms['resolution'].value.set(1 / window.innerWidth, 1 / window.innerHeight)
    composer.addPass(fxaaPass)

    // ── Lights ───────────────────────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0xffffff, 0.35))
    const dirLight = new THREE.DirectionalLight(0xfff4e0, 2.8)
    dirLight.position.set(3, 4, 5)
    scene.add(dirLight)
    const fillLight = new THREE.DirectionalLight(0xaabbff, 0.5)
    fillLight.position.set(-4, -2, -3)
    scene.add(fillLight)

    // ── Textures ─────────────────────────────────────────────────────────────
    const loader = new THREE.TextureLoader()
    const diffuse = loader.load('https://raw.githubusercontent.com/danielyl123/person/refs/heads/main/diffuse.jpg')
    const normalTex = loader.load('https://raw.githubusercontent.com/danielyl123/person/refs/heads/main/normal.jpg')
    const arm = loader.load('https://raw.githubusercontent.com/danielyl123/person/refs/heads/main/arm.jpg')
    ;[diffuse, normalTex, arm].forEach((tex) => {
      tex.repeat.set(2, 2)
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping
    })
    diffuse.colorSpace = THREE.SRGBColorSpace

    // ── Wireframe inner torus (barycentric shader) ────────────────────────────
    const wireMat = new THREE.ShaderMaterial({
      vertexShader: /* glsl */`
        attribute vec3 barycentric;
        varying vec3 vBary;
        void main() {
          vBary = barycentric;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */`
        varying vec3 vBary;
        float wireMask(vec3 b, float t) {
          vec3 d = fwidth(b);
          vec3 a = smoothstep(vec3(0.0), d * t, b);
          return 1.0 - min(a.x, min(a.y, a.z));
        }
        void main() {
          float wf = wireMask(vBary, 1.6);
          vec3 col = mix(vec3(0.07, 0.01, 0.0), vec3(1.0, 0.28, 0.04), wf);
          col = mix(col, vec3(1.0, 0.8, 0.3) * 2.2, wf * 0.55);
          gl_FragColor = vec4(col, 1.0);
        }
      `,
      side: THREE.DoubleSide,
    })
    torusGroup.add(new THREE.Mesh(
      addBarycentricCoords(new THREE.TorusGeometry(TORUS_R, TORUS_r, 80, 80)),
      wireMat
    ))

    // ── Voronoi fragment meshes ───────────────────────────────────────────────
    const baseGeo = new THREE.TorusGeometry(TORUS_R, TORUS_r, 100, 100)
    const nonIndexed = baseGeo.toNonIndexed()
    baseGeo.dispose()
    const pos = nonIndexed.attributes.position.array as Float32Array
    const nrm = nonIndexed.attributes.normal.array as Float32Array
    const uvData = nonIndexed.attributes.uv.array as Float32Array
    const tris = pos.length / 9

    const cellMap = new Map<string, { s: [number, number]; t: number[] }>()
    for (let t = 0; t < tris; t++) {
      const uc = (uvData[t * 6] + uvData[t * 6 + 2] + uvData[t * 6 + 4]) / 3
      const vc = (uvData[t * 6 + 1] + uvData[t * 6 + 3] + uvData[t * 6 + 5]) / 3
      const s = cellSeed(uc, vc)
      const k = `${s[0].toFixed(9)}_${s[1].toFixed(9)}`
      if (!cellMap.has(k)) cellMap.set(k, { s, t: [] })
      cellMap.get(k)!.t.push(t)
    }

    const fragMat = new THREE.MeshStandardMaterial({
      map: diffuse, normalMap: normalTex, roughnessMap: arm,
      roughness: 1.0, metalness: 0.0, side: THREE.DoubleSide,
    })

    const fragments: THREE.Mesh[] = []
    const TWO_PI = Math.PI * 2

    for (const { s: seed, t: triList } of cellMap.values()) {
      if (!triList.length) continue
      const vc = triList.length * 3
      const pArr = new Float32Array(vc * 3)
      const nArr = new Float32Array(vc * 3)
      const uvArr = new Float32Array(vc * 2)
      let vi = 0
      for (const tri of triList) {
        for (let v = 0; v < 3; v++) {
          const sv = tri * 3 + v
          pArr[vi * 3] = pos[sv * 3]; pArr[vi * 3 + 1] = pos[sv * 3 + 1]; pArr[vi * 3 + 2] = pos[sv * 3 + 2]
          nArr[vi * 3] = nrm[sv * 3]; nArr[vi * 3 + 1] = nrm[sv * 3 + 1]; nArr[vi * 3 + 2] = nrm[sv * 3 + 2]
          uvArr[vi * 2] = uvData[sv * 2]; uvArr[vi * 2 + 1] = uvData[sv * 2 + 1]
          vi++
        }
      }

      const phi = seed[0] * TWO_PI
      const theta = seed[1] * TWO_PI
      const cx = (TORUS_R + TORUS_r * Math.cos(theta)) * Math.cos(phi)
      const cy = (TORUS_R + TORUS_r * Math.cos(theta)) * Math.sin(phi)
      const cz = TORUS_r * Math.sin(theta)
      const cellCenter = new THREE.Vector3(cx, cy, cz)
      const majorPt = new THREE.Vector3(TORUS_R * Math.cos(phi), TORUS_R * Math.sin(phi), 0)
      const cellNormal = cellCenter.clone().sub(majorPt).normalize()

      const SHRINK = 0.96
      for (let i = 0; i < pArr.length; i += 3) {
        pArr[i] = (pArr[i] - cx) * SHRINK
        pArr[i + 1] = (pArr[i + 1] - cy) * SHRINK
        pArr[i + 2] = (pArr[i + 2] - cz) * SHRINK
      }

      const geo = new THREE.BufferGeometry()
      geo.setAttribute('position', new THREE.BufferAttribute(pArr, 3))
      geo.setAttribute('normal', new THREE.BufferAttribute(nArr, 3))
      geo.setAttribute('uv', new THREE.BufferAttribute(uvArr, 2))

      const rnd = hash2(seed[0] * 137.53, seed[1] * 137.53)
      const up = Math.abs(cellNormal.z) < 0.9 ? new THREE.Vector3(0, 0, 1) : new THREE.Vector3(0, 1, 0)
      const tang = new THREE.Vector3().crossVectors(cellNormal, up).normalize()
      const bitang = new THREE.Vector3().crossVectors(cellNormal, tang)
      const aa = rnd[0] * TWO_PI
      const rotAxis = tang.clone().multiplyScalar(Math.cos(aa)).addScaledVector(bitang, Math.sin(aa)).normalize()

      const mesh = new THREE.Mesh(geo, fragMat)
      mesh.position.copy(cellCenter).addScaledVector(cellNormal, 0.015)
      const fragData: FragData = { cellCenter, cellNormal, rotAxis, maxAngle: 0.7 + rnd[1] * 0.9, lift: 0 }
      mesh.userData = fragData
      torusGroup.add(mesh)
      fragments.push(mesh)
    }

    nonIndexed.dispose()

    // ── Invisible raycaster mesh ──────────────────────────────────────────────
    const rcMesh = new THREE.Mesh(
      new THREE.TorusGeometry(TORUS_R, TORUS_r, 80, 80),
      new THREE.MeshBasicMaterial({ visible: false })
    )
    torusGroup.add(rcMesh)

    const raycaster = new THREE.Raycaster()
    const mouse = new THREE.Vector2(-999, -999)

    const onMouseMove = (e: MouseEvent) => {
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1
      mouse.y = -(e.clientY / window.innerHeight) * 2 + 1
    }
    window.addEventListener('mousemove', onMouseMove)

    // ── GSAP scroll animation ─────────────────────────────────────────────────
    // We use direct ScrollTrigger to avoid importing gsap here
    // Instead, animate via scroll event listener
    const scrollHandler = () => {
      const progress = window.scrollY / (document.body.scrollHeight - window.innerHeight)
      const p1 = Math.min(progress * 2, 1)
      const p2 = Math.max((progress - 0.5) * 2, 0)

      scrollGroup.position.x = (p1 - p2) * -2.3 + p2 * 2.3
      scrollGroup.rotation.x = 0.15 + p1 * (Math.PI * 0.5 - 0.15) + p2 * (-Math.PI * 0.5 - Math.PI * 0.5)
      scrollGroup.rotation.y = p1 * (-Math.PI * 0.6) + p2 * (Math.PI * 0.6)
      scrollGroup.rotation.z = p1 * (Math.PI * 0.25) + p2 * (-Math.PI * 0.25)
    }
    window.addEventListener('scroll', scrollHandler)

    // ── Entrance animation ────────────────────────────────────────────────────
    scrollGroup.rotation.y = Math.PI
    scrollGroup.position.y = -2
    scrollGroup.rotation.x = 0.15

    let entranceT = 0
    const ENTRANCE_DURATION = 2.4

    // ── Idle rotation ─────────────────────────────────────────────────────────
    let idleActive = false
    setTimeout(() => { idleActive = true }, 2600)

    // ── Fragment hover params ─────────────────────────────────────────────────
    const fragParams = { hoverRadius: 0.75, liftDist: 0.28, liftSpeedUp: 0.15, liftSpeedDown: 0.06 }
    const hover = { point: new THREE.Vector3(), active: 0 }
    const _localHover = new THREE.Vector3()

    function smoothstep(min: number, max: number, v: number) {
      const t = Math.max(0, Math.min(1, (v - min) / (max - min)))
      return t * t * (3 - 2 * t)
    }

    // ── Tick ─────────────────────────────────────────────────────────────────
    const clock = new THREE.Clock()
    let lastTime = 0
    let rafId: number

    const tick = () => {
      rafId = requestAnimationFrame(tick)
      const elapsed = clock.getElapsedTime()
      const delta = elapsed - lastTime
      lastTime = elapsed

      // Entrance ease (power3.out approximation)
      if (entranceT < ENTRANCE_DURATION) {
        entranceT = Math.min(entranceT + delta, ENTRANCE_DURATION)
        const p = entranceT / ENTRANCE_DURATION
        const ease = 1 - Math.pow(1 - p, 3)
        scrollGroup.rotation.y = THREE.MathUtils.lerp(Math.PI, 0, ease)
        scrollGroup.position.y = THREE.MathUtils.lerp(-2, 0, ease)
      }

      // Idle rotation
      if (idleActive && window.scrollY < 50) {
        torusGroup.rotation.y += delta * (Math.PI * 2 / 22)
      }

      // Raycasting
      raycaster.setFromCamera(mouse, camera)
      const hits = raycaster.intersectObject(rcMesh)
      if (hits.length > 0) {
        torusGroup.worldToLocal(_localHover.copy(hits[0].point))
        hover.point.copy(_localHover)
        hover.active = Math.min(hover.active + delta * 5, 1)
      } else {
        hover.active = Math.max(hover.active - delta * 2.5, 0)
      }

      // Update bloom on hover proximity + dispatch CSS glow event
      const newStrength = THREE.MathUtils.lerp(0.4, 1.2, hover.active)
      bloomPass.strength = newStrength
      window.dispatchEvent(new CustomEvent('donut-hover', { detail: hover.active }))

      // Fragment lift
      for (const frag of fragments) {
        const fd = frag.userData as FragData
        let target = 0
        if (hover.active > 0.01) {
          const dist = fd.cellCenter.distanceTo(hover.point)
          target = (1 - smoothstep(0.4, fragParams.hoverRadius, dist)) * hover.active
        }
        const speed = target > fd.lift ? fragParams.liftSpeedUp : fragParams.liftSpeedDown
        fd.lift = THREE.MathUtils.lerp(fd.lift, target, speed)
        const lift = fd.lift
        frag.position.copy(fd.cellCenter).addScaledVector(fd.cellNormal, 0.015 + lift * fragParams.liftDist)
        frag.quaternion.setFromAxisAngle(fd.rotAxis, lift * fd.maxAngle)
      }

      composer.render()
    }
    tick()

    // ── Resize ────────────────────────────────────────────────────────────────
    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      composer.setSize(window.innerWidth, window.innerHeight)
      fxaaPass.uniforms['resolution'].value.set(1 / window.innerWidth, 1 / window.innerHeight)
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('scroll', scrollHandler)
      window.removeEventListener('resize', onResize)
      renderer.dispose()
      composer.dispose()
      fragMat.dispose()
      wireMat.dispose()
      diffuse.dispose()
      normalTex.dispose()
      arm.dispose()
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }}
    />
  )
}
