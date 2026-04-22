#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import re
import sys
import zipfile
from collections import Counter
from dataclasses import dataclass
from datetime import datetime, timedelta
from pathlib import Path
from typing import Iterable
from xml.etree import ElementTree as ET


NS = {"a": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
EXCEL_EPOCH = datetime(1899, 12, 30)

CATEGORY_MAP = {
    "Riv.Inc": "Rivelazione incendi",
    "Antincendio": "Antincendio",
    "Meccanico": "Meccanico",
    "Elettrico": "Elettrico",
    "TVCC": "TVCC",
}

FREQUENCY_MAP = {
    "TRI": 3,
    "SEM": 6,
    "ANN": 12,
}


@dataclass
class NormalizedAsset:
    legacy_id: str
    operational_code: str
    name: str
    category: str
    location_name: str
    brand: str | None
    model: str | None
    verification_frequency_code: str
    verification_frequency_days: int
    verification_frequency_months: int
    last_verification: str | None
    installation_date: str | None
    qr_url: str | None


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Read an asset XLSX file and generate a Supabase SQL import file."
    )
    parser.add_argument("xlsx_path", type=Path, help="Path to the source XLSX file")
    parser.add_argument(
        "--facility-name",
        default="Itelyum Arena",
        help="Facility name to attach imported locations to",
    )
    parser.add_argument(
        "--sql-output",
        type=Path,
        default=Path("import/generated_assets_import.sql"),
        help="Path of the generated SQL file",
    )
    parser.add_argument(
        "--json-output",
        type=Path,
        default=Path("import/generated_assets_preview.json"),
        help="Path of the generated JSON preview file",
    )
    return parser.parse_args()


def column_to_number(col: str) -> int:
    value = 0
    for ch in col:
        if ch.isalpha():
            value = value * 26 + (ord(ch.upper()) - 64)
    return value


def parse_shared_strings(archive: zipfile.ZipFile) -> list[str]:
    if "xl/sharedStrings.xml" not in archive.namelist():
        return []
    root = ET.fromstring(archive.read("xl/sharedStrings.xml"))
    values = []
    for si in root.findall("a:si", NS):
        text = "".join(t.text or "" for t in si.iterfind(".//a:t", NS))
        values.append(text)
    return values


def read_rows(xlsx_path: Path) -> list[list[str]]:
    with zipfile.ZipFile(xlsx_path) as archive:
        shared_strings = parse_shared_strings(archive)
        sheet = ET.fromstring(archive.read("xl/worksheets/sheet1.xml"))
        rows = []
        for row in sheet.findall(".//a:sheetData/a:row", NS):
            values: list[str] = []
            last_column = 0
            for cell in row.findall("a:c", NS):
                ref = cell.attrib.get("r", "A1")
                col_letters = re.match(r"[A-Z]+", ref)
                col_number = column_to_number(col_letters.group(0) if col_letters else "A")
                while last_column + 1 < col_number:
                    values.append("")
                    last_column += 1

                cell_type = cell.attrib.get("t")
                raw = cell.find("a:v", NS)
                value = ""
                if cell_type == "s" and raw is not None and raw.text is not None:
                    value = shared_strings[int(raw.text)]
                elif cell_type == "inlineStr":
                    inline = cell.find("a:is", NS)
                    value = "".join(t.text or "" for t in inline.iterfind(".//a:t", NS)) if inline is not None else ""
                elif raw is not None and raw.text is not None:
                    value = raw.text

                values.append(value)
                last_column = col_number
            rows.append(values)
        return rows


def excel_date_to_iso(raw_value: str) -> str | None:
    if not raw_value:
        return None
    raw_value = raw_value.strip()
    if not raw_value:
        return None
    if re.fullmatch(r"\d+(\.\d+)?", raw_value):
        serial = int(float(raw_value))
        return (EXCEL_EPOCH + timedelta(days=serial)).date().isoformat()
    for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%d-%m-%Y"):
        try:
            return datetime.strptime(raw_value, fmt).date().isoformat()
        except ValueError:
            continue
    return None


def normalize_row(row: dict[str, str]) -> NormalizedAsset:
    category_raw = row.get("Categoria", "").strip()
    frequency_raw = row.get("Frequenza", "").strip()
    frequency_days_raw = row.get("Giorni Freq.", "").strip()
    category = CATEGORY_MAP.get(category_raw, category_raw)
    if category not in CATEGORY_MAP.values():
        raise ValueError(f"Categoria non supportata: {category_raw!r}")
    if frequency_raw not in FREQUENCY_MAP:
        raise ValueError(f"Frequenza non supportata: {frequency_raw!r}")
    if not frequency_days_raw:
        raise ValueError(f"Giorni frequenza mancanti per asset {row.get('Codice Operativo', '').strip()!r}")

    operational_code = row.get("Codice Operativo", "").strip()
    legacy_id = row.get("ID Asset", "").strip()
    serial_source = operational_code or legacy_id
    verification_frequency_days = int(float(frequency_days_raw))

    return NormalizedAsset(
        legacy_id=legacy_id,
        operational_code=serial_source,
        name=row.get("Descrizione", "").strip(),
        category=category,
        location_name=row.get("Ubicazione", "").strip(),
        brand=row.get("Marca", "").strip() or None,
        model=row.get("Modello", "").strip() or None,
        verification_frequency_code=frequency_raw,
        verification_frequency_days=verification_frequency_days,
        verification_frequency_months=FREQUENCY_MAP[frequency_raw],
        last_verification=excel_date_to_iso(row.get("Ultima Verifica", "")),
        installation_date=None,
        qr_url=row.get("URL QR", "").strip() or None,
    )


def sql_literal(value: str | None) -> str:
    if value is None:
        return "NULL"
    return "'" + value.replace("'", "''") + "'"


def array_literal(values: Iterable[str]) -> str:
    clean_values = [v for v in values if v]
    if not clean_values:
        return "ARRAY[]::text[]"
    return "ARRAY[" + ", ".join(sql_literal(v) for v in clean_values) + "]"


def generate_sql(assets: list[NormalizedAsset], facility_name: str) -> str:
    location_names = sorted({asset.location_name for asset in assets if asset.location_name})

    lines = [
        "-- Generated by scripts/prepare_asset_import.py",
        "-- Review on a staging project first if possible.",
        "BEGIN;",
        "",
        f"INSERT INTO facilities (name, address)",
        f"SELECT {sql_literal(facility_name)}, NULL",
        f"WHERE NOT EXISTS (SELECT 1 FROM facilities WHERE name = {sql_literal(facility_name)});",
        "",
    ]

    for location_name in location_names:
        lines.extend(
            [
                "INSERT INTO locations (facility_id, parent_id, name, description, qr_code_id)",
                "SELECT f.id, NULL, "
                f"{sql_literal(location_name)}, NULL, {sql_literal(location_name)}",
                "FROM facilities f",
                f"WHERE f.name = {sql_literal(facility_name)}",
                "AND NOT EXISTS (",
                "  SELECT 1",
                "  FROM locations l",
                "  WHERE l.facility_id = f.id",
                f"    AND l.name = {sql_literal(location_name)}",
                ");",
                "",
            ]
        )

    for asset in assets:
        lines.extend(
            [
                "UPDATE assets a",
                "SET location_id = l.id,",
                f"    name = {sql_literal(asset.name)},",
                f"    category = {sql_literal(asset.category)},",
                f"    brand = {sql_literal(asset.brand)},",
                f"    model = {sql_literal(asset.model)},",
                f"    installation_date = {sql_literal(asset.installation_date)},",
                f"    last_verification = COALESCE({sql_literal(asset.last_verification)}, a.last_verification),",
                f"    verification_frequency_code = {sql_literal(asset.verification_frequency_code)},",
                f"    verification_frequency_days = {asset.verification_frequency_days},",
                f"    verification_frequency_months = {asset.verification_frequency_months},",
                f"    documents = {array_literal([asset.qr_url or '', f'legacy-id:{asset.legacy_id}' if asset.legacy_id else ''])},",
                "    updated_at = NOW()",
                "FROM locations l",
                "JOIN facilities f ON f.id = l.facility_id",
                f"WHERE a.serial_number = {sql_literal(asset.operational_code)}",
                f"  AND f.name = {sql_literal(facility_name)}",
                f"  AND l.name = {sql_literal(asset.location_name)};",
                "",
                "INSERT INTO assets (",
                "  location_id, name, category, brand, model, serial_number, installation_date,",
                "  last_verification, verification_frequency_code, verification_frequency_days,",
                "  verification_frequency_months, documents, updated_at",
                ")",
                "SELECT",
                "  l.id,",
                f"  {sql_literal(asset.name)},",
                f"  {sql_literal(asset.category)},",
                f"  {sql_literal(asset.brand)},",
                f"  {sql_literal(asset.model)},",
                f"  {sql_literal(asset.operational_code)},",
                f"  {sql_literal(asset.installation_date)},",
                f"  {sql_literal(asset.last_verification)},",
                f"  {sql_literal(asset.verification_frequency_code)},",
                f"  {asset.verification_frequency_days},",
                f"  {asset.verification_frequency_months},",
                f"  {array_literal([asset.qr_url or '', f'legacy-id:{asset.legacy_id}' if asset.legacy_id else ''])},",
                "  NOW()",
                "FROM locations l",
                "JOIN facilities f ON f.id = l.facility_id",
                f"WHERE f.name = {sql_literal(facility_name)}",
                f"  AND l.name = {sql_literal(asset.location_name)}",
                "  AND NOT EXISTS (",
                "    SELECT 1",
                "    FROM assets a",
                f"    WHERE a.serial_number = {sql_literal(asset.operational_code)}",
                "  );",
                "",
            ]
        )

    lines.extend(["COMMIT;", ""])
    return "\n".join(lines)


def build_preview(assets: list[NormalizedAsset], source_file: Path, facility_name: str) -> dict:
    return {
        "source_file": str(source_file),
        "facility_name": facility_name,
        "total_assets": len(assets),
        "total_locations": len({asset.location_name for asset in assets}),
        "categories": Counter(asset.category for asset in assets),
        "frequencies_in_months": Counter(asset.verification_frequency_months for asset in assets),
        "frequencies_in_days": Counter(asset.verification_frequency_days for asset in assets),
        "sample_assets": [
            {
                "legacy_id": asset.legacy_id,
                "serial_number": asset.operational_code,
                "name": asset.name,
                "category": asset.category,
                "location_name": asset.location_name,
                "verification_frequency_code": asset.verification_frequency_code,
                "verification_frequency_days": asset.verification_frequency_days,
                "last_verification": asset.last_verification,
                "qr_url": asset.qr_url,
            }
            for asset in assets[:10]
        ],
    }


def main() -> int:
    args = parse_args()
    rows = read_rows(args.xlsx_path)
    if not rows:
        raise SystemExit("Il file Excel non contiene righe.")

    header = rows[0]
    data_rows = [row for row in rows[1:] if any(str(cell).strip() for cell in row)]
    mapped_rows = [
        dict(zip(header, row + [""] * (len(header) - len(row))))
        for row in data_rows
    ]

    assets = [normalize_row(row) for row in mapped_rows]

    args.sql_output.parent.mkdir(parents=True, exist_ok=True)
    args.json_output.parent.mkdir(parents=True, exist_ok=True)
    args.sql_output.write_text(generate_sql(assets, args.facility_name), encoding="utf-8")
    args.json_output.write_text(
        json.dumps(build_preview(assets, args.xlsx_path, args.facility_name), indent=2, ensure_ascii=True),
        encoding="utf-8",
    )

    print(f"SQL scritto in: {args.sql_output}")
    print(f"Preview scritta in: {args.json_output}")
    print(f"Asset pronti all'import: {len(assets)}")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"Errore: {exc}", file=sys.stderr)
        raise
