import pdf from "pdf-parse";

export interface PdfPage {
  pageNumber: number;
  text: string;
}

export interface ParsedPdf {
  text: string;
  pages: PdfPage[];
}

export async function parsePdf(buffer: Buffer): Promise<ParsedPdf> {
  const data = await pdf(buffer);

  const pages: PdfPage[] = [];
  const pageTexts = data.text.split(/\f/);

  pageTexts.forEach((pageText, index) => {
    const trimmed = pageText.trim();
    if (trimmed) {
      pages.push({
        pageNumber: index + 1,
        text: trimmed,
      });
    }
  });

  if (pages.length === 0 && data.text.trim()) {
    pages.push({ pageNumber: 1, text: data.text.trim() });
  }

  return {
    text: data.text.trim(),
    pages,
  };
}
