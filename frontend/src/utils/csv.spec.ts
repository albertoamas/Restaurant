import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock DOM APIs that aren't available in jsdom by default for this flow
const clickMock = vi.fn();
const appendChildMock = vi.fn();
const removeChildMock = vi.fn();
const createObjectURLMock = vi.fn(() => 'blob:mock-url');
const revokeObjectURLMock = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();

  vi.spyOn(document, 'createElement').mockReturnValue({
    href: '',
    download: '',
    style: { display: '' },
    click: clickMock,
  } as unknown as HTMLAnchorElement);
  vi.spyOn(document.body, 'appendChild').mockImplementation(appendChildMock);
  vi.spyOn(document.body, 'removeChild').mockImplementation(removeChildMock);
  URL.createObjectURL = createObjectURLMock;
  URL.revokeObjectURL = revokeObjectURLMock;
});

// We test buildCsv indirectly through downloadCsv by capturing the Blob content
async function captureBlob(fn: () => void): Promise<string> {
  let capturedBlob: Blob | undefined;
  const OrigBlob = global.Blob;
  global.Blob = class extends OrigBlob {
    constructor(parts: BlobPart[], opts?: BlobPropertyBag) {
      super(parts, opts);
      capturedBlob = new OrigBlob(parts, opts);
    }
  } as typeof Blob;
  fn();
  global.Blob = OrigBlob;
  return capturedBlob ? capturedBlob.text() : '';
}

import { downloadCsv } from './csv';

describe('downloadCsv', () => {
  it('genera encabezados y filas correctamente', async () => {
    const content = await captureBlob(() =>
      downloadCsv('test.csv', [{
        headers: ['Nombre', 'Precio'],
        rows: [['Café', '15'], ['Té', '10']],
      }]),
    );
    expect(content).toContain('Nombre,Precio');
    expect(content).toContain('Café,15');
    expect(content).toContain('Té,10');
  });

  it('incluye BOM al inicio para compatibilidad con Excel', () => {
    // Capturamos los argumentos del constructor de Blob directamente para verificar el BOM,
    // ya que jsdom no preserva ﻿ al leer el Blob via .text()
    let blobParts: BlobPart[] | undefined;
    const OrigBlob = global.Blob;
    global.Blob = class extends OrigBlob {
      constructor(parts: BlobPart[], opts?: BlobPropertyBag) {
        super(parts, opts);
        blobParts = parts;
      }
    } as typeof Blob;
    downloadCsv('test.csv', [{ headers: ['A'], rows: [['1']] }]);
    global.Blob = OrigBlob;
    expect(String(blobParts?.[0])).toMatch(/^﻿/);
  });

  it('escapa valores con comas envolviéndolos en comillas', async () => {
    const content = await captureBlob(() =>
      downloadCsv('test.csv', [{
        headers: ['Campo'],
        rows: [['valor, con coma']],
      }]),
    );
    expect(content).toContain('"valor, con coma"');
  });

  it('escapa comillas dobles duplicándolas (estándar CSV)', async () => {
    const content = await captureBlob(() =>
      downloadCsv('test.csv', [{
        headers: ['Campo'],
        rows: [['dijo "hola"']],
      }]),
    );
    expect(content).toContain('"dijo ""hola"""');
  });

  it('incluye el título de sección cuando se proporciona', async () => {
    const content = await captureBlob(() =>
      downloadCsv('test.csv', [{
        title: 'Mi sección',
        headers: ['Col'],
        rows: [],
      }]),
    );
    expect(content).toContain('Mi sección');
  });

  it('dispara el click en el enlace para descargar', () => {
    downloadCsv('test.csv', [{ headers: ['A'], rows: [] }]);
    expect(clickMock).toHaveBeenCalledOnce();
  });
});
