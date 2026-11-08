#!/usr/bin/env python3
"""
Correção cirúrgica de tipagem estrita do TypeScript no GarimpaTrip.
"""
import os
import re

def patch_file(path, modifier_fn):
    if not os.path.exists(path):
        print(f"⚠️  Arquivo não encontrado: {path}")
        return False
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    new_content = modifier_fn(content)
    if new_content != content:
        with open(path, "w", encoding="utf-8") as f:
            f.write(new_content)
        print(f"✅ Atualizado: {path}")
        return True
    else:
        print(f"ℹ️  Sem alterações necessárias: {path}")
        return False

# 1. Adicionar 'web' em DEFAULT_PACKAGE_CATEGORY
def fix_categories(content):
    if "web:" not in content and "DEFAULT_PACKAGE_CATEGORY" in content:
        content = re.sub(
            r"(export const DEFAULT_PACKAGE_CATEGORY:\s*Record<DiscoveryCategory,\s*number>\s*=\s*\{[^}]+)(web_idea:\s*3,?)",
            r"\1\2\n  web: 3,",
            content
        )
        if "web:" not in content:
            content = content.replace("web_idea: 3,", "web_idea: 3,\n  web: 3,")
    return content

# 2. Garantir cityName importado em providers.ts
def fix_providers(content):
    if "cityName" in content:
        if not re.search(r"import\s*\{[^}]*\bcityName\b[^}]*\}\s*from\s*['\"]@/lib/iata['\"]", content):
            content = re.sub(
                r"(import\s*\{)([^}]*)(\}\s*from\s*['\"]@/lib/iata['\"])",
                r"\1 cityName,\2\3",
                content
            )
    return content

# 3. Tornar id e label opcionais no AutocompleteInput
def fix_autocomplete(content):
    content = re.sub(r"(\bid\s*:\s*string;)", r"id?: string;", content)
    content = re.sub(r"(\blabel\s*:\s*string;)", r"label?: string;", content)
    return content

# 4. Tratar nulls e types unknown no DiscoverClient
def fix_discover(content):
    # 4.1 Evitar null em savedUrls.has
    content = re.sub(
        r"savedUrls\.has\(([^)]+)\.id\s*\|\|\s*([^)]+)\.url\)",
        r"savedUrls.has(\1.id || \2.url || '')",
        content
    )

    # 4.2 Evitar null em href
    for var in ['item', 'flight', 'hotel', 'tour', 'webItem', 'r']:
        content = re.sub(
            rf"href=\{{\s*{var}\.url\s*\}}",
            f"href={{{var}.url || '#'}}",
            content
        )

    # 4.3 Tratar .raw?.map_url e campos de texto que caem como unknown
    content = re.sub(
        r"href=\{(\w+)\.raw\?\.map_url\}",
        r"href={String((\1.raw as any)?.map_url || '#')}",
        content
    )
    content = re.sub(
        r"\{(\w+)\.raw\?\.map_url\s*&&",
        r"{((\1.raw as any)?.map_url) &&",
        content
    )
    content = re.sub(
        r"\{(\w+)\.raw\?\.address\}",
        r"{String((\1.raw as any)?.address || '')}",
        content
    )

    # 4.4 Categoria manual
    content = content.replace("category: 'web',", "category: 'web_idea' as any,")

    return content

if __name__ == "__main__":
    print("Corrigindo tipagens estritas do TypeScript...")
    patch_file("src/lib/categories.ts", fix_categories)
    patch_file("src/lib/providers.ts", fix_providers)
    patch_file("src/components/search/AutocompleteInput.tsx", fix_autocomplete)
    patch_file("src/components/discover/DiscoverClient.tsx", fix_discover)
    print("\nConcluído!")
