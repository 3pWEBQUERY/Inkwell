import { sql } from 'drizzle-orm';

import { newId } from '../../lib/ids.js';
import { createDatabase } from '../client.js';
import { rooms } from '../schema.js';

import { ROOM_SEEDS } from './rooms.js';

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is required');

const { db, close } = createDatabase(url);

try {
  await db
    .insert(rooms)
    .values(
      ROOM_SEEDS.map((room, position) => ({
        id: newId(),
        slug: room.slug,
        kind: room.kind,
        locale: room.locale,
        name: room.name,
        description: room.description,
        rules: room.rules,
        sortDefault: room.sortDefault ?? 'new',
        position,
        showHelplines: room.showHelplines ?? false,
      })),
    )
    .onConflictDoUpdate({
      target: rooms.slug,
      set: {
        name: sql`excluded.name`,
        description: sql`excluded.description`,
        rules: sql`excluded.rules`,
        sortDefault: sql`excluded.sort_default`,
        position: sql`excluded.position`,
        showHelplines: sql`excluded.show_helplines`,
      },
    });
  console.warn(`seeded ${ROOM_SEEDS.length} rooms`);
} finally {
  await close();
}
