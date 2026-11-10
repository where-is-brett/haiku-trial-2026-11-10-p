// src/lib/multipart.js

const CRLF = Buffer.from('\r\n');
const DASHES = Buffer.from('--');
const HEADER_END = Buffer.from('\r\n\r\n');

// Reads the `statement` part of a multipart/form-data body as UTF-8 text.
// Returns null when there is no such part, when the Content-Type has no boundary,
// or when the body is malformed. Never throws.
export function readStatementPart(contentType, body) {
  try {
    const boundary = boundaryOf(contentType);
    if (boundary === null) return null;
    const delimiter = Buffer.from(`--${boundary}`);
    // The CRLF before a delimiter belongs to the delimiter, so it is not part of the content.
    const nextDelimiter = Buffer.concat([CRLF, delimiter]);
    let at = body.indexOf(delimiter);
    while (at !== -1) {
      const afterDelimiter = at + delimiter.length;
      const tail = body.subarray(afterDelimiter, afterDelimiter + 2);
      if (tail.equals(DASHES)) return null; // closing delimiter: every part has been read
      if (!tail.equals(CRLF)) return null;
      const partStart = afterDelimiter + 2;
      const partEnd = body.indexOf(nextDelimiter, partStart);
      if (partEnd === -1) return null;
      const part = body.subarray(partStart, partEnd);
      const headerEnd = part.indexOf(HEADER_END);
      if (headerEnd === -1) return null;
      const headers = part.subarray(0, headerEnd).toString('utf8');
      if (nameOf(headers) === 'statement') {
        return part.subarray(headerEnd + HEADER_END.length).toString('utf8');
      }
      at = partEnd + CRLF.length;
    }
    return null;
  } catch {
    return null;
  }
}

// The boundary parameter of a multipart Content-Type, quoted or not. Null when absent.
function boundaryOf(contentType) {
  if (typeof contentType !== 'string' || !/^\s*multipart\//i.test(contentType)) return null;
  const match = /;\s*boundary=(?:"([^"]+)"|([^;\s]+))/i.exec(contentType);
  return match ? (match[1] ?? match[2]) : null;
}

// The `name` parameter of the Content-Disposition header in a part's header block. Null when absent.
function nameOf(headers) {
  const disposition = /^content-disposition:(.*)$/im.exec(headers);
  if (!disposition) return null;
  const match = /;\s*name=(?:"([^"]*)"|([^;\s]+))/i.exec(disposition[1]);
  return match ? (match[1] ?? match[2]) : null;
}
