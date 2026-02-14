// ====== VARIABLES ======
let totalBalance = 0;
let totalSavings = 0;
let expenses = [];
let startDate = new Date();
let chart;

// ====== LOAD DATA ON PAGE LOAD ======
window.onload = function () {
  let saved = JSON.parse(localStorage.getItem("financeData"));

  if (saved) {
    totalBalance = saved.totalBalance;
    totalSavings = saved.totalSavings;
    expenses = saved.expenses;
    startDate = new Date(saved.startDate);

    updateUI();
    updateChart();
    renderTable();
  }
};

// ====== SAVE TO LOCALSTORAGE ======
function saveData() {
  localStorage.setItem("financeData", JSON.stringify({
    totalBalance,
    totalSavings,
    expenses,
    startDate
  }));
}

// ====== SET BALANCE AND SAVINGS ======
function setBalance() {
  const balanceInput = parseFloat(document.getElementById("totalBalanceInput").value);
  const savingsInput = parseFloat(document.getElementById("savingInput").value);

  if (isNaN(balanceInput) || balanceInput < 0) {
    alert("Please enter a valid total balance");
    return;
  }

  if (isNaN(savingsInput) || savingsInput < 0) {
    alert("Please enter a valid savings amount");
    return;
  }

  totalBalance = balanceInput;
  totalSavings = savingsInput;
  startDate = new Date();

  saveData();
  updateUI();

  // Clear inputs
  document.getElementById("totalBalanceInput").value = "";
  document.getElementById("savingInput").value = "";
}

// ====== ADD EXPENSE ======
function addExpense() {
  let amount = parseFloat(document.getElementById("expenseAmount").value);
  let category = document.getElementById("expenseCategory").value || "Others";

  if (isNaN(amount) || amount <= 0) {
    alert("Please enter a valid expense amount");
    return;
  }

  let date = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  expenses.push({ id: Date.now(), amount, category, date });

  saveData();
  updateUI();
  updateChart();
  renderTable();

  // Clear inputs
  document.getElementById("expenseAmount").value = "";
}

// ====== DELETE EXPENSE ======
function deleteExpense(id) {
  if (confirm("Are you sure you want to delete this expense?")) {
    expenses = expenses.filter(exp => exp.id !== id);
    saveData();
    updateUI();
    updateChart();
    renderTable();
  }
}

// ====== EDIT EXPENSE ======
function editExpense(id) {
  let expense = expenses.find(exp => exp.id === id);
  let newAmount = prompt("Edit amount:", expense.amount);

  if (newAmount !== null && newAmount !== "") {
    const parsedAmount = parseFloat(newAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert("Please enter a valid amount");
      return;
    }
    expense.amount = parsedAmount;
    saveData();
    updateUI();
    updateChart();
    renderTable();
  }
}

// ====== UPDATE DASHBOARD UI ======
function updateUI() {
  let totalExpense = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  let available = totalBalance - totalSavings - totalExpense;

  let today = new Date();
  let passedDays = Math.max(1, Math.floor((today - startDate) / (1000 * 60 * 60 * 24)));
  let avgDaily = totalExpense / passedDays;
  let survivalDays = avgDaily > 0 ? (available / avgDaily).toFixed(1) : "∞";

  document.getElementById("totalBalance").innerText = formatCurrency(totalBalance);
  document.getElementById("totalSavings").innerText = formatCurrency(totalSavings);
  document.getElementById("totalExpense").innerText = formatCurrency(totalExpense);
  document.getElementById("availableBalance").innerText = formatCurrency(available);
  document.getElementById("avgDailyExpense").innerText = formatCurrency(avgDaily);
  document.getElementById("survivalDays").innerText = survivalDays;
}

// ====== FORMAT CURRENCY ======
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

// ====== FORMAT DATE ======
function formatDate(dateString) {
  const options = { month: 'short', day: 'numeric', year: 'numeric' };
  return new Date(dateString).toLocaleDateString('en-US', options);
}

// ====== RENDER EXPENSE TABLE ======
function renderTable() {
  let tbody = document.querySelector("#expenseTable tbody");
  tbody.innerHTML = "";

  if (expenses.length === 0) {
    return; // Empty state handled by CSS
  }

  let today = new Date();
  let passedDays = Math.max(1, Math.floor((today - startDate) / (1000 * 60 * 60 * 24)));
  let totalExpense = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  let avgDaily = totalExpense / passedDays;

  // Group by date and sort in descending order
  let grouped = {};
  expenses.forEach(exp => {
    if (!grouped[exp.date]) grouped[exp.date] = [];
    grouped[exp.date].push(exp);
  });

  // Sort dates in descending order (newest first)
  let sortedDates = Object.keys(grouped).sort((a, b) => new Date(b) - new Date(a));

  sortedDates.forEach(date => {
    let dayTotal = grouped[date].reduce((sum, exp) => sum + exp.amount, 0);

    grouped[date].forEach((exp, index) => {
      let row = document.createElement("tr");

      if (dayTotal > avgDaily) row.classList.add("red-row");

      row.innerHTML = `
        <td>${index === 0 ? formatDate(date) : ''}</td>
        <td>${index === 0 ? formatCurrency(dayTotal) : ''}</td>
        <td>${exp.category}</td>
        <td>${formatCurrency(exp.amount)}</td>
        <td>
          <button class="btn btn-small btn-edit" onclick="editExpense(${exp.id})">Edit</button>
          <button class="btn btn-small btn-delete" onclick="deleteExpense(${exp.id})">Delete</button>
        </td>
      `;
      tbody.appendChild(row);
    });
  });
}

// ====== UPDATE CHART ======
function updateChart() {
  let ctx = document.getElementById("expenseChart").getContext("2d");

  if (chart) chart.destroy();

  let categoryTotals = {};
  expenses.forEach(exp => {
    if (!categoryTotals[exp.category]) categoryTotals[exp.category] = 0;
    categoryTotals[exp.category] += exp.amount;
  });

  // If no expenses, show empty chart
  if (Object.keys(categoryTotals).length === 0) {
    categoryTotals = { "No Data": 1 };
  }

  chart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: Object.keys(categoryTotals),
      datasets: [{
        data: Object.values(categoryTotals),
        backgroundColor: [
          "#6366f1",
          "#10b981",
          "#f59e0b",
          "#ef4444",
          "#8b5cf6",
          "#06b6d4",
          "#ec4899"
        ],
        borderWidth: 2,
        borderColor: "#ffffff"
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 15,
            font: {
              size: 12,
              family: "'Inter', sans-serif"
            },
            usePointStyle: true,
            pointStyle: 'circle'
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              let label = context.label || '';
              let value = context.parsed || 0;
              let total = context.dataset.data.reduce((a, b) => a + b, 0);
              let percentage = ((value / total) * 100).toFixed(1);
              return `${label}: ${formatCurrency(value)} (${percentage}%)`;
            }
          },
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          padding: 12,
          cornerRadius: 8,
          titleFont: {
            size: 14,
            family: "'Inter', sans-serif"
          },
          bodyFont: {
            size: 13,
            family: "'Inter', sans-serif"
          }
        }
      }
    }
  });
}