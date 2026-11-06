
pipeline {
    agent any

    options {
        skipDefaultCheckout(true)
    }

    environment {
        IMAGE_NAME = "ecommerce-store"
        CONTAINER_NAME = "ecommerce-container"
        APP_PORT = "8082"
    }

    stages {
        stage('Checkout') {
            steps {
                echo 'Checking out E-commerce source code'
                checkout scm
            }
        }

        stage('Playwright Browser Tests') {
            steps {
                echo 'Running automated browser tests with Playwright'

                sh '''
                    docker run --rm --init --ipc=host \
                    -e CI=true \
                    --volumes-from jenkins-server \
                    -w "$WORKSPACE" \
                    mcr.microsoft.com/playwright:v1.64.1-noble \
                    bash -lc 'npm ci && npm test'
                '''
            }
        }

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

        stage('SonarQube Quality Gate') {
            steps {
                echo 'Waiting for SonarQube Quality Gate result'

                timeout(time: 5, unit: 'MINUTES') {
                    script {
                        def qualityGate = waitForQualityGate(
                            abortPipeline: true
                        )

                        echo "SonarQube Quality Gate: ${qualityGate.status}"
                    }
                }
            }
        }

        stage('Build Docker Image') {
            steps {
                echo 'Building Docker image'

                sh '''
                    docker build --pull --no-cache \
                    -t ${IMAGE_NAME}:${BUILD_NUMBER} \
                    -t ${IMAGE_NAME}:latest .
                '''
            }
        }

        stage('Trivy Security Scan') {
            steps {
                echo 'Scanning Docker image for vulnerabilities'

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

        stage('Verify Docker Image') {
            steps {
                echo 'Verifying Docker image'
                sh 'docker images ${IMAGE_NAME}'
            }
        }

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

        stage('Deployment Verification') {
            steps {
                echo 'Verifying application deployment'

                sh '''
                    docker exec ${CONTAINER_NAME} \
                    wget -q -O - http://127.0.0.1/ > /dev/null
                '''
            }
        }
    }

    post {
        always {
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
