from __future__ import annotations

import argparse
import hashlib
import json
import re
import shutil
import zipfile
from pathlib import Path
from xml.etree import ElementTree

from PIL import Image
from pypdf import PdfReader


IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".bmp", ".gif", ".tif", ".tiff", ".webp"}
SUPPORTED_EXTENSIONS = {".docx", ".odt", ".pdf", ".c"} | IMAGE_EXTENSIONS
WORD_TEXT_TAG = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}t"
WORD_PARAGRAPH_TAG = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}p"
ODT_TEXT_NAMESPACE = "urn:oasis:names:tc:opendocument:xmlns:text:1.0"


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def safe_stem(relative_path: Path) -> str:
    value = "__".join(relative_path.parts)
    return re.sub(r"[^A-Za-z0-9._-]+", "_", value).strip("_")


def normalize_text(value: str) -> str:
    value = value.replace("\r\n", "\n").replace("\r", "\n")
    value = re.sub(r"[ \t]+\n", "\n", value)
    value = re.sub(r"\n{3,}", "\n\n", value)
    return value.strip()


def extract_docx(path: Path, media_dir: Path) -> tuple[str, list[dict[str, object]]]:
    text_blocks: list[str] = []
    media: list[dict[str, object]] = []
    with zipfile.ZipFile(path) as archive:
        xml = ElementTree.fromstring(archive.read("word/document.xml"))
        for paragraph in xml.iter(WORD_PARAGRAPH_TAG):
            text = "".join(node.text or "" for node in paragraph.iter(WORD_TEXT_TAG)).strip()
            if text:
                text_blocks.append(text)

        for member in sorted(name for name in archive.namelist() if name.startswith("word/media/")):
            target = media_dir / Path(member).name
            with archive.open(member) as source, target.open("wb") as destination:
                shutil.copyfileobj(source, destination)
            media.append(image_record(target, member))
    return normalize_text("\n".join(text_blocks)), media


def extract_odt(path: Path, media_dir: Path) -> tuple[str, list[dict[str, object]]]:
    text_blocks: list[str] = []
    media: list[dict[str, object]] = []
    with zipfile.ZipFile(path) as archive:
        xml = ElementTree.fromstring(archive.read("content.xml"))
        paragraph_tags = {
            f"{{{ODT_TEXT_NAMESPACE}}}p",
            f"{{{ODT_TEXT_NAMESPACE}}}h",
        }
        for node in xml.iter():
            if node.tag in paragraph_tags:
                text = "".join(node.itertext()).strip()
                if text:
                    text_blocks.append(text)

        for member in sorted(name for name in archive.namelist() if name.startswith("Pictures/")):
            target = media_dir / Path(member).name
            with archive.open(member) as source, target.open("wb") as destination:
                shutil.copyfileobj(source, destination)
            media.append(image_record(target, member))
    return normalize_text("\n".join(text_blocks)), media


def extract_pdf(path: Path, media_dir: Path) -> tuple[str, list[dict[str, object]], int]:
    reader = PdfReader(str(path))
    pages: list[str] = []
    media: list[dict[str, object]] = []
    for page_index, page in enumerate(reader.pages, start=1):
        pages.append(f"[Page {page_index}]\n{page.extract_text() or ''}")
        try:
            images = list(page.images)
        except Exception:
            images = []
        for image_index, image in enumerate(images, start=1):
            suffix = Path(image.name).suffix or ".bin"
            target = media_dir / f"page-{page_index:03d}-image-{image_index:03d}{suffix}"
            target.write_bytes(image.data)
            media.append(image_record(target, f"page {page_index}: {image.name}"))
    return normalize_text("\n\n".join(pages)), media, len(reader.pages)


def image_record(path: Path, source_name: str) -> dict[str, object]:
    record: dict[str, object] = {
        "sourceName": source_name,
        "extractedPath": str(path.resolve()),
        "sha256": sha256(path),
        "bytes": path.stat().st_size,
    }
    try:
        with Image.open(path) as image:
            record.update(
                {
                    "width": image.width,
                    "height": image.height,
                    "mode": image.mode,
                    "format": image.format,
                }
            )
    except Exception as error:
        record["imageError"] = str(error)
    return record


def write_text(path: Path, value: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(value, encoding="utf-8")


def extract_file(path: Path, root: Path, output_root: Path) -> dict[str, object]:
    relative = path.relative_to(root)
    extension = path.suffix.lower()
    key = safe_stem(relative)
    media_dir = output_root / "media" / key
    media_dir.mkdir(parents=True, exist_ok=True)
    text = ""
    media: list[dict[str, object]] = []
    page_count: int | None = None
    extraction_error: str | None = None

    try:
        if extension == ".docx":
            text, media = extract_docx(path, media_dir)
        elif extension == ".odt":
            text, media = extract_odt(path, media_dir)
        elif extension == ".pdf":
            text, media, page_count = extract_pdf(path, media_dir)
        elif extension == ".c":
            text = path.read_text(encoding="utf-8", errors="replace")
        elif extension in IMAGE_EXTENSIONS:
            media = [image_record(path, relative.as_posix())]
        else:
            extraction_error = f"Unsupported extension: {extension or '<none>'}"
    except Exception as error:
        extraction_error = f"{type(error).__name__}: {error}"

    if text:
        write_text(output_root / "text" / f"{key}.txt", text)

    if not any(media_dir.iterdir()):
        media_dir.rmdir()

    return {
        "relativePath": relative.as_posix(),
        "absolutePath": str(path.resolve()),
        "extension": extension,
        "bytes": path.stat().st_size,
        "sha256": sha256(path),
        "textCharacters": len(text),
        "textLines": len(text.splitlines()) if text else 0,
        "textPath": str((output_root / "text" / f"{key}.txt").resolve()) if text else None,
        "pageCount": page_count,
        "embeddedMediaCount": len(media),
        "media": media,
        "extractionError": extraction_error,
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("source", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()

    source = args.source.resolve()
    output = args.output.resolve()
    if not source.is_dir():
        raise SystemExit(f"Source directory does not exist: {source}")
    if output.exists():
        shutil.rmtree(output)
    output.mkdir(parents=True)

    paths = sorted(path for path in source.rglob("*") if path.is_file())
    records = [extract_file(path, source, output) for path in paths]
    hashes: dict[str, list[str]] = {}
    for record in records:
        hashes.setdefault(str(record["sha256"]), []).append(str(record["relativePath"]))

    manifest = {
        "sourceRoot": str(source),
        "fileCount": len(records),
        "supportedFileCount": sum(record["extension"] in SUPPORTED_EXTENSIONS for record in records),
        "filesWithExtractedText": sum(bool(record["textCharacters"]) for record in records),
        "filesWithVisualMedia": sum(bool(record["media"]) for record in records),
        "embeddedOrStandaloneMediaCount": sum(int(record["embeddedMediaCount"]) for record in records),
        "extractionErrorCount": sum(bool(record["extractionError"]) for record in records),
        "duplicateGroups": [paths for paths in hashes.values() if len(paths) > 1],
        "files": records,
    }
    (output / "manifest.json").write_text(
        json.dumps(manifest, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )
    print(json.dumps({key: value for key, value in manifest.items() if key != "files"}, indent=2))


if __name__ == "__main__":
    main()
