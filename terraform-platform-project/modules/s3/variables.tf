variable "bucket_name" {
  description = "Name of the S3 bucket"
  type        = string
}

variable "tags" {
  description = "Tags applied to the S3 bucket"
  type        = map(string)
  default     = {}
}

variable "enable_versioning" {
  description = "Whether S3 bucket versioning is enabled"
  type        = bool
  default     = true
}