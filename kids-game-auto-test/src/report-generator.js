/**
 * 报告生成器
 * 功能：生成 HTML、Excel、JSON 格式的测试报告
 */

const fs = require('fs');
const path = require('path');
const moment = require('moment');
const { logger } = require('./utils/logger');

class ReportGenerator {
    constructor(results) {
        this.results = results;
        this.outputDir = path.join(__dirname, '..', 'reports');
        
        // 确保报告目录存在
        if (!fs.existsSync(this.outputDir)) {
            fs.mkdirSync(this.outputDir, { recursive: true });
        }
    }

    generate() {
        logger.info('Generating reports...');
        
        try {
            const timestamp = moment().format('YYYY-MM-DD-HH-mm-ss');
            
            // 1. 生成 JSON 报告
            this.generateJSONReport(timestamp);
            
            // 2. 生成 HTML 报告
            this.generateHTMLReport(timestamp);
            
            // 3. 生成 Excel 报告（如果有 ExcelJS）
            this.generateExcelReport(timestamp);
            
            logger.info('All reports generated successfully!');
            
        } catch (error) {
            logger.error('Report generation failed:', error);
            throw error;
        }
    }

    generateJSONReport(timestamp) {
        const filePath = path.join(this.outputDir, `report-${timestamp}.json`);
        
        const report = {
            summary: this.generateSummary(),
            games: this.results.games,
            overall: this.results.overall,
            startTime: this.results.startTime,
            endTime: this.results.endTime,
            generatedAt: new Date().toISOString()
        };
        
        fs.writeFileSync(filePath, JSON.stringify(report, null, 2), 'utf-8');
        logger.info(`✓ JSON report: ${filePath}`);
    }

    generateHTMLReport(timestamp) {
        const filePath = path.join(this.outputDir, `report-${timestamp}.html`);
        
        const html = this.buildHTMLTemplate();
        
        fs.writeFileSync(filePath, html, 'utf-8');
        logger.info(`✓ HTML report: ${filePath}`);
    }

    generateExcelReport(timestamp) {
        try {
            const ExcelJS = require('exceljs');
            const filePath = path.join(this.outputDir, `report-${timestamp}.xlsx`);
            
            const workbook = new ExcelJS.Workbook();
            
            // 添加总览工作表
            const summarySheet = workbook.addWorksheet('Summary');
            this.populateSummarySheet(summarySheet);
            
            // 添加游戏详情工作表
            for (const game of this.results.games) {
                const gameSheet = workbook.addWorksheet(game.name);
                this.populateGameSheet(gameSheet, game);
            }
            
            // 保存文件
            workbook.xlsx.writeFile(filePath);
            logger.info(`✓ Excel report: ${filePath}`);
            
        } catch (error) {
            logger.warn('Excel report generation skipped (ExcelJS not available)');
        }
    }

    populateSummarySheet(sheet) {
        sheet.columns = [
            { header: 'Metric', key: 'metric', width: 30 },
            { header: 'Value', key: 'value', width: 20 }
        ];
        
        const summary = this.generateSummary();
        
        sheet.addRow({ metric: 'Total Games', value: summary.totalGames });
        sheet.addRow({ metric: 'Passed', value: summary.passed });
        sheet.addRow({ metric: 'Failed', value: summary.failed });
        sheet.addRow({ metric: 'Pass Rate', value: `${summary.passRate}%` });
        sheet.addRow({ metric: 'Total Issues', value: summary.totalIssues });
        sheet.addRow({ metric: 'Critical Issues', value: summary.criticalIssues });
    }

    populateGameSheet(sheet, game) {
        sheet.columns = [
            { header: 'Test Name', key: 'test', width: 30 },
            { header: 'Status', key: 'status', width: 15 },
            { header: 'Duration (ms)', key: 'duration', width: 20 },
            { header: 'Details', key: 'details', width: 50 }
        ];
        
        for (const test of game.tests) {
            sheet.addRow({
                test: test.name,
                status: test.status,
                duration: test.duration || 'N/A',
                details: test.details || ''
            });
        }
    }

    buildHTMLTemplate() {
        const summary = this.generateSummary();
        
        return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Kids Game Auto Test Report</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        h1 {
            color: #333;
            border-bottom: 3px solid #4CAF50;
            padding-bottom: 10px;
        }
        .summary {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin: 30px 0;
        }
        .card {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
        }
        .card.success {
            background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
        }
        .card.warning {
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        }
        .card h3 {
            margin: 0;
            font-size: 14px;
            opacity: 0.9;
        }
        .card .value {
            font-size: 36px;
            font-weight: bold;
            margin: 10px 0;
        }
        .game-section {
            margin-top: 40px;
        }
        .game {
            border: 1px solid #ddd;
            border-radius: 8px;
            margin: 20px 0;
            overflow: hidden;
        }
        .game-header {
            background: #f8f9fa;
            padding: 15px 20px;
            border-bottom: 1px solid #ddd;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .game-header h3 {
            margin: 0;
            color: #333;
        }
        .status {
            padding: 5px 15px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
        }
        .status.PASSED {
            background: #d4edda;
            color: #155724;
        }
        .status.FAILED {
            background: #f8d7da;
            color: #721c24;
        }
        .status.ERROR {
            background: #fff3cd;
            color: #856404;
        }
        .game-body {
            padding: 20px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
        }
        th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }
        th {
            background: #f8f9fa;
            font-weight: 600;
        }
        .issue {
            background: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 10px 15px;
            margin: 10px 0;
        }
        .issue.critical {
            background: #f8d7da;
            border-left-color: #dc3545;
        }
        .timestamp {
            color: #666;
            font-size: 12px;
            margin-top: 30px;
            text-align: right;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎮 Kids Game Auto Test Report</h1>
        
        <div class="summary">
            <div class="card">
                <h3>Total Games</h3>
                <div class="value">${summary.totalGames}</div>
            </div>
            <div class="card success">
                <h3>Passed</h3>
                <div class="value">${summary.passed}</div>
            </div>
            <div class="card warning">
                <h3>Failed</h3>
                <div class="value">${summary.failed}</div>
            </div>
            <div class="card">
                <h3>Pass Rate</h3>
                <div class="value">${summary.passRate}%</div>
            </div>
            <div class="card warning">
                <h3>Total Issues</h3>
                <div class="value">${summary.totalIssues}</div>
            </div>
            <div class="card">
                <h3>Critical Issues</h3>
                <div class="value">${summary.criticalIssues}</div>
            </div>
        </div>

        <div class="game-section">
            <h2>Game Details</h2>
            ${this.results.games.map(game => this.buildGameHTML(game)).join('')}
        </div>

        <div class="timestamp">
            Generated at: ${new Date().toLocaleString('zh-CN')}
        </div>
    </div>
</body>
</html>`;
    }

    buildGameHTML(game) {
        return `
            <div class="game">
                <div class="game-header">
                    <h3>${game.name}</h3>
                    <span class="status ${game.status}">${game.status}</span>
                </div>
                <div class="game-body">
                    ${game.tests.length > 0 ? `
                        <table>
                            <thead>
                                <tr>
                                    <th>Test</th>
                                    <th>Status</th>
                                    <th>Duration</th>
                                    <th>Details</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${game.tests.map(test => `
                                    <tr>
                                        <td>${test.name}</td>
                                        <td><span class="status ${test.status}">${test.status}</span></td>
                                        <td>${test.duration || 'N/A'}ms</td>
                                        <td>${test.details || '-'}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    ` : '<p>No tests executed</p>'}
                    
                    ${game.issues && game.issues.length > 0 ? `
                        <h4>Issues Found:</h4>
                        ${game.issues.map(issue => `
                            <div class="issue ${issue.severity === 'critical' ? 'critical' : ''}">
                                <strong>[${issue.severity.toUpperCase()}]</strong> ${issue.message}
                            </div>
                        `).join('')}
                    ` : ''}
                </div>
            </div>
        `;
    }

    generateSummary() {
        const totalTests = this.results.games.reduce((sum, game) => sum + game.tests.length, 0);
        const passedTests = this.results.games.reduce((sum, game) => {
            return sum + game.tests.filter(t => t.status === 'PASSED').length;
        }, 0);
        
        const totalIssues = this.results.games.reduce((sum, game) => sum + game.issues.length, 0);
        const criticalIssues = this.results.games.reduce((sum, game) => {
            return sum + game.issues.filter(i => i.severity === 'critical').length;
        }, 0);
        
        const passRate = totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(1) : 0;
        
        return {
            totalGames: this.results.overall.total,
            passed: this.results.overall.passed,
            failed: this.results.overall.failed,
            passRate: passRate,
            totalTests: totalTests,
            totalIssues: totalIssues,
            criticalIssues: criticalIssues
        };
    }
}

module.exports = { ReportGenerator };
