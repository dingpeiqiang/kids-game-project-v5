#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""将用户可见文案中的「疲劳*」统一为「游学币*」（不修改 fatiguePoints 等 API 字段名）"""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SKIP = {"node_modules", "dist", "target", ".git"}
EXT = {".vue", ".ts", ".tsx", ".java", ".md", ".sql"}

REPLACEMENTS = [
    ("疲劳点不足", "游学币不足"),
    ("疲劳点数", "游学币"),
    ("疲劳点", "游学币"),
    ("疲劳值", "游学币"),
    ("疲劳模式", "游学币模式"),
    ("疲劳不足", "游学币不足"),
    ("今日疲劳", "今日游学币"),
    ("剩余疲劳", "剩余游学币"),
    ("获得疲劳", "获得游学币"),
    ("消耗疲劳", "消耗游学币"),
    ("疲劳已", "游学币已"),
    ("疲劳管理", "游学币管理"),
    ("疲劳规则", "游学币规则"),
    ("疲劳系统", "游学币系统"),
    ("疲劳机制", "游学币机制"),
    ("疲劳驱动", "游学币驱动"),
    ("疲劳相关", "游学币相关"),
    ("疲劳变动", "游学币变动"),
    ("疲劳日志", "游学币日志"),
    ("疲劳记录", "游学币记录"),
    ("疲劳统计", "游学币统计"),
    ("疲劳消耗", "游学币消耗"),
    ("疲劳获取", "游学币获取"),
    ("疲劳上限", "游学币上限"),
    ("疲劳余额", "游学币余额"),
    ("疲劳", "游学币"),
]


def should_skip(p: Path) -> bool:
    return any(part in SKIP for part in p.parts)


def main():
    changed = []
    for path in ROOT.rglob("*"):
        if not path.is_file() or should_skip(path):
            continue
        if path.suffix.lower() not in EXT:
            continue
        if path.name == "rename-fatigue-to-coin.py":
            continue
        try:
            raw = path.read_text(encoding="utf-8")
        except (UnicodeDecodeError, OSError):
            continue
        if "疲劳" not in raw:
            continue
        new = raw
        for old, repl in REPLACEMENTS:
            new = new.replace(old, repl)
        if new != raw:
            path.write_text(new, encoding="utf-8")
            changed.append(str(path.relative_to(ROOT)))
    print(f"Updated {len(changed)} files")
    for c in changed:
        print(c)


if __name__ == "__main__":
    main()