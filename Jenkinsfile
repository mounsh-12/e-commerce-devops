
pipeline {
    agent any

    environment {
        IMAGE_NAME = "ecommerce-store"
        CONTAINER_NAME = "ecommerce-container"
    }

    stages {

        stage('Checkout') {
            steps {
                echo 'Checking out E-commerce source code'
                checkout scm
            }
        }

        stage('Build Docker Image') {
            steps {
                echo 'Building Docker image'

                sh '''
                    docker build \
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
                    -p 8082:80 \
                    ${IMAGE_NAME}:latest
                '''
            }
        }

        stage('Deployment Verification') {
            steps {
                echo 'Verifying application deployment'

                sh '''
                    docker ps --filter name=${CONTAINER_NAME}

                    docker exec ${CONTAINER_NAME} \
                    wget -q -O - http://127.0.0.1/ > /dev/null
                '''
            }
        }
    }

    post {
        success {
            echo 'E-commerce DevSecOps pipeline completed!'
        }

        failure {
            echo 'Pipeline failed. Check security scan and deployment logs.'
        }
    }
}
