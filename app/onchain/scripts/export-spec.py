#!/usr/bin/env python3
"""Export machine-readable JSON contract specification artifacts from Rust source.

Reads Soroban contract source files in app/onchain/contracts/ to extract
enums, structs, errors, events, and function signatures. Outputs a clean,
deterministic JSON contract specification artifact for each contract.

Usage:
    python scripts/export-spec.py [--project-dir DIR] [--output-dir DIR]
"""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path


def parse_cargo_toml(cargo_path: Path) -> tuple[str, str]:
    text = cargo_path.read_text(encoding="utf-8")
    name_match = re.search(r'^name\s*=\s*"([^"]+)"', text, re.MULTILINE)
    version_match = re.search(r'^version\s*=\s*"([^"]+)"', text, re.MULTILINE)
    if not name_match or not version_match:
        raise ValueError(f"Cannot parse name/version from {cargo_path}")
    return name_match.group(1), version_match.group(1)


def parse_enums(code: str) -> dict[str, dict]:
    enums: dict[str, dict] = {}

    pattern = re.compile(
        r'(?:#\[(?:contracttype|contracterror)\][\s\S]*?)?'
        r'pub\s+enum\s+(\w+)\s*\{([^}]+)\}',
        re.MULTILINE,
    )

    for match in pattern.finditer(code):
        enum_name = match.group(1)
        body = match.group(2)

        variants = []
        for line in body.splitlines():
            line = line.strip()
            if not line or line.startswith("//") or line.startswith("///") or line.startswith("#"):
                continue
            var_match = re.match(r'^(\w+)(?:\s*=\s*(\d+))?,?', line)
            if var_match:
                name = var_match.group(1)
                value = int(var_match.group(2)) if var_match.group(2) is not None else None
                variants.append({"name": name, "value": value})

        if variants:
            enums[enum_name] = {
                "name": enum_name,
                "variants": sorted(variants, key=lambda v: (v["value"] if v["value"] is not None else 0, v["name"])),
            }

    return enums


def parse_structs(code: str) -> dict[str, dict]:
    structs: dict[str, dict] = {}

    pattern = re.compile(
        r'pub\s+struct\s+(\w+)\s*\{([^}]+)\}',
        re.MULTILINE,
    )

    for match in pattern.finditer(code):
        struct_name = match.group(1)
        if struct_name in ("AidEscrow", "AidEscrowContract"):
            continue
        body = match.group(2)

        fields = []
        for line in body.splitlines():
            line = line.strip()
            if not line or line.startswith("//") or line.startswith("///") or line.startswith("#"):
                continue
            line = line.split("//")[0].strip()
            if line.endswith(","):
                line = line[:-1].strip()
            field_match = re.match(r'^pub\s+(\w+)\s*:\s*(.+)$', line)
            if field_match:
                fname = field_match.group(1)
                ftype = field_match.group(2).strip()
                fields.append({"name": fname, "type": ftype})

        if fields:
            structs[struct_name] = {
                "name": struct_name,
                "fields": fields,
            }

    return structs


def parse_events(code: str) -> dict[str, dict]:
    events: dict[str, dict] = {}

    pattern = re.compile(
        r'#\[contractevent\]\s*pub\s+struct\s+(\w+)\s*\{([^}]+)\}',
        re.MULTILINE,
    )

    for match in pattern.finditer(code):
        event_name = match.group(1)
        body = match.group(2)

        fields = []
        for line in body.splitlines():
            line = line.strip()
            if not line or line.startswith("//") or line.startswith("///") or line.startswith("#"):
                continue
            line = line.split("//")[0].strip()
            if line.endswith(","):
                line = line[:-1].strip()
            field_match = re.match(r'^pub\s+(\w+)\s*:\s*(.+)$', line)
            if field_match:
                fname = field_match.group(1)
                ftype = field_match.group(2).strip()
                fields.append({"name": fname, "type": ftype})

        events[event_name] = {
            "name": event_name,
            "fields": fields,
        }

    return events


def parse_functions(code: str) -> dict[str, dict]:
    functions: dict[str, dict] = {}

    pattern = re.compile(r'pub\s+fn\s+(\w+)\s*\(', re.MULTILINE)

    for match in pattern.finditer(code):
        fn_name = match.group(1)
        start_idx = match.end()

        depth = 1
        i = start_idx
        while i < len(code) and depth > 0:
            if code[i] == '(':
                depth += 1
            elif code[i] == ')':
                depth -= 1
            i += 1

        if depth != 0:
            continue

        params_str = code[start_idx : i - 1].strip()
        remaining = code[i:].strip()

        ret_str = "()"
        if remaining.startswith("->"):
            after_arrow = remaining[2:].strip()
            depth_angle = 0
            depth_paren = 0
            end_ret = 0
            for idx, ch in enumerate(after_arrow):
                if ch == '<':
                    depth_angle += 1
                elif ch == '>':
                    depth_angle -= 1
                elif ch == '(':
                    depth_paren += 1
                elif ch == ')':
                    depth_paren -= 1
                elif ch == '{' and depth_angle == 0 and depth_paren == 0:
                    end_ret = idx
                    break
            if end_ret > 0:
                ret_str = after_arrow[:end_ret].strip()

        params = []
        if params_str:
            raw_params = []
            depth = 0
            current = []
            for char in params_str:
                if char in "<(":
                    depth += 1
                elif char in ">)":
                    depth -= 1
                if char == "," and depth == 0:
                    raw_params.append("".join(current).strip())
                    current = []
                else:
                    current.append(char)
            if current:
                raw_params.append("".join(current).strip())

            for p in raw_params:
                p = p.strip()
                if not p or p.startswith("//"):
                    continue
                parts = p.split(":", 1)
                if len(parts) == 2:
                    pname = parts[0].strip()
                    ptype = parts[1].strip()
                    params.append({"name": pname, "type": ptype})

        functions[fn_name] = {
            "name": fn_name,
            "parameters": params,
            "return_type": ret_str,
        }

    return functions


def extract_contract_spec(contract_dir: Path) -> dict:
    cargo_path = contract_dir / "Cargo.toml"
    name, version = parse_cargo_toml(cargo_path)

    all_code = []
    src_dir = contract_dir / "src"
    if src_dir.is_dir():
        for rs_file in sorted(src_dir.glob("*.rs")):
            all_code.append(rs_file.read_text(encoding="utf-8"))

    combined_code = "\n".join(all_code)

    enums = parse_enums(combined_code)
    structs = parse_structs(combined_code)
    events = parse_events(combined_code)
    functions = parse_functions(combined_code)

    errors = {}
    if "Error" in enums:
        errors = enums.pop("Error")

    return {
        "$schema": "https://soter.io/schemas/contract-spec.v1.json",
        "name": name,
        "version": version,
        "enums": dict(sorted(enums.items())),
        "structs": dict(sorted(structs.items())),
        "errors": errors,
        "events": dict(sorted(events.items())),
        "functions": dict(sorted(functions.items())),
    }


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Export Soroban contract specifications to machine-readable JSON artifacts",
    )
    parser.add_argument(
        "--project-dir",
        default=str(Path(__file__).resolve().parent.parent),
        help="Root directory of onchain project",
    )
    parser.add_argument(
        "--output-dir",
        default=None,
        help="Directory to save spec artifacts (default: inside contract root)",
    )
    args = parser.parse_args()

    project_dir = Path(args.project_dir).resolve()
    contracts_dir = project_dir / "contracts"

    if not contracts_dir.is_dir():
        print(f"Error: contracts directory not found at {contracts_dir}")
        return

    for entry in sorted(contracts_dir.iterdir()):
        if entry.is_dir() and (entry / "Cargo.toml").is_file():
            spec = extract_contract_spec(entry)
            out_file = (
                Path(args.output_dir) / f"{spec['name']}.spec.json"
                if args.output_dir
                else entry / "contract-spec.json"
            )
            out_file.parent.mkdir(parents=True, exist_ok=True)
            out_file.write_bytes((json.dumps(spec, indent=2) + "\n").encode("utf-8"))
            print(f"[OK] Exported contract spec: {out_file}")
            print(f"   Contract: {spec['name']} v{spec['version']}")
            print(
                f"   Functions: {len(spec['functions'])}, Structs: {len(spec['structs'])}, "
                f"Enums: {len(spec['enums'])}, Events: {len(spec['events'])}"
            )


if __name__ == "__main__":
    main()
