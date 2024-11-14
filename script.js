// script.js

// 초기화 함수
function initialize() {
    const token = getToken(); // 토큰 가져오기
    if (token) {
        fetchData(token)
            .then(data => {
                if (data) {
                    renderBars(data);
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

// 토큰을 가져오는 함수 (URL 파라미터)
function getToken() {
    const params = new URLSearchParams(window.location.search);
    return params.get('token'); // 예: ?token=Og8fcbwFzQ7dc5Ql
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

            const dataTable = response.getDataTable();
            const numRows = dataTable.getNumberOfRows();
            const tokenColumnIndex = dataTable.getColumnIndex('Token');

            for (let i = 0; i < numRows; i++) {
                const currentToken = dataTable.getValue(i, tokenColumnIndex);
                if (currentToken === token) {
                    const row = {};
                    for (let j = 0; j < dataTable.getNumberOfColumns(); j++) {
                        const columnName = dataTable.getColumnLabel(j);
                        row[columnName] = dataTable.getValue(i, j);
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

// 그래프 그리기 함수 (가로 막대)
function renderBars(data) {
    const controlfail = parseInt(data.controlfail, 10);
    const salience = parseInt(data.salience, 10);
    const probleresult = parseInt(data.probleresult, 10);

    // 퍼센트 계산
    const controlfailPercent = mapToPercent(controlfail, 3, 12);
    const saliencePercent = mapToPercent(salience, 3, 12);
    const probleresultPercent = mapToPercent(probleresult, 4, 16);

    // 막대 업데이트
    updateBar('controlfail-bar', controlfailPercent);
    updateBar('salience-bar', saliencePercent);
    updateBar('probleresult-bar', probleresultPercent);

    // 퍼센트 라벨 업데이트
    document.getElementById('controlfail-percent').textContent = `${controlfailPercent}%`;
    document.getElementById('salience-percent').textContent = `${saliencePercent}%`;
    document.getElementById('probleresult-percent').textContent = `${probleresultPercent}%`;
}

// 퍼센트 매핑 함수 (점수를 25~100%로 변환)
function mapToPercent(score, min, max) {
    if (score < min) score = min;
    if (score > max) score = max;
    return Math.round(25 + ((score - min) / (max - min)) * 75);
}

// 막대 업데이트 함수
function updateBar(barId, percent) {
    const bar = document.getElementById(barId);
    bar.style.width = `${percent}%`;
}

// 에러 표시 함수
function showError(message) {
    const container = document.querySelector('.data-table');
    container.innerHTML = `<tr><td colspan="2" class="error">${message}</td></tr>`;
}

// Google Charts 로드 후 초기화 호출
google.charts.load('current', { packages: ['corechart'] });
google.charts.setOnLoadCallback(initialize);
