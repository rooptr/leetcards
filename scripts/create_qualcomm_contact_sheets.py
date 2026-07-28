from __future__ import annotations

import argparse
import json
import textwrap
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageOps


CELL_WIDTH = 1200
CELL_HEIGHT = 1500
LABEL_HEIGHT = 120
GRID_COLUMNS = 2
GRID_ROWS = 2
SHEET_CAPACITY = GRID_COLUMNS * GRID_ROWS


def load_font(size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    candidates = [
        Path("C:/Windows/Fonts/segoeui.ttf"),
        Path("C:/Windows/Fonts/arial.ttf"),
    ]
    for candidate in candidates:
        if candidate.exists():
            return ImageFont.truetype(str(candidate), size)
    return ImageFont.load_default()


def media_items(manifest: dict[str, object]) -> list[dict[str, object]]:
    items: list[dict[str, object]] = []
    for file_record in manifest["files"]:
        for media in file_record["media"]:
            items.append(
                {
                    "owner": file_record["relativePath"],
                    "sourceName": media["sourceName"],
                    "path": media["extractedPath"],
                    "width": media.get("width"),
                    "height": media.get("height"),
                    "sha256": media["sha256"],
                }
            )
    return items


def render_cell(item: dict[str, object], index: int) -> Image.Image:
    cell = Image.new("RGB", (CELL_WIDTH, CELL_HEIGHT), "#f4f1e8")
    image_area = (CELL_WIDTH - 50, CELL_HEIGHT - LABEL_HEIGHT - 50)
    try:
        with Image.open(item["path"]) as source:
            image = ImageOps.exif_transpose(source).convert("RGB")
            image.thumbnail(image_area, Image.Resampling.LANCZOS)
            x = (CELL_WIDTH - image.width) // 2
            y = LABEL_HEIGHT + (CELL_HEIGHT - LABEL_HEIGHT - image.height) // 2
            cell.paste(image, (x, y))
    except Exception as error:
        draw = ImageDraw.Draw(cell)
        draw.text((30, LABEL_HEIGHT + 30), f"Could not render: {error}", fill="#9c2f24")

    draw = ImageDraw.Draw(cell)
    title_font = load_font(30)
    meta_font = load_font(24)
    owner = str(item["owner"])
    source_name = str(item["sourceName"])
    title = f"{index:02d}. {owner}"
    title_lines = textwrap.wrap(title, width=58)[:2]
    draw.multiline_text((24, 16), "\n".join(title_lines), font=title_font, fill="#171713", spacing=3)
    meta = f"{source_name} | {item.get('width')}x{item.get('height')}"
    draw.text((24, 88), meta[:92], font=meta_font, fill="#645f55")
    draw.rectangle((0, 0, CELL_WIDTH - 1, CELL_HEIGHT - 1), outline="#b9b3a5", width=2)
    return cell


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("manifest", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()

    manifest = json.loads(args.manifest.read_text(encoding="utf-8"))
    items = media_items(manifest)
    args.output.mkdir(parents=True, exist_ok=True)

    index_records: list[dict[str, object]] = []
    for sheet_offset in range(0, len(items), SHEET_CAPACITY):
        sheet_number = sheet_offset // SHEET_CAPACITY + 1
        sheet = Image.new(
            "RGB",
            (CELL_WIDTH * GRID_COLUMNS, CELL_HEIGHT * GRID_ROWS),
            "#e9e5da",
        )
        batch = items[sheet_offset : sheet_offset + SHEET_CAPACITY]
        for batch_index, item in enumerate(batch):
            absolute_index = sheet_offset + batch_index + 1
            cell = render_cell(item, absolute_index)
            x = (batch_index % GRID_COLUMNS) * CELL_WIDTH
            y = (batch_index // GRID_COLUMNS) * CELL_HEIGHT
            sheet.paste(cell, (x, y))
            index_records.append(
                {
                    "index": absolute_index,
                    "sheet": sheet_number,
                    **item,
                }
            )
        sheet.save(args.output / f"sheet-{sheet_number:02d}.jpg", quality=94, subsampling=0)

    (args.output / "index.json").write_text(
        json.dumps(index_records, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )
    print(f"Created {len(index_records)} indexed images across {(len(items) + 3) // 4} sheets")


if __name__ == "__main__":
    main()
