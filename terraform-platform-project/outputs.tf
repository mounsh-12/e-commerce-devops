output "bucket_name" {
  description = "Name of the S3 bucket"
  value       = module.storage.bucket_name
}

output "bucket_arn" {
  description = "ARN of the S3 bucket"
  value       = module.storage.bucket_arn
}

output "bucket_region" {
  description = "Region of the S3 bucket"
  value       = module.storage.bucket_region
}

output "deployment_environment" {
  description = "Current Terraform workspace"
  value       = local.environment
}

output "environment_description" {
  description = "Description of the current environment"
  value       = local.environment_description
}

output "versioning_status" {
  description = "Configured S3 versioning status"
  value       = local.versioning_status
}

output "aws_account_id" {
  description = "AWS account ID"
  value       = data.aws_caller_identity.current.account_id
}

output "current_aws_region" {
  description = "Current AWS region"
  value       = data.aws_region.current.region
}