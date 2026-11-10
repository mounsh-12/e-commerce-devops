locals {
  environment = lower(terraform.workspace)

  bucket_name = lower(
    "${var.project_name}-${local.environment}-${data.aws_caller_identity.current.account_id}-platform-lab"
  )

  common_tags = {
    Project     = var.project_name
    Environment = local.environment
    ManagedBy   = "Terraform"
  }

  environment_description = (
    local.environment == "prod"
    ? "Production Environment"
    : local.environment == "test"
    ? "Testing Environment"
    : "Development Environment"
  )

  versioning_status = (
    var.enable_versioning
    ? "Enabled"
    : "Suspended"
  )
}