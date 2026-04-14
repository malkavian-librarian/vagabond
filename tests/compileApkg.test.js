// @vitest-environment node
import { POST } from '../src/app/api/compile-apkg/route';
import { describe, it, expect, vi } from 'vitest';

vi.mock('anki-apkg-export', () => {
  return {
    default: class MockExporter {
      addMedia() {}
      addCard() {}
      save() { return Promise.resolve(Buffer.from('zipcontent')) }
    }
  };
});

describe('compile-apkg API', () => {
  it('should return CORS headers on OPTIONS', async () => {
    const res = await import('../src/app/api/compile-apkg/route').then(m => m.OPTIONS());
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
  });

  it('should return 400 if cards are missing', async () => {
    const req = { json: async () => ({ topic: 'Test' }) };
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('should return 400 if cards is not an array', async () => {
    const req = { json: async () => ({ topic: 'Test', cards: "invalid" }) };
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('should generate a zip file if cards are provided', async () => {
    const req = { 
      json: async () => ({ 
        topic: 'Test', 
        cards: [
          { native: 'Hola', target: 'Hello', imageBase64: 'abc', audioBase64: '123', subtopic: 'Greeting' },
          { native: 'Adios', target: 'Bye' } // test branch without media
        ] 
      }) 
    };
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('application/vnd.anki');
    
    // Check if body is buffer or readable stream depending on NextResponse
  });

  it('should return 500 on internal failure', async () => {
    const req = {
      json: async () => { throw new Error('parse error') }
    };
    const res = await POST(req);
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('parse error');
  });
});
