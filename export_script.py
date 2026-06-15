import os

OUTPUT_FILE = "Full_Codebase.md"

def get_files():
    # Directories to ignore
    ignore_dirs = {'.git', 'node_modules', 'dist', '__pycache__', 'venv', '.venv', 'build', '.npm'}
    files_to_export = []
    
    # Define files we want to include explicitly if needed, but walking is easier.
    valid_extensions = ('.py', '.ts', '.tsx', '.css', '.html', '.json', '.yml', '.yaml', '.txt', '.js')
    
    for root, dirs, files in os.walk("."):
        # filter out ignored directories
        dirs[:] = [d for d in dirs if d not in ignore_dirs]
        
        for file in files:
            # specifically ignore lockfiles or the export script itself
            if file in ['package-lock.json', 'export_script.py', OUTPUT_FILE]:
                continue
                
            if file.endswith(valid_extensions):
                files_to_export.append(os.path.join(root, file))
                
    return sorted(files_to_export)

with open(OUTPUT_FILE, "w") as out:
    out.write("# Student Dashboard App Full Codebase\n\n")
    out.write("This file contains the entire copy-pastable codebase for the application, organized by file.\n\n")
    
    for fpath in get_files():
        try:
            with open(fpath, "r", encoding="utf-8") as infile:
                content = infile.read()
                
            ext = fpath.split('.')[-1]
            lang = ext if ext in ['py', 'ts', 'tsx', 'js', 'json', 'yaml', 'yml', 'css', 'html'] else ''
            
            # format the path nicely (remove leading ./)
            clean_path = fpath[2:] if fpath.startswith("./") else fpath
            
            out.write(f"### `{clean_path}`\n\n")
            out.write(f"```{lang}\n")
            out.write(content)
            if not content.endswith("\n"):
                out.write("\n")
            out.write("```\n\n")
        except Exception as e:
            print(f"Skipping {fpath}: {e}")

print(f"Export completed to {OUTPUT_FILE}")
