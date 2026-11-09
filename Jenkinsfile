
pipeline {
    agent any

    options {
        skipDefaultCheckout(true)
        timestamps()
    }

    environment {
        IMAGE_NAME = "ecommerce-store"
        CONTAINER_NAME = "ecommerce-container"
        APP_PORT = "8082"
    }

    stages {

        // Stage 1: Checkout source code
        stage('Checkout') {
            steps {
                echo 'Checking out E-commerce source code'
                checkout scm
            }
        }

        // Stage 2: Playwright end-to-end testing
        stage('Playwright Browser Tests') {
            steps {
                echo 'Running Playwright end-to-end tests'

                sh '''
                    mkdir -p playwright-report test-results

                    docker run --rm --init --ipc=host \
                        -e CI=true \
                        --volumes-from jenkins-server \
                        -w "$WORKSPACE" \
                        mcr.microsoft.com/playwright:v1.64.1-noble \
                        bash -lc 'npm ci && npx playwright test'
                '''
            }
        }

        // Stage 3: SonarQube code analysis
        stage('SonarQube Code Analysis') {
            steps {
                echo 'Starting SonarQube code analysis'

                withSonarQubeEnv('SonarQube') {
                    script {
                        def scannerHome = tool 'SonarScanner'

                        sh """
                            ${scannerHome}/bin/sonar-scanner
                        """
                    }
                }
            }
        }

        // Stage 4: SonarQube Quality Gate
        stage('SonarQube Quality Gate') {
            steps {
                echo 'Checking SonarQube Quality Gate'

                timeout(time: 5, unit: 'MINUTES') {
                    script {
                        def qualityGate = waitForQualityGate(
                            abortPipeline: true
                        )

                        echo "Quality Gate: ${qualityGate.status}"
                    }
                }
            }
        }

        // Stage 5: Build Docker image
        stage('Build Docker Image') {
            steps {
                echo 'Building E-commerce Docker image'

                sh '''
                    docker build --pull --no-cache \
                        -t ${IMAGE_NAME}:${BUILD_NUMBER} \
                        -t ${IMAGE_NAME}:latest .
                '''
            }
        }

        // Stage 6: Trivy vulnerability scan
        stage('Trivy Security Scan') {
            steps {
                echo 'Scanning Docker image for HIGH and CRITICAL vulnerabilities'

                sh '''
                    docker run --rm \
                        -v /var/run/docker.sock:/var/run/docker.sock \
                        aquasec/trivy:latest image \
                        --exit-code 1 \
                        --severity HIGH,CRITICAL \
                        --ignore-unfixed \
                        ${IMAGE_NAME}:latest
                '''
            }
        }

        // Stage 7: Verify Docker image
        stage('Verify Docker Image') {
            steps {
                echo 'Verifying Docker image'

                sh 'docker images ${IMAGE_NAME}'
            }
        }

        // Stage 8: Deploy application
        stage('Deploy Application') {
            steps {
                echo 'Deploying E-commerce application'

                sh '''
                    docker rm -f ${CONTAINER_NAME} || true

                    docker run -d \
                        --name ${CONTAINER_NAME} \
                        -p ${APP_PORT}:80 \
                        ${IMAGE_NAME}:latest
                '''
            }
        }

        // Stage 9: Verify deployment
        stage('Deployment Verification') {
            steps {
                echo 'Verifying deployed application'

                sh '''
                    docker exec ${CONTAINER_NAME} \
                        wget -q -O - http://127.0.0.1/ > /dev/null

                    echo "Application deployment verified successfully"
                '''
            }
        }
    }

    post {

        always {
            echo 'Publishing Playwright test reports'

            junit(
                allowEmptyResults: true,
                testResults: 'test-results/e2e-results.xml'
            )

            archiveArtifacts(
                artifacts: 'playwright-report/**,test-results/**',
                allowEmptyArchive: true
            )
        }

        success {
            echo 'E-commerce DevSecOps pipeline completed successfully!'
        }

        failure {
            echo 'Pipeline failed. Check the failed stage and console output.'
        }
    }
}
