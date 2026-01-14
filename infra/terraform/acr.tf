resource "azurerm_container_registry" "main" {
  name                = "${replace(var.project_name, "-", "")}acr${var.environment}"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  sku                 = "Basic"
  admin_enabled       = true

  tags = var.tags
}

output "acr_login_server" {
  value       = azurerm_container_registry.main.login_server
  description = "ACR login server URL"
}

output "acr_admin_username" {
  value       = azurerm_container_registry.main.admin_username
  description = "ACR admin username"
}

output "acr_admin_password" {
  value       = azurerm_container_registry.main.admin_password
  sensitive   = true
  description = "ACR admin password"
}

output "acr_name" {
  value       = azurerm_container_registry.main.name
  description = "ACR name"
}
