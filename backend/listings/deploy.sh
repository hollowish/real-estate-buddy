#!/bin/bash
export AWS_PROFILE=class
cd /home/hollowish/projects/real-estate-buddy/backend/listings
python3 -c "import zipfile; z=zipfile.ZipFile('/tmp/fn.zip','w'); z.write('handler.js'); z.close()"
aws lambda update-function-code --function-name reb-listings-handler --zip-file fileb:///tmp/fn.zip --region us-west-2 --output text --query 'LastUpdateStatus'
echo "Done"
