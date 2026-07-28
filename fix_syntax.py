import re

file_path = r'src/app/dashboard/eventos-presenciales/[id]/PanelOradorClient.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

broken_pattern = r'<span className="text-xs font-extrabold uppercase tracking-wide text-zinc-200">\s*</div>\s*</div>\s*\)\)\s*\)\}\s*</div>\s*</div>\s*</div>\s*</div>\s*\)\}'

fixed_str = """<span className="text-xs font-extrabold uppercase tracking-wide text-zinc-200">
                          {pal.palabra}
                        </span>
                        <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                          {pal.cantidad} {pal.cantidad === 1 ? "concepto" : "conceptos"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}"""

new_content = re.sub(broken_pattern, fixed_str, content)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Done")
