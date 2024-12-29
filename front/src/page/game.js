import * as THREE from 'three';
import { Text } from 'troika-three-text';
import { loadCSS } from '../utils/loadcss';
import { language } from "../utils/language";

let leftPaddle, rightPaddle, ball

export function loadGame() {
  loadCSS('../styles/game.css');
  const languageKey = localStorage.getItem("selectedLanguage");

  const html = `
    <div class="game-container">

      <div id="overlay" class="overlay"></div>
      <canvas id="pong-area" class="pong-area"></canvas>

      <div id="game-rules" class="game-rules">
        <Button id="start-game" class="start-game">
          ${language[languageKey]["Start"]}
        </Button>
        <h4 className="game-rules-title">${language[languageKey]["PongRules"]}</h4>
        <p>${language[languageKey]["FirstTo11"]}</p>
        <p>${language[languageKey]["LeftPlayer"]}</p>
        <p>${language[languageKey]["RightPlayer"]}</p>
      </div>
    </div>
  `

  document.getElementById('app').innerHTML = html;

  const pongArea = document.getElementById('pong-area');
  const startGame = document.getElementById('start-game');
  const gameRules = document.getElementById('game-rules');
  const overlay = document.getElementById('overlay');

  let ws = null;
  let animationId = null;
  let gameState = '1';
  let scores = { left: 0, right: 0 };
  let minutes = 0;
  let seconds = 0;
  let message = 'none';

  startGame.addEventListener('click', () => {
    if (ws && ws.readyState === 1) {
      ws.send(JSON.stringify({ type: 'start_game' }));
      gameState = '2';
      gameRules.style.display = 'none';
      pongArea.style.display = 'block';
      initGame();
    }
  });

  function handleOverlayClick() {
    reset_game();
    overlay.removeEventListener('click', handleOverlayClick);
  };

  function renderMessage() {
    if (message === 'menu')
      overlay.addEventListener('click', handleOverlayClick);
    if (message !== 'none') {
      overlay.style.visibility = 'visible';
      overlay.innerHTML = message;
    } else {
      overlay.style.visibility = 'hidden';
    }
  };

  const scoreText = new Text();
  scoreText.text = `${scores.left} - ${scores.right}`;
  scoreText.fontSize = 40;
  scoreText.color = 0x000000;
  scoreText.position.set(0, 1, -340);
  scoreText.rotation.x = Math.PI;
  scoreText.textAlign = 'center';
  scoreText.anchorX = 'center';
  scoreText.anchorY = 'top';
  scoreText.sync();

  const timeText = new Text();
  timeText.text = `${minutes}:${seconds}`;
  timeText.fontSize = 20;
  timeText.color = 0x000000;
  timeText.position.set(0, 1, -300)
  timeText.rotation.x = Math.PI;
  timeText.textAlign = 'right';
  timeText.anchorX = 'right';
  timeText.anchorY = 'top';
  timeText.sync();

  function initWebSocket() {
    const username = 'guest';
    ws = new WebSocket(`wss://localhost:443/ws/localgame/${username}/`);

    ws.onerror = (e) => {
      console.error("WebSocket error: ", e);
    };

    ws.onopen = () => {
      console.log("WebSocket opened");
    };

    ws.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.type === "paddle_update") {
          // 패들의 3D 위치와 회전 업데이트
          leftPaddle.position.x = data.paddles.left.x;
          leftPaddle.position.y = data.paddles.left.y;
          leftPaddle.position.z = data.paddles.left.z;
          leftPaddle.rotation.x = data.paddles.left.rotation.x;
          leftPaddle.rotation.y = data.paddles.left.rotation.y;
          leftPaddle.rotation.z = data.paddles.left.rotation.z;
  
          rightPaddle.position.x = data.paddles.right.x;
          rightPaddle.position.y = data.paddles.right.y;
          rightPaddle.position.z = data.paddles.right.z;
          rightPaddle.rotation.x = data.paddles.right.rotation.x;
          rightPaddle.rotation.y = data.paddles.right.rotation.y;
          rightPaddle.rotation.z = data.paddles.right.rotation.z;
  
      } else if (data.type === "ball_update") {
          // 공의 3D 위치 업데이트
          ball.position.set(
              data.ball.x,
              data.ball.y,
              data.ball.z
          );
  
      } else if (data.type === "update") {
          // 전체 게임 상태 업데이트
          scores.left = data.scores.left;
          scores.right = data.scores.right;
          minutes = data.time.min;
          seconds = data.time.sec;
  
          // 패들과 공의 3D 위치 업데이트
          if (data.paddles) {
              leftPaddle.position.set(
                  data.paddles.left.x,
                  data.paddles.left.y,
                  data.paddles.left.z
              );
              leftPaddle.rotation.set(
                  data.paddles.left.rotation.x,
                  data.paddles.left.rotation.y,
                  data.paddles.left.rotation.z
              );
  
              rightPaddle.position.set(
                  data.paddles.right.x,
                  data.paddles.right.y,
                  data.paddles.right.z
              );
              rightPaddle.rotation.set(
                  data.paddles.right.rotation.x,
                  data.paddles.right.rotation.y,
                  data.paddles.right.rotation.z
              );
          }
  
          if (data.ball) {
              ball.position.set(
                  data.ball.x,
                  data.ball.y,
                  data.ball.z
              );
          }
      } else if (data.type === "message") {
          message = data.message;
          renderMessage();
      }
  };
  

    ws.onclose = () => {
      console.log("WebSocket closed");
      ws = null;
    };
  }

  initWebSocket();

  function reset_game() {
    if (animationId) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }
    gameState = '1';
    scores = { left: 0, right: 0 };
    paddles = {
      left: { top: "50%" },
      right: { top: "50%" }
    };
    ballPosition = { x: "50%", y: "50%" };
    minutes = 0;
    seconds = 0;
    message = 'none';

    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'reset_game' }));
    }

    overlay.style.display = 'none';
    gameRules.style.display = 'block';
    pongArea.style.display = 'none';
  };

  // WebSocket 이벤트 핸들러
  function handleKeyDown(event) {
    const key = event.key;
    if (key === 'ArrowUp' || key === 'ArrowDown') {
      event.preventDefault();
    }
    if (["w", "s", "ArrowUp", "ArrowDown"].includes(key) && ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "keydown", key }));
    }
  }

  function handleKeyUp(event) {
    const key = event.key;
    if (["w", "s", "ArrowUp", "ArrowDown"].includes(key) && ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "keyup", key }));
    }
  }

  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', handleKeyUp);

  // Three.js 초기 설정
  function initGame() {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    // 카메라 설정 - 탁구 테이블을 위에서 내려다보는 각도로 설정
    const camera = new THREE.PerspectiveCamera(60, 800 / 600, 0.1, 1000);
    camera.position.set(0, 700, 0);  // 테이블 위쪽으로 이동
    camera.lookAt(0, 0, 0);  // 테이블 중앙을 바라보도록 설정
    
    const renderer = new THREE.WebGLRenderer({ 
      canvas: pongArea,
      antialias: true,
      alpha: true
    });
    renderer.setSize(800, 600);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);
    // 렌더러 설정
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;

    // 바닥 생성
    const floorGeometry = new THREE.PlaneGeometry(1000, 1000);
    const floorMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xCEB195,
      roughness: 0.8,
      metalness: 0.2,
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -50;
    floor.receiveShadow = true;
    scene.add(floor);

    // 탁구 테이블 상판 생성
    const tableTopGeometry = new THREE.BoxGeometry(700, 4, 500);
    const tableTopMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x1B5E20,
      roughness: 0.7,
      metalness: 0.1,
    });
    const tableTop = new THREE.Mesh(tableTopGeometry, tableTopMaterial);
    tableTop.position.y = 0;
    tableTop.castShadow = true;
    tableTop.receiveShadow = true;
    scene.add(tableTop);

  // 테이블 라인들 생성
  const lineMaterial = new THREE.MeshBasicMaterial({ 
    color: 0xFFFFFF,
});
  // 중앙선
  const centerLineGeometry = new THREE.PlaneGeometry(700, 2);
  const centerLine = new THREE.Mesh(centerLineGeometry, lineMaterial);
  centerLine.position.y = 2;  // 약간 위로 올려서 z-fighting 방지
  centerLine.rotation.x = -Math.PI / 2;
  scene.add(centerLine);
    
  // 추가적으로 수직 중앙선도 생성
  const verticalCenterLineGeometry = new THREE.PlaneGeometry(2, 500);
  const verticalCenterLine = new THREE.Mesh(verticalCenterLineGeometry, lineMaterial);
  verticalCenterLine.position.y = 2;
  verticalCenterLine.rotation.x = -Math.PI / 2;
  scene.add(verticalCenterLine);

  // 사이드 라인들
  const sideLineGeometry = new THREE.PlaneGeometry(700, 2);
  const endLineGeometry = new THREE.PlaneGeometry(2, 500);

  // 상단과 하단 라인
  [-250, 250].forEach(z => {
    const sideLine = new THREE.Mesh(sideLineGeometry, lineMaterial);
    sideLine.position.set(0, 2, z);
    sideLine.rotation.x = -Math.PI / 2;
    scene.add(sideLine);
  });

  // 좌우 끝 라인
  [-350, 350].forEach(x => {
    const endLine = new THREE.Mesh(endLineGeometry, lineMaterial);
    endLine.position.set(x, 2, 0);
    endLine.rotation.x = -Math.PI / 2;
    scene.add(endLine);
  });

  // 탁구 라켓 생성 함수
  function createPaddle(isLeft) {
    // 패들 그룹 생성
    const paddleGroup = new THREE.Group();
  
    // 직선 막대기 형태의 패들 생성
    const paddleGeometry = new THREE.BoxGeometry(16, 2, 100); // 두께, 높이, 길이
    const paddleMaterial = new THREE.MeshStandardMaterial({
      color: isLeft ? 0x4169E1 : 0xFF4500,
      roughness: 0.6,
      metalness: 0.3,
    });
  
    const paddle = new THREE.Mesh(paddleGeometry, paddleMaterial);
    paddle.castShadow = true;
    paddle.receiveShadow = true;
  
    paddleGroup.add(paddle);
    return paddleGroup;
  }
  
  // 양쪽 라켓 생성 및 추가
  leftPaddle = createPaddle(true);
  rightPaddle = createPaddle(false);
  scene.add(leftPaddle);
  scene.add(rightPaddle);

  // 공 생성
  const ballGeometry = new THREE.SphereGeometry(6);
  // 공의 재질 수정
  const ballMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xffffff,
    roughness: 0.2,
    metalness: 0.7,
  });

  ball = new THREE.Mesh(ballGeometry, ballMaterial);
  ball.castShadow = true;
  scene.add(ball);

  // 점수 텍스트
  const scoreText = new Text();
  scoreText.text = `${scores.left} - ${scores.right}`;
  scoreText.fontSize = 40;
  scoreText.color = 0xffffff;
  // 테이블 위에 떠 있도록 위치 조정
  scoreText.position.set(0, 1, -340);
  // 카메라에서 잘 보이도록 회전
  scoreText.rotation.x = -Math.PI / 2;
  scoreText.textAlign = 'center';
  scoreText.anchorX = 'center';
  scoreText.anchorY = 'center';
  scoreText.sync();
  scene.add(scoreText);

  // 시간 텍스트
  const timeText = new Text();
  timeText.text = `${minutes}:${seconds}`;
  timeText.fontSize = 20;
  timeText.color = 0xffffff;
  // 점수 텍스트 옆에 위치하도록 조정
  timeText.position.set(0, 1, -300);
  // 카메라에서 잘 보이도록 회전
  timeText.rotation.x = -Math.PI / 2;
  timeText.textAlign = 'center';
  timeText.anchorX = 'center';
  timeText.anchorY = 'center';
  timeText.sync();
  scene.add(timeText);


// 애니메이션 함수 수정
function animate() {
  animationId = requestAnimationFrame(animate);

  // 텍스트 업데이트
  scoreText.text = `${scores.left} - ${scores.right}`;
  timeText.text = `${minutes}:${seconds}`;
  scoreText.sync();
  timeText.sync();

  renderer.render(scene, camera);
}
  animate();
  }
}