
data "aws_caller_identity" "current" {}

# --------------------------------------------------
# 1. Main E-Commerce S3 bucket
# --------------------------------------------------

resource "aws_s3_bucket" "project_bucket" {
  bucket = var.bucket_name

  tags = var.tags

  lifecycle {
    prevent_destroy = true
  }
}

# --------------------------------------------------
# 2. Block all public access
# --------------------------------------------------

resource "aws_s3_bucket_public_access_block" "project_bucket_security" {
  bucket = aws_s3_bucket.project_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# --------------------------------------------------
# 3. Enable AES-256 encryption
# --------------------------------------------------

resource "aws_s3_bucket_server_side_encryption_configuration" "project_bucket_encryption" {
  bucket = aws_s3_bucket.project_bucket.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# --------------------------------------------------
# 4. Enable versioning
# --------------------------------------------------

resource "aws_s3_bucket_versioning" "project_bucket_versioning" {
  bucket = aws_s3_bucket.project_bucket.id

  versioning_configuration {
    status = var.enable_versioning ? "Enabled" : "Suspended"
  }
}

# --------------------------------------------------
# 5. Deny insecure HTTP requests
# --------------------------------------------------

data "aws_iam_policy_document" "project_bucket_policy" {
  statement {
    sid    = "DenyInsecureTransport"
    effect = "Deny"

    principals {
      type        = "*"
      identifiers = ["*"]
    }

    actions = ["s3:*"]

    resources = [
      aws_s3_bucket.project_bucket.arn,
      "${aws_s3_bucket.project_bucket.arn}/*"
    ]

    condition {
      test     = "Bool"
      variable = "aws:SecureTransport"
      values   = ["false"]
    }

    condition {
      test     = "Bool"
      variable = "aws:PrincipalIsAWSService"
      values   = ["false"]
    }
  }
}

resource "aws_s3_bucket_policy" "project_bucket_policy" {
  bucket = aws_s3_bucket.project_bucket.id
  policy = data.aws_iam_policy_document.project_bucket_policy.json
}

# --------------------------------------------------
# 6. Dedicated access logging destination bucket
# --------------------------------------------------

resource "aws_s3_bucket" "access_logs" {
  bucket = "${var.bucket_name}-access-logs"

  tags = merge(var.tags, {
    Purpose = "S3 Server Access Logs"
  })

  lifecycle {
    prevent_destroy = true
  }
}

# --------------------------------------------------
# 7. Protect logging bucket from public access
# --------------------------------------------------

resource "aws_s3_bucket_public_access_block" "access_logs_security" {
  bucket = aws_s3_bucket.access_logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# --------------------------------------------------
# 8. Enforce encryption on logging bucket
# --------------------------------------------------

resource "aws_s3_bucket_server_side_encryption_configuration" "access_logs_encryption" {
  bucket = aws_s3_bucket.access_logs.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# --------------------------------------------------
# 9. Allow S3 logging service to deliver log objects
# --------------------------------------------------

data "aws_iam_policy_document" "access_logs_policy" {
  statement {
    sid    = "AllowS3ServerAccessLogDelivery"
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["logging.s3.amazonaws.com"]
    }

    actions = [
      "s3:PutObject"
    ]

    resources = [
      "${aws_s3_bucket.access_logs.arn}/s3-access-logs/*"
    ]

    condition {
      test     = "ArnLike"
      variable = "aws:SourceArn"
      values   = [aws_s3_bucket.project_bucket.arn]
    }

    condition {
      test     = "StringEquals"
      variable = "aws:SourceAccount"
      values   = [data.aws_caller_identity.current.account_id]
    }
  }

  statement {
    sid    = "DenyInsecureTransport"
    effect = "Deny"

    principals {
      type        = "*"
      identifiers = ["*"]
    }

    actions = ["s3:*"]

    resources = [
      aws_s3_bucket.access_logs.arn,
      "${aws_s3_bucket.access_logs.arn}/*"
    ]

    condition {
      test     = "Bool"
      variable = "aws:SecureTransport"
      values   = ["false"]
    }

    condition {
      test     = "Bool"
      variable = "aws:PrincipalIsAWSService"
      values   = ["false"]
    }
  }
}

resource "aws_s3_bucket_policy" "access_logs_policy" {
  bucket = aws_s3_bucket.access_logs.id
  policy = data.aws_iam_policy_document.access_logs_policy.json
}

# --------------------------------------------------
# 10. Enable server access logging
# --------------------------------------------------

resource "aws_s3_bucket_logging" "project_bucket_logging" {
  bucket = aws_s3_bucket.project_bucket.id

  target_bucket = aws_s3_bucket.access_logs.id
  target_prefix = "s3-access-logs/"

  depends_on = [
    aws_s3_bucket_policy.access_logs_policy
  ]
}
