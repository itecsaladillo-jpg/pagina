import re
import os
import glob

# Only process migrations from 063 onwards
files = glob.glob('supabase/migrations/*.sql')
files.sort()

target_files = [f for f in files if os.path.basename(f) >= '063']

policy_pattern = re.compile(r'CREATE POLICY "([^"]+)"\s+ON (?:public\.)?([a-zA-Z_0-9]+)', re.IGNORECASE)
table_pattern = re.compile(r'CREATE TABLE\s+(?:public\.)?([a-zA-Z_0-9]+)', re.IGNORECASE)

for file_path in target_files:
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    new_content = content
    
    # Patch CREATE POLICY
    for match in policy_pattern.finditer(content):
        policy_name = match.group(1)
        table_name = match.group(2)
        drop_stmt = f'DROP POLICY IF EXISTS "{policy_name}" ON public.{table_name};\n'
        # Check without schema prefix too just in case
        drop_stmt_no_public = f'DROP POLICY IF EXISTS "{policy_name}" ON {table_name};\n'
        
        if drop_stmt not in new_content and drop_stmt_no_public not in new_content:
            create_stmt = match.group(0)
            # determine which schema prefix to use for DROP based on CREATE
            schema = 'public.' if 'public.' in create_stmt else ''
            actual_drop = f'DROP POLICY IF EXISTS "{policy_name}" ON {schema}{table_name};\n'
            new_content = new_content.replace(create_stmt, actual_drop + create_stmt)

    # Note: we are not doing CREATE TABLE IF NOT EXISTS automatically here to avoid edge cases with syntax, 
    # but we can try basic replacement if they don't have IF NOT EXISTS.
    # Actually, let's just do CREATE TABLE IF NOT EXISTS if it's not there.
    table_pattern_strict = re.compile(r'CREATE TABLE (?!IF NOT EXISTS)(?:public\.)?([a-zA-Z_0-9]+)', re.IGNORECASE)
    for match in table_pattern_strict.finditer(content):
        create_stmt = match.group(0)
        # We replace 'CREATE TABLE' with 'CREATE TABLE IF NOT EXISTS'
        replaced_stmt = re.sub(r'CREATE TABLE', 'CREATE TABLE IF NOT EXISTS', create_stmt, flags=re.IGNORECASE)
        new_content = new_content.replace(create_stmt, replaced_stmt)
        
    if new_content != content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f'Patched {os.path.basename(file_path)}')
