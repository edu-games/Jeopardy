import { getDb, type DB } from "./db";
import { eq, sql } from "drizzle-orm";
import { games, teams, students, gameState, boardQuestionSlots } from "./schema";

export class GameHub implements DurableObject {
	private readonly state: DurableObjectState;
	private readonly env: { DB: D1Database };

	constructor(state: DurableObjectState, env: { DB: D1Database }) {
		this.state = state;
		this.env = env;
	}

	async fetch(request: Request): Promise<Response> {
		const url = new URL(request.url);

		// WebSocket upgrade for real-time connections
		if (url.pathname === "/ws") {
			if (request.headers.get("Upgrade") !== "websocket") {
				return new Response("Expected WebSocket", { status: 426 });
			}

			const role = url.searchParams.get("role") as "instructor" | "student" | "projector";
			const gameId = url.searchParams.get("gameId")!;
			const instructorId = url.searchParams.get("instructorId") || "";
			const studentId = url.searchParams.get("studentId") || "";

			const pair = new WebSocketPair();
			const [client, server] = Object.values(pair);

			// Use Hibernation API — DO sleeps between messages
			this.state.acceptWebSocket(server, [role, gameId, instructorId, studentId]);
			server.send(JSON.stringify({ type: "connected", role, gameId }));

			if (role === "student" && studentId) {
				this.broadcast({ type: "student-status", studentId, connected: true });
			}

			if (role === "instructor" || role === "projector") {
				// Snapshot of which students are currently connected
				const connectedStudentIds = this.state.getWebSockets()
					.filter(ws => this.state.getTags(ws)[0] === "student")
					.map(ws => this.state.getTags(ws)[3])
					.filter((id): id is string => id !== "");
				server.send(JSON.stringify({ type: "connected-students-snapshot", studentIds: connectedStudentIds }));

				// Snapshot of current game state so reconnecting clients are immediately in sync
				const db = getDb(this.env.DB);
				const game = await db.query.games.findFirst({
					where: (g, { eq }) => eq(g.id, gameId),
					with: { gameState: true, teams: { with: { students: true } } }
				});
				if (game?.gameState) {
					let currentSlot = null;
					if (game.gameState.currentSlotId) {
						currentSlot = await db.query.boardQuestionSlots.findFirst({
							where: (s, { eq }) => eq(s.id, game.gameState!.currentSlotId!),
							with: { question: true, category: { with: { board: true } } }
						});
					}
					server.send(JSON.stringify({
						type: "game-state-snapshot",
						currentSlot,
						answeredSlots: JSON.parse(game.gameState.answeredSlots ?? "[]"),
						teams: game.teams,
						buzzerEnabled: game.gameState.buzzerEnabled ?? false,
						currentWager: game.gameState.currentWager ?? null,
						currentTeamId: game.gameState.currentTeamId ?? null
					}));
				}
			}

			return new Response(null, { status: 101, webSocket: client });
		}

		// Internal broadcast endpoint (called by REST routes for student-joined)
		if (url.pathname === "/broadcast" && request.method === "POST") {
			const event = await request.json() as object;
			this.broadcast(event);
			return new Response("ok");
		}

		return new Response("Not found", { status: 404 });
	}

	// ── Hibernation API callbacks ──────────────────────────────────────────────

	async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
		const [role, gameId, instructorId, studentId] = this.state.getTags(ws);
		const db = getDb(this.env.DB);

		let event: { type: string; [key: string]: unknown };
		try {
			event = JSON.parse(typeof message === "string" ? message : new TextDecoder().decode(message));
		} catch {
			ws.send(JSON.stringify({ type: "error", message: "Invalid JSON" }));
			return;
		}

		try {
			switch (event.type) {
				case "start-game":
					await this.handleStartGame(db, ws, gameId, instructorId);
					break;
				case "end-game":
					await this.handleEndGame(db, ws, gameId, instructorId);
					break;
				case "reveal-question":
					await this.handleRevealQuestion(db, ws, gameId, instructorId, event.slotId as string);
					break;
				case "close-question":
					await this.handleCloseQuestion(db, ws, gameId, instructorId);
					break;
				case "submit-wager":
					await this.handleSubmitWager(db, ws, gameId, instructorId, event.teamId as string, event.wager as number);
					break;
				case "answer":
					await this.handleAnswer(db, ws, gameId, instructorId, event.isCorrect as boolean, event.teamId as string);
					break;
				case "assign-team":
					await this.handleAssignTeam(db, ws, gameId, instructorId, event.studentId as string, event.teamId as string);
					break;
				case "enable-buzzer":
					await this.handleEnableBuzzer(db, ws, gameId, instructorId);
					break;
				case "buzzer":
					await this.handleBuzzer(db, ws, gameId, studentId);
					break;
				default:
					ws.send(JSON.stringify({ type: "error", message: "Unknown message type" }));
			}
		} catch (err) {
			console.error("[GameHub] Error handling message:", err);
			ws.send(JSON.stringify({ type: "error", message: "Internal error" }));
		}
	}

	async webSocketClose(ws: WebSocket, _code: number, _reason: string): Promise<void> {
		const [role, , , studentId] = this.state.getTags(ws);
		if (role === "student" && studentId) {
			this.broadcast({ type: "student-status", studentId, connected: false });
		}
	}

	async webSocketError(_ws: WebSocket, error: unknown): Promise<void> {
		console.error("[GameHub] WebSocket error:", error);
	}

	// ── Game action handlers ───────────────────────────────────────────────────

	private async handleStartGame(db: DB, ws: WebSocket, gameId: string, instructorId: string) {
		const game = await db.query.games.findFirst({ where: (g, { eq }) => eq(g.id, gameId) });
		if (!game || game.instructorId !== instructorId) {
			return ws.send(JSON.stringify({ type: "error", message: "Unauthorized" }));
		}
		if (game.status !== "LOBBY") {
			return ws.send(JSON.stringify({ type: "error", message: "Game is not in LOBBY status" }));
		}

		await db.update(games).set({ status: "IN_PROGRESS", updatedAt: new Date().toISOString() }).where(eq(games.id, gameId));
		this.broadcast({ type: "game-started", status: "IN_PROGRESS" });
	}

	private async handleEndGame(db: DB, ws: WebSocket, gameId: string, instructorId: string) {
		const game = await db.query.games.findFirst({ where: (g, { eq }) => eq(g.id, gameId) });
		if (!game || game.instructorId !== instructorId) {
			return ws.send(JSON.stringify({ type: "error", message: "Unauthorized" }));
		}

		await db.update(games).set({ status: "COMPLETED", updatedAt: new Date().toISOString() }).where(eq(games.id, gameId));

		const finalTeams = await db.query.teams.findMany({
			where: (t, { eq }) => eq(t.gameId, gameId),
			with: { students: true },
			orderBy: (t, { desc }) => [desc(t.score)]
		});

		this.broadcast({ type: "game-ended", status: "COMPLETED", finalScores: finalTeams });
	}

	private async handleRevealQuestion(db: DB, ws: WebSocket, gameId: string, instructorId: string, slotId: string) {
		if (!slotId) return ws.send(JSON.stringify({ type: "error", message: "Slot ID is required" }));

		const game = await db.query.games.findFirst({
			where: (g, { eq }) => eq(g.id, gameId),
			with: { gameState: true }
		});
		if (!game || game.instructorId !== instructorId) {
			return ws.send(JSON.stringify({ type: "error", message: "Unauthorized" }));
		}
		if (game.status !== "IN_PROGRESS") {
			return ws.send(JSON.stringify({ type: "error", message: "Game is not in progress" }));
		}

		const answered = JSON.parse(game.gameState?.answeredSlots ?? "[]") as string[];
		if (answered.includes(slotId)) {
			return ws.send(JSON.stringify({ type: "error", message: "Question already answered" }));
		}

		const slot = await db.query.boardQuestionSlots.findFirst({
			where: (s, { eq }) => eq(s.id, slotId),
			with: { question: true, category: { with: { board: true } } }
		});
		if (!slot || slot.category.board.id !== game.boardId) {
			return ws.send(JSON.stringify({ type: "error", message: "Slot not found" }));
		}

		const now = new Date().toISOString();
		const buzzerEnabled = !slot.isDailyDouble;

		await db.update(gameState).set({
			currentSlotId: slotId,
			questionStartedAt: now,
			buzzerEnabled,
			currentWager: null,
			currentTeamId: null,
			updatedAt: now
		}).where(eq(gameState.gameId, gameId));

		this.broadcast({ type: "question-revealed", slotId, currentSlot: slot, buzzerEnabled });
	}

	private async handleCloseQuestion(db: DB, ws: WebSocket, gameId: string, instructorId: string) {
		const game = await db.query.games.findFirst({ where: (g, { eq }) => eq(g.id, gameId) });
		if (!game || game.instructorId !== instructorId) {
			return ws.send(JSON.stringify({ type: "error", message: "Unauthorized" }));
		}

		const now = new Date().toISOString();
		await db.update(gameState).set({
			currentSlotId: null,
			currentTeamId: null,
			questionStartedAt: null,
			buzzerEnabled: false,
			currentWager: null,
			updatedAt: now
		}).where(eq(gameState.gameId, gameId));

		this.broadcast({ type: "question-closed" });
	}

	private async handleAnswer(db: DB, ws: WebSocket, gameId: string, instructorId: string, isCorrect: boolean, teamId: string) {
		const game = await db.query.games.findFirst({
			where: (g, { eq }) => eq(g.id, gameId),
			with: { gameState: true }
		});
		if (!game || game.instructorId !== instructorId) {
			return ws.send(JSON.stringify({ type: "error", message: "Unauthorized" }));
		}

		const currentSlotId = game.gameState?.currentSlotId;
		if (!currentSlotId) return ws.send(JSON.stringify({ type: "error", message: "No active question" }));

		const slot = await db.query.boardQuestionSlots.findFirst({
			where: (s, { eq }) => eq(s.id, currentSlotId)
		});
		if (!slot) return ws.send(JSON.stringify({ type: "error", message: "Slot not found" }));

		let points = slot.points;
		if (slot.isDailyDouble) {
			if (!game.gameState?.currentWager) {
				return ws.send(JSON.stringify({ type: "error", message: "No wager submitted for Daily Double" }));
			}
			points = game.gameState.currentWager;
		}
		const scoreChange = isCorrect ? points : -points;
		const now = new Date().toISOString();

		await db.update(teams)
			.set({ score: sql`${teams.score} + ${scoreChange}`, updatedAt: now })
			.where(eq(teams.id, teamId));

		const answered = JSON.parse(game.gameState?.answeredSlots ?? "[]") as string[];
		answered.push(currentSlotId);

		await db.update(gameState).set({
			answeredSlots: JSON.stringify(answered),
			currentSlotId: null,
			currentTeamId: null,
			questionStartedAt: null,
			buzzerEnabled: false,
			currentWager: null,
			updatedAt: now
		}).where(eq(gameState.gameId, gameId));

		const updatedTeams = await db.query.teams.findMany({
			where: (t, { eq }) => eq(t.gameId, gameId),
			with: { students: true }
		});

		this.broadcast({ type: "answer-submitted", teams: updatedTeams, answeredSlots: answered, currentSlotId: null });
	}

	private async handleSubmitWager(db: DB, ws: WebSocket, gameId: string, instructorId: string, teamId: string, wager: number) {
		if (!teamId || !wager || wager < 1) {
			return ws.send(JSON.stringify({ type: "error", message: "Invalid wager" }));
		}

		const game = await db.query.games.findFirst({
			where: (g, { eq }) => eq(g.id, gameId),
			with: { gameState: true }
		});
		if (!game || game.instructorId !== instructorId) {
			return ws.send(JSON.stringify({ type: "error", message: "Unauthorized" }));
		}
		if (game.status !== "IN_PROGRESS") {
			return ws.send(JSON.stringify({ type: "error", message: "Game is not in progress" }));
		}

		const currentSlotId = game.gameState?.currentSlotId;
		if (!currentSlotId) return ws.send(JSON.stringify({ type: "error", message: "No active question" }));

		const slot = await db.query.boardQuestionSlots.findFirst({
			where: (s, { eq }) => eq(s.id, currentSlotId),
			with: { question: true, category: { with: { board: true } } }
		});
		if (!slot?.isDailyDouble) {
			return ws.send(JSON.stringify({ type: "error", message: "Current question is not a Daily Double" }));
		}

		const team = await db.query.teams.findFirst({
			where: (t, { eq }) => eq(t.id, teamId)
		});
		if (!team) return ws.send(JSON.stringify({ type: "error", message: "Team not found" }));

		const now = new Date().toISOString();
		await db.update(gameState).set({
			currentWager: wager,
			currentTeamId: teamId,
			updatedAt: now
		}).where(eq(gameState.gameId, gameId));

		this.broadcast({ type: "wager-submitted", teamId, teamName: team.name, wager, currentSlot: slot });
	}

	private async handleBuzzer(db: DB, ws: WebSocket, gameId: string, studentId: string) {
		if (!studentId) return ws.send(JSON.stringify({ type: "error", message: "Student ID required" }));

		const game = await db.query.games.findFirst({
			where: (g, { eq }) => eq(g.id, gameId),
			with: { gameState: true }
		});
		if (!game || game.status !== "IN_PROGRESS") {
			return ws.send(JSON.stringify({ type: "error", message: "Game not in progress" }));
		}
		if (!game.gameState?.buzzerEnabled) {
			return ws.send(JSON.stringify({ type: "error", message: "Buzzer is not enabled" }));
		}

		const student = await db.query.students.findFirst({
			where: (s, { eq, and }) => and(eq(s.id, studentId), eq(s.gameId, gameId)),
			with: { team: true }
		});
		if (!student) return ws.send(JSON.stringify({ type: "error", message: "Student not found" }));

		const buzzerAt = new Date().toISOString();
		await db.update(students).set({ buzzerAt, updatedAt: buzzerAt }).where(eq(students.id, studentId));

		await db.update(gameState).set({ buzzerEnabled: false, updatedAt: buzzerAt }).where(eq(gameState.gameId, gameId));

		this.broadcast({
			type: "buzzer-pressed",
			studentId: student.id,
			studentName: student.name,
			teamId: student.teamId ?? "",
			teamName: student.team?.name ?? "",
			buzzerAt
		});
	}

	private async handleAssignTeam(db: DB, ws: WebSocket, gameId: string, instructorId: string, studentId: string, teamId: string) {
		const game = await db.query.games.findFirst({ where: (g, { eq }) => eq(g.id, gameId) });
		if (!game || game.instructorId !== instructorId) {
			return ws.send(JSON.stringify({ type: "error", message: "Unauthorized" }));
		}

		const now = new Date().toISOString();
		await db.update(students).set({ teamId, updatedAt: now }).where(eq(students.id, studentId));

		const updatedGame = await db.query.games.findFirst({
			where: (g, { eq }) => eq(g.id, gameId),
			with: {
				students: { with: { team: true } },
				teams: { with: { students: true } }
			}
		});

		this.broadcast({ type: "team-assigned", students: updatedGame?.students ?? [], teams: updatedGame?.teams ?? [] });
	}

	private async handleEnableBuzzer(db: DB, ws: WebSocket, gameId: string, instructorId: string) {
		const game = await db.query.games.findFirst({ where: (g, { eq }) => eq(g.id, gameId) });
		if (!game || game.instructorId !== instructorId) {
			return ws.send(JSON.stringify({ type: "error", message: "Unauthorized" }));
		}

		const now = new Date().toISOString();
		await db.update(gameState).set({ buzzerEnabled: true, updatedAt: now }).where(eq(gameState.gameId, gameId));
		this.broadcast({ type: "buzzer-enabled", enabled: true });
	}

	// ── Helpers ────────────────────────────────────────────────────────────────

	private broadcast(event: object): void {
		const message = JSON.stringify(event);
		for (const ws of this.state.getWebSockets()) {
			try {
				ws.send(message);
			} catch {
				// Client disconnected
			}
		}
	}
}
