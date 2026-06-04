import { BaseGameMode } from './BaseGameMode';
import { GameModeConfig, GameModeType, Player, Team } from '../interfaces';

/**
 * 组队模式实现
 * 处理团队分组、组队匹配、团队计分、队内协作规则
 */
export class TeamMode extends BaseGameMode {
  private teams: Map<string, Team> = new Map();
  private playerTeamMap: Map<string, string> = new Map();
  private teamCount: number = 2;

  constructor(config?: Partial<GameModeConfig>) {
    super({
      ...config,
      modeType: GameModeType.TEAM,
      modeName: 'Team Battle',
      maxPlayers: 4,
      supportAI: true,
    });

    this.teamCount = config?.teamCount ?? 2;
  }

  /**
   * 初始化组队模式
   */
  async initialize(config: GameModeConfig): Promise<void> {
    await super.initialize(config);
    this.teamCount = config.teamCount ?? 2;

    // 创建队伍
    this.createTeams();

    this.log('TeamMode initialized', { teamCount: this.teamCount });
  }

  /**
   * 创建队伍
   */
  private createTeams(): void {
    const teamColors = ['#FF6B9D', '#4ECDC4', '#FFE66D', '#95E1D3'];

    for (let i = 0; i < this.teamCount; i++) {
      const team: Team = {
        id: `team_${i + 1}`,
        name: `Team ${i + 1}`,
        players: [],
        score: 0,
      };

      this.teams.set(team.id, team);
    }

    this.log('Created teams', { count: this.teamCount });
  }

  /**
   * 分配玩家到队伍
   */
  assignPlayerToTeam(playerId: string, teamId: string): boolean {
    if (!this.players.has(playerId)) {
      this.log(`Player ${playerId} not found`);
      return false;
    }

    if (!this.teams.has(teamId)) {
      this.log(`Team ${teamId} not found`);
      return false;
    }

    // 从原队伍移除
    const oldTeamId = this.playerTeamMap.get(playerId);
    if (oldTeamId) {
      const oldTeam = this.teams.get(oldTeamId)!;
      const index = oldTeam.players.indexOf(playerId);
      if (index !== -1) {
        oldTeam.players.splice(index, 1);
      }
    }

    // 添加到新队伍
    const newTeam = this.teams.get(teamId)!;
    newTeam.players.push(playerId);
    this.playerTeamMap.set(playerId, teamId);

    this.log(`Assigned player ${playerId} to team ${teamId}`);
    return true;
  }

  /**
   * 获取玩家所在队伍
   */
  getPlayerTeam(playerId: string): Team | null {
    const teamId = this.playerTeamMap.get(playerId);
    return teamId ? this.teams.get(teamId) ?? null : null;
  }

  /**
   * 获取所有队伍
   */
  getTeams(): Team[] {
    return Array.from(this.teams.values());
  }

  /**
   * 获取队伍
   */
  getTeam(teamId: string): Team | null {
    return this.teams.get(teamId) ?? null;
  }

  /**
   * 更新队伍分数
   */
  updateTeamScore(teamId: string, delta: number): void {
    const team = this.teams.get(teamId);
    if (!team) return;

    team.score = Math.max(0, team.score + delta);
    this.log(`Updated team ${teamId} score`, { delta, newScore: team.score });

    // 触发分数变化事件
    this.emit('team_score_change', { teamId, delta, score: team.score });
  }

  /**
   * 获取队伍排名
   */
  getTeamRanking(): Team[] {
    return this.getTeams().sort((a, b) => b.score - a.score);
  }

  /**
   * 获取统计信息
   */
  getStatistics(): Record<string, any> {
    const baseStats = super.getStatistics();

    return {
      ...baseStats,
      teamCount: this.teams.size,
      teams: this.getTeams(),
      teamRanking: this.getTeamRanking(),
    };
  }
}
