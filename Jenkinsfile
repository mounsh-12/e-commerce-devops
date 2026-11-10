
pipeline {
    agent any

    options {
        skipDefaultCheckout(true)
        timestamps()
    }

    environment {
        IMAGE_NAME = 'ecommerce-store'
        CONTAINER_NAME = 'ecommerce-container'
        APP_PORT = '8082'
        CONTAINER_PORT = '8080'
    }

    stages {

        stage('Checkout') {
            steps {
                echo 'Checking out source code'
                checkout scm
            }
        }

        stage('Playwright Browser Tests') {
            steps {
                echo 'Running Playwright tests and collecting coverage'

                sh '''
                    set -eu

                    mkdir -p playwright-report test-results coverage

                    rm -f test-results/e2e-results.xml
                    rm -f coverage/lcov.info

                    docker run --rm --init --ipc=host \
                        -e CI=true \
                        --volumes-from jenkins-server \
                        -w "$WORKSPACE" \
                        mcr.microsoft.com/playwright:v1.64.1-noble \
                        bash -lc '
                            set -e

                            echo "Installing dependencies"
                            npm ci

                            echo "Checking Playwright version"
                            npx playwright --version

                            echo "Running all Playwright tests"
                            npx playwright test

                            echo "Verifying JUnit report"
                            test -s test-results/e2e-results.xml

                            echo "Verifying LCOV coverage report"
                            test -s coverage/lcov.info

                            echo "Generated reports"
                            ls -lh \
                                test-results/e2e-results.xml \
                                coverage/lcov.info

                            echo "Coverage report preview"
                            head -n 15 coverage/lcov.info
                        '
                '''
            }
        }

        stage('SonarQube Code Analysis') {
            steps {
                echo 'Starting SonarQube analysis'

                withSonarQubeEnv('SonarQube') {
                    script {
                        def scannerHome = tool 'SonarScanner'

                        sh """
                            test -s coverage/lcov.info
                            ${scannerHome}/bin/sonar-scanner
                        """
                    }
                }
            }
        }

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
                echo 'Scanning Docker image'

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

                sh '''
                    docker images ${IMAGE_NAME}

                    echo "Configured user:"
                    docker image inspect ${IMAGE_NAME}:latest \
                        --format '{{.Config.User}}'

                    echo "Health check:"
                    docker image inspect ${IMAGE_NAME}:latest \
                        --format '{{json .Config.Healthcheck}}'

                    echo "Exposed ports:"
                    docker image inspect ${IMAGE_NAME}:latest \
                        --format '{{json .Config.ExposedPorts}}'
                '''
            }
        }

        stage('Deploy Application') {
            steps {
                echo 'Deploying hardened application container'

                sh '''
                    docker rm -f ${CONTAINER_NAME} || true

                    docker run -d \
                        --name ${CONTAINER_NAME} \
                        --restart unless-stopped \
                        --publish ${APP_PORT}:${CONTAINER_PORT} \
                        --read-only \
                        --tmpfs /tmp:rw,noexec,nosuid,size=64m \
                        --cap-drop ALL \
                        --security-opt no-new-privileges:true \
                        --memory 256m \
                        --cpus 0.5 \
                        --pids-limit 100 \
                        ${IMAGE_NAME}:latest
                '''
            }
        }

        stage('Deployment Verification') {
            steps {
                echo 'Verifying application deployment'

                sh '''
                    ATTEMPT=0
                    MAX_ATTEMPTS=30

                    while [ "$ATTEMPT" -lt "$MAX_ATTEMPTS" ]; do

                        STATUS=$(docker inspect \
                            --format '{{.State.Status}}' \
                            ${CONTAINER_NAME})

                        HEALTH=$(docker inspect \
                            --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}no-healthcheck{{end}}' \
                            ${CONTAINER_NAME})

                        echo "Container: $STATUS | Health: $HEALTH"

                        if [ "$STATUS" = "running" ] && [ "$HEALTH" = "healthy" ]; then
                            break
                        fi

                        if [ "$STATUS" != "running" ]; then
                            docker logs ${CONTAINER_NAME}
                            exit 1
                        fi

                        ATTEMPT=$((ATTEMPT + 1))
                        sleep 2
                    done

                    if [ "$HEALTH" != "healthy" ]; then
                        docker logs ${CONTAINER_NAME}
                        exit 1
                    fi

                    echo "Checking HTTP response"

                    docker exec ${CONTAINER_NAME} \
                        wget -q -O - http://127.0.0.1:${CONTAINER_PORT}/ \
                        > /dev/null

                    echo "Checking container user"
                    docker exec ${CONTAINER_NAME} id

                    echo "Checking read-only filesystem"
                    docker inspect ${CONTAINER_NAME} \
                        --format '{{.HostConfig.ReadonlyRootfs}}'

                    echo "Checking dropped capabilities"
                    docker inspect ${CONTAINER_NAME} \
                        --format '{{json .HostConfig.CapDrop}}'

                    echo "Deployment verification successful"
                '''
            }
        }
    }

    post {

        always {
            echo 'Publishing Playwright reports'

            junit(
                allowEmptyResults: true,
                testResults: 'test-results/e2e-results.xml'
            )

            archiveArtifacts(
                artifacts: 'playwright-report/**,test-results/**,coverage/**',
                allowEmptyArchive: true
            )
        }

        success {
            echo 'E-commerce DevSecOps pipeline completed successfully!'
        }

        failure {
            echo 'Pipeline failed. Check the failed stage.'
        }
    }
}
