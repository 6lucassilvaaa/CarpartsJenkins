#!/usr/bin/env bash
set -euo pipefail
set +x
: "${IMAGE_DIGEST:?}" "${APP_NAME:?}" "${RESOURCE_GROUP:?}" "${GIT_COMMIT:?}"
[[ "$IMAGE_DIGEST" =~ @sha256:[a-f0-9]{64}$ ]] || { echo 'Imagem deve ser um digest imutável'; exit 1; }
az containerapp update --name "$APP_NAME" --resource-group "$RESOURCE_GROUP" --image "$IMAGE_DIGEST" --output none
fqdn=$(az containerapp show --name "$APP_NAME" --resource-group "$RESOURCE_GROUP" --query properties.configuration.ingress.fqdn --output tsv)
SMOKE_URL="https://$fqdn" EXPECTED_COMMIT="$GIT_COMMIT" node scripts/smoke.js
