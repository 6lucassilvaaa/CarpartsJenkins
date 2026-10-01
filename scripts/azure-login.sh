#!/usr/bin/env bash
set -euo pipefail
set +x
: "${AZ_CLIENT_ID:?}" "${AZ_CLIENT_SECRET:?}" "${AZ_TENANT_ID:?}" "${AZ_SUBSCRIPTION_ID:?}"
az login --service-principal --username "$AZ_CLIENT_ID" --password "$AZ_CLIENT_SECRET" --tenant "$AZ_TENANT_ID" --output none
az account set --subscription "$AZ_SUBSCRIPTION_ID"
