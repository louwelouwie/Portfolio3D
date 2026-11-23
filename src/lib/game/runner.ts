export const width = 640;
export const height = 320;
export const groundY = 252;
export const playerX = 74;
export const playerWidth = 38;
export const playerHeight = 42;

const gravity = 1750;
const jumpSpeed = -650;

export type GamePhase = 'ready' | 'running' | 'paused' | 'over';
export type Obstacle = { x: number; width: number; height: number };

export type RunnerState = {
	phase: GamePhase;
	playerY: number;
	velocityY: number;
	obstacles: Obstacle[];
	score: number;
	speed: number;
	spawnIn: number;
	distance: number;
};

export function createRunner(): RunnerState {
	return {
		phase: 'ready',
		playerY: groundY - playerHeight,
		velocityY: 0,
		obstacles: [],
		score: 0,
		speed: 230,
		spawnIn: 1.15,
		distance: 0
	};
}

export function startRunner(state: RunnerState) {
	if (state.phase === 'paused') {
		state.phase = 'running';
		return;
	}
	if (state.phase === 'running') return;
	Object.assign(state, createRunner());
	state.phase = 'running';
}

export function jump(state: RunnerState) {
	if (state.phase !== 'running') return;
	if (state.playerY >= groundY - playerHeight - 0.5) state.velocityY = jumpSpeed;
}

export function advanceRunner(state: RunnerState, elapsed: number, random = Math.random) {
	if (state.phase !== 'running') return;
	const dt = Math.min(Math.max(elapsed, 0), 0.05);
	state.score += dt * 10;
	state.speed = Math.min(390, 230 + state.score * 0.8);
	state.distance += state.speed * dt;
	state.velocityY += gravity * dt;
	state.playerY = Math.min(groundY - playerHeight, state.playerY + state.velocityY * dt);
	if (state.playerY === groundY - playerHeight) state.velocityY = 0;

	state.spawnIn -= dt;
	if (state.spawnIn <= 0) {
		state.obstacles.push({
			x: width + 12,
			width: 20 + random() * 12,
			height: 28 + random() * 20
		});
		state.spawnIn = 0.85 + random() * 0.6;
	}
	for (const obstacle of state.obstacles) obstacle.x -= state.speed * dt;
	state.obstacles = state.obstacles.filter((obstacle) => obstacle.x + obstacle.width > -10);

	const playerLeft = playerX + 6;
	const playerRight = playerX + playerWidth - 5;
	const playerTop = state.playerY + 5;
	const playerBottom = state.playerY + playerHeight - 3;
	for (const obstacle of state.obstacles) {
		if (
			playerRight > obstacle.x + 3 &&
			playerLeft < obstacle.x + obstacle.width - 3 &&
			playerBottom > groundY - obstacle.height + 4 &&
			playerTop < groundY
		) {
			state.phase = 'over';
			break;
		}
	}
}
