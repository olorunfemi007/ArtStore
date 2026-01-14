# Azure Kubernetes Deployment Guide

This guide explains how to deploy STUDIODROP to Azure Kubernetes Service (AKS) using GitHub Actions.

## Option 1: Automated Infrastructure with Terraform (Recommended)

Use Terraform to automatically provision all Azure resources.

### Prerequisites

1. **Azure CLI** installed and logged in
2. **Terraform** installed (v1.5+)
3. **GitHub repository** with Actions enabled

### Step 1: Create Terraform State Storage

```bash
# Create resource group for Terraform state
az group create --name terraform-state-rg --location eastus

# Create storage account for state
az storage account create \
  --name yourterraformstate \
  --resource-group terraform-state-rg \
  --sku Standard_LRS

# Create container for state files
az storage container create \
  --name tfstate \
  --account-name yourterraformstate
```

### Step 2: Create Service Principal

```bash
# Get subscription ID
SUBSCRIPTION_ID=$(az account show --query id -o tsv)

# Create service principal for Terraform
az ad sp create-for-rbac \
  --name "studiodrop-terraform" \
  --role Contributor \
  --scopes /subscriptions/$SUBSCRIPTION_ID \
  --sdk-auth
```

Save the JSON output for `AZURE_CREDENTIALS` GitHub secret.

Extract these values for additional secrets:
- `ARM_CLIENT_ID`: appId from JSON
- `ARM_CLIENT_SECRET`: password from JSON  
- `ARM_SUBSCRIPTION_ID`: subscription from JSON
- `ARM_TENANT_ID`: tenant from JSON

### Step 3: Configure GitHub Secrets for Terraform

| Secret Name | Description |
|-------------|-------------|
| `ARM_CLIENT_ID` | Service principal app ID |
| `ARM_CLIENT_SECRET` | Service principal password |
| `ARM_SUBSCRIPTION_ID` | Azure subscription ID |
| `ARM_TENANT_ID` | Azure AD tenant ID |
| `TF_STATE_RESOURCE_GROUP` | `terraform-state-rg` |
| `TF_STATE_STORAGE_ACCOUNT` | Your storage account name |

### Step 4: Deploy Infrastructure

Push changes to `infra/terraform/` or manually trigger the workflow:

1. Go to GitHub Actions
2. Select "Deploy Azure Infrastructure with Terraform"
3. Click "Run workflow" → Select "apply"

The workflow will create:
- Resource Group
- Azure Container Registry
- AKS Cluster with auto-scaling
- PostgreSQL Flexible Server
- Azure Key Vault (with generated secrets)
- Log Analytics Workspace
- Application Insights

### Step 5: Get Secrets from Key Vault

After Terraform runs, retrieve secrets:

```bash
# Get Key Vault name from Terraform output
terraform output github_secrets_summary

# Retrieve DATABASE_URL
az keyvault secret show \
  --vault-name studiodrop-kv-prod \
  --name database-url \
  --query value -o tsv

# Retrieve SESSION_SECRET
az keyvault secret show \
  --vault-name studiodrop-kv-prod \
  --name session-secret \
  --query value -o tsv
```

---

## Option 2: Manual Infrastructure Setup

If you prefer manual setup, create resources with Azure CLI:

### Azure Resources

1. **Resource Group**
   ```bash
   az group create --name studiodrop-rg --location eastus
   ```

2. **Azure Container Registry (ACR)**
   ```bash
   az acr create --resource-group studiodrop-rg --name studiodropacr --sku Basic
   ```

3. **Azure Kubernetes Service (AKS)**
   ```bash
   az aks create \
     --resource-group studiodrop-rg \
     --name studiodrop-aks \
     --node-count 2 \
     --enable-addons monitoring \
     --generate-ssh-keys \
     --attach-acr studiodropacr
   ```

4. **Azure Database for PostgreSQL**
   ```bash
   az postgres flexible-server create \
     --resource-group studiodrop-rg \
     --name studiodrop-db \
     --admin-user adminuser \
     --admin-password <your-password> \
     --sku-name Standard_B1ms \
     --tier Burstable
   ```

### Service Principal for GitHub Actions

Create a service principal with permissions to deploy:

```bash
az ad sp create-for-rbac \
  --name "studiodrop-github-actions" \
  --role contributor \
  --scopes /subscriptions/<subscription-id>/resourceGroups/studiodrop-rg \
  --sdk-auth
```

Save the JSON output - you'll need it for GitHub Secrets.

## GitHub Secrets Configuration

Add the following secrets to your GitHub repository (Settings → Secrets and variables → Actions):

| Secret Name | Description |
|-------------|-------------|
| `AZURE_CREDENTIALS` | The JSON output from the service principal creation |
| `ACR_NAME` | Your Azure Container Registry name (e.g., `studiodropacr`) |
| `AKS_CLUSTER_NAME` | Your AKS cluster name (e.g., `studiodrop-aks`) |
| `AKS_RESOURCE_GROUP` | Your resource group name (e.g., `studiodrop-rg`) |
| `DATABASE_URL` | PostgreSQL connection string |
| `SESSION_SECRET` | A random secret string for session encryption |
| `STRIPE_SECRET_KEY` | Your Stripe secret key |
| `STRIPE_PUBLISHABLE_KEY` | Your Stripe publishable key |
| `ADMIN_PASSWORD` | Admin panel password |
| `DOMAIN_NAME` | Your domain name for the ingress (e.g., `studiodrop.example.com`) |

## NGINX Ingress Controller Setup

Install NGINX Ingress Controller in your AKS cluster:

```bash
# Get AKS credentials
az aks get-credentials --resource-group studiodrop-rg --name studiodrop-aks

# Install NGINX Ingress Controller
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo update
helm install ingress-nginx ingress-nginx/ingress-nginx \
  --create-namespace \
  --namespace ingress-nginx \
  --set controller.service.annotations."service\.beta\.kubernetes\.io/azure-load-balancer-health-probe-request-path"=/healthz
```

## TLS/SSL with cert-manager (Optional)

For automatic TLS certificates:

```bash
# Install cert-manager
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml

# Create ClusterIssuer for Let's Encrypt
cat <<EOF | kubectl apply -f -
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: your-email@example.com
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: nginx
EOF
```

## Deployment

### Automatic Deployment

Push to the `main` branch or create a tag to trigger automatic deployment:

```bash
git push origin main
# or
git tag v1.0.0 && git push origin v1.0.0
```

### Manual Deployment

You can also trigger the workflow manually from the GitHub Actions tab.

## Monitoring & Troubleshooting

### Check Deployment Status

```bash
kubectl get pods -n studiodrop
kubectl get services -n studiodrop
kubectl get ingress -n studiodrop
```

### View Logs

```bash
kubectl logs -n studiodrop deployment/studiodrop -f
```

### Check Events

```bash
kubectl get events -n studiodrop --sort-by='.lastTimestamp'
```

### Rollback

If a deployment fails, rollback to the previous version:

```bash
kubectl rollout undo deployment/studiodrop -n studiodrop
```

## Architecture

```
                    ┌─────────────────┐
                    │   GitHub Repo   │
                    └────────┬────────┘
                             │ Push to main
                             ▼
                    ┌─────────────────┐
                    │ GitHub Actions  │
                    │  (Build & Push) │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │  Azure Container│
                    │    Registry     │
                    └────────┬────────┘
                             │
                             ▼
┌───────────────────────────────────────────────┐
│              Azure Kubernetes Service          │
│  ┌─────────────────────────────────────────┐  │
│  │            NGINX Ingress                 │  │
│  │         (TLS Termination)                │  │
│  └────────────────┬────────────────────────┘  │
│                   │                            │
│  ┌────────────────▼────────────────────────┐  │
│  │           Service (ClusterIP)            │  │
│  └────────────────┬────────────────────────┘  │
│                   │                            │
│  ┌────────────────▼────────────────────────┐  │
│  │        Deployment (2+ replicas)          │  │
│  │  ┌──────────┐  ┌──────────┐              │  │
│  │  │   Pod    │  │   Pod    │              │  │
│  │  └──────────┘  └──────────┘              │  │
│  └──────────────────────────────────────────┘  │
└───────────────────────────────────────────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │   PostgreSQL    │
                    │    Database     │
                    └─────────────────┘
```

## Cost Optimization Tips

1. Use spot instances for non-production workloads
2. Scale down replicas during off-peak hours
3. Use the Basic tier for ACR in development
4. Consider Azure Database for PostgreSQL Flexible Server with burstable tier

## Security Best Practices

1. Enable Azure AD integration for AKS
2. Use Azure Key Vault for secrets management
3. Enable network policies in AKS
4. Regularly update Node.js base images
5. Enable container scanning in ACR
