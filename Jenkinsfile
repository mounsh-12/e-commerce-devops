
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
                    -p 8080:80 \
                    ${IMAGE_NAME}:latest
                '''
            }
        }

        stage('Deployment Verification') {
            steps {
                echo 'Checking container status'

                sh '''
                    docker ps --filter name=${CONTAINER_NAME}
                '''
            }
        }
    }

    post {
        success {
            echo 'E-commerce deployment completed successfully!'
        }

        failure {
            echo 'E-commerce deployment failed. Check Jenkins logs.'
        }
    }
}
