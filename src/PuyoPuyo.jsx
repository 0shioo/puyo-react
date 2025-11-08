// App.js
import React, { useState, useEffect, useCallback } from "react";
import "./App.css";

const ROWS = 12;
const COLS = 6;
const COLORS = ["red", "green", "blue", "yellow", "purple"];

function App() {
  const [field, setField] = useState(
    Array.from({ length: ROWS }, () => Array(COLS).fill(null))
  );
  const [currentPuyo, setCurrentPuyo] = useState({
    color: [randomColor(), randomColor()],
    pos: [0, Math.floor(COLS / 2)],
    dir: 0, // 0:縦, 1:右, 2:下, 3:左
  });
  const [nextPuyo, setNextPuyo] = useState([randomColor(), randomColor()]);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  // 落下タイマー
  useEffect(() => {
    if (gameOver) return;
    const timer = setInterval(() => {
      moveDown();
    }, 500);
    return () => clearInterval(timer);
  }, [currentPuyo, field, gameOver]);

  // キー操作
  useEffect(() => {
    const handleKey = (e) => {
      if (gameOver) return;
      if (e.key === "ArrowLeft") move(0, -1);
      else if (e.key === "ArrowRight") move(0, 1);
      else if (e.key === "ArrowDown") moveDown();
      else if (e.key === "ArrowUp") rotate();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [currentPuyo, field, gameOver]);

  const move = (dr, dc) => {
    const [r, c] = currentPuyo.pos;
    if (canMove(r + dr, c + dc, currentPuyo.dir)) {
      setCurrentPuyo({ ...currentPuyo, pos: [r + dr, c + dc] });
    }
  };

  const moveDown = () => {
    const [r, c] = currentPuyo.pos;
    if (canMove(r + 1, c, currentPuyo.dir)) {
      setCurrentPuyo({ ...currentPuyo, pos: [r + 1, c] });
    } else {
      fixPuyo();
    }
  };

  const rotate = () => {
    const newDir = (currentPuyo.dir + 1) % 4;
    const [r, c] = currentPuyo.pos;
    if (canMove(r, c, newDir)) {
      setCurrentPuyo({ ...currentPuyo, dir: newDir });
    }
  };

  const canMove = (r, c, dir) => {
    const positions = getPositions(r, c, dir);
    return positions.every(([nr, nc]) => nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && !field[nr][nc]);
  };

  const getPositions = (r, c, dir) => {
    switch (dir) {
      case 0: return [[r, c], [r + 1, c]]; // 縦
      case 1: return [[r, c], [r, c + 1]]; // 右
      case 2: return [[r, c], [r - 1, c]]; // 下
      case 3: return [[r, c], [r, c - 1]]; // 左
      default: return [[r, c], [r + 1, c]];
    }
  };

  const fixPuyo = () => {
    const newField = field.map(row => [...row]);
    const positions = getPositions(...currentPuyo.pos, currentPuyo.dir);
    positions.forEach((pos, i) => {
      const [r, c] = pos;
      if (r < 0) {
        setGameOver(true);
        return;
      }
      newField[r][c] = currentPuyo.color[i];
    });
    setField(newField);
    clearPuyos(newField);
    // 次のぷよセット
    setCurrentPuyo({ color: nextPuyo, pos: [0, Math.floor(COLS / 2)], dir: 0 });
    setNextPuyo([randomColor(), randomColor()]);
  };

  const clearPuyos = (fld) => {
    let chain = 0;
    const newField = fld.map(row => [...row]);
    while (true) {
      const visited = Array.from({ length: ROWS }, () => Array(COLS).fill(false));
      let toClear = [];
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const color = newField[r][c];
          if (color && !visited[r][c]) {
            const queue = [[r, c]];
            const connected = [];
            while (queue.length) {
              const [cr, cc] = queue.pop();
              if (visited[cr][cc]) continue;
              visited[cr][cc] = true;
              connected.push([cr, cc]);
              [[-1,0],[1,0],[0,-1],[0,1]].forEach(([dr, dc]) => {
                const nr = cr + dr;
                const nc = cc + dc;
                if (nr>=0 && nr<ROWS && nc>=0 && nc<COLS && !visited[nr][nc] && newField[nr][nc] === color){
                  queue.push([nr,nc]);
                }
              });
            }
            if (connected.length >= 4) toClear.push(...connected);
          }
        }
      }
      if (!toClear.length) break;
      chain++;
      toClear.forEach(([r,c]) => newField[r][c] = null);
      setScore(prev => prev + toClear.length * chain);
      // 落下処理
      for (let c=0;c<COLS;c++){
        const stack = [];
        for (let r=ROWS-1;r>=0;r--){
          if (newField[r][c]) stack.push(newField[r][c]);
        }
        for (let r=ROWS-1;r>=0;r--){
          newField[r][c] = stack.pop() || null;
        }
      }
    }
    setField(newField);
  };

  return (
    <div className="game-container">
      <h1>ぷよぷよ React</h1>
      <p>Score: {score}</p>
      {gameOver && <h2>Game Over!</h2>}
      <div className="game">
        {field.map((row, r) => (
          <div key={r} className="row">
            {row.map((cell, c) => {
              const isCurrent = getPositions(...currentPuyo.pos, currentPuyo.dir).some(([rr,cc]) => rr===r && cc===c);
              const color = isCurrent ? currentPuyo.color[getPositions(...currentPuyo.pos, currentPuyo.dir).findIndex(([rr,cc])=>rr===r&&cc===c)] : cell;
              return <div key={c} className="cell">{color && <div className="puyo" style={{backgroundColor: color}} />}</div>
            })}
          </div>
        ))}
      </div>
      <div className="next">
        <p>NEXT</p>
        {nextPuyo.map((color,i)=><div key={i} className="cell"><div className="puyo" style={{backgroundColor: color}} /></div>)}
      </div>
    </div>
  );
}

function randomColor() {
  return COLORS[Math.floor(Math.random() * COLORS.length)];
}

export default App;
