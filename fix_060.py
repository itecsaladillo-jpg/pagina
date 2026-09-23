import re

with open('supabase/migrations/060_esquema_hibrido_virtual.sql', 'r', encoding='utf-8') as f:
    content = f.read()

pattern = re.compile(r'CREATE POLICY "([^"]+)" ON public\.([a-zA-Z_0-9]+)', re.IGNORECASE)

new_content = content
for match in pattern.finditer(content):
    policy_name = match.group(1)
    table_name = match.group(2)
    drop_stmt = f'DROP POLICY IF EXISTS "{policy_name}" ON public.{table_name};\n'
    if drop_stmt not in new_content:
        create_stmt = match.group(0)
        new_content = new_content.replace(create_stmt, drop_stmt + create_stmt)

with open('supabase/migrations/060_esquema_hibrido_virtual.sql', 'w', encoding='utf-8') as f:
    f.write(new_content)

print('Fixed 060 migration policies')
