#!/usr/bin/env python3
"""
OmniTools AI - PDF to EPUB Ebook Converter
Author: OmniTools AI Team
"""

import os
import sys
import argparse

try:
    from pypdf import PdfReader
    from ebooklib import epub
except ImportError:
    print("[ERROR] Required libraries not found. Run:")
    print("pip install pypdf ebooklib")
    sys.exit(1)

def convert_pdf_to_epub(pdf_path, epub_path, title=None, author="OmniTools AI"):
    reader = PdfReader(pdf_path)
    book = epub.EpubBook()

    doc_title = title or os.path.splitext(os.path.basename(pdf_path))[0]
    book.set_identifier(f"omni-id-{os.path.basename(pdf_path)}")
    book.set_title(doc_title)
    book.set_language("en")
    book.add_author(author)

    chapters = []
    toc = []

    full_text_pages = []
    for idx, page in enumerate(reader.pages):
        text = page.extract_text() or ""
        full_text_pages.append(text)

    # Combine into chapters (e.g. every 5 pages or per page)
    for idx, text in enumerate(full_text_pages):
        c = epub.EpubHtml(title=f"Page {idx+1}", file_name=f"page_{idx+1}.xhtml", lang="en")
        paras = "".join([f"<p>{p.strip()}</p>" for p in text.split("\n\n") if p.strip()])
        c.content = f"<h2>Page {idx+1}</h2>{paras or '<p>[No extractable text]</p>'}"
        book.add_item(c)
        chapters.append(c)
        toc.append(c)

    book.toc = tuple(toc)
    book.add_item(epub.EpubNcx())
    book.add_item(epub.EpubNav())

    # CSS
    style = 'body { font-family: sans-serif; line-height: 1.6; padding: 5%; } h2 { color: #4f46e5; }'
    nav_css = epub.EpubItem(uid="style_nav", file_name="style/nav.css", media_type="text/css", content=style)
    book.add_item(nav_css)

    book.spine = ["nav"] + chapters
    epub.write_epub(epub_path, book, {})
    print(f"[✓] Successfully generated EPUB: '{epub_path}' with {len(chapters)} pages.")

def main():
    parser = argparse.ArgumentParser(description="Convert PDF documents to EPUB 3 ebook")
    parser.add_argument("-i", "--input", required=True, help="Input PDF file")
    parser.add_argument("-o", "--output", required=True, help="Output EPUB file")
    parser.add_argument("-t", "--title", help="Ebook title")
    args = parser.parse_args()

    convert_pdf_to_epub(args.input, args.output, args.title)

if __name__ == "__main__":
    main()
