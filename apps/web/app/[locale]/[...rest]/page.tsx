import { notFound } from 'next/navigation';

/** Any path that no route matched inside a valid locale renders the localised 404. */
export default function CatchAll() {
  notFound();
}
