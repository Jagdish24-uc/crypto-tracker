let currentPage = 1;
let coinsData = [];
let sortedByPrice = false;
let sortedByVolume = false;

async function fetchCryptoData(page = 1) {
    const response = await fetch(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=15&page=${page}&sparkline=false`);
    const data = await response.json();
    coinsData = data;
    renderTable(data);
}

function renderTable(data) {
    const tableBody = document.querySelector('#crypto-table tbody');
    tableBody.innerHTML = '';
    data.forEach((coin, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td><img src="${coin.image}" alt="${coin.name}" width="20"></td>
            <td>${coin.name}</td>
            <td>${coin.current_price}</td>
            <td>${coin.total_volume}</td>
            <td>${coin.market_cap}</td>
            <td>
                <button onclick="toggleFavorite('${coin.id}')">
                    ${isFavorite(coin.id) ? '★' : '☆'}
                </button>
            </td>
        `;
        row.addEventListener('click', () => showDetails(coin.id));
        tableBody.appendChild(row);
    });
}

function sortTableByPrice(asc) {
    sortedByPrice = asc;
    const sortedData = coinsData.sort((a, b) => asc ? a.current_price - b.current_price : b.current_price - a.current_price);
    renderTable(sortedData);
}

function sortTableByVolume(asc) {
    sortedByVolume = asc;
    const sortedData = coinsData.sort((a, b) => asc ? a.total_volume - b.total_volume : b.total_volume - a.total_volume);
    renderTable(sortedData);
}

function toggleFavorite(coinId) {
    let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    if (favorites.includes(coinId)) {
        favorites = favorites.filter(id => id !== coinId);
    } else {
        favorites.push(coinId);
    }
    localStorage.setItem('favorites', JSON.stringify(favorites));
    renderTable(coinsData);
}

function isFavorite(coinId) {
    const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    return favorites.includes(coinId);
}

function searchCoins(query) {
    const filteredData = coinsData.filter(coin => coin.name.toLowerCase().includes(query.toLowerCase()));
    renderTable(filteredData);
}

function prevPage() {
    if (currentPage > 1) {
        currentPage--;
        fetchCryptoData(currentPage);
        document.getElementById('page-number').textContent = currentPage;
    }
}

function nextPage() {
    currentPage++;
    fetchCryptoData(currentPage);
    document.getElementById('page-number').textContent = currentPage;
}

function showDetails(coinId) {
    window.location.href = `details.html?coinId=${coinId}`;
}

document.addEventListener('DOMContentLoaded', () => {
    fetchCryptoData();
});

async function loadCoinDetails() {
    const params = new URLSearchParams(window.location.search);
    const coinId = params.get('coinId');
    const response = await fetch(`https://api.coingecko.com/api/v3/coins/${coinId}`);
    const data = await response.json();

    if (data) {
        document.getElementById('coin-name').textContent = data.name;
        document.getElementById('coin-icon').src = data.image.large;
        document.getElementById('coin-rank').textContent = data.market_cap_rank;
        document.getElementById('coin-price').textContent = data.market_data.current_price.usd;
        document.getElementById('coin-market-cap').textContent = data.market_data.market_cap.usd;

        // Load initial price data with a default frequency (e.g., 24h)
        loadPriceData('24h');
    } else {
        alert('Coin data is not available.');
    }
}

async function loadPriceData(frequency) {
    const params = new URLSearchParams(window.location.search);
    const coinId = params.get('coinId');
    let days;

    switch(frequency) {
        case '24h':
            days = 1;
            break;
        case '30d':
            days = 30;
            break;
        case '3m':
            days = 90;
            break;
        default:
            days = 1;
    }

    const response = await fetch(`https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=${days}`);
    const data = await response.json();

    if (data && data.prices) {
        const prices = data.prices.map(price => ({ x: new Date(price[0]), y: price[1] }));
        renderChart(prices);
    } else {
        alert('Price data is not available for this coin.');
    }
}

function renderChart(prices) {
    const ctx = document.getElementById('price-chart').getContext('2d');
    if (window.priceChart) {
        window.priceChart.destroy();
    }
    window.priceChart = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [{
                label: 'Price (USD)',
                data: prices,
                borderColor: 'rgb(255, 205, 86)',
                fill: false,
            }]
        },
        options: {
            scales: {
                x: {
                    type: 'time',
                    title: {
                        display: true,
                        text: 'Time'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Price (USD)'
                    }
                }
            }
        }
    });
}

if (window.location.pathname.endsWith('details.html')) {
    loadCoinDetails();
}


document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.endsWith('favorites.html')) {
        const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
        Promise.all(favorites.map(id => fetch(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${id}`).then(response => response.json()))).then(data => {
            renderTable(data.flat());
        });
    }
});
