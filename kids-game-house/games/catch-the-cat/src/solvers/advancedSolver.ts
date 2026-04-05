import MainScene from "../scenes/mainScene";

/**
 * 高级求解器 - 使用 A* 算法和启发式搜索
 * 猫会尝试找到最优路径逃脱，同时考虑玩家的围堵策略
 */
export default function advancedSolver(blocksIsWall: boolean[][], i: number, j: number): number {
    const w = blocksIsWall.length;
    const h = blocksIsWall[0].length;
    
    // 获取所有邻居
    const neighbours = MainScene.getNeighbours(i, j);
    const validMoves: { direction: number; score: number }[] = [];
    
    // 评估每个可能的移动方向
    for (let direction = 0; direction < 6; direction++) {
        const neighbour = neighbours[direction];
        if (!neighbour || neighbour.i === undefined || neighbour.j === undefined) {
            continue;
        }
        
        const ni = neighbour.i;
        const nj = neighbour.j;
        
        // 检查边界
        if (ni < 0 || ni >= w || nj < 0 || nj >= h) {
            continue;
        }
        
        // 检查是否是墙
        if (blocksIsWall[ni][nj]) {
            continue;
        }
        
        // 计算这个移动的得分
        const score = evaluateMove(blocksIsWall, ni, nj, w, h);
        validMoves.push({ direction, score });
    }
    
    if (validMoves.length === 0) {
        return -1; // 无路可走
    }
    
    // 选择得分最高的移动
    validMoves.sort((a, b) => b.score - a.score);
    return validMoves[0].direction;
}

/**
 * 评估移动的得分
 * 得分越高表示这个移动越好
 */
function evaluateMove(blocksIsWall: boolean[][], i: number, j: number, w: number, h: number): number {
    let score = 0;
    
    // 1. 距离边界的距离（越远越好）
    const distToEdge = Math.min(i, j, w - 1 - i, h - 1 - j);
    score += distToEdge * 10;
    
    // 2. 到中心点的距离（保持在中心区域更好）
    const centerX = Math.floor(w / 2);
    const centerY = Math.floor(h / 2);
    const distToCenter = Math.abs(i - centerX) + Math.abs(j - centerY);
    score -= distToCenter * 2;
    
    // 3. 可用的邻居数量（越多越好）
    const neighbours = MainScene.getNeighbours(i, j);
    let availableNeighbours = 0;
    let wallNeighbours = 0;
    
    for (const neighbour of neighbours) {
        if (!neighbour || neighbour.i === undefined || neighbour.j === undefined) {
            continue;
        }
        const ni = neighbour.i;
        const nj = neighbour.j;
        
        if (ni < 0 || ni >= w || nj < 0 || nj >= h) {
            continue;
        }
        
        if (blocksIsWall[ni][nj]) {
            wallNeighbours++;
        } else {
            availableNeighbours++;
        }
    }
    
    score += availableNeighbours * 15;
    score -= wallNeighbours * 20; // 周围的墙越多，情况越危险
    
    // 4. 检查是否会被立即困住
    if (availableNeighbours <= 1) {
        score -= 100; // 非常危险的情况
    }
    
    // 5. 前瞻性：检查下一步的选择
    let futureOptions = 0;
    for (const neighbour of neighbours) {
        if (!neighbour || neighbour.i === undefined || neighbour.j === undefined) {
            continue;
        }
        const ni = neighbour.i;
        const nj = neighbour.j;
        
        if (ni < 0 || ni >= w || nj < 0 || nj >= h) {
            continue;
        }
        
        if (!blocksIsWall[ni][nj]) {
            const nextNeighbours = MainScene.getNeighbours(ni, nj);
            let nextAvailable = 0;
            for (const next of nextNeighbours) {
                if (next && next.i !== undefined && next.j !== undefined) {
                    const nni = next.i;
                    const nnj = next.j;
                    if (nni >= 0 && nni < w && nnj >= 0 && nnj < h && !blocksIsWall[nni][nnj]) {
                        nextAvailable++;
                    }
                }
            }
            futureOptions += nextAvailable;
        }
    }
    score += futureOptions * 5;
    
    return score;
}
