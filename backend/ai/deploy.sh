#!/bin/bash
set -e
cd /home/hollowish/projects/real-estate-buddy/backend/ai

python3 << 'EOF'
import zipfile, os

zip_path = '/tmp/ai.zip'
source_dir = '/home/hollowish/projects/real-estate-buddy/backend/ai'

with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as z:
    for root, dirs, files in os.walk(source_dir):
        # Skip cache dirs
        dirs[:] = [d for d in dirs if d != '.cache']
        for file in files:
            full_path = os.path.join(root, file)
            arcname = os.path.relpath(full_path, source_dir)
            # Skip the deploy script and this zip itself
            if arcname in ('deploy.sh',):
                continue
            z.write(full_path, arcname)

size = os.path.getsize(zip_path)
print(f'Zip created: {zip_path} ({size:,} bytes)')
EOF

export AWS_PROFILE=class
aws lambda update-function-code \
  --function-name reb-ai-scoring \
  --zip-file fileb:///tmp/ai.zip \
  --region us-west-2
