/**
 * No context column on this route. Parallel slots keep their last content
 * during client navigation unless the new URL matches a page in them, so
 * every app route without context has an explicit empty one.
 */
export default function NoContext() {
  return null;
}
