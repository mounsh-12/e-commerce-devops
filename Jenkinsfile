
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
                echo 'Checking out E-commerce source code'
                checkout scm
            }
        }

        stage('Playwright Browser Tests') {
            steps {
                echo 'Running Playwright tests with FULL diagnostics'

                sh '''
                    echo "========== JENKINS CHECKOUT =========="
                    git log -1 --oneline

                    echo "========== HTML SOURCE =========="
                    grep -n -A 12 -B 5 "Sign Up" index.html

                    echo "========== TEST SOURCE =========="
                    grep -n -A 10 -B 5 "openSignup" tests/store.spec.js

                    echo "========== STARTING PLAYWRIGHT =========="

                    mkdir -p playwright-report test-results

                    docker run --rm --init --ipc=host \
                        -e CI=true \
                        --volumes-from jenkins-server \
                        -w "$WORKSPACE" \
                        mcr.microsoft.com/playwright:v1.64.1-noble \
                        bash -lc '
                            echo "========== CONTAINER WORKSPACE =========="
                            pwd

                            echo "========== CONTAINER HTML SOURCE =========="
                            grep -n -A 12 -B 5 "Sign Up" index.html

                            echo "========== CONTAINER TEST SOURCE =========="
                            grep -n -A 10 -B 5 "openSignup" tests/store.spec.js

                            echo "========== DEPENDENCY INSTALLATION =========="
                            npm ci

                            echo "========== PLAYWRIGHT VERSION =========="
                            npx playwright --version

                            echo "========== RUNNING ALL TESTS =========="
                            npx playwright test
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

                    echo "========== IMAGE USER CONFIGURATION =========="

                    docker image inspect ${IMAGE_NAME}:latest \
                        --format 'Configured user: {{.Config.User}}'

                    echo "========== IMAGE HEALTH CHECK =========="

                    docker image inspect ${IMAGE_NAME}:latest \
                        --format '{{json .Config.Healthcheck}}'

                    echo "========== IMAGE EXPOSED PORTS =========="

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
                echo 'Verifying hardened deployment'

                sh '''
                    echo "========== WAITING FOR CONTAINER HEALTH =========="

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
                            echo "Container is not running"
                            docker logs ${CONTAINER_NAME}
                            exit 1
                        fi

                        ATTEMPT=$((ATTEMPT + 1))
                        sleep 2
                    done

                    if [ "$HEALTH" != "healthy" ]; then
                        echo "Container did not become healthy"
                        docker logs ${CONTAINER_NAME}
                        exit 1
                    fi

                    echo "========== VERIFYING HTTP RESPONSE =========="

                    docker exec ${CONTAINER_NAME} \
                        wget -q -O - http://127.0.0.1:${CONTAINER_PORT}/ \
                        > /dev/null

                    echo "========== VERIFYING NON-ROOT USER =========="

                    docker exec ${CONTAINER_NAME} id

                    echo "========== VERIFYING CONTAINER SECURITY =========="

                    docker inspect ${CONTAINER_NAME} \
                        --format 'Read-only root filesystem: {{.HostConfig.ReadonlyRootfs}}'

                    docker inspect ${CONTAINER_NAME} \
                        --format 'Dropped capabilities: {{json .HostConfig.CapDrop}}'

                    echo "Application deployment and security verification successful"
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
                artifacts: 'playwright-report/**,test-results/**',
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
