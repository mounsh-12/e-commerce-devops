output "bucket_name" {
  description = "Name of the created S3 bucket"
  value       = aws_s3_bucket.project_bucket.bucket
}

output "bucket_arn" {
  description = "ARN of the created S3 bucket"
  value       = aws_s3_bucket.project_bucket.arn
}

output "bucket_region" {
  description = "Region of the S3 bucket"
  value       = aws_s3_bucket.project_bucket.region
}