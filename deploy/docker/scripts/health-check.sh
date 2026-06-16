#!/bin/sh

# ========================================
# 服务健康检查脚本
# ========================================

set -e

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DOCKER_DIR="$(dirname "$SCRIPT_DIR")"

printf "=========================================\n"
printf "Kids Game 服务健康检查\n"
printf "=========================================\n\n"

# 检查结果计数
PASS=0
FAIL=0
WARN=0

# 颜色定义（使用 printf）
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_success() {
    printf "${GREEN}✓ %s${NC}\n" "$1"
}

print_fail() {
    printf "${RED}✗ %s${NC}\n" "$1"
}

print_warn() {
    printf "${YELLOW}⚠ %s${NC}\n" "$1"
}

# 检查函数
check_service() {
    local service=$1
    local name=$2
    
    printf "检查 %s... " "$name"
    
    # 检查容器是否运行
    if docker inspect --format='{{.State.Running}}' "$service" 2>/dev/null | grep -q "true"; then
        print_success "运行中"
        PASS=$((PASS + 1))
        return 0
    else
        print_fail "未运行"
        FAIL=$((FAIL + 1))
        return 1
    fi
}

check_health() {
    local service=$1
    local name=$2
    
    printf "检查 %s... " "$name 健康状态"
    
    local health=$(docker inspect --format='{{.State.Health.Status}}' "$service" 2>/dev/null || echo "unknown")
    
    case $health in
        "healthy")
            print_success "健康"
            PASS=$((PASS + 1))
            ;;
        "unhealthy")
            print_fail "不健康"
            FAIL=$((FAIL + 1))
            ;;
        "starting")
            print_warn "启动中"
            WARN=$((WARN + 1))
            ;;
        *)
            print_warn "状态: $health"
            WARN=$((WARN + 1))
            ;;
    esac
}

check_http() {
    local url=$1
    local name=$2
    local expected_code=${3:-200}
    
    printf "测试 %s... " "$name ($url)"
    
    # 使用 wget 或 curl 测试
    if command -v curl >/dev/null 2>&1; then
        http_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "$url" 2>/dev/null || echo "000")
    elif command -v wget >/dev/null 2>&1; then
        http_code=$(wget -q -O /dev/null --timeout=5 --server-response "$url" 2>&1 | grep "HTTP/" | tail -1 | awk '{print $2}' || echo "000")
    else
        print_warn "缺少 curl/wget，跳过"
        WARN=$((WARN + 1))
        return
    fi
    
    if [ "$http_code" = "$expected_code" ]; then
        print_success "HTTP $http_code"
        PASS=$((PASS + 1))
    else
        print_fail "HTTP $http_code (期望: $expected_code)"
        FAIL=$((FAIL + 1))
    fi
}

check_log_errors() {
    local log_file=$1
    local name=$2
    
    if [ ! -f "$log_file" ]; then
        print_warn "日志文件不存在: $log_file"
        WARN=$((WARN + 1))
        return
    fi
    
    printf "检查 %s... " "$name 错误日志"
    
    # 统计最近 100 行中的 ERROR 数量（去除空格和换行）
    error_count=$(tail -n 100 "$log_file" 2>/dev/null | grep -c "ERROR" || true)
    error_count=$(echo "$error_count" | tr -d '[:space:]')
    
    if [ "$error_count" = "0" ] || [ -z "$error_count" ]; then
        print_success "无错误"
        PASS=$((PASS + 1))
    else
        print_fail "发现 $error_count 个错误"
        FAIL=$((FAIL + 1))
        printf "  最近的错误:\n"
        tail -n 100 "$log_file" | grep "ERROR" | tail -3 | sed 's/^/    /'
    fi
}

# 开始检查
printf "[1/8] 检查容器运行状态...\n"
printf "%s\n" "-----------------------------------------"
check_service "kids-game-mysql" "MySQL"
check_service "kids-game-redis" "Redis"
check_service "kids-game-backend" "后端服务"
check_service "kids-game-frontend" "前端服务"
printf "\n"

printf "[2/8] 检查服务健康状态...\n"
printf "%s\n" "-----------------------------------------"
check_health "kids-game-mysql" "MySQL"
check_health "kids-game-redis" "Redis"
check_health "kids-game-backend" "后端服务"
check_health "kids-game-frontend" "前端服务"
printf "\n"

printf "[3/8] 测试后端 API...\n"
printf "%s\n" "-----------------------------------------"
SERVER_IP=$(hostname -I | awk '{print $1}')
check_http "http://$SERVER_IP:8080/actuator/health" "后端健康检查" "200"
check_http "http://$SERVER_IP:8080/api/games" "游戏列表 API" "200"
printf "\n"

printf "[4/8] 测试前端页面...\n"
printf "%s\n" "-----------------------------------------"
check_http "http://$SERVER_IP" "前端首页" "200"
printf "\n"

printf "[5/8] 检查数据库连接...\n"
printf "%s\n" "-----------------------------------------"
if docker exec kids-game-mysql mysqladmin ping -h localhost -u root -p"${MYSQL_ROOT_PASSWORD:-rootpassword}" --silent 2>/dev/null; then
    print_success "数据库连接正常"
    PASS=$((PASS + 1))
else
    print_fail "数据库连接失败"
    FAIL=$((FAIL + 1))
fi
printf "\n"

printf "[6/8] 检查 Redis 连接...\n"
printf "%s\n" "-----------------------------------------"
if docker exec kids-game-redis redis-cli ping 2>/dev/null | grep -q "PONG"; then
    print_success "Redis 连接正常"
    PASS=$((PASS + 1))
else
    print_fail "Redis 连接失败"
    FAIL=$((FAIL + 1))
fi
printf "\n"

printf "[7/8] 检查应用日志...\n"
printf "%s\n" "-----------------------------------------"
LOGS_DIR="$DOCKER_DIR/logs"
check_log_errors "$LOGS_DIR/backend.log" "后端日志"
check_log_errors "$LOGS_DIR/frontend.log" "前端日志"
printf "\n"

printf "[8/8] 查看服务资源占用...\n"
printf "%s\n" "-----------------------------------------"
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}" kids-game-mysql kids-game-redis kids-game-backend kids-game-frontend 2>/dev/null || printf "无法获取资源统计\n"
printf "\n"

# 总结
printf "=========================================\n"
printf "检查结果汇总\n"
printf "=========================================\n"
printf "通过: ${GREEN}%d${NC}\n" "$PASS"
printf "失败: ${RED}%d${NC}\n" "$FAIL"
printf "警告: ${YELLOW}%d${NC}\n" "$WARN"
printf "\n"

if [ $FAIL -eq 0 ]; then
    printf "${GREEN}✓ 所有检查通过！服务运行正常${NC}\n"
    exit 0
else
    printf "${RED}✗ 发现 %d 个问题，请检查上述错误${NC}\n" "$FAIL"
    printf "\n"
    printf "建议操作：\n"
    printf "  1. 查看失败服务的日志: docker logs <容器名>\n"
    printf "  2. 重启失败的服务: ./manage-service.sh <service> restart\n"
    printf "  3. 检查配置文件: cat %s/.env\n" "$DOCKER_DIR"
    exit 1
fi
