import os
import zipfile
import sys
import shutil

def create_source_zip(primary_target):
    # Directories and files to include
    include_dirs = ['src', 'public', 'web', 'scripts']
    include_files = [
        'package.json',
        'tsconfig.json',
        'tsconfig.node.json',
        'vite.config.ts',
        'server.ts',
        'index.html',
        'metadata.json',
        'firebase.json',
        'firestore.rules',
        'README.md',
        '.env.example'
    ]

    # Patterns or directory names to strictly ignore
    ignored_names = {'node_modules', 'dist', 'build', '.git', '.cache', '__pycache__', '.DS_Store'}
    ignored_extensions = {'.zip', '.tar.gz', '.tgz'}

    print(f"📦 Packaging CAPP AI project into {primary_target}...")
    os.makedirs(os.path.dirname(os.path.abspath(primary_target)), exist_ok=True)

    file_count = 0
    with zipfile.ZipFile(primary_target, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=9) as zipf:
        # Add specific root files if they exist
        for filename in include_files:
            if os.path.isfile(filename):
                zipf.write(filename, arcname=filename)
                file_count += 1
                print(f"  + {filename}")

        # Add directories recursively
        for dir_name in include_dirs:
            if not os.path.isdir(dir_name):
                continue
            for root, dirs, files in os.walk(dir_name):
                # Filter out ignored dirs in-place
                dirs[:] = [d for d in dirs if d not in ignored_names and not d.startswith('.')]
                for file in files:
                    ext = os.path.splitext(file)[1].lower()
                    if ext in ignored_extensions or file in ignored_names:
                        continue
                    file_path = os.path.join(root, file)
                    arc_path = os.path.relpath(file_path, start='.')
                    zipf.write(file_path, arcname=arc_path)
                    file_count += 1
                    print(f"  + {arc_path}")

    zip_size = os.path.getsize(primary_target)
    print(f"\n✅ Created {primary_target}: {file_count} files, {zip_size:,} bytes ({zip_size / 1024:.1f} KB)")

    # Also make aliases and copy to dist/ and build/web/
    output_dir = os.path.dirname(os.path.abspath(primary_target))
    aliases = [
        'capp-ai-project.zip',
        'capp-source-code.zip',
        'capp-project.zip',
        'capp-ai.zip'
    ]

    for alias in aliases:
        alias_path = os.path.join(output_dir, alias)
        if alias_path != os.path.abspath(primary_target):
            shutil.copyfile(primary_target, alias_path)

    # Mirror to dist and build/web if they exist
    for target_dir in ['dist', os.path.join('build', 'web')]:
        if os.path.isdir(target_dir):
            for alias in aliases:
                shutil.copyfile(primary_target, os.path.join(target_dir, alias))

    print(f"✅ Mirrored to aliases: {', '.join(aliases)}")

if __name__ == '__main__':
    target = sys.argv[1] if len(sys.argv) > 1 else 'public/capp-ai-project.zip'
    create_source_zip(target)
