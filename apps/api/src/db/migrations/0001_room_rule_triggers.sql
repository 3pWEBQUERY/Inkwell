-- Room rules are enforced in the database as well, so no code path can bypass them.

-- Votes exist only in fiction rooms.
CREATE OR REPLACE FUNCTION enforce_vote_room_kind() RETURNS trigger AS $$
DECLARE
  room_kind room_kind;
BEGIN
  SELECT r.kind INTO room_kind
  FROM posts p
  JOIN rooms r ON r.id = p.room_id
  WHERE p.id = NEW.post_id;

  IF room_kind IS DISTINCT FROM 'fiction' THEN
    RAISE EXCEPTION 'VOTING_DISABLED_IN_ROOM' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS votes_room_kind ON votes;
CREATE TRIGGER votes_room_kind
  BEFORE INSERT OR UPDATE ON votes
  FOR EACH ROW EXECUTE FUNCTION enforce_vote_room_kind();

-- Anonymous texts are not allowed in fiction rooms; private texts carry no room.
CREATE OR REPLACE FUNCTION enforce_post_room_rules() RETURNS trigger AS $$
DECLARE
  room_kind room_kind;
BEGIN
  IF NEW.visibility = 'private' THEN
    IF NEW.room_id IS NOT NULL OR NEW.body IS NOT NULL THEN
      RAISE EXCEPTION 'PLAINTEXT_NOT_ALLOWED' USING ERRCODE = 'check_violation';
    END IF;
    RETURN NEW;
  END IF;

  IF NEW.room_id IS NULL THEN
    RAISE EXCEPTION 'ROOM_REQUIRED' USING ERRCODE = 'check_violation';
  END IF;

  SELECT kind INTO room_kind FROM rooms WHERE id = NEW.room_id;
  IF room_kind = 'fiction' AND NEW.visibility = 'anonymous' THEN
    RAISE EXCEPTION 'ANON_NOT_ALLOWED_IN_ROOM' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS posts_room_rules ON posts;
CREATE TRIGGER posts_room_rules
  BEFORE INSERT OR UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION enforce_post_room_rules();

-- Partial index for the hot path: visible texts in a room, newest first.
CREATE INDEX IF NOT EXISTS posts_room_visible_idx
  ON posts (room_id, created_at DESC, id DESC)
  WHERE status = 'visible' AND deleted_at IS NULL;

-- Expiry sweep only ever looks at visible texts with a deadline.
CREATE INDEX IF NOT EXISTS posts_expiry_sweep_idx
  ON posts (expires_at)
  WHERE status = 'visible' AND expires_at IS NOT NULL;
