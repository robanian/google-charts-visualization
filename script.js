// script.js

// Google Charts 로드
google.charts.load('current', { packages: ['corechart'] });
google.charts.setOnLoadCallback(initialize);

// 초기화 함수
function initialize() {
    const token = getToken(); // 토큰 가져오기
    if (token) {
        fetchData(token)
            .then(data => {
                if (data) {
                    renderCharts(data);
                } else {
                    showError('해당 토큰에 대한 데이터를 찾을 수 없습니다.');
                }
            })
            .catch(error => {
                console.error('데이터 가져오기 에러:', error);
                showError('데이터를 불러오는 중 오류가 발생했습니다.');
            });
    } else {
        showError('토큰이 제공되지 않았습니다.');
    }
}

// 토큰을 가져오는 함수 (예: URL 파라미터)
function getToken() {
    const params = new URLSearchParams(window.location.search);
    return params.get('token'); // 예: ?token=odSJyYaj0OcdRHAD
}

// 데이터 가져오기 함수 (Google Visualization API 사용)
function fetchData(token) {
    return new Promise((resolve, reject) => {
        const sheetId = '1ESc7JIag5FpJ3gp3JxuHIIvr8vRMVXw5dNT7sqlHeAI'; // 본인의 시트 ID로 교체
        const query = new google.visualization.Query(`https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?sheet=Smore-ResultSheet`);

        query.send(response => {
            if (response.isError()) {
                console.error('Query Error:', response.getMessage(), response.getDetailedMessage());
                reject(new Error('Google Visualization API 쿼리 오류'));
                return;
            }

            const data = response.getDataTable();
            const numRows = data.getNumberOfRows();
            const tokenColumnIndex = data.getColumnIndex('Token');

            for (let i = 0; i < numRows; i++) {
                const currentToken = data.getValue(i, tokenColumnIndex);
                if (currentToken === token) {
                    const row = {};
                    for (let j = 0; j < data.getNumberOfColumns(); j++) {
                        const columnName = data.getColumnLabel(j);
                        row[columnName] = data.getValue(i, j);
                    }
                    resolve(row);
                    return;
                }
            }

            // 토큰을 찾지 못한 경우
            resolve(null);
        });
    });
}

// 그래프 그리기 함수
function renderCharts(data) {
    const controlfail = parseInt(data.controlfail, 10);
    const salience = parseInt(data.salience, 10);
    const probleresult = parseInt(data.probleresult, 10);

    // 퍼센트 계산
    const controlfailPercent = mapToPercent(controlfail, 3, 12);
    const saliencePercent = mapToPercent(salience, 3, 12);
    const probleresultPercent = mapToPercent(probleresult, 4, 16);

    // 차트 데이터 준비
    const chartsData = [
        { id: 'controlfail-chart', value: controlfailPercent, color: '#FF6C6C', label: '조절 실패' },
        { id: 'salience-chart', value: saliencePercent, color: '#54CA95', label: '현저성' },
        { id: 'probleresult-chart', value: probleresultPercent, color: '#2F7EFF', label: '문제적 결과' },
    ];

    chartsData.forEach(chart => {
        drawChart(chart.id, chart.value, chart.color, chart.label);
    });
}

// 퍼센트 매핑 함수
function mapToPercent(score, min, max) {
    if (score < min) score = min;
    if (score > max) score = max;
    return 25 + ((score - min) / (max - min)) * 75;
}

// 차트 그리기 함수
function drawChart(elementId, percent, color, label) {
    const data = google.visualization.arrayToDataTable([
        ['Label', 'Value'],
        [label, percent],
        ['', 100 - percent]
    ]);

    const options = {
        pieHole: 0.8,
        pieSliceText: 'none',
        tooltip: { trigger: 'none' },
        backgroundColor: 'transparent',
        slices: {
            0: { color: color },
            1: { color: '#EEEEEE' }
        },
        chartArea: { width: '100%', height: '100%' }
    };

    const chart = new google.visualization.PieChart(document.getElementById(elementId));
    chart.draw(data, options);
}

// 에러 표시 함수
function showError(message) {
    const container = document.querySelector('.container');
    container.innerHTML = `<div class="error">${message}</div>`;
}
