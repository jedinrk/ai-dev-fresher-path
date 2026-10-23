import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { deleteUserByEmail, findUserByEmail, listUsers } from '../src/auth/users.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

try {
  process.loadEnvFile(path.join(__dirname, '../../.env'));
} catch {
  // no .env file; rely on the environment already having DB_PATH set
}

const [command, email] = process.argv.slice(2);

function printUsers(users) {
  if (users.length === 0) {
    console.log('No registered users.');
    return;
  }
  for (const user of users) {
    console.log(`${user.email}\t${user.name}\t${user.role}\t${user.created_at}`);
  }
}

switch (command) {
  case 'list': {
    printUsers(listUsers());
    break;
  }
  case 'reset-user': {
    if (!email) {
      console.error('Usage: npm run admin -- reset-user <email>');
      process.exit(1);
    }
    if (!findUserByEmail(email)) {
      console.error(`No registered user with email ${email}`);
      process.exit(1);
    }
    deleteUserByEmail(email);
    console.log(`Removed ${email}. They can now register again.`);
    break;
  }
  default: {
    console.error('Usage: npm run admin -- <list|reset-user> [email]');
    process.exit(1);
  }
}
