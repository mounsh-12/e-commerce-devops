
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
                checkout scm
            }
        }

        stage('Playwright Browser Tests') {
            steps {
                echo 'Running browser tests and generating coverage'

                sh '''
                    set -eu

                    mkdir -p playwright-report test-results coverage
                    rm -rf coverage/raw
                    rm -f coverage/lcov.info
                    rm -f test-results/e2e-results.xml

                    docker run --rm --init --ipc=host \
                        -e CI=true \
                        --volumes-from jenkins-server \
                        -w "$WORKSPACE" \
                        mcr.microsoft.com/playwright:v1.65.0-noble \
                        bash -lc '
                            set -eu

                            npm ci

                            echo "Playwright version:"
                            npx playwright --version

                            echo "Running browser tests:"
                            npx playwright test

                            echo "Generating LCOV:"
                            node scripts/generate-coverage.js

                            echo "Verifying reports:"
                            test -s test-results/e2e-results.xml
                            test -s coverage/lcov.info

                            echo "Coverage report preview:"
                            head -n 12 coverage/lcov.info

                            echo "Browser tests and coverage completed"
                        '
                '''

                sh '''
                    set -eu
                    test -s test-results/e2e-results.xml
                    test -s coverage/lcov.info
                    echo "JUnit and LCOV reports verified in Jenkins"
                '''
            }
        }

        stage('SonarQube Code Analysis') {
            steps {
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
                sh '''
                    docker build --pull --no-cache \
                        -t ${IMAGE_NAME}:${BUILD_NUMBER} \
                        -t ${IMAGE_NAME}:latest .
                '''
            }
        }

        stage('Trivy Security Scan') {
            steps {
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
                sh '''
                    docker images ${IMAGE_NAME}

                    docker image inspect ${IMAGE_NAME}:latest \
                        --format '{{.Config.User}}'

                    docker image inspect ${IMAGE_NAME}:latest \
                        --format '{{json .Config.Healthcheck}}'

                    docker image inspect ${IMAGE_NAME}:latest \
                        --format '{{json .Config.ExposedPorts}}'
                '''
            }
        }

        stage('Deploy Application') {
            steps {
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
                sh '''
                    set -eu

                    ATTEMPT=0
                    MAX_ATTEMPTS=30
                    HEALTH=unknown

                    while [ "$ATTEMPT" -lt "$MAX_ATTEMPTS" ]; do
                        STATUS=$(docker inspect \
                            --format '{{.State.Status}}' \
                            ${CONTAINER_NAME})

                        HEALTH=$(docker inspect \
                            --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}no-healthcheck{{end}}' \
                            ${CONTAINER_NAME})

                        echo "Status: $STATUS | Health: $HEALTH"

                        if [ "$STATUS" = "running" ] && \
                           [ "$HEALTH" = "healthy" ]; then
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

                    docker exec ${CONTAINER_NAME} \
                        wget -q -O /dev/null \
                        http://127.0.0.1:${CONTAINER_PORT}/

                    docker exec ${CONTAINER_NAME} id

                    docker inspect ${CONTAINER_NAME} \
                        --format '{{.HostConfig.ReadonlyRootfs}}'

                    docker inspect ${CONTAINER_NAME} \
                        --format '{{json .HostConfig.CapDrop}}'

                    echo "Deployment verification successful"
                '''
            }
        }
    }

    post {
        always {
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
