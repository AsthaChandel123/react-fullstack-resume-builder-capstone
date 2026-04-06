#!/bin/bash
# Deploy ResumeAI to Cloud Run
# All keys read from .env file - NEVER hardcode secrets in scripts.

set -euo pipefail

PROJECT_ID="${GCP_PROJECT:-lmsforshantithakur}"
REGION="${GCP_REGION:-asia-south1}"
SERVICE_NAME="resumeai"
IMAGE="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"

# Read keys from .env file
if [ ! -f .env ]; then
  echo "ERROR: .env file not found. Copy .env.example and fill in your keys."
  exit 1
fi

set -a
source .env
set +a

echo "==> Building container..."
docker build \
  --build-arg VITE_FIREBASE_API_KEY="${VITE_FIREBASE_API_KEY}" \
  --build-arg VITE_FIREBASE_AUTH_DOMAIN="${VITE_FIREBASE_AUTH_DOMAIN}" \
  --build-arg VITE_FIREBASE_PROJECT_ID="${VITE_FIREBASE_PROJECT_ID}" \
  --build-arg VITE_FIREBASE_STORAGE_BUCKET="${VITE_FIREBASE_STORAGE_BUCKET}" \
  --build-arg VITE_FIREBASE_MESSAGING_SENDER_ID="${VITE_FIREBASE_MESSAGING_SENDER_ID}" \
  --build-arg VITE_FIREBASE_APP_ID="${VITE_FIREBASE_APP_ID}" \
  --build-arg VITE_GEMINI_API_KEY="${VITE_GEMINI_API_KEY:-}" \
  -t "${IMAGE}" .

echo "==> Pushing to GCR..."
docker push "${IMAGE}"

echo "==> Deploying to Cloud Run..."
gcloud run deploy "${SERVICE_NAME}" \
  --image="${IMAGE}" \
  --project="${PROJECT_ID}" \
  --region="${REGION}" \
  --platform=managed \
  --allow-unauthenticated \
  --port=8080 \
  --memory=256Mi \
  --cpu=1 \
  --min-instances=0 \
  --max-instances=3

echo "==> Done. Service URL:"
gcloud run services describe "${SERVICE_NAME}" \
  --project="${PROJECT_ID}" \
  --region="${REGION}" \
  --format="value(status.url)"
