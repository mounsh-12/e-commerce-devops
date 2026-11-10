terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }

  backend "s3" {
    bucket       = "terraform-state-008579398303-ap-south-1"
    key          = "ecommerce/dev/terraform.tfstate"
    region       = "ap-south-1"
    profile      = "terraform-lab"
    encrypt      = true
    use_lockfile = true
  }
}

provider "aws" {
  region  = var.aws_region
  profile = var.aws_profile
}

# Data sources
data "aws_caller_identity" "current" {}

data "aws_region" "current" {}

# S3 module
module "storage" {
  source = "./modules/s3"

  bucket_name       = local.bucket_name
  tags              = local.common_tags
  enable_versioning = var.enable_versioning
}

# Preserve previous resource addresses
moved {
  from = aws_s3_bucket.project_bucket
  to   = module.storage.aws_s3_bucket.project_bucket
}

moved {
  from = aws_s3_bucket_public_access_block.project_bucket_security
  to   = module.storage.aws_s3_bucket_public_access_block.project_bucket_security
}

moved {
  from = aws_s3_bucket_server_side_encryption_configuration.project_bucket_encryption
  to   = module.storage.aws_s3_bucket_server_side_encryption_configuration.project_bucket_encryption
}

moved {
  from = aws_s3_bucket_versioning.project_bucket_versioning
  to   = module.storage.aws_s3_bucket_versioning.project_bucket_versioning
}