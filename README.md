# E-Commerce DevOps Project

An end-to-end DevOps project that automates testing, code-quality analysis, containerization, security scanning, and application deployment using a Jenkins CI/CD pipeline.

## Project Overview

This project demonstrates the integration of multiple DevOps tools to automate the software delivery lifecycle of an E-Commerce application.

Jenkins orchestrates the pipeline, while specialized tools perform automated browser testing, static code analysis, Docker image building, and vulnerability scanning.

### Key Results

- **SonarQube Code Coverage:** 92.5%
- **SonarQube Quality Gate:** PASSED
- **Automated Browser Tests:** PASSED
- **CI/CD Pipeline:** SUCCESSFULLY COMPLETED
- **Required Code Coverage:** 80%

## Technology Stack

| Technology | Purpose |
|---|---|
| Git | Version control |
| GitHub | Source code management |
| Jenkins | CI/CD automation |
| Playwright | Automated browser testing |
| SonarQube | Static code analysis and coverage |
| Docker | Application containerization |
| Nginx | Web server and reverse proxy |
| Trivy | Container vulnerability scanning |
| Terraform | Infrastructure as Code |
| AWS | Cloud infrastructure |

## CI/CD Pipeline Architecture

```text
        Developer
            |
            v
       Git / GitHub
            |
            v
      Jenkins Pipeline
            |
            v
   Playwright Browser Tests
            |
            v
   SonarQube Code Analysis
            |
            v
    SonarQube Quality Gate
            |
            v
     Docker Image Build
            |
            v
      Trivy Security Scan
            |
            v
        Deployment
            |
            v
   Deployment Verification
            |
            v
      Application Running
```

## Pipeline Stages

### 1. GitHub Integration
- Maintains application source code.
- Supports version control.
- Provides the source repository for Jenkins.

### 2. Jenkins CI/CD
- Automates the software delivery workflow.
- Executes pipeline stages defined in the Jenkinsfile.
- Controls the execution sequence.
- Handles pipeline failures.

### 3. Playwright Testing
- Executes automated browser tests.
- Validates application functionality.
- Generates test and coverage reports.

### 4. SonarQube Analysis
- Performs static code analysis.
- Identifies code-quality issues.
- Imports the LCOV coverage report.
- Enforces the configured Quality Gate.

**Achieved code coverage: 92.5%**

### 5. Docker
- Builds the application Docker image.
- Packages the application into a container image.
- Supports consistent application deployment.

### 6. Trivy Security Scanning
- Scans Docker images for known vulnerabilities.
- Helps identify security risks before deployment.

### 7. Deployment and Verification
- Executes the configured deployment process.
- Verifies that the application is running successfully.

## Repository Structure

```text
ecommerce-devops/
│
├── index.html
├── script.js
├── style.css
│
├── images/
│
├── tests/
│   ├── store.spec.js
│   ├── fixtures.js
│   └── coverage-fixtures.js
│
├── e2e/
│
├── scripts/
│   └── generate-coverage.js
│
├── Jenkinsfile
├── Dockerfile
├── nginx.conf
├── playwright.config.js
├── sonar-project.properties
│
├── terraform-platform-project/
│
├── package.json
├── package-lock.json
└── README.md
```

## Running the Project Locally

Clone the repository:

```bash
git clone https://github.com/mounsh-12/e-commerce-devops.git
```

Navigate into the project:

```bash
cd e-commerce-devops
```

Install dependencies:

```bash
npm install
```

Check the available application scripts:

```bash
npm run
```

Start the application using the appropriate script configured in `package.json`.

## Running Automated Tests

Install dependencies:

```bash
npm ci
```

Install Playwright browsers if required:

```bash
npx playwright install
```

Execute the browser tests:

```bash
npx playwright test
```

## Building the Docker Image

Build the application image:

```bash
docker build -t ecommerce-store:latest .
```

Verify the image:

```bash
docker images
```

Run the container using the port mapping configured for your application:

```bash
docker run -d --name ecommerce-container -p 8082:8080 ecommerce-store:latest
```

## SonarQube Quality Gate

The project integrates SonarQube with Jenkins for automated code-quality analysis.

Configured coverage requirement:

**80%**

Achieved coverage:

**92.5%**

The SonarQube Quality Gate successfully passed.

## Security Scanning

Trivy is integrated into the Jenkins pipeline to scan the Docker image for known security vulnerabilities.

This helps identify security risks before application deployment.

## Infrastructure as Code

Terraform configuration is included in the project to manage cloud infrastructure.

AWS is used as the cloud infrastructure platform.

## Skills Demonstrated

- DevOps fundamentals
- CI/CD pipeline implementation
- Git and GitHub integration
- Jenkins pipeline automation
- Automated browser testing
- Static code analysis
- Docker containerization
- Container security scanning
- Nginx configuration
- Infrastructure as Code
- Deployment verification

## Project Outcome

Successfully implemented an end-to-end DevOps workflow for an E-Commerce application.

The completed Jenkins pipeline successfully passed automated testing, SonarQube code analysis, the Quality Gate, Docker image building, Trivy security scanning, and deployment verification.

**Final SonarQube Code Coverage: 92.5%**

**Project Status: COMPLETED SUCCESSFULLY**

---

**Developer:** Mounish Reddy

**GitHub Repository:** https://github.com/mounsh-12/e-commerce-devops