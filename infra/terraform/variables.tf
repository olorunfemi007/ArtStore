variable "resource_group_name" {
  description = "Name of the resource group"
  type        = string
  default     = "studiodrop-rg"
}

variable "location" {
  description = "Azure region for resources"
  type        = string
  default     = "eastus"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "prod"
}

variable "project_name" {
  description = "Project name used for naming resources"
  type        = string
  default     = "studiodrop"
}

variable "aks_node_count" {
  description = "Number of AKS worker nodes"
  type        = number
  default     = 2
}

variable "aks_node_size" {
  description = "Size of AKS worker nodes"
  type        = string
  default     = "Standard_B2s"
}

variable "postgres_sku" {
  description = "PostgreSQL SKU name"
  type        = string
  default     = "B_Standard_B1ms"
}

variable "postgres_storage_mb" {
  description = "PostgreSQL storage in MB"
  type        = number
  default     = 32768
}

variable "postgres_admin_username" {
  description = "PostgreSQL admin username"
  type        = string
  default     = "studiodropadmin"
}

variable "domain_name" {
  description = "Domain name for the application"
  type        = string
  default     = ""
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default = {
    Project     = "STUDIODROP"
    ManagedBy   = "Terraform"
  }
}
