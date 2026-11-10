variable "aws_region" {
  description = "AWS region for infrastructure"
  type        = string
  default     = "ap-south-1"
}

variable "aws_profile" {
  description = "AWS CLI profile used by Terraform"
  type        = string
  default     = "terraform-lab"
}

variable "project_name" {
  description = "Project identifier"
  type        = string
  default     = "ecommerce"

  validation {
    condition     = length(var.project_name) >= 3
    error_message = "Project name must contain at least 3 characters."
  }
}

variable "enable_versioning" {
  description = "Enable S3 bucket versioning"
  type        = bool
  default     = true
}