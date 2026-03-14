export { GameHub } from './lib/server/game-hub';

export default {
	fetch(): Response {
		return new Response('Not found', { status: 404 });
	}
};
