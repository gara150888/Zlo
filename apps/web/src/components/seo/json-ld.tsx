/**
 * Renders schema.org JSON-LD structured data.
 *
 * `JSON.stringify` output is escaped so no value can terminate the
 * script element early or break out of the string literal — structured
 * data must never become an XSS vector.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  const json = JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
