output "resource_group_name" {
  value       = azurerm_resource_group.main.name
  description = "Resource group name"
}

output "github_secrets_summary" {
  value = <<-EOT
    
    ============================================
    GitHub Secrets to Configure:
    ============================================
    
    ACR_NAME             = ${azurerm_container_registry.main.name}
    AKS_CLUSTER_NAME     = ${azurerm_kubernetes_cluster.main.name}
    AKS_RESOURCE_GROUP   = ${azurerm_resource_group.main.name}
    
    Secrets are stored in Azure Key Vault: ${azurerm_key_vault.main.name}
    Retrieve them using Azure CLI:
    - az keyvault secret show --vault-name ${azurerm_key_vault.main.name} --name database-url --query value -o tsv
    - az keyvault secret show --vault-name ${azurerm_key_vault.main.name} --name session-secret --query value -o tsv
    
    Manual secrets to add to GitHub:
    - STRIPE_SECRET_KEY
    - STRIPE_PUBLISHABLE_KEY
    - ADMIN_PASSWORD
    - DOMAIN_NAME
    - AZURE_CREDENTIALS (from service principal)
    
    ============================================
  EOT
  description = "Summary of GitHub secrets to configure"
}
