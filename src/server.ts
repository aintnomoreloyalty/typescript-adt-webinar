import Fastify from 'fastify';
import { config } from 'dotenv';
import { handleUserRegistration } from './endpoints/user-registration';
import { handleCreateInvitation } from './endpoints/invitation-endpoints';

config();

const server = Fastify({
  logger: {
    level: 'info',
    transport: {
      target: 'pino-pretty',
    },
  },
});

server.get('/', async () => {
  return { hello: 'world' };
});

server.post('/api/user-registration', handleUserRegistration);
server.post('/api/invitations', handleCreateInvitation);

const start = async () => {
  try {
    const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
    await server.listen({ port });
    console.log(`Server listening on ${port}`);

  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
